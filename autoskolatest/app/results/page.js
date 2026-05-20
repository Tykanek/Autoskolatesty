import Link from "next/link";
import { supabase } from "../lib/supabase";

export default async function ResultsPage() {
    const { data: results, error } = await supabase
        .from("test_results")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        return (
            <main className="min-h-screen bg-gray-100 p-6 text-black">
                <div className="mx-auto max-w-4xl rounded-2xl bg-white p-8 shadow">
                    <h1 className="text-2xl font-bold text-red-600">
                        Chyba při načítání výsledků
                    </h1>
                    <p className="mt-4">{error.message}</p>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gray-100 p-6 text-black">
            <div className="mx-auto max-w-4xl rounded-2xl bg-white p-8 shadow">
                <h1 className="mb-6 text-3xl font-bold">Výsledky testů</h1>

                {results.length === 0 ? (
                    <p className="text-gray-700">Zatím nejsou uložené žádné výsledky.</p>
                ) : (
                    <div className="space-y-4">
                        {results.map((result) => (
                            <div
                                key={result.id}
                                className="rounded-xl border border-gray-300 bg-white p-4 shadow-sm"
                            >
                                <h2 className="text-xl font-semibold">
                                    {result.user_name}
                                </h2>

                                <p className="mt-2 text-gray-700">
                                    Výsledek: {result.score} / {result.total_points} bodů
                                </p>

                                <p className="text-sm text-gray-600">
                                    Datum: {new Date(result.created_at).toLocaleString("cs-CZ")}
                                </p>
                            </div>
                        ))}
                    </div>
                )}

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <Link
                        href="/test"
                        className="rounded-xl bg-black px-5 py-3 text-center text-white"
                    >
                        Spustit test
                    </Link>

                    <Link
                        href="/"
                        className="rounded-xl border border-black px-5 py-3 text-center text-black"
                    >
                        Zpět na hlavní stránku
                    </Link>
                </div>
            </div>
        </main>
    );
}