import Link from "next/link";
import { supabase } from "../lib/supabase";
import TestClient from "./TestClient";

export const dynamic = "force-dynamic";

function shuffleQuestions(questions) {
  return [...questions].sort(() => Math.random() - 0.5).slice(0, 10);
}

export default async function TestPage() {
  const { data: questions, error } = await supabase
    .from("questions")
    .select("*, answers(*)");

  if (error) {
    return (
      <main className="min-h-screen px-4 py-6 text-foreground sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-lg border border-destructive bg-destructive-soft p-5 text-destructive">
          <h1 className="text-2xl font-bold">Chyba při načítání testu</h1>
          <p className="mt-3 text-sm">{error.message}</p>
          <Link href="/" className="mt-5 inline-flex font-semibold underline">
            Zpět na přehled
          </Link>
        </div>
      </main>
    );
  }

  const usableQuestions = (questions || []).filter(
    (question) => question.answers?.length >= 2
  );

  if (usableQuestions.length === 0) {
    return (
      <main className="min-h-screen px-4 py-6 text-foreground sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-lg border border-border bg-card p-5 shadow-sm">
          <h1 className="text-3xl font-bold text-foreground">Cvičný test</h1>
          <p className="mt-3 text-muted-foreground">
            V databázi nejsou žádné otázky s alespoň dvěma odpověďmi.
          </p>

          <Link
            href="/questions"
            className="mt-5 inline-flex rounded-lg bg-primary px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-primary-strong"
          >
            Otevřít otázky
          </Link>
        </div>
      </main>
    );
  }

  return <TestClient questions={shuffleQuestions(usableQuestions)} />;
}
