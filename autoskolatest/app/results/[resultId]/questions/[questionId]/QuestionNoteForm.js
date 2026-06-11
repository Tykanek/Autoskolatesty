"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { getQuestionNote, saveQuestionNote } from "../../../../actions";
import { useAuth } from "../../../../components/AuthProvider";
import { questionNoteSchema } from "../../../../lib/questionSchema";

export default function QuestionNoteForm({ questionId }) {
  const { accessToken, loading: authLoading, user } = useAuth();
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(questionNoteSchema),
    defaultValues: {
      title: "Moje poznámka",
      note: "",
    },
  });

  useEffect(() => {
    let active = true;

    if (authLoading) {
      return undefined;
    }

    if (!accessToken) {
      reset({ title: "Moje poznámka", note: "" });
      return undefined;
    }

    getQuestionNote({ access_token: accessToken, question_id: questionId }).then(
      (response) => {
        if (!active) {
          return;
        }

        if (!response.ok) {
          setError(response.error);
          return;
        }

        reset({
          title: response.title || "Moje poznámka",
          note: response.note || "",
        });
      }
    );

    return () => {
      active = false;
    };
  }, [accessToken, authLoading, questionId, reset]);

  const onSubmit = (values) => {
    setStatus("");
    setError("");

    startTransition(async () => {
      const response = await saveQuestionNote({
        access_token: accessToken,
        question_id: questionId,
        ...values,
      });

      if (!response.ok) {
        setError(response.error);
        return;
      }

      reset({
        title: response.title || values.title,
        note: response.note || values.note,
      });
      setStatus("Poznámka byla uložena.");
    });
  };

  const disabled = authLoading || !user || isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
      <div>
        <label className="block text-sm font-semibold text-foreground">
          Název poznámky
        </label>
        <input
          {...register("title")}
          disabled={disabled}
          className="mt-2 w-full rounded-lg border border-border bg-card p-3 text-foreground shadow-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
          placeholder="Např. Pravidlo přednosti"
        />
        {errors.title && (
          <p className="mt-1 text-sm text-destructive">{errors.title.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-foreground">
          Vlastní poznámka k otázce
        </label>
        <textarea
          {...register("note")}
          disabled={disabled}
          className="mt-2 min-h-36 w-full rounded-lg border border-border bg-card p-3 text-foreground shadow-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
          placeholder={
            user
              ? "Zapište si vlastní vysvětlení, mnemotechniku nebo chybu, na kterou si chcete dát pozor."
              : "Pro ukládání poznámek se přihlaste."
          }
        />
        {errors.note && (
          <p className="mt-1 text-sm text-destructive">{errors.note.message}</p>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-destructive bg-destructive-soft p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {status && (
        <div className="rounded-lg border border-accent bg-accent-soft p-3 text-sm text-accent">
          {status}
        </div>
      )}

      <button
        type="submit"
        disabled={disabled}
        className="rounded-lg bg-primary px-5 py-3 text-center font-semibold text-white shadow-sm transition hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Ukládám..." : "Uložit poznámku"}
      </button>
    </form>
  );
}
