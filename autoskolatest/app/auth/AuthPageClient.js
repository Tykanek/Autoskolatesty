"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "../components/AuthProvider";
import { authSchema } from "../lib/authSchema";

function authErrorMessage(error) {
  switch (error?.code) {
    case "email_address_not_authorized":
      return "Potvrzovací e-mail nelze odeslat, protože v Supabase není nastavené vlastní SMTP. Kontaktujte správce aplikace.";
    case "email_not_confirmed":
      return "E-mail ještě nebyl potvrzen. Nechte si poslat nový potvrzovací odkaz.";
    case "over_email_send_rate_limit":
      return "Bylo odesláno příliš mnoho e-mailů. Počkejte několik minut a zkuste to znovu.";
    default:
      return error?.message || "Přihlášení se nezdařilo.";
  }
}

export default function AuthPageClient() {
  const router = useRouter();
  const { user, loading, authError, signIn, signUp, resendConfirmation } = useAuth();
  const [mode, setMode] = useState("login");
  const [status, setStatus] = useState("");
  const [formError, setFormError] = useState("");
  const [resending, setResending] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(authSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
    },
  });

  const email = watch("email");

  const onSubmit = async ({ email: submittedEmail, password, fullName }) => {
    setFormError("");
    setStatus("");

    try {
      const response =
        mode === "register"
          ? await signUp(submittedEmail, password, fullName)
          : await signIn(submittedEmail, password);

      if (response?.error) {
        if (response.error.code === "email_not_confirmed") {
          setAwaitingConfirmation(true);
        }
        setFormError(authErrorMessage(response.error));
        return;
      }

      if (mode === "register" && !response?.data?.session) {
        setAwaitingConfirmation(true);
        setStatus("Účet byl vytvořen. Pro přihlášení potvrďte e-mail pomocí odkazu ve zprávě. Pokud nepřijde, použijte nové odeslání níže.");
        return;
      }

      router.push("/results");
      router.refresh();
    } catch (error) {
      setFormError(error.message);
    }
  };

  const handleResendConfirmation = async () => {
    setFormError("");
    setStatus("");
    setResending(true);

    try {
      const { error } = await resendConfirmation(email);

      if (error) {
        setFormError(authErrorMessage(error));
        return;
      }

      setStatus(`Požadavek na nový potvrzovací e-mail pro ${email} byl přijat. Zkontrolujte také spam.`);
    } catch (error) {
      setFormError(error.message);
    } finally {
      setResending(false);
    }
  };

  const changeMode = (nextMode) => {
    setMode(nextMode);
    reset({
      fullName: "",
      email,
      password: "",
    });
    setStatus("");
    setFormError("");
    setAwaitingConfirmation(false);
  };

  if (loading) {
    return (
      <main className="min-h-screen px-3 py-4 text-foreground sm:px-6 sm:py-6 lg:px-8">
        <section className="mx-auto max-w-xl rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
          Načítám účet...
        </section>
      </main>
    );
  }

  if (user) {
    return (
      <main className="min-h-screen px-3 py-4 text-foreground sm:px-6 sm:py-6 lg:px-8">
        <section className="mx-auto max-w-xl rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
          <Link href="/" className="text-sm font-semibold text-primary hover:text-primary-strong">
            Přehled
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">
            Jste přihlášeni
          </h1>
          <p className="mt-3 break-all text-muted-foreground sm:break-normal">
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
    <main className="min-h-screen px-3 py-4 text-foreground sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto max-w-xl space-y-4 sm:space-y-5">
        <header className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
          <Link href="/" className="text-sm font-semibold text-primary hover:text-primary-strong">
            Přehled
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">
            {mode === "register" ? "Registrace" : "Přihlášení"}
          </h1>
          <p className="mt-2 text-muted-foreground">
            Přihlášené testy se ukládají do osobní historie a počítají se do pokroku.
          </p>
        </header>

        <section className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
          <div className="mb-5 grid grid-cols-2 rounded-lg border border-border bg-muted p-1">
            <button
              type="button"
              onClick={() => changeMode("login")}
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
              onClick={() => changeMode("register")}
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

          {awaitingConfirmation && email && (
            <button
              type="button"
              onClick={handleResendConfirmation}
              disabled={resending}
              className="mb-4 w-full rounded-lg border border-border bg-card px-5 py-3 text-center font-semibold text-foreground shadow-sm transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
            >
              {resending ? "Odesílám nový odkaz..." : "Poslat potvrzovací e-mail znovu"}
            </button>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {mode === "register" && (
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-foreground">
                  Jméno
                </span>
                <input
                  {...register("fullName")}
                  className="w-full rounded-lg border border-border bg-card px-4 py-3 text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/10"
                  placeholder="Nepovinné"
                />
                {errors.fullName && (
                  <span className="block text-sm text-destructive">
                    {errors.fullName.message}
                  </span>
                )}
              </label>
            )}

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-foreground">
                E-mail
              </span>
              <input
                type="email"
                {...register("email", {
                  onChange: () => {
                    setAwaitingConfirmation(false);
                  },
                })}
                className="w-full rounded-lg border border-border bg-card px-4 py-3 text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/10"
                placeholder="student@example.com"
              />
              {errors.email && (
                <span className="block text-sm text-destructive">
                  {errors.email.message}
                </span>
              )}
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-foreground">
                Heslo
              </span>
              <input
                type="password"
                {...register("password")}
                className="w-full rounded-lg border border-border bg-card px-4 py-3 text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/10"
                placeholder="Alespoň 6 znaků"
              />
              {errors.password && (
                <span className="block text-sm text-destructive">
                  {errors.password.message}
                </span>
              )}
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-primary px-5 py-3 text-center font-semibold text-white shadow-sm transition hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting
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
