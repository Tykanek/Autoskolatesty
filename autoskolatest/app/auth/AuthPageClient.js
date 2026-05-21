"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "../components/AuthProvider";

export default function AuthPageClient() {
  const router = useRouter();
  const { user, loading, authError, signIn, signUp } = useAuth();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [status, setStatus] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");
    setStatus("");
    setSubmitting(true);

    try {
      const response =
        mode === "register"
          ? await signUp(email, password, fullName)
          : await signIn(email, password);

      if (response?.error) {
        setFormError(response.error.message);
        return;
      }

      if (mode === "register" && !response?.data?.session) {
        setStatus("Registrace proběhla. Pokud je zapnuté potvrzení e-mailu, dokončete ho přes doručenou zprávu.");
        return;
      }

      router.push("/results");
      router.refresh();
    } catch (error) {
      setFormError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen px-4 py-6 text-foreground sm:px-6 lg:px-8">
        <section className="mx-auto max-w-xl rounded-lg border border-border bg-card p-5 shadow-sm">
          Načítám účet...
        </section>
      </main>
    );
  }

  if (user) {
    return (
      <main className="min-h-screen px-4 py-6 text-foreground sm:px-6 lg:px-8">
        <section className="mx-auto max-w-xl rounded-lg border border-border bg-card p-5 shadow-sm">
          <Link href="/" className="text-sm font-semibold text-primary hover:text-primary-strong">
            Přehled
          </Link>
          <h1 className="mt-2 text-3xl font-bold text-foreground">
            Jste přihlášeni
          </h1>
          <p className="mt-3 text-muted-foreground">
            {user.user_metadata?.full_name || user.email}
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/results"
              className="rounded-lg bg-primary px-5 py-3 text-center font-semibold text-white shadow-sm transition hover:bg-primary-strong"
            >
              Otevřít historii
            </Link>
            <Link
              href="/test"
              className="rounded-lg border border-border bg-card px-5 py-3 text-center font-semibold text-foreground shadow-sm transition hover:bg-muted"
            >
              Spustit test
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto max-w-xl space-y-5">
        <header className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <Link href="/" className="text-sm font-semibold text-primary hover:text-primary-strong">
            Přehled
          </Link>
          <h1 className="mt-2 text-3xl font-bold text-foreground">
            {mode === "register" ? "Registrace" : "Přihlášení"}
          </h1>
          <p className="mt-2 text-muted-foreground">
            Přihlášené testy se ukládají do osobní historie a počítají se do pokroku.
          </p>
        </header>

        <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <div className="mb-5 grid grid-cols-2 rounded-lg border border-border bg-muted p-1">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                mode === "login"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Přihlášení
            </button>
            <button
              type="button"
              onClick={() => setMode("register")}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                mode === "register"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Registrace
            </button>
          </div>

          {authError && (
            <div className="mb-4 rounded-lg border border-warning bg-warning-soft p-3 text-sm text-warning">
              {authError}
            </div>
          )}

          {formError && (
            <div className="mb-4 rounded-lg border border-destructive bg-destructive-soft p-3 text-sm text-destructive">
              {formError}
            </div>
          )}

          {status && (
            <div className="mb-4 rounded-lg border border-accent bg-accent-soft p-3 text-sm text-accent">
              {status}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-foreground">
                  Jméno
                </span>
                <input
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  className="w-full rounded-lg border border-border bg-card px-4 py-3 text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/10"
                  placeholder="Nepovinné"
                />
              </label>
            )}

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-foreground">
                E-mail
              </span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="w-full rounded-lg border border-border bg-card px-4 py-3 text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/10"
                placeholder="student@example.com"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-foreground">
                Heslo
              </span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={6}
                required
                className="w-full rounded-lg border border-border bg-card px-4 py-3 text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/10"
                placeholder="Alespoň 6 znaků"
              />
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-primary px-5 py-3 text-center font-semibold text-white shadow-sm transition hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting
                ? "Odesílám..."
                : mode === "register"
                  ? "Vytvořit účet"
                  : "Přihlásit"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}