import Link from "next/link";
import { supabase } from "../lib/supabase";
import QuestionsClient from "./QuestionsClient";

export default async function QuestionsPage() {
    const { data: questions, error } = await supabase
        .from("questions")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        return (
            <main className="flex min-h-screen w-full flex-col items-center justify-center p-8">
                <div className="w-full max-w-4xl rounded-lg bg-card p-8 text-center">
                    <h1 className="text-2xl font-bold text-destructive">
                        Chyba při načítání otázek
                    </h1>
                    <p className="mt-4 text-muted-foreground">{error.message}</p>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen w-full p-4 sm:p-8">
            <div className="mx-auto max-w-5xl">
                <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">Seznam otázek</h1>
                        <p className="mt-1 text-muted-foreground">Spravujte, upravujte a přidávejte nové otázky do systému.</p>
                    </div>

                    <Link
                        href="/questions/new"
                        className="rounded-full bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                    >
                        + Přidat novou otázku
                    </Link>
                </div>

                <div className="rounded-xl border border-border bg-card shadow-sm">
                    <QuestionsClient questions={questions} />
                </div>
            </div>
        </main>
    );
}