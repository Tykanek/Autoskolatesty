import Link from "next/link";
import { notFound } from "next/navigation";
import MediaPreview, { isMediaUrl } from "../../../../components/MediaPreview";
import { supabase } from "../../../../lib/supabase";
import QuestionNoteForm from "./QuestionNoteForm";

export const dynamic = "force-dynamic";

function safeAnswers(result) {
  return Array.isArray(result.answers) ? result.answers : [];
}

function answerText(answer) {
  if (!answer) {
    return "Nezodpovězeno";
  }

  return answer.answer_text || answer.media_url || "Odpověď bez textu";
}

function answerMedia(answer) {
  return answer?.media_url || answer?.answer_text || "";
}

function answerClass({ isCorrect, isSelected }) {
  if (isCorrect) {
    return "border-accent bg-accent-soft";
  }

  if (isSelected) {
    return "border-destructive bg-destructive-soft";
  }

  return "border-border bg-card";
}

function normalizeText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function answerMatchesText(answer, text) {
  const normalizedText = normalizeText(text);

  if (!normalizedText || normalizedText === "nezodpovězeno") {
    return false;
  }

  return normalizeText(answerText(answer)) === normalizedText;
}

function findReview(result, questionId) {
  return safeAnswers(result).find(
    (answer) => String(answer.question_id) === String(questionId)
  );
}

async function findCurrentQuestionForReview(review) {
  if (!review?.question_text) {
    return null;
  }

  const { data, error } = await supabase
    .from("questions")
    .select("*, answers(*)")
    .eq("question_text", review.question_text);

  if (error || !data?.length) {
    return null;
  }

  const exactMatch = data.find((question) =>
    question.answers?.some((answer) =>
      answerMatchesText(answer, review.correct_answer_text)
    )
  );

  return exactMatch || (data.length === 1 ? data[0] : null);
}

function SnapshotAnswer({ label, value, state }) {
  const stateClass =
    state === "correct"
      ? "border-accent bg-accent-soft text-accent"
      : state === "wrong"
        ? "border-destructive bg-destructive-soft text-destructive"
        : "border-border bg-card text-foreground";

  return (
    <article className={`rounded-lg border p-4 ${stateClass}`}>
      <p className="text-sm font-bold">{label}</p>
      <p className="mt-2 text-sm">{value || "Nezodpovězeno"}</p>
    </article>
  );
}

function MissingQuestionSnapshot({ result, review, questionNumber }) {
  return (
    <main className="min-h-screen px-3 py-4 text-foreground sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-4 sm:space-y-5">
        <header className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
          <Link
            href={`/results/${result.id}`}
            className="text-sm font-semibold text-primary hover:text-primary-strong"
          >
            Zpět na výsledek testu
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">
            {questionNumber ? `Otázka č. ${questionNumber}` : "Revize otázky"}
          </h1>
          <p className="mt-2 text-muted-foreground">
            Původní otázka už není v aktuální databázi, zobrazuji uložený záznam
            z výsledku testu.
          </p>
        </header>

        <section className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-muted-foreground">
                Kategorie
              </p>
              <p className="mt-1 font-semibold text-foreground">
                {review.category || "Bez kategorie"} ({review.points || 0} bodů)
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-muted-foreground">
                Text otázky
              </p>
              <p className="mt-2 rounded-lg border border-border bg-muted p-3 text-foreground">
                {review.question_text || "Text otázky není uložený."}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
          <h2 className="text-xl font-semibold text-foreground">Odpovědi</h2>
          <div className="mt-4 space-y-3">
            <SnapshotAnswer
              label="Vaše odpověď"
              value={review.selected_answer_text}
              state={review.is_correct ? "correct" : "wrong"}
            />
            <SnapshotAnswer
              label="Správná odpověď"
              value={review.correct_answer_text}
              state="correct"
            />
          </div>
        </section>

        {review.explanation && (
          <section className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
            <h2 className="text-xl font-semibold text-foreground">
              Vysvětlení
            </h2>
            <p className="mt-3 rounded-lg border border-border bg-muted p-3 text-foreground">
              {review.explanation}
            </p>
          </section>
        )}
      </div>
    </main>
  );
}

