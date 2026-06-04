"use client";

import Link from "next/link";
import { useAuth } from "./AuthProvider";
import { useTheme } from "./ThemeProvider";

const navLinks = [
  { href: "/test", label: "Spustit test" },
  { href: "/questions", label: "Správa otázek" },
  { href: "/results", label: "Výsledky" },
];

function NavigationLinks() {
  return (
    <div className="-mx-3 mt-3 flex gap-2 overflow-x-auto px-3 pb-1 lg:mx-0 lg:mt-0 lg:overflow-visible lg:px-0 lg:pb-0">
      {navLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="shrink-0 rounded-full border border-border bg-muted px-3 py-2 text-sm font-semibold text-muted-foreground transition hover:border-primary/50 hover:bg-card hover:text-foreground"
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
}

export default function AppNavigation() {
  const { user, loading, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const themeLabel = theme === "dark" ? "Tmavý" : "Světlý";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 text-foreground shadow-sm backdrop-blur">
      <nav className="mx-auto max-w-6xl px-3 py-3 sm:px-6 lg:flex lg:items-center lg:justify-between lg:gap-6 lg:px-8">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="shrink-0 text-base font-bold text-foreground">
            Autoškola eTesty
          </Link>

          <div className="flex min-w-0 items-center gap-2 lg:hidden">
            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-full border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground shadow-sm transition hover:bg-muted"
              title={theme === "dark" ? "Přepnout na světlý režim" : "Přepnout na tmavý režim"}
            >
              {themeLabel}
            </button>

            {loading ? (
              <span className="rounded-full border border-border bg-muted px-3 py-2 text-xs font-semibold text-muted-foreground">
                Účet
              </span>
            ) : user ? (
              <button
                type="button"
                onClick={() => signOut()}
                className="rounded-full border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground shadow-sm transition hover:bg-muted"
              >
                Odhlásit
              </button>
            ) : (
              <Link
                href="/auth"
                className="rounded-full bg-primary px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-primary-strong"
              >
                Přihlášení
              </Link>
            )}
          </div>
        </div>

        <NavigationLinks />

        <div className="mt-3 hidden flex-wrap items-center justify-end gap-2 lg:mt-0 lg:flex">
          <button
            type="button"
            onClick={toggleTheme}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground shadow-sm transition hover:bg-muted"
            title={theme === "dark" ? "Přepnout na světlý režim" : "Přepnout na tmavý režim"}
          >
            {theme === "dark" ? "Tmavý režim" : "Světlý režim"}
          </button>

          {loading ? (
            <span className="rounded-lg border border-border bg-muted px-3 py-2 text-sm font-semibold text-muted-foreground">
              Načítám účet
            </span>
          ) : user ? (
            <>
              <span className="max-w-48 truncate rounded-lg border border-border bg-muted px-3 py-2 text-sm font-semibold text-foreground">
                {user.user_metadata?.full_name || user.email}
              </span>
              <button
                type="button"
                onClick={() => signOut()}
                className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground shadow-sm transition hover:bg-muted"
              >
                Odhlásit
              </button>
            </>
          ) : (
            <Link
              href="/auth"
              className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-strong"
            >
              Přihlášení
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
