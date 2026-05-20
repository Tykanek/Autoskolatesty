import Link from "next/link";
import { notFound } from "next/navigation";
import MediaPreview, { isMediaUrl } from "../../components/MediaPreview";
import { supabase } from "../../lib/supabase";
import DeleteQuestionButton from "../DeleteQuestionButton";

export const dynamic = "force-dynamic";

function AnswerContent({ answer, index }) {
  const mediaUrl = answer.media_url || answer.answer_text;
  const hasMedia = isMediaUrl(mediaUrl);

  return (
    <li
      className={`rounded-lg border p-4 ${
        answer.is_correct
          ? "border-accent bg-accent-soft"
          : "border-border bg-white"
      }`}
    >
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <span className="font-semibold text-foreground">
          Odpověď {index + 1}
        </span>
        {answer.is_correct && (
          <span className="w-fit rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-accent">
            Správná
          </span>
        )}
      </div>

      {hasMedia ? (
        <MediaPreview url={mediaUrl} alt={`Odpověď ${index + 1}`} />
      ) : (
        <p className="text-muted-foreground">
          {answer.answer_text || "Bez textu"}
        </p>
      )}
    </li>
  );
}

export default async function QuestionDetailPage({ params }) {
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
      <div className="mx-auto max-w-5xl space-y-5">
        <header className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <Link href="/questions" className="text-sm font-semibold text-primary hover:text-primary-strong">
                Zpět na seznam otázek
              </Link>
              <p className="mt-4 text-sm font-semibold text-accent">
                {question.category || "Bez kategorie"}
              </p>
              <h1 className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">
                {question.question_text}
              </h1>
              <p className="mt-3 text-sm text-muted-foreground">
                Počet bodů: {question.points}
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Link
                href={`/questions/${question.id}/edit`}
                className="rounded-lg border border-border bg-white px-4 py-3 text-center font-semibold text-foreground shadow-sm transition hover:bg-muted"
              >
                Upravit
              </Link>
              <DeleteQuestionButton questionId={question.id} />
            </div>
          </div>
        </header>

        {question.image_url && (
          <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              Média k otázce
            </h2>
            <MediaPreview url={question.image_url} alt="Médium k otázce" />
          </section>
        )}

        <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-foreground">Odpovědi</h2>
          {question.answers?.length > 0 ? (
            <ul className="mt-4 space-y-3">
              {question.answers.map((answer, index) => (
                <AnswerContent
                  key={answer.id || index}
                  answer={answer}
                  index={index}
                />
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-muted-foreground">
              Tato otázka zatím nemá žádné odpovědi.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
