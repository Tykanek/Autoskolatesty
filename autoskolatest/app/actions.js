"use server";

import { revalidatePath } from "next/cache";
import {
  questionNoteSchema,
  questionSchema,
  testResultSchema,
} from "./lib/questionSchema";
import { createUserSupabaseClient, supabase } from "./lib/supabase";

function firstValidationMessage(error) {
  return error.issues[0]?.message || "Data nejsou platná.";
}

function normalizeQuestionId(questionId) {
  const id = Number(questionId);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function splitQuestionPayload(question) {
  const { answers, ...questionFields } = question;

  return {
    questionFields,
    answers,
  };
}

function omitField(payload, fieldName) {
  const { [fieldName]: _removed, ...rest } = payload;
  return rest;
}

function isMissingColumnError(error, columnName) {
  const message = error?.message || "";

  return (
    error?.code === "PGRST204" ||
    error?.code === "42P01" ||
    message.includes(columnName) ||
    message.includes("schema cache") ||
    message.includes("does not exist") ||
    message.includes("column")
  );
}

async function insertQuestion(questionFields) {
  const { data, error } = await supabase
    .from("questions")
    .insert(questionFields)
    .select("id")
    .single();

  if (!error || !isMissingColumnError(error, "explanation")) {
    return { data, error };
  }

  return supabase
    .from("questions")
    .insert(omitField(questionFields, "explanation"))
    .select("id")
    .single();
}

async function updateQuestionRecord(id, questionFields) {
  const { data, error } = await supabase
    .from("questions")
    .update(questionFields)
    .eq("id", id)
    .select("id")
    .single();

  if (!error || !isMissingColumnError(error, "explanation")) {
    return { data, error };
  }

  return supabase
    .from("questions")
    .update(omitField(questionFields, "explanation"))
    .eq("id", id)
    .select("id")
    .single();
}

function answerRows(questionId, answers, includeMediaUrl) {
  return answers.map((answer) => {
    const mediaUrl = answer.media_url || null;
    const row = {
      question_id: questionId,
      answer_text: answer.answer_text || mediaUrl || "",
      is_correct: answer.is_correct,
    };

    if (includeMediaUrl) {
      row.media_url = mediaUrl;
    }

    return row;
  });
}

async function insertAnswers(questionId, answers) {
  const hasMediaUrls = answers.some((answer) => Boolean(answer.media_url));
  const initialRows = answerRows(questionId, answers, hasMediaUrls);

  const { error } = await supabase.from("answers").insert(initialRows);

  if (!error) {
    return null;
  }

  const missingMediaColumn =
    hasMediaUrls &&
    (error.code === "PGRST204" || error.message?.includes("media_url"));

  if (!missingMediaColumn) {
    return error;
  }

  const fallbackRows = answerRows(questionId, answers, false);
  const { error: fallbackError } = await supabase
    .from("answers")
    .insert(fallbackRows);

  return fallbackError;
}

function revalidateQuestionPages(questionId) {
  revalidatePath("/");
  revalidatePath("/questions");
  revalidatePath("/test");
  revalidatePath(`/questions/${questionId}`);
  revalidatePath(`/questions/${questionId}/edit`);
}

async function verifiedUser(accessToken) {
  if (!accessToken) {
    return null;
  }

  const { data, error } = await supabase.auth.getUser(accessToken);

  if (error) {
    return null;
  }

  return data.user || null;
}

async function requireAdmin(accessToken) {
  const user = await verifiedUser(accessToken);

  if (!user) {
    throw new Error("Neoprávněný přístup");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (error || profile?.role !== "admin") {
    throw new Error("Neoprávněný přístup");
  }

  return user;
}

function fallbackResultRow(data, user) {
  return {
    user_name: user?.email || data.user_name || "Student",
    score: data.score,
    total_points: data.total_points,
  };
}

function extendedResultRow(data, user) {
  return {
    ...fallbackResultRow(data, user),
    user_id: user?.id || null,
    total_questions: data.total_questions,
    correct_questions: data.correct_questions,
    duration_seconds: data.duration_seconds,
    answers: data.answers,
  };
}

export async function createQuestion(input, accessToken) {
  await requireAdmin(accessToken);

  const parsed = questionSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, error: firstValidationMessage(parsed.error) };
  }

  const { questionFields, answers } = splitQuestionPayload(parsed.data);

  const { data: savedQuestion, error: questionError } =
    await insertQuestion(questionFields);

  if (questionError) {
    return { ok: false, error: questionError.message };
  }

  const answersError = await insertAnswers(savedQuestion.id, answers);

  if (answersError) {
    await supabase.from("questions").delete().eq("id", savedQuestion.id);
    return { ok: false, error: answersError.message };
  }

  revalidateQuestionPages(savedQuestion.id);

  return { ok: true, id: savedQuestion.id };
}

