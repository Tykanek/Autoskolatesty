"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { createQuestion, updateQuestion } from "../actions";
import { questionSchema } from "../lib/questionSchema";

const blankAnswer = { answer_text: "", media_url: "", is_correct: false };

function initialAnswers(question) {
  if (question?.answers?.length > 0) {
    return question.answers.map((answer) => ({
      answer_text: answer.answer_text || "",
      media_url: answer.media_url || "",
      is_correct: Boolean(answer.is_correct),
    }));
  }

  return [
    { ...blankAnswer, is_correct: true },
    { ...blankAnswer },
    { ...blankAnswer },
  ];
}

function FieldError({ message }) {
  if (!message) {
    return null;
  }

  return <p className="mt-1 text-sm text-destructive">{message}</p>;
}

export default function QuestionForm({ mode = "create", question }) {
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
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      question_text: question?.question_text || "",
      category: question?.category || "",
      points: question?.points || 1,
      image_url: question?.image_url || "",
      explanation: question?.explanation || "",
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
      setValue(`answers.${fieldIndex}.is_correct`, fieldIndex === index, {
        shouldDirty: true,
        shouldValidate: true,
      });
    });
  };

  const addAnswer = () => {
    append({ ...blankAnswer });
  };

  const removeAnswer = (index) => {
    if (fields.length <= 2) {
      return;
    }

    remove(index);

    if (correctIndex === index) {
      setCorrectIndex(0);
      setValue("answers.0.is_correct", true, {
        shouldDirty: true,
        shouldValidate: true,
      });
      return;
    }

    if (correctIndex > index) {
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

    setFormError("");

    const result =
      mode === "edit"
        ? await updateQuestion(question.id, payload)
        : await createQuestion(payload);

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
        <div className="rounded-lg border border-destructive bg-destructive-soft p-3 text-sm text-destructive">
          {formError}
        </div>
      )}

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-foreground">
          Text otázky
        </label>
        <textarea
          {...register("question_text")}
          className="min-h-32 w-full rounded-lg border border-border bg-card p-3 text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
          placeholder="Např. Co znamená tato dopravní značka?"
        />
        <FieldError message={errors.question_text?.message} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-foreground">
            Kategorie
          </label>
          <input
            {...register("category")}
            className="w-full rounded-lg border border-border bg-card p-3 text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
            placeholder="Např. Dopravní značky"
          />
          <FieldError message={errors.category?.message} />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-foreground">
            Počet bodů
          </label>
          <input
            type="number"
            min="1"
            {...register("points")}
            className="w-full rounded-lg border border-border bg-card p-3 text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
          />
          <FieldError message={errors.points?.message} />
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-foreground">
          URL obrázku nebo videa k otázce
        </label>
        <input
          {...register("image_url")}
          className="w-full rounded-lg border border-border bg-card p-3 text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
          placeholder="Nepovinné"
        />
        <FieldError message={errors.image_url?.message} />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-foreground">
          Vysvětlení správné odpovědi
        </label>
        <textarea
          {...register("explanation")}
          className="min-h-24 w-full rounded-lg border border-border bg-card p-3 text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
          placeholder="Nepovinné vysvětlení, které se zobrazí v revizi testu."
        />
        <FieldError message={errors.explanation?.message} />
      </div>

      <section className="space-y-3">
        <div className="flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Odpovědi</h2>
            <p className="text-sm text-muted-foreground">
              Označte právě jednu správnou odpověď.
            </p>
          </div>
          <button
            type="button"
            onClick={addAnswer}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground shadow-sm transition hover:bg-muted"
          >
            Přidat odpověď
          </button>
        </div>

        <FieldError message={errors.answers?.message} />

        <div className="space-y-3">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="rounded-lg border border-border bg-card p-4 shadow-sm"
            >
              <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <label className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                  <input
                    type="radio"
                    name="correct-answer"
                    checked={correctIndex === index}
                    onChange={() => markCorrect(index)}
                    className="h-4 w-4 accent-primary"
                  />
                  Správná odpověď
                </label>

                <button
                  type="button"
                  onClick={() => removeAnswer(index)}
                  disabled={fields.length <= 2}
                  className="rounded-lg border border-destructive px-3 py-2 text-sm font-semibold text-destructive transition hover:bg-destructive-soft disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Odebrat
                </button>
              </div>

              <div className="grid gap-3 lg:grid-cols-2">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">
                    Text odpovědi
                  </label>
                  <textarea
                    {...register(`answers.${index}.answer_text`)}
                    className="min-h-24 w-full rounded-lg border border-border bg-card p-3 text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                    placeholder={`Odpověď ${index + 1}`}
                  />
                  <FieldError message={errors.answers?.[index]?.answer_text?.message} />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">
                    URL média odpovědi
                  </label>
                  <input
                    {...register(`answers.${index}.media_url`)}
                    className="w-full rounded-lg border border-border bg-card p-3 text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                    placeholder="Nepovinné"
                  />
                  <FieldError message={errors.answers?.[index]?.media_url?.message} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="flex flex-col gap-3 border-t border-border pt-6 sm:flex-row">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-primary px-5 py-3 text-center font-semibold text-white shadow-sm transition hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting
            ? "Ukládám..."
            : mode === "edit"
              ? "Uložit změny"
              : "Uložit otázku"}
        </button>

        <Link
          href={mode === "edit" && question ? `/questions/${question.id}` : "/questions"}
          className="rounded-lg border border-border bg-card px-5 py-3 text-center font-semibold text-foreground shadow-sm transition hover:bg-muted"
        >
          Zpět
        </Link>
      </div>
    </form>
  );
}
