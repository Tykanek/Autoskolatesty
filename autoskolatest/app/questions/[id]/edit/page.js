import { notFound } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import QuestionForm from "../../../components/QuestionForm";

export default async function EditQuestionPage({ params }) {
    const { id } = await params;
    const { data: question, error } = await supabase
        .from("questions")
        .select("*, answers(*)")
        .eq("id", id)
        .single();

    if (error || !question) {
        notFound();
    }

    return (
        <main className="min-h-screen bg-gray-100 p-6">
            <div className="mx-auto max-w-3xl rounded-2xl bg-white p-8 shadow">
                <h1 className="mb-6 text-3xl font-bold text-black">
                    Upravit otázku
                </h1>

                <QuestionForm mode="edit" question={question} />
            </div>
        </main>
    );
}