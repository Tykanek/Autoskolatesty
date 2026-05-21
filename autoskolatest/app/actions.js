"use server";

import { revalidatePath } from "next/cache";
import { questionSchema, testResultSchema } from "./lib/questionSchema";
import { supabase } from "./lib/supabase";

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
    message.includes(columnName) ||
    message.includes("schema cache") ||
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

export async function createQuestion(input) {
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

export async function updateQuestion(questionId, input) {
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

export async function saveQuestion(formData) {
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

  return id ? updateQuestion(id, payload) : createQuestion(payload);
}

export async function deleteQuestion(questionId) {
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
