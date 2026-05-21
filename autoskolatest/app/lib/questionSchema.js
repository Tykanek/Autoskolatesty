import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((value) => value || null);

const answerText = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((value) => value || "");

export const answerSchema = z
  .object({
    answer_text: answerText,
    media_url: optionalText,
    is_correct: z.boolean(),
  })
  .refine((answer) => Boolean(answer.answer_text || answer.media_url), {
    message: "Odpověď musí mít text nebo URL média",
    path: ["answer_text"],
  });

export const questionSchema = z
  .object({
    question_text: z
      .string()
      .trim()
      .min(5, "Otázka musí mít alespoň 5 znaků"),
    category: z.string().trim().min(2, "Kategorie je povinná"),
    points: z.coerce
      .number()
      .int("Počet bodů musí být celé číslo")
      .min(1, "Počet bodů musí být alespoň 1"),
    image_url: optionalText,
    explanation: optionalText,
    answers: z
      .array(answerSchema)
      .min(2, "Otázka musí mít alespoň dvě odpovědi"),
  })
  .refine(
    (value) => value.answers.filter((answer) => answer.is_correct).length === 1,
    {
      message: "Právě jedna odpověď musí být označená jako správná",
      path: ["answers"],
    }
  );

export const testResultSchema = z.object({
  access_token: z.string().optional(),
  user_name: z.string().trim().min(1).default("Student"),
  score: z.coerce.number().int().min(0),
  total_points: z.coerce.number().int().min(0),
  total_questions: z.coerce.number().int().min(0).default(0),
  correct_questions: z.coerce.number().int().min(0).default(0),
  duration_seconds: z.coerce.number().int().min(0).default(0),
  answers: z.array(z.record(z.any())).default([]),
});

export function normalizeQuestionInput(input) {
  const parsed = questionSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message || "Neplatná data.",
    };
  }

  return {
    ok: true,
    data: {
      ...parsed.data,
      answers: parsed.data.answers.map((answer) => ({
        answer_text: answer.answer_text || answer.media_url || "",
        media_url: answer.media_url,
        is_correct: answer.is_correct,
      })),
    },
  };
}
