"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { saveTestResult } from "../actions";
import MediaPreview, { isMediaUrl } from "../components/MediaPreview";

function getAnswerMedia(answer) {
  return answer.media_url || answer.answer_text;
}

function AnswerOption({ answer, selected, finished, onChoose }) {
  const mediaUrl = getAnswerMedia(answer);
  const hasMedia = isMediaUrl(mediaUrl);

  const stateClass = finished
    ? answer.is_correct
      ? "border-accent bg-accent-soft text-foreground"
      : selected
        ? "border-destructive bg-destructive-soft text-foreground"
        : "border-border bg-white text-foreground"
    : selected
      ? "border-primary bg-primary-soft text-foreground"
      : "border-border bg-white text-foreground hover:border-primary/60 hover:bg-muted";

  return (
    <button
      type="button"
      onClick={onChoose}
      disabled={finished}
      className={`w-full rounded-lg border p-3 text-left text-sm transition ${stateClass}`}
    >
      {hasMedia ? (
        <MediaPreview url={mediaUrl} alt="Odpověď" />
      ) : (
        <span>{answer.answer_text || "Odpověď bez textu"}</span>
      )}
    </button>
  );
}

export default function TestClient({ questions }) {
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [finished, setFinished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const answeredCount = Object.keys(selectedAnswers).length;

  const result = useMemo(() => {
    let score = 0;
    let totalPoints = 0;

    questions.forEach((question) => {
      const points = Number(question.points) || 0;
      totalPoints += points;

      const selectedAnswerId = selectedAnswers[question.id];
      const correctAnswer = question.answers.find((answer) => answer.is_correct);

      if (correctAnswer && correctAnswer.id === selectedAnswerId) {
        score += points;
      }
    });

    return { score, totalPoints };
  }, [questions, selectedAnswers]);

  const chooseAnswer = (questionId, answerId) => {
    setSelectedAnswers((current) => ({
      ...current,
      [questionId]: answerId,
    }));
  };

  const finishTest = async () => {
    setFinished(true);
    setSaving(true);
    setSaveError("");

    try {
      const response = await saveTestResult({
        user_name: "Student",
        score: result.score,
        total_points: result.totalPoints,
      });

      if (!response.ok) {
        setSaveError(`Výsledek se nepodařilo uložit: ${response.error}`);
      }
    } catch (error) {
      setSaveError(`Výsledek se nepodařilo uložit: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

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
                Cvičný test
              </h1>
              <p className="mt-2 text-muted-foreground">
                Zodpovězeno {answeredCount} z {questions.length} otázek.
              </p>
            </div>

            <div className="rounded-lg border border-border bg-muted px-4 py-3 text-sm font-semibold text-foreground">
              {result.score} / {result.totalPoints} bodů
            </div>
          </div>
        </header>

        {finished && (
          <section className="rounded-lg border border-accent bg-accent-soft p-5 text-accent">
            <h2 className="text-xl font-bold">
              Výsledek: {result.score} / {result.totalPoints} bodů
            </h2>
            {saving && <p className="mt-2 text-sm">Ukládám výsledek...</p>}
          </section>
        )}

        {saveError && (
          <section className="rounded-lg border border-warning bg-warning-soft p-4 text-sm text-warning">
            {saveError}
          </section>
        )}

        <div className="space-y-4">
          {questions.map((question, index) => (
            <section
              key={question.id}
              className="rounded-lg border border-border bg-card p-5 shadow-sm"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <h2 className="text-lg font-semibold text-foreground">
                  {index + 1}. {question.question_text}
                </h2>
                <span className="w-fit rounded-lg bg-muted px-3 py-1 text-sm font-semibold text-muted-foreground">
                  {question.points} bodů
                </span>
              </div>

              <p className="mt-2 text-sm text-muted-foreground">
                {question.category || "Bez kategorie"}
              </p>

              <MediaPreview
                url={question.image_url}
                alt={`Médium k otázce ${index + 1}`}
                className="mt-4"
              />

              <div className="mt-4 space-y-2">
                {question.answers.map((answer) => (
                  <AnswerOption
                    key={answer.id}
                    answer={answer}
                    selected={selectedAnswers[question.id] === answer.id}
                    finished={finished}
                    onChoose={() => chooseAnswer(question.id, answer.id)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-5 shadow-sm sm:flex-row">
          {!finished ? (
            <button
              type="button"
              onClick={finishTest}
              disabled={saving}
              className="rounded-lg bg-primary px-5 py-3 text-center font-semibold text-white shadow-sm transition hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Ukládám..." : "Vyhodnotit test"}
            </button>
          ) : (
            <Link
              href="/test"
              className="rounded-lg bg-primary px-5 py-3 text-center font-semibold text-white shadow-sm transition hover:bg-primary-strong"
            >
              Spustit další test
            </Link>
          )}

          <Link
            href="/questions"
            className="rounded-lg border border-border bg-white px-5 py-3 text-center font-semibold text-foreground shadow-sm transition hover:bg-muted"
          >
            Otázky
          </Link>
        </div>
      </div>
    </main>
  );
}
