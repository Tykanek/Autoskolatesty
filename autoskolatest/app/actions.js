"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "./lib/supabase";
import { z } from "zod";

const QuestionSchema = z.object({
  id: z.number().optional(),
  question_text: z
    .string()
    .min(5, { message: "Text otázky musí mít alespoň 5 znaků." }),
  points: z.coerce.number().min(1, { message: "Otázka musí mít alespoň 1 bod." }),
  answers: z
    .array(
      z.object({
        id: z.number().optional(),
        answer_text: z.string().min(1, { message: "Odpověď nesmí být prázdná." }),
        is_correct: z.boolean(),
      })
    )
    .min(2, { message: "Musíte zadat alespoň dvě odpovědi." })
    .refine((answers) => answers.filter((a) => a.is_correct).length === 1, {
      message: "Přesně jedna odpověď musí být označena jako správná.",
    }),
});

export async function saveQuestion(formData) {
  const rawData = Object.fromEntries(formData);
  
  const parsedAnswers = JSON.parse(rawData.answers || "[]");

  const validationResult = QuestionSchema.safeParse({
    id: rawData.id ? parseInt(rawData.id, 10) : undefined,
    question_text: rawData.question_text,
    points: rawData.points,
    answers: parsedAnswers,
  });

  if (!validationResult.success) {
    return {
      errors: validationResult.error.flatten().fieldErrors,
    };
  }

  const { id, question_text, points, answers } = validationResult.data;

  // Save question
  const { data: savedQuestion, error: questionError } = await supabase
    .from("questions")
    .upsert({ id, question_text, points })
    .select()
    .single();

  if (questionError) {
    return { errors: { _form: [questionError.message] } };
  }

  // Prepare answers
  const answersToUpsert = answers.map(a => ({ ...a, question_id: savedQuestion.id }));
  
  const { error: answersError } = await supabase
    .from("answers")
    .upsert(answersToUpsert);

  if (answersError) {
    return { errors: { _form: [answersError.message] } };
  }

  revalidatePath("/");
  revalidatePath(`/questions/${savedQuestion.id}`);
  
  return { success: true, questionId: savedQuestion.id };
}

export async function deleteQuestion(questionId) {
  if (!questionId) {
    return { error: "ID otázky chybí." };
  }

  const { error } = await supabase
    .from("questions")
    .delete()
    .eq("id", questionId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/");
  revalidatePath("/questions");

  return { success: true };
}