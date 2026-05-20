"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { saveQuestion } from "../actions";

const QuestionSchema = z.object({
  id: z.number().optional(),
  question_text: z.string().min(5, "Text otázky musí mít alespoň 5 znaků."),
  points: z.coerce.number().min(1, "Otázka musí mít alespoň 1 bod."),
  answers: z
    .array(
      z.object({
        id: z.number().optional(),
        answer_text: z.string().min(1, "Odpověď nesmí být prázdná."),
        is_correct: z.boolean(),
      })
    )
    .min(2, "Musíte zadat alespoň dvě odpovědi.")
    .refine((answers) => answers.filter((a) => a.is_correct).length === 1, {
      message: "Přesně jedna odpověď musí být označena jako správná.",
    }),
});

export default function QuestionForm({ mode = "create", question }) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    setError,
    getValues,
  } = useForm({
    resolver: zodResolver(QuestionSchema),
    defaultValues:
      mode === "edit"
        ? {
            id: question.id,
            question_text: question.question_text,
            points: question.points,
            answers: question.answers,
          }
        : {
            question_text: "",
            points: 1,
            answers: [
              { answer_text: "", is_correct: true },
              { answer_text: "", is_correct: false },
            ],
          },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "answers",
  });

  const onSubmit = async (data) => {
    const formData = new FormData();
    formData.append("id", data.id || "");
    formData.append("question_text", data.question_text);
    formData.append("points", data.points);
    formData.append("answers", JSON.stringify(data.answers));

    const result = await saveQuestion(formData);

    if (result.errors) {
      for (const [field, messages] of Object.entries(result.errors)) {
        setError(field, { type: "server", message: messages.join(", ") });
      }
    } else if (result.success) {
      router.push(`/questions/${result.questionId}`);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {errors._form && <p className="text-sm text-red-600">{errors._form.message}</p>}
      
      <input type="hidden" {...register("id")} />

      <div className="space-y-2">
        <label htmlFor="question_text" className="text-sm font-medium leading-6 text-gray-900">
          Text otázky
        </label>
        <textarea
          id="question_text"
          {...register("question_text")}
          rows={4}
          className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
        />
        {errors.question_text && <p className="mt-2 text-sm text-red-600">{errors.question_text.message}</p>}
      </div>

      <div className="space-y-2">
        <label htmlFor="points" className="text-sm font-medium leading-6 text-gray-900">
          Počet bodů
        </label>
        <input
          id="points"
          type="number"
          {...register("points")}
          className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
        />
        {errors.points && <p className="mt-2 text-sm text-red-600">{errors.points.message}</p>}
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-base font-semibold leading-7 text-gray-900">Odpovědi</h3>
          {errors.answers && <p className="mt-2 text-sm text-red-600">{errors.answers.message}</p>}
        </div>
        <div className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-start gap-4 rounded-lg border bg-gray-50 p-4">
              <input type="hidden" {...register(`answers.${index}.id`)} />
              <div className="flex-grow">
                <label htmlFor={`answers.${index}.answer_text`} className="sr-only">
                  Text odpovědi
                </label>
                <input
                  id={`answers.${index}.answer_text`}
                  {...register(`answers.${index}.answer_text`)}
                  placeholder={`Text odpovědi ${index + 1}`}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
                {errors.answers?.[index]?.answer_text && (
                  <p className="mt-2 text-sm text-red-600">{errors.answers[index].answer_text.message}</p>
                )}
              </div>
              <div className="flex h-10 items-center space-x-2">
                <input
                  id={`answers.${index}.is_correct`}
                  type="radio"
                  {...register("answers")}
                  onChange={() => {
                    const currentValues = getValues("answers");
                    const newValues = currentValues.map((ans, i) => ({
                      ...ans,
                      is_correct: i === index,
                    }));
                    control.setValue("answers", newValues, { shouldValidate: true });
                  }}
                  checked={getValues("answers")[index].is_correct}
                  className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-600"
                />
                <label htmlFor={`answers.${index}.is_correct`} className="text-sm text-gray-700">
                  Správná
                </label>
              </div>
              <button type="button" onClick={() => remove(index)} className="h-10 rounded-md px-2 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700">
                ✕
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => append({ answer_text: "", is_correct: false })}
          className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
        >
          Přidat odpověď
        </button>
      </div>

      <div className="flex items-center justify-end gap-x-6 border-t border-gray-900/10 pt-6">
        <button type="button" onClick={() => router.back()} className="text-sm font-semibold leading-6 text-gray-900">
          Zrušit
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
        >
          {isSubmitting ? "Ukládání..." : (mode === "edit" ? "Uložit změny" : "Vytvořit otázku")}
        </button>
      </div>
    </form>
  );
}