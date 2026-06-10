# Autoškola eTesty

Full-stack aplikace v Next.js 14 pro procvičování teoretických otázek autoškoly,
ukládání výsledků a osobních poznámek. Autentizaci, databázi a řízení přístupu
zajišťuje Supabase.

## Cloud-only architektura

Aplikace používá Supabase jako jediný zdroj dat.

- Otázky a odpovědi jsou centrálně uložené v tabulkách `questions` a `answers`.
- Seznam otázek i generování testu načítají aktuální data přímo ze vzdáleného
  Supabase projektu pomocí Server Components.
- Repozitář neobsahuje lokální JSON soubor s otázkami ani importní skript.
- Po klonování se žádná data negenerují, nekopírují ani neimportují.
- Změny provedené administrátorem jsou okamžitě dostupné všem instancím
  aplikace připojeným ke stejnému Supabase projektu.

Pro spuštění aplikace tedy stačí připojení k existujícímu Supabase projektu,
který již obsahuje databázové schéma a data.

## Hlavní funkce

- Cvičný test s 25 otázkami podle předepsaných kategorií.
- Seznam a detail všech otázek načítaných ze Supabase.
- Administrátorská správa otázek a odpovědí.
- RBAC s rolemi `user` a `admin`.
- Osobní poznámky uživatelů chráněné pomocí Row Level Security.
- Historie testů a přehled výsledků.

## Použité technologie

- Next.js 14, App Router a Server Actions
- React 18
- Supabase PostgreSQL a Supabase Auth
- Tailwind CSS
- Zod a React Hook Form

## Spuštění po klonování

### 1. Instalace závislostí

```bash
cd autoskolatest
npm install
```

### 2. Připojení ke vzdálenému Supabase projektu

V adresáři `autoskolatest` zkopíruj `.env.example` jako `.env.local` a doplň
údaje existujícího vzdáleného Supabase projektu:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tvuj-projekt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tvuj_anon_klic
SUPABASE_SERVICE_ROLE_KEY=tvuj_service_role_klic
```

`SUPABASE_SERVICE_ROLE_KEY` je tajný serverový klíč. Nesmí být zveřejněn ani
použit v klientských komponentách.

### 3. Spuštění aplikace

```bash
npm run dev
```

Aplikace po spuštění načte otázky přímo z připojeného Supabase projektu.
Není potřeba spouštět žádný seed ani importní skript.

## Databázové migrace

Složka `autoskolatest/supabase/migrations` obsahuje změny databázového schématu,
RLS politiky a RBAC konfiguraci. Při připojení k již připravenému vzdálenému
Supabase projektu se migrace ani import dat při každém klonování nespouštějí.

Migrace se používají pouze při prvotním vytvoření nebo změně databázového
schématu:

- `20260521120000_learning_features.sql`
- `20260525130000_user_question_notes.sql`
- `20260610100000_admin_rbac.sql`

## Datový model

- `questions` - text otázky, kategorie, body, vysvětlení a média
- `answers` - odpovědi propojené s otázkami
- `test_results` - historie dokončených testů
- `user_question_notes` - soukromé poznámky uživatelů
- `profiles` - role uživatelů pro RBAC

## Oprávnění

Běžný uživatel může otázky číst, spouštět testy a spravovat pouze své poznámky.
Administrátor může navíc otázky a odpovědi vytvářet, upravovat a mazat.

Role administrátora se nastavuje v Supabase:

```sql
update public.profiles
set role = 'admin', updated_at = now()
where id = (
  select id
  from auth.users
  where email = 'admin@example.com'
);
```

## Ověření projektu

```bash
npm run lint
npm run build
```
