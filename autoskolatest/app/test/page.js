import Link from "next/link";
import { supabase } from "../lib/supabase";
import TestClient from "./TestClient";

export const dynamic = "force-dynamic";

const TEST_CATEGORIES = [
  {
    label: "Znalost pravidel provozu na pozemních komunikacích",
    count: 10,
    aliases: ["Pravidla provozu"],
  },
  {
    label: "Znalost zásad bezpečné jízdy a ovládání vozidla",
    count: 4,
    aliases: ["Zásady bezpečné jízdy"],
  },
  {
    label: "Znalost dopravních značek, světelných a akustických signálů",
    count: 3,
    aliases: ["Dopravní značky"],
  },
  {
    label: "Schopnost řešení dopravních situací",
    count: 3,
    aliases: ["Dopravní situace"],
  },
  {
    label: "Znalost předpisů o podmínkách provozu vozidel",
    count: 2,
    aliases: ["Technické podmínky", "Předpisy o podmínkách provozu vozidel"],
  },
  {
    label: "Znalost předpisů souvisejících s provozem",
    count: 2,
    aliases: ["Předpisy související s provozem"],
  },
  {
    label: "Znalost zdravotnické přípravy",
    count: 1,
    aliases: ["Zdravotnická příprava"],
  },
];

const TEST_QUESTION_COUNT = TEST_CATEGORIES.reduce(
  (total, category) => total + category.count,
  0
);

const CATEGORY_LOOKUP = TEST_CATEGORIES.reduce((lookup, category, index) => {
  [category.label, ...category.aliases].forEach((name) => {
    lookup.set(normalizeCategory(name), index);
  });

  return lookup;
}, new Map());

function normalizeCategory(value) {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function shuffleQuestions(questions) {
  const shuffled = [...questions];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [
      shuffled[swapIndex],
      shuffled[index],
    ];
  }

  return shuffled;
}

function hasUsableAnswers(question) {
  const answers = question.answers || [];

  return (
    answers.length >= 2 &&
    answers.filter((answer) => answer.is_correct).length === 1
  );
}

function categoryIndexFor(question) {
  return CATEGORY_LOOKUP.get(normalizeCategory(question.category));
}

function selectTestQuestions(questions) {
  const buckets = TEST_CATEGORIES.map(() => []);

  questions.filter(hasUsableAnswers).forEach((question) => {
    const categoryIndex = categoryIndexFor(question);

    if (categoryIndex !== undefined) {
      buckets[categoryIndex].push(question);
    }
  });

  const shortages = TEST_CATEGORIES.flatMap((category, index) => {
    const available = buckets[index].length;

    if (available >= category.count) {
      return [];
    }

    return [
      {
        category: category.label,
        required: category.count,
        available,
      },
    ];
  });

  if (shortages.length > 0) {
    return { questions: [], shortages };
  }

  const selectedQuestions = TEST_CATEGORIES.flatMap((category, index) =>
    shuffleQuestions(buckets[index]).slice(0, category.count)
  );

  return {
    questions: selectedQuestions,
    shortages: [],
  };
}

export default async function TestPage() {
  const { data: questions, error } = await supabase
    .from("questions")
    .select("*, answers(*)")
    .limit(2000);

  if (error) {
    return (
      <main className="min-h-screen px-4 py-6 text-foreground sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-lg border border-destructive bg-destructive-soft p-5 text-destructive">
          <h1 className="text-2xl font-bold">Chyba při načítání testu</h1>
          <p className="mt-3 text-sm">{error.message}</p>
          <Link href="/" className="mt-5 inline-flex font-semibold underline">
            Zpět na přehled
          </Link>
        </div>
      </main>
    );
  }

  const { questions: testQuestions, shortages } = selectTestQuestions(
    questions || []
  );

  if (shortages.length > 0) {
    return (
      <main className="min-h-screen px-4 py-6 text-foreground sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-lg border border-border bg-card p-5 shadow-sm">
          <h1 className="text-3xl font-bold text-foreground">Cvičný test</h1>
          <p className="mt-3 text-muted-foreground">
            V databázi není dostatek použitelných otázek pro test o{" "}
            {TEST_QUESTION_COUNT} otázkách podle předepsaných kategorií.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            {shortages.map((shortage) => (
              <li key={shortage.category}>
                {shortage.category}: dostupné {shortage.available} z{" "}
                {shortage.required}
              </li>
            ))}
          </ul>

          <Link
            href="/questions"
            className="mt-5 inline-flex rounded-lg bg-primary px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-primary-strong"
          >
            Otevřít otázky
          </Link>
        </div>
      </main>
    );
  }

  return <TestClient questions={testQuestions} />;
}
