"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getUserTestHistory } from "../actions";
import { useAuth } from "../components/AuthProvider";

function percent(result) {
  const total = Number(result.total_points) || 0;

  if (!total) {
    return 0;
  }

  return Math.round((Number(result.score) / total) * 100);
}

function formatDuration(seconds) {
  const safeSeconds = Number(seconds) || 0;

  if (!safeSeconds) {
    return "bez času";
  }

  const minutes = Math.floor(safeSeconds / 60);
  const rest = safeSeconds % 60;

  return `${minutes}:${rest.toString().padStart(2, "0")}`;
}

function safeAnswers(result) {
  return Array.isArray(result.answers) ? result.answers : [];
}

function buildStats(results) {
  if (results.length === 0) {
    return {
      average: 0,
      best: 0,
      totalTests: 0,
      latest: null,
    };
  }

  const percentages = results.map(percent);
  const total = percentages.reduce((sum, value) => sum + value, 0);

  return {
    average: Math.round(total / percentages.length),
    best: Math.max(...percentages),
    totalTests: results.length,
    latest: results[0],
  };
}

function buildProblemQuestions(results) {
  const questions = new Map();

  results.forEach((result) => {
    safeAnswers(result).forEach((answer) => {
      if (answer.is_correct) {
        return;
      }

      const key = String(answer.question_id || answer.question_text);
      const current = questions.get(key) || {
        question_text: answer.question_text,
        category: answer.category,
        correct_answer_text: answer.correct_answer_text,
        misses: 0,
      };

      current.misses += 1;
      questions.set(key, current);
    });
  });

  return Array.from(questions.values())
    .sort((a, b) => b.misses - a.misses)
    .slice(0, 6);
}

