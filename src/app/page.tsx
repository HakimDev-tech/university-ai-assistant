import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-[calc(100vh-72px)] items-center justify-center bg-canvas px-6">
      <section className="mx-auto w-full max-w-3xl text-center">
        {/* Badge */}
        <div className="mb-6 inline-flex items-center rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-sm font-medium text-brand-700">
          ✨ AI-powered document assistant
        </div>

        {/* Title */}
        <h1 className="text-5xl font-bold tracking-tight text-ink-primary">
          Chat with your
          <span className="block text-brand-600">
            university documents
          </span>
        </h1>

        {/* Description */}
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-ink-secondary">
          Upload your PDFs, ask natural language questions, and receive accurate
          answers with source citations powered by Gemini AI.
        </p>

        {/* CTA */}
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/signup"
            className="btn-primary min-w-42.5"
          >
            Get Started
          </Link>

          <Link
            href="/login"
            className="btn-secondary min-w-42.5"
          >
            Sign In
          </Link>
        </div>

        {/* Features */}
        <div className="mt-16 grid gap-4 sm:grid-cols-3">
          <div className="card text-left">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-xl">
              📄
            </div>

            <h3 className="font-semibold text-ink-primary">
              Upload PDFs
            </h3>

            <p className="mt-2 text-sm text-ink-secondary">
              Import your lecture notes, books and research papers in seconds.
            </p>
          </div>

          <div className="card text-left">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-xl">
              🤖
            </div>

            <h3 className="font-semibold text-ink-primary">
              Ask Anything
            </h3>

            <p className="mt-2 text-sm text-ink-secondary">
              Use natural language to search across all your documents.
            </p>
          </div>

          <div className="card text-left">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-xl">
              🎯
            </div>

            <h3 className="font-semibold text-ink-primary">
              Source Citations
            </h3>

            <p className="mt-2 text-sm text-ink-secondary">
              Every answer links back to the exact document and page used.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}