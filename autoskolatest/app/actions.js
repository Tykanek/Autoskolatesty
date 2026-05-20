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

export async function createQuestion(input) {
  const parsed = questionSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, error: firstValidationMessage(parsed.error) };
  }

  const { questionFields, answers } = splitQuestionPayload(parsed.data);

  const { data: savedQuestion, error: questionError } = await supabase
    .from("questions")
    .insert(questionFields)
    .select("id")
    .single();

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

  const { error: questionError } = await supabase
    .from("questions")
    .update(questionFields)
    .eq("id", id)
    .select("id")
    .single();

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

  const { data, error } = await supabase
    .from("test_results")
    .insert(parsed.data)
    .select("id")
    .single();

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/results");

  return { ok: true, id: data.id };
}
