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

    let answerClass =
        "w-full rounded-lg border border-gray-300 p-3 text-left text-black cursor-pointer";

    if (selected) {
        answerClass =
            "w-full rounded-lg border border-black bg-gray-100 p-3 text-left text-black cursor-pointer";
    }

    if (finished && answer.is_correct) {
        answerClass =
            "w-full rounded-lg border border-green-500 bg-green-50 p-3 text-left text-black";
    }

    if (finished && selected && !answer.is_correct) {
        answerClass =
            "w-full rounded-lg border border-red-500 bg-red-50 p-3 text-left text-black";
    }

    return (
        <button
            type="button"
            onClick={onChoose}
            disabled={finished}
            className={answerClass}
        >
            {hasMedia ? (
                <MediaPreview url={mediaUrl} alt="Odpověď" />
            ) : (
                answer.answer_text || "Odpověď bez textu"
            )}
        </button>
    );
}

export default function TestClient({ questions }) {
    const [selectedAnswers, setSelectedAnswers] = useState({});
    const [finished, setFinished] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState("");

    const result = useMemo(() => {
        let score = 0;
        let totalPoints = 0;

        questions.forEach((question) => {
            totalPoints += question.points;

            const selectedAnswerId = selectedAnswers[question.id];
            const correctAnswer = question.answers.find((answer) => answer.is_correct);

            if (correctAnswer && correctAnswer.id === selectedAnswerId) {
                score += question.points;
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
        setSaving(true);
        setSaveError("");

        const response = await saveTestResult({
            user_name: "Student",
            score: result.score,
            total_points: result.totalPoints,
        });

        setSaving(false);

        if (!response.ok) {
            setSaveError(response.error);
            return;
        }

        setFinished(true);
    };

    return (
        <main className="min-h-screen bg-gray-100 p-6 text-black">
            <div className="mx-auto max-w-4xl rounded-2xl bg-white p-8 shadow">
                <h1 className="mb-2 text-3xl font-bold">Cvičný test</h1>
                <p className="mb-6 text-gray-700">
                    Zodpovězeno: {Object.keys(selectedAnswers).length} / {questions.length}
                </p>

                {finished && (
                    <div className="mb-6 rounded-xl border border-green-500 bg-green-50 p-4">
                        <h2 className="text-xl font-bold text-green-700">
                            Výsledek: {result.score} / {result.totalPoints} bodů
                        </h2>
                    </div>
                )}

                {saveError && (
                    <div className="mb-6 rounded-xl border border-red-300 bg-red-50 p-4 text-red-700">
                        {saveError}
                    </div>
                )}

                <div className="space-y-6">
                    {questions.map((question, index) => (
                        <div
                            key={question.id}
                            className="rounded-xl border border-gray-300 p-5"
                        >
                            <h2 className="mb-2 text-xl font-semibold">
                                {index + 1}. {question.question_text}
                            </h2>

                            <p className="mb-4 text-sm text-gray-700">
                                Kategorie: {question.category} | Body: {question.points}
                            </p>

                            <MediaPreview
                                url={question.image_url}
                                alt={`Médium k otázce ${index + 1}`}
                                className="mb-4"
                            />

                            <div className="space-y-2">
                                {question.answers.map((answer) => (
                                    <AnswerOption
                                        key={answer.id}
                                        answer={answer}
                                        selected={selectedAnswers[question.id] === answer.id}
                                        finished={finished}
                                        onChoose={() =>
                                            chooseAnswer(question.id, answer.id)
                                        }
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {!finished && (
                    <button
                        onClick={finishTest}
                        disabled={saving}
                        className="mt-6 rounded-xl bg-black px-5 py-3 text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {saving ? "Ukládám..." : "Vyhodnotit test"}
                    </button>
                )}

                <div className="mt-6">
                    <Link href="/" className="text-blue-600 underline">
                        Zpět na hlavní stránku
                    </Link>
                </div>
            </div>
        </main>
    );
}
