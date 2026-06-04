"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { saveTestResult } from "../actions";
import { useAuth } from "../components/AuthProvider";
import MediaPreview, { isMediaUrl } from "../components/MediaPreview";

const TEST_DURATION_SECONDS = 30 * 60;

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function getAnswerMedia(answer) {
  return answer.media_url || answer.answer_text;
}

function answerText(answer) {
  if (!answer) {
    return "Nezodpovězeno";
  }

  return answer.answer_text || answer.media_url || "Odpověď bez textu";
}

function explanationText(question, selectedAnswer, correctAnswer) {
  if (question.explanation) {
    return question.explanation;
  }

  if (!selectedAnswer) {
    return `Otázka zůstala bez odpovědi. Správná odpověď je: ${answerText(correctAnswer)}.`;
  }

  if (selectedAnswer.id === correctAnswer?.id) {
    return "Zvolená odpověď odpovídá správné možnosti.";
  }

  return `Správná odpověď je: ${answerText(correctAnswer)}. Porovnejte ji se svou volbou a vraťte se k této oblasti v dalším procvičování.`;
}

function AnswerOption({ answer, selected, finished, onChoose }) {
  const mediaUrl = getAnswerMedia(answer);
  const hasMedia = isMediaUrl(mediaUrl);

  const stateClass = finished
    ? answer.is_correct
      ? "border-accent bg-accent-soft text-foreground"
      : selected
        ? "border-destructive bg-destructive-soft text-foreground"
        : "border-border bg-card text-foreground"
    : selected
      ? "border-primary bg-primary-soft text-foreground"
      : "border-border bg-card text-foreground hover:border-primary/60 hover:bg-muted";

  return (
    <button
      type="button"
      onClick={onChoose}
      disabled={finished}
      className={`w-full rounded-lg border p-3 text-left text-sm transition ${stateClass}`}
    >
      <span className="flex flex-col gap-2">
        <span className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-medium">
            {hasMedia ? "Mediální odpověď" : answer.answer_text || "Odpověď bez textu"}
          </span>
          {finished && (
            <span className="flex flex-wrap gap-2">
              {selected && (
                <span className="rounded-lg bg-card px-2 py-1 text-xs font-semibold text-foreground">
                  Vaše odpověď
                </span>
              )}
              {answer.is_correct && (
                <span className="rounded-lg bg-card px-2 py-1 text-xs font-semibold text-accent">
                  Správně
                </span>
              )}
            </span>
          )}
        </span>

        {hasMedia && <MediaPreview url={mediaUrl} alt="Odpověď" />}
      </span>
    </button>
  );
}

function ResultTransition({ redirecting }) {
  return (
    <main className="min-h-screen px-3 py-4 text-foreground sm:px-6 sm:py-6 lg:px-8">
      <section className="mx-auto max-w-5xl rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">
          {redirecting ? "Načítám vyhodnocení" : "Ukládám výsledek"}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {redirecting
            ? "Přecházím na stránku s výsledkem testu."
            : "Probíhá uložení odpovědí a výpočtu bodů."}
        </p>
      </section>
    </main>
  );
}

