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
const INSERT_BATCH_SIZE = 500;
const EXPECTED_GROUP_B_QUESTION_COUNT = 1114;
const GROUP_B_SOURCE_ID_PATTERN = /^\d{8}$/;

const categoryPoints = {
  "Znalost pravidel provozu na pozemních komunikacích": 2,
  "Znalost zásad bezpečné jízdy a ovládání vozidla": 2,
  "Znalost dopravních značek, světelných a akustických signálů": 1,
  "Schopnost řešení dopravních situací": 4,
  "Znalost předpisů o podmínkách provozu vozidel": 1,
  "Znalost předpisů souvisejících s provozem": 2,
  "Znalost zdravotnické přípravy": 1,
};

const categoryAliases = {
  "Pravidla provozu": "Znalost pravidel provozu na pozemních komunikacích",
  "Zásady bezpečné jízdy": "Znalost zásad bezpečné jízdy a ovládání vozidla",
  "Dopravní značky":
    "Znalost dopravních značek, světelných a akustických signálů",
  "Dopravní situace": "Schopnost řešení dopravních situací",
  "Technické podmínky": "Znalost předpisů o podmínkách provozu vozidel",
  "Předpisy o podmínkách provozu vozidel":
    "Znalost předpisů o podmínkách provozu vozidel",
  "Předpisy související s provozem":
    "Znalost předpisů souvisejících s provozem",
  "Zdravotnická příprava": "Znalost zdravotnické přípravy",
};

function getPointsForCategory(category) {
  const categoryName = category?.trim();
  const canonicalCategory = categoryAliases[categoryName] || categoryName;

  if (Object.prototype.hasOwnProperty.call(categoryPoints, canonicalCategory)) {
    return categoryPoints[canonicalCategory];
  }

  throw new Error(
    `Neznámá kategorie otázky "${category}". Doplň mapování bodů před importem.`
  );
}

function isGroupBQuestion(question) {
  return GROUP_B_SOURCE_ID_PATTERN.test(String(question.source_id || "").trim());
}

function filterGroupBQuestions(questions) {
  const groupBQuestions = questions.filter(isGroupBQuestion);
  const skippedCount = questions.length - groupBQuestions.length;

  if (skippedCount > 0) {
    const skippedIds = questions
      .filter((question) => !isGroupBQuestion(question))
      .map((question) => question.source_id)
      .join(", ");

    console.log(
      `Vyřazeno ${skippedCount} otázek mimo sadu B podle source_id: ${skippedIds}`
    );
  }

  if (groupBQuestions.length !== EXPECTED_GROUP_B_QUESTION_COUNT) {
    throw new Error(
      `Po filtru skupiny B zůstalo ${groupBQuestions.length} otázek, očekáváno je ${EXPECTED_GROUP_B_QUESTION_COUNT}. Import zastaven před mazáním databáze.`
    );
  }

  console.log(
    `K importu připraveno ${groupBQuestions.length} otázek pro skupinu B.`
  );

  return groupBQuestions;
}

async function deleteAllRows(table) {
  console.log(`Mažu tabulku ${table}...`);
  const { error } = await supabase.from(table).delete().gt("id", 0);

  if (error) {
    throw new Error(`Chyba při mazání tabulky ${table}: ${error.message}`);
  }
  console.log(`Tabulka ${table} vymazána.`);
}

function chunkRows(rows, size) {
  const chunks = [];

  for (let index = 0; index < rows.length; index += size) {
    chunks.push(rows.slice(index, index + size));
  }

  return chunks;
}

async function insertQuestions(rows) {
  const insertedRows = [];
  const chunks = chunkRows(rows, INSERT_BATCH_SIZE);

  for (const [index, chunk] of chunks.entries()) {
    const { data, error } = await supabase
      .from("questions")
      .insert(chunk)
      .select("id");

    if (error) {
      throw new Error(
        `Chyba při vkládání otázek v dávce ${index + 1}: ${error.message}`
      );
    }

    insertedRows.push(...data);
    console.log(
      `Vložena dávka otázek ${index + 1}/${chunks.length} (${data.length} řádků).`
    );
  }

  return insertedRows;
}

async function insertAnswers(rows) {
  const chunks = chunkRows(rows, INSERT_BATCH_SIZE);

  for (const [index, chunk] of chunks.entries()) {
    const { error } = await supabase.from("answers").insert(chunk);

    if (error) {
      throw new Error(
        `Chyba při vkládání odpovědí v dávce ${index + 1}: ${error.message}`
      );
    }

    console.log(
      `Vložena dávka odpovědí ${index + 1}/${chunks.length} (${chunk.length} řádků).`
    );
  }
}

async function importQuestions() {
  const filePath = path.join(process.cwd(), "data", "questions.json");
  if (!fs.existsSync(filePath)) {
    throw new Error(`Soubor s otázkami nebyl nalezen: ${filePath}`);
  }

  const fileContent = fs.readFileSync(filePath, "utf-8");
  const questions = JSON.parse(fileContent);

  console.log(`Zdrojový soubor obsahuje ${questions.length} otázek.`);
  const groupBQuestions = filterGroupBQuestions(questions);

  // 1. Příprava otázek pro vložení s body přepsanými podle kategorie
  const questionsToInsert = groupBQuestions.map((q) => ({
    question_text: q.question_text,
    category: q.category,
    points: getPointsForCategory(q.category),
    image_url: q.image_url,
  }));

  // 2. Vymazání starých dat
  await deleteAllRows("answers");
  await deleteAllRows("questions");

  // 3. Dávkové vložení všech otázek
  console.log("Vkládám otázky do databáze...");
  const insertedQuestions = await insertQuestions(questionsToInsert);
  console.log(`Úspěšně vloženo ${insertedQuestions.length} otázek.`);

  if (insertedQuestions.length !== groupBQuestions.length) {
    throw new Error(
      `Počet vložených otázek (${insertedQuestions.length}) neodpovídá počtu otázek pro skupinu B (${groupBQuestions.length}).`
    );
  }

  // 5. Příprava všech odpovědí pro dávkové vložení
  const allAnswersToInsert = groupBQuestions.flatMap((originalQuestion, index) => {
    const questionId = insertedQuestions[index]?.id;
    if (!questionId) {
      console.warn(
        `Nenalezeno databázové ID pro otázku na pozici ${index + 1}. Odpovědi budou přeskočeny.`
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
  await insertAnswers(allAnswersToInsert);
  console.log("Všechny odpovědi úspěšně vloženy.");

  console.log("Import dokončen.");
}

importQuestions().catch((error) => {
  console.error("Během importu došlo k chybě:", error.message);
  process.exit(1);
});
