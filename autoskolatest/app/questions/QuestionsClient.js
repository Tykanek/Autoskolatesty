"use client";

import { useState } from "react";
import Link from "next/link";
import DeleteQuestionButton from "./DeleteQuestionButton";

export default function QuestionsClient({ questions }) {
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("vse");

    const categories = Array.from(
        new Set(questions.map((question) => question.category))
    );

    const filteredQuestions = questions.filter((question) => {
        const matchesSearch = question.question_text
            .toLowerCase()
            .includes(search.toLowerCase());

        const matchesCategory =
            category === "vse" || question.category === category;

        return matchesSearch && matchesCategory;
    });

    return (
        <div>
            <div className="grid gap-4 p-6 sm:grid-cols-2">
                <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Hledat v otázkách..."
                    className="w-full rounded-lg border border-border bg-secondary px-4 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />

                <select
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                    className="w-full rounded-lg border border-border bg-secondary px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    <option value="vse">Všechny kategorie</option>
                    {categories.map((categoryName) => (
                        <option key={categoryName} value={categoryName}>
                            {categoryName}
                        </option>
                    ))}
                </select>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                    <thead className="bg-secondary/50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Otázka</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Kategorie</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Body</th>
                            <th scope="col" className="relative px-6 py-3"><span className="sr-only">Akce</span></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {filteredQuestions.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                                    Žádné otázky neodpovídají zadaným kritériím.
                                </td>
                            </tr>
                        ) : (
                            filteredQuestions.map((question) => (
                                <tr key={question.id} className="transition-colors hover:bg-secondary/50">
                                    <td className="px-6 py-4">
                                        <Link href={`/questions/${question.id}`} className="font-medium text-foreground hover:text-indigo-400">
                                            {question.question_text.substring(0, 80)}...
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-muted-foreground">{question.category}</td>
                                    <td className="px-6 py-4 text-sm text-muted-foreground">{question.points}</td>
                                    <td className="flex items-center justify-end gap-2 px-6 py-4 text-right text-sm font-medium">
                                        <Link href={`/questions/${question.id}/edit`} className="rounded-md px-3 py-1 text-indigo-400 transition-colors hover:bg-indigo-500/10">
                                            Upravit
                                        </Link>
                                        <DeleteQuestionButton questionId={question.id} />
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            <div className="border-t border-border px-6 py-3 text-xs text-muted-foreground">
                Celkem otázek: {filteredQuestions.length}
            </div>
        </div>
    );
}