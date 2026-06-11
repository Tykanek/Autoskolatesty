# Autoškola eTesty

Full-stack aplikace v Next.js 14 pro procvičování teoretických otázek autoškoly,
ukládání výsledků a osobních poznámek. Autentizaci, databázi a řízení přístupu
zajišťuje Supabase.

## Cloud-only architektura

Aplikace používá vzdálený Supabase projekt jako jediný zdroj dat. Lze ji připojit
k existujícímu projektu autora nebo vytvořit nový Supabase projekt pomocí migrací
uložených v repozitáři.

- Otázky a odpovědi jsou centrálně uložené v tabulkách `questions` a `answers`.
- Seznam otázek i generování testu načítají aktuální data přímo ze vzdáleného
  Supabase projektu pomocí Server Components.
- Repozitář neobsahuje lokální JSON soubor s otázkami ani importní skript.
- Po klonování se žádná data negenerují, nekopírují ani neimportují.
- Změny provedené administrátorem jsou okamžitě dostupné všem instancím
  aplikace připojeným ke stejnému Supabase projektu.

Cloud-only neznamená, že lze databázové přístupové klíče bezpečně zveřejnit
v GitHub repozitáři. Tajné klíče se nastavují pouze v lokálním nebo nasazeném
prostředí aplikace.

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
- Vercel pro produkční nasazení aplikace
- Brevo jako SMTP služba pro potvrzovací e-maily

## Splnění zadání

- Dynamické App Router stránky: `/questions/[id]`, `/questions/[id]/edit`,
  `/results/[resultId]` a `/results/[resultId]/questions/[questionId]`.
- CRUD operace nad otázkami a odpověďmi probíhají přes Supabase.
- Všechny formuláře používají React Hook Form a Zod a obsahují alespoň dvě
  validovaná pole.
- Supabase migrace vytvářejí kompletní schéma, vazby, indexy, RLS politiky a role.
- Tailwind breakpointy zajišťují mobilní i desktopové zobrazení.

## Použití aplikace

Běžný uživatel otevře nasazenou webovou aplikaci a nemusí nic instalovat ani
nastavovat. Aplikace automaticky pracuje s centrálními daty ve vzdáleném
Supabase projektu.

## Spuštění zdrojového kódu po klonování

Projekt lze spustit proti novému vlastnímu Supabase projektu nebo proti již
připravenému projektu autora.

### 1. Instalace závislostí

```bash
cd autoskolatest
npm install
```

### 2. Nastavení Supabase

1. Vytvoř nový projekt na Supabase.
2. V Supabase SQL Editoru spusť soubory z `autoskolatest/supabase/migrations`
   podle názvu od nejstaršího po nejnovější.
3. V adresáři `autoskolatest` zkopíruj `.env.example` jako `.env.local` a doplň
   údaje ze Supabase Dashboardu:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tvuj-projekt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tvuj_anon_klic
SUPABASE_SERVICE_ROLE_KEY=tvuj_service_role_klic
```

`SUPABASE_SERVICE_ROLE_KEY` je tajný serverový klíč. Nesmí být zveřejněn
v GitHubu ani použit v klientských komponentách.

### 3. Vytvoření administrátora

Po registraci uživatele nastav jeho roli podle SQL příkazu v části
[Oprávnění](#oprávnění). Administrátor může přes webové rozhraní vytvořit první
otázky a odpovědi.

### 4. Spuštění aplikace

```bash
npm run dev
```

Aplikace po spuštění načte data přímo z nastaveného Supabase projektu.

## Produkční nasazení

Aplikace je nasazená na platformě Vercel. V nastavení Vercel projektu je jako
Root Directory nastavená složka `autoskolatest` a v `Settings > Environment
Variables` jsou uložené stejné Supabase proměnné jako v lokálním `.env.local`.
Po každém sloučení změn do větve `main` Vercel automaticky vytvoří nové
produkční nasazení.

Produkční adresu z Vercelu je potřeba přidat také v Supabase Dashboardu do
`Authentication > URL Configuration` jako `Site URL` a mezi povolené redirect
URL. Díky tomu funguje návrat uživatele po potvrzení e-mailu.

## Databázové migrace

Složka `autoskolatest/supabase/migrations` obsahuje kompletní databázové schéma,
vazby, RLS politiky a RBAC konfiguraci:

- `20260520000000_initial_schema.sql`
- `20260521120000_learning_features.sql`
- `20260525130000_user_question_notes.sql`
- `20260610100000_admin_rbac.sql`
- `20260611120000_note_titles.sql`

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

## Potvrzovací e-maily

Při zapnutém potvrzení e-mailu zajišťuje autentizaci Supabase Auth a samotné
odesílání zpráv probíhá přes SMTP službu Brevo. Přístupové údaje z Brevo jsou
nastavené v Supabase Dashboardu v `Authentication > SMTP Settings`; SMTP heslo
není uložené v repozitáři ani ve zdrojovém kódu.

V Supabase je zároveň potřeba povolit produkční adresu aplikace z Vercelu v
`Authentication > URL Configuration`. Výchozí SMTP služba Supabase je vhodná
pouze pro omezené testování, proto projekt pro registraci běžných uživatelů
používá Brevo.

## Ověření projektu

```bash
npm run lint
npm run build
```
