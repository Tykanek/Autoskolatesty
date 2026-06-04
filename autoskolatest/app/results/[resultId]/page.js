import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "../../lib/supabase";

export const dynamic = "force-dynamic";

const MAX_POINTS = 50;
const PASS_PERCENT = 85;
const PASS_POINTS = 43;

function safeAnswers(result) {
  return Array.isArray(result.answers) ? result.answers : [];
}

function scoreValue(result) {
  return Number(result.score) || 0;
}

function resultPercent(result) {
  return Math.round((scoreValue(result) / MAX_POINTS) * 100);
}

function resultStatus(result) {
  return scoreValue(result) >= PASS_POINTS ? "Prospěl" : "Neprospěl";
}

export default async function TestResultPage({ params }) {
  const { resultId } = params;
  const { data: result, error } = await supabase
    .from("test_results")
    .select("*")
    .eq("id", resultId)
    .single();

  if (error || !result) {
    notFound();
  }

  const answers = safeAnswers(result);
  const score = scoreValue(result);
  const percent = resultPercent(result);
  const passed = score >= PASS_POINTS;
  const status = resultStatus(result);
  const progressWidth = `${Math.max(0, Math.min(percent, 100))}%`;

  return (
    <main className="min-h-screen px-3 py-4 text-foreground sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-4 sm:space-y-5">
        <header className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <Link href="/results" className="text-sm font-semibold text-primary hover:text-primary-strong">
                Historie testů
              </Link>
              <h1 className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">
                Výsledek testu
              </h1>
              <p className="mt-3 text-base font-semibold text-foreground sm:text-lg">
                Bylo dosaženo {score} bodů z maxima {MAX_POINTS} bodů
              </p>
              <p className="mt-2 text-muted-foreground">
                To je {percent} %, test bylo potřeba splnit na {PASS_PERCENT} %,
                tedy {PASS_POINTS} bodů.
              </p>
            </div>

            <div
                className={`rounded-lg border p-4 text-base font-bold shadow-sm sm:p-5 sm:text-lg ${
                passed
                  ? "border-accent bg-accent-soft text-accent"
                  : "border-destructive bg-destructive-soft text-destructive"
              }`}
            >
              Výsledek testu: {score} body - {status}
            </div>
          </div>
        </header>

        <section className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                Úspěšnost
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Grafické znázornění získaných procent a hranice úspěšnosti.
              </p>
            </div>
            <span className="text-sm font-semibold text-muted-foreground">
              {percent} %
            </span>
          </div>

          <div className="mt-6">
            <div className="relative h-6 rounded-lg bg-muted">
              <div
                className={`h-full rounded-lg ${
                  passed ? "bg-accent" : "bg-destructive"
                }`}
                style={{ width: progressWidth }}
              />
              <div
                className="absolute -top-2 bottom-[-1.75rem] w-0.5 bg-warning"
                style={{ left: `${PASS_PERCENT}%` }}
              />
              <span
                className="absolute top-8 -translate-x-1/2 text-xs font-bold text-warning"
                style={{ left: `${PASS_PERCENT}%` }}
              >
                85 %
              </span>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                Přehled otázek
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Otevřete detail otázky do nového panelu pro kontrolu odpovědi a poznámky.
              </p>
            </div>
          </div>

          {answers.length === 0 ? (
            <p className="mt-4 text-muted-foreground">
              U tohoto výsledku nejsou uložené detailní odpovědi.
            </p>
          ) : (
            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-5 sm:gap-3">
              {answers.map((answer, index) => (
                <a
                  key={`${answer.question_id}-${index}`}
                  href={`/results/${result.id}/questions/${answer.question_id}?index=${index + 1}`}
                  target="_blank"
                  rel="noreferrer"
                  className={`rounded-lg border p-3 text-center text-sm font-bold transition hover:-translate-y-0.5 hover:shadow-md sm:p-4 ${
                    answer.is_correct
                      ? "border-accent bg-accent-soft text-accent"
                      : "border-destructive bg-destructive-soft text-destructive"
                  }`}
                >
                  Otázka č. {index + 1}
                </a>
              ))}
            </div>
          )}
        </section>

        <section className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 shadow-sm sm:flex-row sm:p-5">
          <Link
            href="/test"
            className="rounded-lg bg-primary px-5 py-3 text-center font-semibold text-white shadow-sm transition hover:bg-primary-strong"
          >
            Spustit další test
          </Link>
          <Link
            href="/results"
            className="rounded-lg border border-border bg-card px-5 py-3 text-center font-semibold text-foreground shadow-sm transition hover:bg-muted"
          >
            Historie
          </Link>
          <Link
            href="/questions"
            className="rounded-lg border border-border bg-card px-5 py-3 text-center font-semibold text-foreground shadow-sm transition hover:bg-muted"
          >
            Otázky
          </Link>
        </section>
      </div>
    </main>
  );
}
