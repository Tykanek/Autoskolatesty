import Link from "next/link";
import QuestionForm from "../QuestionForm";

export default function NewQuestionPage() {
  return (
    <main className="min-h-screen px-3 py-4 text-foreground sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-4 sm:space-y-5">
        <header className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
          <Link href="/questions" className="text-sm font-semibold text-primary hover:text-primary-strong">
            Zpět na otázky
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">
            Nová otázka
          </h1>
          <p className="mt-2 text-muted-foreground">
            Vyplňte text otázky, bodové hodnocení a alespoň dvě odpovědi.
          </p>
        </header>

        <section className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
          <QuestionForm mode="create" />
        </section>
      </div>
    </main>
  );
}
