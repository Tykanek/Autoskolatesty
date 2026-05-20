import Link from "next/link";
import { supabase } from "../lib/supabase";
import TestClient from "./TestClient";

function shuffleQuestions(questions) {
    return [...questions].sort(() => Math.random() - 0.5).slice(0, 10);
}

export default async function TestPage() {
    const { data: questions, error } = await supabase
        .from("questions")
        .select("*, answers(*)");

    if (error) {
        return (
            <main className="min-h-screen bg-gray-100 p-6 text-black">
                <div className="mx-auto max-w-4xl rounded-2xl bg-white p-8 shadow">
                    <h1 className="text-2xl font-bold text-red-600">
                        Chyba při načítání testu
                    </h1>
                    <p className="mt-4">{error.message}</p>
                </div>
            </main>
        );
    }

    const usableQuestions = (questions || []).filter(
        (question) => question.answers?.length > 0
    );

    if (usableQuestions.length === 0) {
        return (
            <main className="min-h-screen bg-gray-100 p-6 text-black">
                <div className="mx-auto max-w-4xl rounded-2xl bg-white p-8 shadow">
                    <h1 className="mb-4 text-3xl font-bold">Test</h1>
                    <p>V databázi nejsou žádné otázky.</p>

                    <Link href="/questions" className="mt-4 inline-block text-blue-600 underline">
                        Zpět na otázky
                    </Link>
                </div>
            </main>
        );
    }

    return <TestClient questions={shuffleQuestions(usableQuestions)} />;
}
