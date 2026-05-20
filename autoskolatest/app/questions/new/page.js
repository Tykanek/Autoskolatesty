import Link from "next/link";
import QuestionForm from "../QuestionForm";

export default function NewQuestionPage() {
  return (
    <main className="min-h-screen px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-5">
        <header className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <Link href="/questions" className="text-sm font-semibold text-primary hover:text-primary-strong">
            Zpět na otázky
          </Link>
          <h1 className="mt-2 text-3xl font-bold text-foreground">
            Nová otázka
          </h1>
          <p className="mt-2 text-muted-foreground">
            Vyplňte text otázky, bodové hodnocení a alespoň dvě odpovědi.
          </p>
        </header>

        <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <QuestionForm mode="create" />
        </section>
      </div>
    </main>
  );
}