export default function ResultsClient() {
  const { user, accessToken, loading: authLoading } = useAuth();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [storedReview, setStoredReview] = useState(true);

  const loadResults = useCallback(async () => {
    if (!accessToken) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await getUserTestHistory({ access_token: accessToken });

      if (!response.ok) {
        setError(response.error);
        setResults([]);
        return;
      }

      setResults(response.results || []);
      setStoredReview(response.storedReview !== false);
    } catch (loadError) {
      setError(loadError.message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    loadResults();
  }, [loadResults]);

  const stats = useMemo(() => buildStats(results), [results]);
  const problemQuestions = useMemo(
    () => buildProblemQuestions(results),
    [results]
  );
  const progressResults = useMemo(
    () => [...results].reverse().slice(-8),
    [results]
  );

  if (authLoading) {
    return (
      <main className="min-h-screen px-4 py-6 text-foreground sm:px-6 lg:px-8">
        <section className="mx-auto max-w-5xl rounded-lg border border-border bg-card p-5 shadow-sm">
          Načítám účet...
        </section>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen px-4 py-6 text-foreground sm:px-6 lg:px-8">
        <section className="mx-auto max-w-5xl rounded-lg border border-border bg-card p-5 shadow-sm">
          <Link href="/" className="text-sm font-semibold text-primary hover:text-primary-strong">
            Přehled
          </Link>
          <h1 className="mt-2 text-3xl font-bold text-foreground">
            Osobní historie testů
          </h1>
          <p className="mt-3 text-muted-foreground">
            Pro ukládání pokroku, historii testů a nejčastější chyby se přihlaste.
          </p>
          <Link
            href="/auth"
            className="mt-5 inline-flex rounded-lg bg-primary px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-primary-strong"
          >
            Přihlásit nebo registrovat
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-5">
        <header className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <Link href="/" className="text-sm font-semibold text-primary hover:text-primary-strong">
                Přehled
              </Link>
              <h1 className="mt-2 text-3xl font-bold text-foreground">
                Osobní historie testů
              </h1>
              <p className="mt-2 text-muted-foreground">
                Přihlášený účet: {user.email}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={loadResults}
                disabled={loading}
                className="rounded-lg border border-border bg-card px-4 py-3 text-center font-semibold text-foreground shadow-sm transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Načítám..." : "Obnovit"}
              </button>
              <Link
                href="/test"
                className="rounded-lg bg-primary px-4 py-3 text-center font-semibold text-white shadow-sm transition hover:bg-primary-strong"
              >
                Spustit test
              </Link>
            </div>
          </div>
        </header>

        {error && (
          <section className="rounded-lg border border-warning bg-warning-soft p-4 text-sm text-warning">
            {error}
          </section>
        )}

        {!storedReview && (
          <section className="rounded-lg border border-warning bg-warning-soft p-4 text-sm text-warning">
            Databáze zatím nemá nové sloupce pro detailní revize. Spusťte Supabase migraci a další testy už uloží i odpovědi.
          </section>
        )}

        <section className="grid gap-4 md:grid-cols-4">
          <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <p className="text-sm font-semibold text-muted-foreground">
              Testů
            </p>
            <p className="mt-2 text-3xl font-bold text-foreground">
              {stats.totalTests}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <p className="text-sm font-semibold text-muted-foreground">
              Průměr
            </p>
            <p className="mt-2 text-3xl font-bold text-foreground">
              {stats.average} %
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <p className="text-sm font-semibold text-muted-foreground">
              Nejlepší výsledek
            </p>
            <p className="mt-2 text-3xl font-bold text-foreground">
              {stats.best} %
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <p className="text-sm font-semibold text-muted-foreground">
              Poslední test
            </p>
            <p className="mt-2 text-3xl font-bold text-foreground">
              {stats.latest ? `${percent(stats.latest)} %` : "-"}
            </p>
          </div>
        </section>

        <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                Pokrok
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Posledních až osm uložených testů.
              </p>
            </div>
          </div>

          {progressResults.length === 0 ? (
            <p className="mt-4 text-muted-foreground">
              Zatím tu není žádný uložený test.
            </p>
          ) : (
            <div className="mt-5 grid gap-3">
              {progressResults.map((result) => {
                const value = percent(result);

                return (
                  <div
                    key={result.id}
                    className="grid gap-2 sm:grid-cols-[9rem_1fr_4rem] sm:items-center"
                  >
                    <span className="text-sm text-muted-foreground">
                      {new Date(result.created_at).toLocaleDateString("cs-CZ")}
                    </span>
                    <div className="h-3 overflow-hidden rounded-lg bg-muted">
                      <div
                        className="h-full rounded-lg bg-primary"
                        style={{ width: `${value}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-foreground">
                      {value} %
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-foreground">
            Nejproblematičtější otázky
          </h2>
          {problemQuestions.length === 0 ? (
            <p className="mt-4 text-muted-foreground">
              Po dalších uložených revizích se zde zobrazí otázky, ve kterých se nejčastěji chybuje.
            </p>
          ) : (
            <div className="mt-4 divide-y divide-border">
              {problemQuestions.map((question) => (
                <article
                  key={`${question.question_text}-${question.misses}`}
                  className="py-4"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {question.question_text}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {question.category || "Bez kategorie"}
                      </p>
                    </div>
                    <span className="w-fit rounded-lg bg-destructive-soft px-3 py-1 text-sm font-semibold text-destructive">
                      {question.misses}x chyba
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Správně: {question.correct_answer_text}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          {results.length === 0 ? (
            <div className="p-5 text-muted-foreground">
              Zatím nejsou uložené žádné výsledky.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {results.map((result) => {
                const answers = safeAnswers(result);

                return (
                  <article key={result.id} className="p-5">
                    <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
                      <div>
                        <h2 className="font-semibold text-foreground">
                          {new Date(result.created_at).toLocaleString("cs-CZ")}
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {result.correct_questions || 0} z {result.total_questions || answers.length || "?"} otázek,
                          čas {formatDuration(result.duration_seconds)}
                        </p>
                      </div>

                      <div className="rounded-lg bg-muted px-4 py-3 text-lg font-bold text-foreground">
                        {result.score} / {result.total_points} bodů
                      </div>
                    </div>

                    {answers.length > 0 && (
                      <details className="mt-4 rounded-lg border border-border bg-muted p-4">
                        <summary className="cursor-pointer text-sm font-semibold text-foreground">
                          Revize odpovědí
                        </summary>
                        <div className="mt-4 space-y-3">
                          {answers.map((answer) => (
                            <div
                              key={`${result.id}-${answer.question_id}`}
                              className="rounded-lg border border-border bg-card p-3"
                            >
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                <p className="font-semibold text-foreground">
                                  {answer.question_text}
                                </p>
                                <span
                                  className={`w-fit rounded-lg px-2 py-1 text-xs font-semibold ${
                                    answer.is_correct
                                      ? "bg-accent-soft text-accent"
                                      : "bg-destructive-soft text-destructive"
                                  }`}
                                >
                                  {answer.is_correct ? "Správně" : "Chyba"}
                                </span>
                              </div>
                              <p className="mt-2 text-sm text-muted-foreground">
                                Vaše odpověď: {answer.selected_answer_text}
                              </p>
                              <p className="mt-1 text-sm text-muted-foreground">
                                Správně: {answer.correct_answer_text}
                              </p>
                              <p className="mt-2 text-sm text-muted-foreground">
                                {answer.explanation}
                              </p>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