export default async function ResultQuestionPage({ params, searchParams }) {
  const { resultId, questionId } = params;
  const questionNumber = Number(searchParams?.index) || null;

  const { data: result, error: resultError } = await supabase
    .from("test_results")
    .select("*")
    .eq("id", resultId)
    .single();

  if (resultError || !result) {
    notFound();
  }

  const review = findReview(result, questionId);

  if (!review) {
    notFound();
  }

  const { data: directQuestion } = await supabase
    .from("questions")
    .select("*, answers(*)")
    .eq("id", questionId)
    .maybeSingle();

  const question = directQuestion || (await findCurrentQuestionForReview(review));

  if (!question) {
    return (
      <MissingQuestionSnapshot
        result={result}
        review={review}
        questionNumber={questionNumber}
      />
    );
  }

  const selectedAnswerId = review.selected_answer_id;
  const correctAnswerId = review.correct_answer_id;
  const selectedAnswer = question.answers?.find(
    (answer) =>
      String(answer.id) === String(selectedAnswerId) ||
      answerMatchesText(answer, review.selected_answer_text)
  );

  return (
    <main className="min-h-screen px-3 py-4 text-foreground sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-4 sm:space-y-5">
        <header className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
          <Link
            href={`/results/${result.id}`}
            className="text-sm font-semibold text-primary hover:text-primary-strong"
          >
            Zpět na výsledek testu
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">
            {questionNumber ? `Otázka č. ${questionNumber}` : "Revize otázky"}
          </h1>
          <p className="mt-2 text-muted-foreground">
            Detail odpovědi z testu a vlastní poznámka ke studiu.
          </p>
        </header>

        <section className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-foreground">
                Text otázky
              </label>
              <textarea
                readOnly
                value={question.question_text || ""}
                className="min-h-28 w-full rounded-lg border border-border bg-muted p-3 text-foreground shadow-sm outline-none"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-foreground">
                  Kategorie
                </label>
                <input
                  readOnly
                  value={question.category || "Bez kategorie"}
                  className="w-full rounded-lg border border-border bg-muted p-3 text-foreground shadow-sm outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-foreground">
                  Počet bodů
                </label>
                <input
                  readOnly
                  value={question.points || 0}
                  className="w-full rounded-lg border border-border bg-muted p-3 text-foreground shadow-sm outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-foreground">
                URL obrázku nebo videa k otázce
              </label>
              <input
                readOnly
                value={question.image_url || ""}
                className="w-full rounded-lg border border-border bg-muted p-3 text-foreground shadow-sm outline-none"
                placeholder="Bez média"
              />
              <MediaPreview
                url={question.image_url}
                alt="Médium k otázce"
                className="mt-3"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-foreground">
                Vysvětlení správné odpovědi
              </label>
              <textarea
                readOnly
                value={
                  question.explanation ||
                  "V databázi zatím není uložené oficiální vysvětlení."
                }
                className="min-h-28 w-full rounded-lg border border-border bg-muted p-3 text-foreground shadow-sm outline-none"
              />
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
          <h2 className="text-xl font-semibold text-foreground">Odpovědi</h2>

          {!selectedAnswer && (
            <div className="mt-4 rounded-lg border border-destructive bg-destructive-soft p-3 text-sm text-destructive">
              V testu nebyla zvolena žádná odpověď.
            </div>
          )}

          <div className="mt-4 space-y-3">
            {(question.answers || []).map((answer, index) => {
              const isSelected =
                String(answer.id) === String(selectedAnswerId) ||
                answerMatchesText(answer, review.selected_answer_text);
              const isCorrect =
                answer.is_correct ||
                String(answer.id) === String(correctAnswerId) ||
                answerMatchesText(answer, review.correct_answer_text);
              const mediaUrl = answerMedia(answer);
              const hasMedia = isMediaUrl(mediaUrl);

              return (
                <article
                  key={answer.id || index}
                  className={`rounded-lg border p-4 ${answerClass({
                    isCorrect,
                    isSelected,
                  })}`}
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-semibold text-foreground">
                        Odpověď {index + 1}
                      </p>
                      {!hasMedia && (
                        <p className="mt-2 text-muted-foreground">
                          {answerText(answer)}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {isSelected && (
                        <span
                          className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                            isCorrect
                              ? "bg-card text-accent"
                              : "bg-card text-destructive"
                          }`}
                        >
                          Vaše odpověď
                        </span>
                      )}
                      {isCorrect && (
                        <span className="rounded-lg bg-card px-2.5 py-1 text-xs font-bold text-accent">
                          Správná odpověď
                        </span>
                      )}
                    </div>
                  </div>

                  {hasMedia && (
                    <MediaPreview
                      url={mediaUrl}
                      alt={`Odpověď ${index + 1}`}
                      className="mt-3"
                    />
                  )}
                </article>
              );
            })}
          </div>
        </section>

        <section className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
          <QuestionNoteForm questionId={question.id} />
        </section>
      </div>
    </main>
  );
}
