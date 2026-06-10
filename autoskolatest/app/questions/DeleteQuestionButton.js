"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { deleteQuestion } from "../actions";
import { useAuth } from "../components/AuthProvider";

export default function DeleteQuestionButton({ questionId, className = "" }) {
  const router = useRouter();
  const { accessToken } = useAuth();
  const [isPending, startTransition] = useTransition();

  const handleDelete = async () => {
    const confirmed = confirm("Opravdu chcete smazat tuto otázku?");

    if (!confirmed) {
      return;
    }

    startTransition(async () => {
      try {
        const result = await deleteQuestion(questionId, accessToken);

        if (!result?.ok) {
          alert("Chyba při mazání otázky: " + result?.error);
          return;
        }

        if (window.location.pathname.includes(`/questions/${questionId}`)) {
          router.push("/questions");
        } else {
          router.refresh();
        }
      } catch (error) {
        alert(error.message || "Neoprávněný přístup");
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      className={`rounded-lg px-3 py-2 text-sm font-semibold text-destructive transition hover:bg-destructive-soft disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {isPending ? "Mažu..." : "Smazat"}
    </button>
  );
}
