# 🚗 Autoškola eTesty (Skupina B)

Moderní full-stack webová aplikace pro efektivní simulaci reálných teoretických zkoušek z autoškoly pro **řidičské oprávnění skupiny B**. Systém disponuje klientským průvodcem (stepperem), hloubkovou revizí chyb, pokročilými statistikami studenta a ukládáním vlastních studijních poznámek.

Projekt byl vytvořen jako maturitní práce v rámci předmětu Tvorba Webových Aplikací na SPŠE V Úžlabině.

## 🚀 Hlavní Funkce

- **Generování testů dle oficiálních kvót:** Algoritmus sestavuje test o délce přesně 25 otázek, seřazených sekvenčně za sebou a náhodně vybraných podle reálných ministerských kritérií:
  - Pravidla provozu na pozemních komunikacích (10 otázek / 2 body za otázku)
  - Zásady bezpečné jízdy a ovládání vozidla (4 otázky / 2 body za otázku)
  - Dopravní značky, světelné a akustické signály (3 otázky / 1 bod za otázku)
  - Schopnost řešení dopravních situací / Křižovatky (3 otázky / 4 body za otázku)
  - Předpisy o podmínkách provozu vozidel (2 otázky / 1 bod za otázku)
  - Předpisy související s provozem (2 otázky / 2 body za otázku)
  - Zdravotnická příprava (1 otázka / 1 bod za otázku)
- **Celkové maximum 50 bodů** s oficiální hranicí úspěšnosti **85 % (minimálně 43 bodů)** pro stav *Prospěl*.
- **Časový limit:** Odpočet nastavený na 30 minut s funkcí automatického vyhodnocení a odeslání při timeoutu.
- **Klientský stepper UI:** V testu se zobrazuje vždy pouze jedna otázka pro maximální soustředění, možnost plynulého přecházení dopředu i zpět. Tlačítko pro předčasné vyhodnocení testu je k dispozici na každé otázce.
- **Osobní poznámky studenta:** Možnost napsat si vlastní poznámku k jakékoliv otázce v detailní revizi chyb. Poznámky se asynchronně ukládají do databáze a propojují se i do globálního seznamu všech otázek na webu.
- **Statistický Dashboard & Historie:** Přihlášení uživatelé vidí přehled svých minulých testů, průměrnou úspěšnost, nejlepší výsledek a dlouhodobě problémové otázky.
- **Python Scraper & API:** Vlastní skript v adresáři `autoskola_eTesty_API` pro automatické stahování a čištění oficiálních otázek. Skript automaticky odfiltruje nevalidní záznamy a propustí pouze 1114 čistých otázek validních pro skupinu B.

## 🛠️ Použité Technologie

- **Frontend & Backend:** [Next.js 14](https://nextjs.org/) (App Router, Server Actions, React Context API)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) (Kompletní Dark Mode s kartovým UI layoutem)
- **Databáze & Auth:** [Supabase](https://supabase.com/) (PostgreSQL relace, Supabase Auth se správou sezení)
- **Data Mining:** [Python 3](https://www.python.org/) (BeautifulSoup4 / Request scraper pro import dat)
- **Validace:** [Zod](https://zod.dev/) & [React Hook Form](https://react-hook-form.com/)

## 📂 Architektura Projektu

```text
AutoskolaFinal/
|-- autoskolatest/                    # Next.js aplikace
|   |-- app/
|   |   |-- auth/
|   |   |   |-- AuthPageClient.js
|   |   |   `-- page.js
|   |   |-- components/
|   |   |   |-- AppNavigation.js
|   |   |   |-- AuthProvider.js
|   |   |   |-- MediaPreview.js
|   |   |   |-- QuestionForm.js
|   |   |   `-- ThemeProvider.js
|   |   |-- lib/
|   |   |   |-- questionSchema.js
|   |   |   |-- supabase.js
|   |   |   `-- supabaseBrowser.js
|   |   |-- questions/
|   |   |   |-- new/
|   |   |   |   `-- page.js
|   |   |   |-- [id]/
|   |   |   |   |-- edit/
|   |   |   |   |   `-- page.js
|   |   |   |   `-- page.js
|   |   |   |-- DeleteQuestionButton.js
|   |   |   |-- page.js
|   |   |   |-- QuestionForm.js
|   |   |   `-- QuestionsClient.js
|   |   |-- results/
|   |   |   |-- [resultId]/
|   |   |   |   |-- questions/
|   |   |   |   |   `-- [questionId]/
|   |   |   |   |       |-- page.js
|   |   |   |   |       `-- QuestionNoteForm.js
|   |   |   |   |-- loading.js
|   |   |   `-- page.js
|   |   |   |-- page.js
|   |   |   `-- ResultsClient.js
|   |   |-- test/
|   |   |   |-- page.js
|   |   |   `-- TestClient.js
|   |   |-- actions.js
|   |   |-- globals.css
|   |   |-- layout.js
|   |   `-- page.js
|   |-- data/
|   |   `-- questions.json
|   |-- public/
|   |   |-- file.svg
|   |   |-- globe.svg
|   |   |-- next.svg
|   |   |-- vercel.svg
|   |   `-- window.svg
|   |-- scripts/
|   |   `-- importQuestions.js
|   |-- supabase/
|   |   `-- migrations/
|   |       |-- 20260521120000_learning_features.sql
|   |       `-- 20260525130000_user_question_notes.sql
|   |-- package.json
|   |-- package-lock.json
|   |-- next.config.mjs
|   |-- tailwind.config.js
|   `-- README.md
|
`-- autoskola_eTesty_API/              # Python scraper/export
    |-- autoskola_etesty.py
    |-- export_questions.py
    |-- example.py
    |-- questions_export.json
    |-- requirements.txt
    `-- README.md

```

## ⚙️ Lokální Spuštění

### 1. Klonování repozitáře

```bash
git clone [https://github.com/Tykanek/Autoskolatesty.git](https://github.com/Tykanek/Autoskolatesty.git)
cd Autoskolatesty

```

### 2. Instalace závislostí

```bash
npm install

```

### 3. Nastavení proměnných prostředí

V kořenovém adresáři vytvoř soubor `.env.local` a vlož do něj své klíče ze Supabase projektu:

```env
NEXT_PUBLIC_SUPABASE_URL=tvoje_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tvuj_anon_key
SUPABASE_SERVICE_ROLE_KEY=tvuj_service_role_key

```

### 4. Inicializace databáze (Migrace)

Spusť SQL skripty ze složky `supabase/migrations/` v SQL editoru tvého Supabase projektu pro vytvoření potřebných tabulek a relací (`questions`, `answers`, `test_results`, `user_question_notes`).

### 5. Spuštění vývojového serveru

```bash
npm run dev

```

Aplikace poběží lokálně

## 📊 Datový Model (PostgreSQL)

Aplikace pracuje se čtyřmi provázanými tabulkami:

1. `questions` - Obsahuje znění otázek, přiřazené body (1, 2 nebo 4), textové vysvětlení správné odpovědi a URL médií.
2. `answers` - Odpovědi provázané přes cizí klíč s tabulkou otázek, definující příznak `is_correct`.
3. `test_results` - Ukládá historii dokončených testů, dosažené body, celkový čas v sekundách a JSON snapshot uživatelských odpovědí.
4. `user_question_notes` - Spojovací tabulka mapující `user_id` a `question_id` na konkrétní textový řetězec osobní poznámky studenta.

## 👨‍💻 Autor

* **Lukáš Elbl**
* Projekt vznikl pod odborným dohledem vyučujícího Sergeye Kuroedova na SPŠE V Úžlabině.



