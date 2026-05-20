import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-8 text-center">
      <div className="w-full max-w-3xl">
        <h1 className="text-5xl font-extrabold tracking-tighter text-foreground sm:text-7xl md:text-8xl">
          Autoškola <span className="text-indigo-400">eTesty</span>
        </h1>
        <p className="mt-6 max-w-xl mx-auto text-lg text-muted-foreground">
          Ovládněte teorii. Zvládněte zkoušky. Moderní platforma pro vaši přípravu.
        </p>
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/test"
            className="inline-block w-full sm:w-auto rounded-full bg-indigo-500 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-transform duration-300 hover:scale-105 hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
          >
            Spustit nový test
          </Link>
          <Link
            href="/questions"
            className="inline-block w-full sm:w-auto rounded-full border border-border px-8 py-4 text-lg font-semibold text-muted-foreground transition-colors duration-300 hover:border-indigo-400 hover:text-indigo-400"
          >
            Spravovat otázky
          </Link>
        </div>
      </div>
    </main>
  );
}