export async function updateQuestion(questionId, input, accessToken) {
  await requireAdmin(accessToken);

  const id = normalizeQuestionId(questionId);

  if (!id) {
    return { ok: false, error: "ID otázky chybí nebo není platné." };
  }

  const parsed = questionSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, error: firstValidationMessage(parsed.error) };
  }

  const { questionFields, answers } = splitQuestionPayload(parsed.data);

  const { error: questionError } = await updateQuestionRecord(
    id,
    questionFields
  );

  if (questionError) {
    return { ok: false, error: questionError.message };
  }

  const { error: deleteAnswersError } = await supabase
    .from("answers")
    .delete()
    .eq("question_id", id);

  if (deleteAnswersError) {
    return { ok: false, error: deleteAnswersError.message };
  }

  const answersError = await insertAnswers(id, answers);

  if (answersError) {
    return { ok: false, error: answersError.message };
  }

  revalidateQuestionPages(id);

  return { ok: true, id };
}

export async function saveQuestion(formData, accessToken) {
  await requireAdmin(accessToken);

  const rawData = Object.fromEntries(formData);
  const id = normalizeQuestionId(rawData.id);
  let answers;

  try {
    answers = JSON.parse(rawData.answers || "[]");
  } catch {
    return { ok: false, error: "Odpovědi nejsou ve správném formátu." };
  }

  const payload = {
    question_text: rawData.question_text,
    category: rawData.category,
    points: rawData.points,
    image_url: rawData.image_url,
    explanation: rawData.explanation,
    answers,
  };

  return id
    ? updateQuestion(id, payload, accessToken)
    : createQuestion(payload, accessToken);
}

export async function deleteQuestion(questionId, accessToken) {
  await requireAdmin(accessToken);

  const id = normalizeQuestionId(questionId);

  if (!id) {
    return { ok: false, error: "ID otázky chybí nebo není platné." };
  }

  const { error: answersError } = await supabase
    .from("answers")
    .delete()
    .eq("question_id", id);

  if (answersError) {
    return { ok: false, error: answersError.message };
  }

  const { error } = await supabase.from("questions").delete().eq("id", id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidateQuestionPages(id);

  return { ok: true, success: true };
}

export async function saveTestResult(input) {
  const parsed = testResultSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, error: firstValidationMessage(parsed.error) };
  }

  const user = await verifiedUser(parsed.data.access_token);
  const row = extendedResultRow(parsed.data, user);

  const { data, error } = await supabase
    .from("test_results")
    .insert(row)
    .select("id")
    .single();

  if (error && isMissingColumnError(error, "test_results")) {
    const fallbackRow = fallbackResultRow(parsed.data, user);
    const { data: fallbackData, error: fallbackError } = await supabase
      .from("test_results")
      .insert(fallbackRow)
      .select("id")
      .single();

    if (fallbackError) {
      return { ok: false, error: fallbackError.message };
    }

    revalidatePath("/results");

    return { ok: true, id: fallbackData.id, storedReview: false };
  }

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/results");

  return { ok: true, id: data.id, storedReview: true };
}

export async function getUserTestHistory(input = {}) {
  const user = await verifiedUser(input.access_token);

  if (!user) {
    return {
      ok: false,
      error: "Pro osobní historii se nejdříve přihlaste.",
    };
  }

  const { data, error } = await supabase
    .from("test_results")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (!error) {
    return { ok: true, results: data || [] };
  }

  if (!isMissingColumnError(error, "user_id")) {
    return { ok: false, error: error.message };
  }

  const { data: fallbackData, error: fallbackError } = await supabase
    .from("test_results")
    .select("*")
    .eq("user_name", user.email)
    .order("created_at", { ascending: false })
    .limit(100);

  if (fallbackError) {
    return { ok: false, error: fallbackError.message };
  }

  return {
    ok: true,
    results: fallbackData || [],
    storedReview: false,
  };
}

