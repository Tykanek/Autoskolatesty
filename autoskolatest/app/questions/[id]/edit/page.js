import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import QuestionForm from "../../QuestionForm";

export const dynamic = "force-dynamic";

export default async function EditQuestionPage({ params }) {
  const { id } = await params;
  const { data: question, error } = await supabase
    .from("questions")
    .select("*, answers(*)")
    .eq("id", id)
    .single();

  if (error || !question) {
    notFound();
  }

  return (
    <main className="min-h-screen px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-5">
        <header className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <Link
            href={`/questions/${question.id}`}
            className="text-sm font-semibold text-primary hover:text-primary-strong"
          >
            Zpět na detail
          </Link>
          <h1 className="mt-2 text-3xl font-bold text-foreground">
            Upravit otázku
          </h1>
          <p className="mt-2 text-muted-foreground">
            Změny se po uložení propíšou do seznamu i cvičných testů.
          </p>
        </header>

        <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <QuestionForm mode="edit" question={question} />
        </section>
      </div>
    </main>
  );
}
