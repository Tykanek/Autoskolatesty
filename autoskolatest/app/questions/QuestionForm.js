"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { createQuestion, updateQuestion } from "../actions";
import { questionSchema } from "../lib/questionSchema";

const blankAnswer = { answer_text: "", media_url: null, is_correct: false };

function initialAnswers(question) {
  if (question?.answers?.length > 0) {
    return question.answers.map((answer) => ({
      answer_text: answer.answer_text || "",
      media_url: answer.media_url || null,
      is_correct: Boolean(answer.is_correct),
    }));
  }

  return [
    { ...blankAnswer, is_correct: true },
    { ...blankAnswer },
    { ...blankAnswer },
  ];
}

export default function QuestionForm({ mode, question }) {
  const router = useRouter();
  const answers = initialAnswers(question);
  const firstCorrect = answers.findIndex((answer) => answer.is_correct);
  const [correctIndex, setCorrectIndex] = useState(
    firstCorrect >= 0 ? firstCorrect : 0
  );
  const [formError, setFormError] = useState("");

  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: {
      question_text: question?.question_text || "",
      category: question?.category || "",
      points: question?.points || 1,
      image_url: question?.image_url || "",
      answers,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "answers",
  });

  const markCorrect = (index) => {
    setCorrectIndex(index);
    fields.forEach((_, fieldIndex) => {
      setValue(`answers.${fieldIndex}.is_correct`, fieldIndex === index);
    });
  };

  const removeAnswer = (index) => {
    if (fields.length <= 2) {
      return;
    }

    remove(index);

    if (correctIndex === index) {
      setCorrectIndex(0);
      setValue("answers.0.is_correct", true);
    } else if (correctIndex > index) {
      setCorrectIndex(correctIndex - 1);
    }
  };

  const onSubmit = async (values) => {
    const payload = {
      ...values,
      answers: values.answers.map((answer, index) => ({
        ...answer,
        is_correct: index === correctIndex,
      })),
    };

    const parsed = questionSchema.safeParse(payload);

    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message || "Formulář není platný.");
      return;
    }

    setFormError("");

    const result =
      mode === "edit"
        ? await updateQuestion(question.id, parsed.data)
        : await createQuestion(parsed.data);

    if (!result.ok) {
      setFormError(result.error);
      return;
    }

    router.push(mode === "edit" ? `/questions/${result.id}` : "/questions");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {formError && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-red-700">
          {formError}
        </div>
      )}

      <div>
        <label className="mb-1 block font-medium text-black">Text otázky</label>
        <textarea
          {...register("question_text")}
          className="w-full rounded-xl border border-gray-300 p-3 text-black"
          rows="4"
          placeholder="Např. Co znamená tato dopravní značka?"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block font-medium text-black">Kategorie</label>
          <input
            {...register("category")}
            className="w-full rounded-xl border border-gray-300 p-3 text-black"
            placeholder="Např. Dopravní značky"
          />
        </div>

        <div>
          <label className="mb-1 block font-medium text-black">Počet bodů</label>
          <input
            type="number"
            min="1"
            {...register("points")}
            className="w-full rounded-xl border border-gray-300 p-3 text-black"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block font-medium text-black">
          URL obrázku nebo videa
        </label>
        <input
          {...register("image_url")}
          className="w-full rounded-xl border border-gray-300 p-3 text-black"
          placeholder="Nepovinné"
        />
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-black">Odpovědi</h2>
          <button
            type="button"
            onClick={() => append({ ...blankAnswer })}
            className="rounded-lg border border-gray-400 px-3 py-2 text-black hover:bg-gray-100"
          >
            Přidat odpověď
          </button>
        </div>

        {fields.map((field, index) => (
          <div
            key={field.id}
            className="rounded-xl border border-gray-300 bg-white p-4"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <label className="flex items-center gap-2 font-medium text-black">
                <input
                  type="radio"
                  name="correct-answer"
                  checked={correctIndex === index}
                  onChange={() => markCorrect(index)}
                />
                Správná odpověď
              </label>

              <button
                type="button"
                onClick={() => removeAnswer(index)}
                disabled={fields.length <= 2}
                className="rounded-lg border border-red-300 px-3 py-2 text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Odebrat
              </button>
            </div>

            <textarea
              {...register(`answers.${index}.answer_text`)}
              className="w-full rounded-lg border border-gray-300 p-3 text-black"
              rows="3"
              placeholder="Text odpovědi nebo URL obrázku/videa"
            />
          </div>
        ))}
      </section>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-xl bg-black px-5 py-3 text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting
            ? "Ukládám..."
            : mode === "edit"
              ? "Uložit změny"
              : "Uložit otázku"}
        </button>

        <Link
          href={mode === "edit" && question ? `/questions/${question.id}` : "/questions"}
          className="rounded-xl border border-black px-5 py-3 text-center text-black"
        >
          Zpět
        </Link>
      </div>
    </form>
  );
}
