import Link from "next/link";
import { supabase } from "../lib/supabase";

export const dynamic = "force-dynamic";

export default async function ResultsPage() {
  const { data: results, error } = await supabase
    .from("test_results")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <main className="min-h-screen px-4 py-6 text-foreground sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-lg border border-red-200 bg-red-50 p-5 text-red-800">
          <h1 className="text-2xl font-bold">Chyba při načítání výsledků</h1>
          <p className="mt-3 text-sm">{error.message}</p>
          <Link href="/" className="mt-5 inline-flex font-semibold text-red-900 underline">
            Zpět na přehled
          </Link>
        </div>
      </main>
    );
  }

  const safeResults = results || [];

  return (
    <main className="min-h-screen px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-5">
        <header className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <Link href="/" className="text-sm font-semibold text-primary hover:text-primary-strong">
                Přehled
              </Link>
              <h1 className="mt-2 text-3xl font-bold text-foreground">
                Výsledky testů
              </h1>
              <p className="mt-2 text-muted-foreground">
                Poslední uložené výsledky cvičných testů.
              </p>
            </div>

            <Link
              href="/test"
              className="rounded-lg bg-primary px-4 py-3 text-center font-semibold text-white shadow-sm transition hover:bg-primary-strong"
            >
              Spustit test
            </Link>
          </div>
        </header>

        <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          {safeResults.length === 0 ? (
            <div className="p-5 text-muted-foreground">
              Zatím nejsou uložené žádné výsledky.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {safeResults.map((result) => (
                <article
                  key={result.id}
                  className="grid gap-3 p-5 sm:grid-cols-[1fr_auto] sm:items-center"
                >
                  <div>
                    <h2 className="font-semibold text-foreground">
                      {result.user_name || "Student"}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {new Date(result.created_at).toLocaleString("cs-CZ")}
                    </p>
                  </div>

                  <div className="rounded-lg bg-muted px-4 py-3 text-lg font-bold text-foreground">
                    {result.score} / {result.total_points} bodů
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
