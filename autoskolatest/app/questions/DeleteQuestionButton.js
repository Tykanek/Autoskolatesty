"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { deleteQuestion } from "../actions";

export default function DeleteQuestionButton({ questionId }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const handleDelete = async () => {
        const confirmed = confirm("Opravdu chceš smazat tuto otázku?");

        if (!confirmed) {
            return;
        }

        startTransition(async () => {
            const result = await deleteQuestion(questionId);

            if (!result?.ok) {
                alert("Chyba při mazání otázky: " + result?.error);
            } else {
                if (window.location.pathname.includes(`/questions/${questionId}`)) {
                    router.push("/questions");
                } else {
                    router.refresh();
                }
            }
        });
    };

    return (
        <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="rounded-lg px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
            {isPending ? "Mažu..." : "Smazat"}
        </button>
    );
}
