This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


Zde je několik oblastí, které bychom mohli vylepšit, seřazených od nejdůležitějších po "nice-to-have" přídavky.
1. Vylepšení kvality kódu a stability
   •
   Přechod na TypeScript: Váš kód je v JavaScriptu. Přechod na TypeScript (.ts, .tsx) by byl největším vylepšením. Pomůže vám odhalit chyby ještě před spuštěním, zlepší doplňování kódu v IDE a usnadní budoucí úpravy.
   •
   Správa .env proměnných: Používáte Supabase, což znamená, že máte citlivé klíče v .env.local. Je klíčové zajistit, aby tento soubor nikdy nebyl v Gitu. Můžeme vytvořit soubor .env.example, který bude obsahovat seznam potřebných proměnných, ale bez jejich hodnot.
   •
   Struktura komponent: Jak se bude aplikace rozrůstat, doporučuji lépe organizovat komponenty. Například vytvořit složku components/ui, kde budou obecné, znovupoužitelné komponenty (tlačítka, inputy, karty), a oddělit je od komplexnějších komponent, které řeší specifickou logiku.
2. Vylepšení uživatelského zážitku (UX)
   •
   Načítací stavy (Loading States): Když se načítají otázky z databáze, co vidí uživatel? Pravděpodobně prázdnou stránku. Můžeme přidat jednoduché "loading spinnery" nebo elegantnější "skeleton screens" (šedé blikající obdélníky), aby uživatel věděl, že se něco děje.
   •
   Zpětná vazba pro uživatele (Toast notifikace): Když uživatel vytvoří novou otázku nebo dokončí test, měl by dostat jasnou zpětnou vazbu. Například malá notifikace "Otázka byla úspěšně uložena" nebo "Test byl odeslán". K tomu se skvěle hodí knihovna jako react-hot-toast.
   •
   Responzivita: I když používáte Tailwind, je dobré se ujistit, že se aplikace pohodlně používá i na mobilních telefonech. Zejména formuláře a dlouhé texty otázek mohou na malých obrazovkách dělat problémy.
3. Nové funkce
   •
   Kategorie otázek: Rozdělte otázky do kategorií (dopravní značky, křižovatky, pravidla provozu). Uživatelé by si pak mohli procvičovat jen ty oblasti, ve kterých si nejsou jistí.
   •
   Uživatelské účty a historie: Umožněte uživatelům registraci. Každý by pak měl přístup k historii svých testů, mohl by sledovat svůj pokrok a vidět, které otázky mu dělají největší problémy.
   •
   Revize testu: Po dokončení testu nestačí jen ukázat skóre. Ukažte uživateli všechny otázky, jeho odpovědi a správné odpovědi s vysvětlením. To je klíčové pro učení.
   •
   Časovaný test: Přidejte na stránku s testem odpočet, aby se simulovaly reálné podmínky zkoušky.
   •
   Tmavý režim (Dark Mode): Jednoduché, ale velmi populární vylepšení. S Tailwindem je jeho implementace poměrně snadná.