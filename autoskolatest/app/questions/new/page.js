import QuestionForm from "../../components/QuestionForm";

export default function NewQuestionPage() {
  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-3xl rounded-2xl bg-white p-8 shadow">
        <h1 className="mb-6 text-3xl font-bold text-black">
          Nová otázka
        </h1>
        <QuestionForm mode="create" />
      </div>
    </main>
  );
}