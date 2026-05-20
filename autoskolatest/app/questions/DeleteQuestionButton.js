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

            if (result?.error) {
                alert("Chyba při mazání otázky: " + result.error);
            } else {
                if (window.location.pathname.includes(`/questions/${questionId}`)) {
                    router.push("/questions");
                }
            }
        });
    };

    return (
        <button
            onClick={handleDelete}
            disabled={isPending}
            className="rounded-md px-3 py-1 text-red-500 transition-colors hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
            {isPending ? "Mažu..." : "Smazat"}
        </button>
    );
}