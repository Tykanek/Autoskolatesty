import Link from "next/link";
import { supabase } from "../lib/supabase";
import QuestionsClient from "./QuestionsClient";

export const dynamic = "force-dynamic";

export default async function QuestionsPage() {
  const { data: questions, error } = await supabase
    .from("questions")
    .select("*")
    .limit(2000)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <main className="min-h-screen px-3 py-4 text-foreground sm:px-6 sm:py-6 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-lg border border-destructive bg-destructive-soft p-4 text-destructive sm:p-5">
          <h1 className="text-2xl font-bold">Chyba při načítání otázek</h1>
          <p className="mt-3 text-sm">{error.message}</p>
          <Link href="/" className="mt-5 inline-flex font-semibold underline">
            Zpět na přehled
          </Link>
        </div>
      </main>
    );
  }

  const safeQuestions = questions || [];

  return (
    <main className="min-h-screen px-3 py-4 text-foreground sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-4 sm:space-y-5">
        <header className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <Link href="/" className="text-sm font-semibold text-primary hover:text-primary-strong">
                Přehled
              </Link>
              <h1 className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">
                Seznam otázek
              </h1>
              <p className="mt-2 text-muted-foreground">
                Celkem v databázi: {safeQuestions.length} otázek.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/test"
                className="rounded-lg border border-border bg-card px-4 py-3 text-center font-semibold text-foreground shadow-sm transition hover:bg-muted"
              >
                Spustit test
              </Link>
              <Link
                href="/questions/new"
                className="rounded-lg bg-primary px-4 py-3 text-center font-semibold text-white shadow-sm transition hover:bg-primary-strong"
              >
                Přidat otázku
              </Link>
            </div>
          </div>
        </header>

        <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          <QuestionsClient questions={safeQuestions} />
        </section>
      </div>
    </main>
  );
}