export async function getUserQuestionNotes(input = {}) {
  const user = await verifiedUser(input.access_token);

  if (!user) {
    return { ok: true, notes: [] };
  }

  const userSupabase = createUserSupabaseClient(input.access_token);

  const { data, error } = await userSupabase
    .from("user_question_notes")
    .select("question_id,note_title,note,updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (!error) {
    return { ok: true, notes: data || [], notesAvailable: true };
  }

  if (isMissingColumnError(error, "note_title")) {
    const { data: fallbackData, error: fallbackError } = await userSupabase
      .from("user_question_notes")
      .select("question_id,note,updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (!fallbackError) {
      return {
        ok: true,
        notes: (fallbackData || []).map((note) => ({
          ...note,
          note_title: "Moje poznámka",
        })),
        notesAvailable: true,
        noteTitlesAvailable: false,
      };
    }

    if (isMissingColumnError(fallbackError, "user_question_notes")) {
      return { ok: true, notes: [], notesAvailable: false };
    }

    return { ok: false, error: fallbackError.message };
  }

  return { ok: false, error: error.message };
}

export async function getQuestionNote(input = {}) {
  const user = await verifiedUser(input.access_token);
  const questionId = normalizeQuestionId(input.question_id);

  if (!questionId) {
    return { ok: false, error: "ID otázky chybí nebo není platné." };
  }

  if (!user) {
    return { ok: true, note: "", authenticated: false };
  }

  const userSupabase = createUserSupabaseClient(input.access_token);

  const { data, error } = await userSupabase
    .from("user_question_notes")
    .select("note_title,note,updated_at")
    .eq("user_id", user.id)
    .eq("question_id", questionId)
    .maybeSingle();

  if (!error) {
    return {
      ok: true,
      title: data?.note_title || "Moje poznámka",
      note: data?.note || "",
      updatedAt: data?.updated_at || null,
      authenticated: true,
      notesAvailable: true,
    };
  }

  if (isMissingColumnError(error, "note_title")) {
    const { data: fallbackData, error: fallbackError } = await userSupabase
      .from("user_question_notes")
      .select("note,updated_at")
      .eq("user_id", user.id)
      .eq("question_id", questionId)
      .maybeSingle();

    if (!fallbackError) {
      return {
        ok: true,
        title: "Moje poznámka",
        note: fallbackData?.note || "",
        updatedAt: fallbackData?.updated_at || null,
        authenticated: true,
        notesAvailable: true,
        noteTitlesAvailable: false,
      };
    }

    if (isMissingColumnError(fallbackError, "user_question_notes")) {
      return { ok: true, note: "", notesAvailable: false };
    }

    return { ok: false, error: fallbackError.message };
  }

  return { ok: false, error: error.message };
}

export async function saveQuestionNote(input = {}) {
  const user = await verifiedUser(input.access_token);
  const questionId = normalizeQuestionId(input.question_id);

  if (!user) {
    return { ok: false, error: "Pro uložení poznámky se nejdříve přihlaste." };
  }

  if (!questionId) {
    return { ok: false, error: "ID otázky chybí nebo není platné." };
  }

  const parsed = questionNoteSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, error: firstValidationMessage(parsed.error) };
  }

  const now = new Date().toISOString();
  const userSupabase = createUserSupabaseClient(input.access_token);

  const noteRow = {
    user_id: user.id,
    question_id: questionId,
    note_title: parsed.data.title,
    note: parsed.data.note,
    updated_at: now,
  };

  let { data, error } = await userSupabase
    .from("user_question_notes")
    .upsert(noteRow, { onConflict: "user_id,question_id" })
    .select("note_title,note,updated_at")
    .single();

  if (error && isMissingColumnError(error, "note_title")) {
    const { note_title: _noteTitle, ...fallbackRow } = noteRow;
    const fallbackResult = await userSupabase
      .from("user_question_notes")
      .upsert(fallbackRow, { onConflict: "user_id,question_id" })
      .select("note,updated_at")
      .single();

    data = fallbackResult.data
      ? { ...fallbackResult.data, note_title: parsed.data.title }
      : null;
    error = fallbackResult.error;
  }

  if (error) {
    if (isMissingColumnError(error, "user_question_notes")) {
      return {
        ok: false,
        error: "Chybí tabulka user_question_notes. Spusťte Supabase migraci pro poznámky.",
      };
    }

    return { ok: false, error: error.message };
  }

  revalidatePath("/questions");
  revalidatePath(`/questions/${questionId}`);

  return {
    ok: true,
    title: data.note_title,
    note: data.note,
    updatedAt: data.updated_at,
  };
}