export default function TestClient({ questions }) {
  const router = useRouter();
  const { user, accessToken } = useAuth();
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const [finishReason, setFinishReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [redirectingToResult, setRedirectingToResult] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveNotice, setSaveNotice] = useState("");
  const [timeLeft, setTimeLeft] = useState(TEST_DURATION_SECONDS);

  const answeredCount = Object.keys(selectedAnswers).length;
  const currentQuestion = questions[currentQuestionIndex];
  const currentQuestionNumber = currentQuestionIndex + 1;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const progressPercent = questions.length
    ? Math.round((currentQuestionNumber / questions.length) * 100)
    : 0;

  const reviewItems = useMemo(
    () =>
      questions.map((question) => {
        const selectedAnswerId = selectedAnswers[question.id];
        const selectedAnswer = question.answers.find(
          (answer) => answer.id === selectedAnswerId
        );
        const correctAnswer = question.answers.find((answer) => answer.is_correct);
        const isCorrect = Boolean(
          correctAnswer && selectedAnswer?.id === correctAnswer.id
        );

        return {
          question,
          selectedAnswer,
          correctAnswer,
          isCorrect,
          explanation: explanationText(question, selectedAnswer, correctAnswer),
        };
      }),
    [questions, selectedAnswers]
  );

  const result = useMemo(() => {
    let score = 0;
    let totalPoints = 0;
    let correctQuestions = 0;

    reviewItems.forEach(({ question, isCorrect }) => {
      const points = Number(question.points) || 0;
      totalPoints += points;

      if (isCorrect) {
        score += points;
        correctQuestions += 1;
      }
    });

    return { score, totalPoints, correctQuestions };
  }, [reviewItems]);

  const chooseAnswer = (questionId, answerId) => {
    setSelectedAnswers((current) => ({
      ...current,
      [questionId]: answerId,
    }));
  };

  const goToPreviousQuestion = () => {
    setCurrentQuestionIndex((index) => Math.max(index - 1, 0));
  };

  const goToNextQuestion = () => {
    setCurrentQuestionIndex((index) =>
      Math.min(index + 1, questions.length - 1)
    );
  };

  const finishTest = useCallback(
    async (reason = "manual") => {
      if (finished || saving) {
        return;
      }

      let redirectPath = "";

      setFinished(true);
      setFinishReason(reason);
      setSaving(true);
      setSaveError("");
      setSaveNotice("");

      const durationSeconds = TEST_DURATION_SECONDS - timeLeft;

      try {
        const response = await saveTestResult({
          access_token: accessToken,
          user_name: user?.email || "Student",
          score: result.score,
          total_points: result.totalPoints,
          total_questions: questions.length,
          correct_questions: result.correctQuestions,
          duration_seconds: durationSeconds,
          answers: reviewItems.map(
            ({ question, selectedAnswer, correctAnswer, isCorrect, explanation }) => ({
              question_id: question.id,
              question_text: question.question_text,
              category: question.category || "Bez kategorie",
              points: Number(question.points) || 0,
              selected_answer_id: selectedAnswer?.id || null,
              selected_answer_text: answerText(selectedAnswer),
              correct_answer_id: correctAnswer?.id || null,
              correct_answer_text: answerText(correctAnswer),
              is_correct: isCorrect,
              explanation,
            })
          ),
        });

        if (!response.ok) {
          setSaveError(`Výsledek se nepodařilo uložit: ${response.error}`);
        } else if (response.storedReview === false) {
          setSaveNotice(
            "Skóre se uložilo, ale detail revize vyžaduje novou Supabase migraci."
          );
          redirectPath = response.id ? `/results/${response.id}` : "/results";
        } else {
          redirectPath = response.id ? `/results/${response.id}` : "/results";
        }
      } catch (error) {
        setSaveError(`Výsledek se nepodařilo uložit: ${error.message}`);
      } finally {
        if (redirectPath || reason === "timeout") {
          setRedirectingToResult(true);
          router.replace(redirectPath || "/results");
          return;
        }

        setSaving(false);
      }
    },
    [
      accessToken,
      finished,
      questions.length,
      result.correctQuestions,
      result.score,
      result.totalPoints,
      reviewItems,
      router,
      saving,
      timeLeft,
      user?.email,
    ]
  );

  useEffect(() => {
    if (finished) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setTimeLeft((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [finished]);

  useEffect(() => {
    if (!finished && timeLeft === 0) {
      finishTest("timeout");
    }
  }, [finishTest, finished, timeLeft]);

  const timeWarning = timeLeft <= 60;

  if (saving || redirectingToResult) {
    return <ResultTransition redirecting={redirectingToResult} />;
  }

  return (
    <main className="min-h-screen px-3 py-4 text-foreground sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-4 sm:space-y-5">
        <header className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <Link href="/" className="text-sm font-semibold text-primary hover:text-primary-strong">
                Přehled
              </Link>
              <h1 className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">
                Cvičný test
              </h1>
              <p className="mt-2 text-muted-foreground">
                Zodpovězeno {answeredCount} z {questions.length} otázek.
              </p>
            </div>

            <div>
              <div
                className={`rounded-lg border px-4 py-3 text-sm font-semibold ${
                  timeWarning && !finished
                    ? "border-warning bg-warning-soft text-warning"
                    : "border-border bg-muted text-foreground"
                }`}
              >
                Čas: {formatTime(timeLeft)}
              </div>
            </div>
          </div>
        </header>

        {finished && (
          <section className="rounded-lg border border-accent bg-accent-soft p-5 text-accent">
            <h2 className="text-xl font-bold">
              Výsledek: {result.score} / {result.totalPoints} bodů
            </h2>
            <p className="mt-2 text-sm">
              Správně {result.correctQuestions} z {questions.length} otázek.
              {finishReason === "timeout" ? " Test byl ukončen po vypršení času." : ""}
            </p>
            {saving && <p className="mt-2 text-sm">Ukládám výsledek...</p>}
          </section>
        )}

        {saveError && (
          <section className="rounded-lg border border-warning bg-warning-soft p-4 text-sm text-warning">
            {saveError}
          </section>
        )}

        {saveNotice && (
          <section className="rounded-lg border border-border bg-muted p-4 text-sm text-muted-foreground">
            {saveNotice}
          </section>
        )}

        {currentQuestion ? (
          <>
            <section className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-primary">
                    Otázka {currentQuestionNumber} z {questions.length}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Zodpovězeno {answeredCount} z {questions.length} otázek.
                  </p>
                </div>
                <span className="text-sm font-semibold text-muted-foreground">
                  {progressPercent} %
                </span>
              </div>

              <div className="mt-4 h-3 overflow-hidden rounded-lg bg-muted">
                <div
                  className="h-full rounded-lg bg-primary transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </section>

            <section className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
              <div>
                <h2 className="text-lg font-semibold leading-7 text-foreground sm:text-xl">
                  {currentQuestion.question_text}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {currentQuestion.category || "Bez kategorie"}
                </p>
              </div>

              <MediaPreview
                key={currentQuestion.id ?? currentQuestion.image_url ?? currentQuestionNumber}
                url={currentQuestion.image_url}
                alt={`Médium k otázce ${currentQuestionNumber}`}
                className="mt-4"
              />

              <div className="mt-4 space-y-2">
                {currentQuestion.answers.map((answer) => (
                  <AnswerOption
                    key={answer.id}
                    answer={answer}
                    selected={selectedAnswers[currentQuestion.id] === answer.id}
                    finished={finished}
                    onChoose={() => chooseAnswer(currentQuestion.id, answer.id)}
                  />
                ))}
              </div>
            </section>

            <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div>
                {currentQuestionIndex > 0 && (
                  <button
                    type="button"
                    onClick={goToPreviousQuestion}
                    disabled={saving || finished}
                    className="w-full rounded-lg border border-border bg-card px-5 py-3 text-center font-semibold text-foreground shadow-sm transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    Předchozí otázka
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                {!isLastQuestion && (
                  <button
                    type="button"
                    onClick={goToNextQuestion}
                    disabled={saving || finished}
                    className="w-full rounded-lg bg-primary px-5 py-3 text-center font-semibold text-white shadow-sm transition hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                  >
                    Další otázka
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => finishTest("manual")}
                  disabled={saving || finished}
                  className="w-full rounded-lg bg-destructive px-5 py-3 text-center font-semibold text-white shadow-sm transition hover:bg-destructive/90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {saving ? "Ukládám..." : "Vyhodnotit test"}
                </button>
              </div>
            </div>
          </>
        ) : (
          <section className="rounded-lg border border-warning bg-warning-soft p-5 text-sm text-warning">
            Test neobsahuje žádné otázky.
          </section>
        )}
      </div>
    </main>
  );
}
