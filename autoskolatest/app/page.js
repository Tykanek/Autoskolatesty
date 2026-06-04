import Link from "next/link";

const actions = [
  {
    href: "/test",
    title: "Spustit test",
    description: "Procvičit 25 otázek podle skladby reálné zkoušky na úřadě.",
    tone: "primary",
  },
  {
    href: "/questions",
    title: "Správa otázek",
    description: "Vyhledat, upravit nebo přidat otázky do databáze.",
    tone: "accent",
  },
  {
    href: "/results",
    title: "Výsledky",
    description: "Zobrazit poslední uložené výsledky cvičných testů.",
    tone: "neutral",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen px-3 py-4 text-foreground sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:gap-6">
        <header className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-sm font-semibold uppercase text-primary">
                Autoškola eTesty
              </p>
              <h1 className="mt-2 text-2xl font-bold text-foreground sm:text-4xl">
                Přehled pro procvičování a správu otázek
              </h1>
              <p className="mt-3 max-w-2xl text-muted-foreground">
                Vyberte si další práci: spustit cvičný test, upravit databázi
                otázek nebo zkontrolovat uložené výsledky.
              </p>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          {actions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group rounded-lg border border-border bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md sm:p-5"
            >
              <div
                className={
                  action.tone === "primary"
                    ? "mb-5 h-2 rounded-full bg-primary"
                    : action.tone === "accent"
                      ? "mb-5 h-2 rounded-full bg-accent"
                      : "mb-5 h-2 rounded-full bg-warning"
                }
              />
              <h2 className="text-xl font-semibold text-foreground">
                {action.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {action.description}
              </p>
              <span className="mt-5 inline-flex text-sm font-semibold text-primary group-hover:text-primary-strong">
                Otevřít
              </span>
            </Link>
          ))}
        </section>

        <section className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
          <h2 className="text-xl font-semibold text-foreground">
            Cvičný test podle reálné zkoušky
          </h2>
          <p className="mt-2 max-w-4xl text-muted-foreground">
            Test obsahuje 25 otázek sestavených podle skutečné zkoušky na úřadě.
            Na vypracování je limit 30 minut a maximálně lze získat 50 bodů.
          </p>
        </section>
      </div>
    </main>
  );
}
