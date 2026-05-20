import Link from "next/link";
import { notFound } from "next/navigation";
import MediaPreview, { isMediaUrl } from "../../components/MediaPreview";
import { supabase } from "../../lib/supabase";
import DeleteQuestionButton from "../DeleteQuestionButton";

function AnswerContent({ answer, index }) {
    const mediaUrl = answer.media_url || answer.answer_text;
    const hasMedia = isMediaUrl(mediaUrl);

    return (
        <li
            className={`rounded-lg border p-4 ${
                answer.is_correct
                    ? "border-green-600 bg-green-50 ring-2 ring-green-600"
                    : "border-gray-200 bg-white"
            }`}
        >
            <div className="mb-3 flex items-center justify-between gap-3">
                <span className="font-semibold text-gray-800">Odpověď {index + 1}</span>
                {answer.is_correct && (
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                        Správná
                    </span>
                )}
            </div>

            {hasMedia ? (
                <MediaPreview url={mediaUrl} alt={`Odpověď ${index + 1}`} />
            ) : (
                <p className="text-gray-700">{answer.answer_text || "Bez textu"}</p>
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
        <main className="min-h-screen bg-gray-50 p-4 sm:p-6">
            <div className="mx-auto max-w-4xl">
                <div className="mb-6">
                    <Link href="/questions" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                        &larr; Zpět na seznam otázek
                    </Link>
                </div>

                <div className="rounded-2xl bg-white p-6 shadow-sm sm:p-8">
                    <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
                        <div className="flex-1">
                            <p className="mb-1 text-sm font-semibold text-indigo-600">{question.category}</p>
                            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                                {question.question_text}
                            </h1>
                            <p className="mt-3 text-sm text-gray-600">Počet bodů: {question.points}</p>
                        </div>

                        <div className="flex flex-shrink-0 gap-3">
                            <Link
                                href={`/questions/${question.id}/edit`}
                                className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                            >
                                Upravit
                            </Link>
                            <DeleteQuestionButton questionId={question.id} />
                        </div>
                    </div>

                    {question.image_url && (
                        <MediaPreview
                            url={question.image_url}
                            alt="Médium k otázce"
                            className="mt-6"
                        />
                    )}

                    <div className="mt-8 border-t border-gray-200 pt-8">
                        <h2 className="mb-4 text-xl font-semibold text-gray-900">Odpovědi</h2>
                        {question.answers?.length > 0 ? (
                            <ul className="space-y-4">
                                {question.answers.map((answer, index) => (
                                    <AnswerContent
                                        key={answer.id || index}
                                        answer={answer}
                                        index={index}
                                    />
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-600">Tato otázka zatím nemá žádné odpovědi.</p>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}