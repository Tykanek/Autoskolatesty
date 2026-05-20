const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(process.cwd(), ".env.local") });

const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Chybí Supabase proměnné prostředí. Ujistěte se, že NEXT_PUBLIC_SUPABASE_URL a SUPABASE_SERVICE_ROLE_KEY jsou nastaveny v .env.local"
  );
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function deleteAllRows(table) {
  console.log(`Mažu tabulku ${table}...`);
  const { error } = await supabase.from(table).delete().gt("id", 0);

  if (error) {
    throw new Error(`Chyba při mazání tabulky ${table}: ${error.message}`);
  }
  console.log(`Tabulka ${table} vymazána.`);
}

async function importQuestions() {
  const filePath = path.join(process.cwd(), "data", "questions.json");
  if (!fs.existsSync(filePath)) {
    throw new Error(`Soubor s otázkami nebyl nalezen: ${filePath}`);
  }

  const fileContent = fs.readFileSync(filePath, "utf-8");
  const questions = JSON.parse(fileContent);

  console.log(`Načteno otázek ze souboru: ${questions.length}`);

  // 1. Vymazání starých dat ve správném pořadí (nejprve potomci)
  await deleteAllRows("answers");
  await deleteAllRows("questions");

  // 2. Příprava otázek pro dávkové vložení
  // Poznámka: Ujistěte se, že tabulka 'questions' má sloupec 'source_id' pro ukládání původního ID.
  const questionsToInsert = questions.map((q) => ({
    source_id: q.source_id,
    question_text: q.question_text,
    category: q.category,
    points: q.points,
    image_url: q.image_url,
  }));

  // 3. Dávkové vložení všech otázek
  console.log("Vkládám otázky do databáze...");
  const { data: insertedQuestions, error: questionError } = await supabase
    .from("questions")
    .insert(questionsToInsert)
    .select("id, source_id");

  if (questionError) {
    throw new Error(`Chyba při vkládání otázek: ${questionError.message}`);
  }
  console.log(`Úspěšně vloženo ${insertedQuestions.length} otázek.`);

  // 4. Vytvoření mapování z source_id na nové databázové ID
  const sourceIdToDbIdMap = insertedQuestions.reduce((acc, q) => {
    acc[q.source_id] = q.id;
    return acc;
  }, {});

  // 5. Příprava všech odpovědí pro dávkové vložení
  const allAnswersToInsert = questions.flatMap((originalQuestion) => {
    const questionId = sourceIdToDbIdMap[originalQuestion.source_id];
    if (!questionId) {
      console.warn(
        `Nenalezeno databázové ID pro otázku se source_id: ${originalQuestion.source_id}. Odpovědi budou přeskočeny.`
      );
      return [];
    }

    return originalQuestion.answers
      .filter((answer) => answer.answer_text || answer.media_url)
      .map((answer) => ({
        question_id: questionId,
        answer_text: answer.answer_text || answer.media_url,
        is_correct: answer.is_correct,
      }));
  });

  // 6. Dávkové vložení všech odpovědí
  console.log(`Vkládám ${allAnswersToInsert.length} odpovědí...`);
  const { error: answersError } = await supabase
    .from("answers")
    .insert(allAnswersToInsert);

  if (answersError) {
    throw new Error(`Chyba při vkládání odpovědí: ${answersError.message}`);
  }
  console.log("Všechny odpovědi úspěšně vloženy.");

  console.log("Import dokončen.");
}

importQuestions().catch((error) => {
  console.error("Během importu došlo k chybě:", error.message);
  process.exit(1);
});