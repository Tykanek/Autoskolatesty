"use client";

import { useEffect, useState, useTransition } from "react";
import { getQuestionNote, saveQuestionNote } from "../../../../actions";
import { useAuth } from "../../../../components/AuthProvider";

export default function QuestionNoteForm({ questionId }) {
  const { accessToken, loading: authLoading, user } = useAuth();
  const [note, setNote] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let active = true;

    if (authLoading) {
      return undefined;
    }

    if (!accessToken) {
      setNote("");
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

        setNote(response.note || "");
      }
    );

    return () => {
      active = false;
    };
  }, [accessToken, authLoading, questionId]);

  const handleSubmit = (event) => {
    event.preventDefault();
    setStatus("");
    setError("");

    startTransition(async () => {
      const response = await saveQuestionNote({
        access_token: accessToken,
        question_id: questionId,
        note,
      });

      if (!response.ok) {
        setError(response.error);
        return;
      }

      setNote(response.note || "");
      setStatus("Poznámka byla uložena.");
    });
  };

  const disabled = authLoading || !user || isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-sm font-semibold text-foreground">
          Vlastní poznámka k otázce
        </label>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          disabled={disabled}
          className="mt-2 min-h-36 w-full rounded-lg border border-border bg-card p-3 text-foreground shadow-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
          placeholder={
            user
              ? "Zapište si vlastní vysvětlení, mnemotechniku nebo chybu, na kterou si chcete dát pozor."
              : "Pro ukládání poznámek se přihlaste."
          }
        />
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
