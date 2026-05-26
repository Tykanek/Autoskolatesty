"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getUserQuestionNotes } from "../actions";
import { useAuth } from "../components/AuthProvider";
import DeleteQuestionButton from "./DeleteQuestionButton";

function shortText(value, length = 96) {
  if (!value) {
    return "Bez textu otázky";
  }

  return value.length > length ? `${value.slice(0, length)}...` : value;
}

function notePreview(value, length = 140) {
  if (!value) {
    return "";
  }

  return value.length > length ? `${value.slice(0, length)}...` : value;
}

export default function QuestionsClient({ questions }) {
  const { accessToken } = useAuth();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("vse");
  const [notesByQuestionId, setNotesByQuestionId] = useState({});

  useEffect(() => {
    let active = true;

    if (!accessToken) {
      setNotesByQuestionId({});
      return undefined;
    }

    getUserQuestionNotes({ access_token: accessToken }).then((response) => {
      if (!active || !response.ok) {
        return;
      }

      const nextNotes = (response.notes || []).reduce((notes, item) => {
        if (item.note) {
          notes[String(item.question_id)] = item.note;
        }

        return notes;
      }, {});

      setNotesByQuestionId(nextNotes);
    });

    return () => {
      active = false;
    };
  }, [accessToken]);

  const categories = useMemo(
    () =>
      Array.from(
        new Set(questions.map((question) => question.category).filter(Boolean))
      ).sort((a, b) => a.localeCompare(b, "cs")),
    [questions]
  );

  const filteredQuestions = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return questions.filter((question) => {
      const questionText = question.question_text || "";
      const matchesSearch = questionText
        .toLowerCase()
        .includes(normalizedSearch);

      const matchesCategory =
        category === "vse" || question.category === category;

      return matchesSearch && matchesCategory;
    });
  }, [category, questions, search]);

  return (
    <div>
      <div className="grid gap-4 border-b border-border p-4 sm:grid-cols-[1fr_16rem]">
        <label className="space-y-2">
          <span className="block text-sm font-semibold text-foreground">
            Hledání
          </span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Hledat v otázkách..."
            className="w-full rounded-lg border border-border bg-card px-4 py-3 text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/10"
          />
        </label>

        <label className="space-y-2">
          <span className="block text-sm font-semibold text-foreground">
            Kategorie
          </span>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="w-full rounded-lg border border-border bg-card px-4 py-3 text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
          >
            <option value="vse">Všechny kategorie</option>
            {categories.map((categoryName) => (
              <option key={categoryName} value={categoryName}>
                {categoryName}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                Otázka
              </th>
              <th scope="col" className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                Kategorie
              </th>
              <th scope="col" className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                Body
              </th>
              <th scope="col" className="px-4 py-3 text-right text-sm font-semibold text-foreground">
                Akce
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {filteredQuestions.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">
                  Žádné otázky neodpovídají zadaným kritériím.
                </td>
              </tr>
            ) : (
              filteredQuestions.map((question) => (
                <tr key={question.id} className="transition hover:bg-muted/70">
                  <td className="max-w-xl px-4 py-4">
                    <Link
                      href={`/questions/${question.id}`}
                      className="font-semibold text-foreground hover:text-primary"
                    >
                      {shortText(question.question_text)}
                    </Link>
                    {notesByQuestionId[String(question.id)] && (
                      <p className="mt-2 rounded-lg border border-border bg-muted p-2 text-xs leading-5 text-muted-foreground">
                        <span className="font-semibold text-foreground">
                          Poznámka:
                        </span>{" "}
                        {notePreview(notesByQuestionId[String(question.id)])}
                      </p>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm text-muted-foreground">
                    {question.category || "Bez kategorie"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm text-muted-foreground">
                    {question.points}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/questions/${question.id}/edit`}
                        className="rounded-lg px-3 py-2 text-sm font-semibold text-primary transition hover:bg-primary-soft"
                      >
                        Upravit
                      </Link>
                      <DeleteQuestionButton questionId={question.id} />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="border-t border-border bg-muted px-4 py-3 text-sm text-muted-foreground">
        Zobrazeno: {filteredQuestions.length} z {questions.length}
      </div>
    </div>
  );
}
