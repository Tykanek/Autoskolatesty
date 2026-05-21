"use client";

import Link from "next/link";
import { useAuth } from "./AuthProvider";
import { useTheme } from "./ThemeProvider";

export default function AppNavigation() {
  const { user, loading, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="border-b border-border bg-card/95 text-foreground shadow-sm backdrop-blur">
      <nav className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/" className="text-base font-bold text-foreground">
            Autoškola eTesty
          </Link>
          <Link
            href="/test"
            className="rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            Test
          </Link>
          <Link
            href="/results"
            className="rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            Historie
          </Link>
          <Link
            href="/questions"
            className="rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            Otázky
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground shadow-sm transition hover:bg-muted"
            title={theme === "dark" ? "Přepnout na světlý režim" : "Přepnout na tmavý režim"}
          >
            {theme === "dark" ? "Světlý režim" : "Tmavý režim"}
          </button>

          {loading ? (
            <span className="rounded-lg border border-border bg-muted px-3 py-2 text-sm font-semibold text-muted-foreground">
              Načítám účet
            </span>
          ) : user ? (
            <>
              <span className="max-w-48 truncate rounded-lg border border-border bg-muted px-3 py-2 text-sm font-semibold text-foreground">
                {user.email}
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
