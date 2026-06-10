"use client";

import Link from "next/link";
import { useAuth } from "./AuthProvider";

export default function AdminOnly({ children, showDenied = false }) {
  const { isAdmin, loading, roleLoading } = useAuth();

  if (loading || roleLoading) {
    return showDenied ? (
      <main className="min-h-screen px-3 py-4 text-foreground sm:px-6 sm:py-6 lg:px-8">
        <section className="mx-auto max-w-xl rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
          Ověřuji oprávnění...
        </section>
      </main>
    ) : null;
  }

  if (!isAdmin) {
    return showDenied ? (
      <main className="min-h-screen px-3 py-4 text-foreground sm:px-6 sm:py-6 lg:px-8">
        <section className="mx-auto max-w-xl rounded-lg border border-destructive bg-destructive-soft p-4 text-destructive shadow-sm sm:p-5">
          <h1 className="text-2xl font-bold">Neoprávněný přístup</h1>
          <p className="mt-3 text-sm">
            Tuto stránku může otevřít pouze administrátor.
          </p>
          <Link href="/questions" className="mt-5 inline-flex font-semibold underline">
            Zpět na seznam otázek
          </Link>
        </section>
      </main>
    ) : null;
  }

  return children;
}
