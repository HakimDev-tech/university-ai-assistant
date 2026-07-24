import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import FileUpload from "@/components/FileUpload";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: sessions } = await supabase
    .from("chat_sessions")
    .select("id, title, document_id, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  return (
    <main className="bg-canvas">
      <div className="mx-auto max-w-7xl px-6 py-10">

        {/* Hero */}

        <section className="card overflow-hidden bg-linear-to-r from-brand-50 to-white">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">

            <div>
              <div className="mb-3 inline-flex items-center rounded-full bg-brand-100 px-3 py-1 text-sm font-medium text-brand-700">
                👋 Welcome back
              </div>

              <h1 className="text-4xl font-bold tracking-tight text-ink-primary">
                Your AI Knowledge Workspace
              </h1>

              <p className="mt-3 max-w-2xl text-lg text-ink-secondary">
                Upload documents, organize your knowledge base and chat with
                your PDFs using Gemini AI.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">

              <div className="card min-w-35 text-center">
                <p className="text-3xl font-bold text-brand-600">
                  {sessions?.length ?? 0}
                </p>

                <p className="mt-1 text-sm text-ink-secondary">
                  Conversations
                </p>
              </div>

              <div className="card min-w-35 text-center">
                <p className="text-3xl font-bold text-brand-600">
                  AI
                </p>

                <p className="mt-1 text-sm text-ink-secondary">
                  Ready
                </p>
              </div>

            </div>

          </div>
        </section>

        {/* Upload */}

        <section className="mt-8 card">

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-ink-primary">
              Upload a document
            </h2>

            <p className="mt-2 text-sm text-ink-secondary">
              Upload PDF or text documents. They will be indexed automatically
              and become searchable in your AI assistant.
            </p>
          </div>

          <FileUpload />

        </section>

        {/* Sessions */}

        <section className="mt-10">

          <div className="mb-5 flex items-center justify-between">

            <div>

              <h2 className="text-xl font-semibold text-ink-primary">
                Recent conversations
              </h2>

              <p className="mt-1 text-sm text-ink-secondary">
                Continue where you left off.
              </p>

            </div>

          </div>

          {sessions && sessions.length > 0 ? (

            <div className="space-y-3">

              {sessions.map((session) => (

                <Link
                  key={session.id}
                  href={`/chat/${session.id}`}
                  className="
                    card
                    flex
                    items-center
                    justify-between
                    transition-all
                    duration-200
                    hover:-translate-y-0.5
                    hover:border-brand-300
                  "
                >

                  <div className="flex items-center gap-4">

                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-100 text-xl">
                      📄
                    </div>

                    <div>

                      <h3 className="font-medium text-ink-primary">
                        {session.title}
                      </h3>

                      <p className="mt-1 text-xs text-ink-muted">
                        Last updated{" "}
                        {new Date(session.updated_at).toLocaleDateString()}
                      </p>

                    </div>

                  </div>

                  <span className="badge badge-info">
                    Open →
                  </span>

                </Link>

              ))}

            </div>

          ) : (

            <div className="card py-16 text-center">

              <div className="mb-5 text-6xl">
                📚
              </div>

              <h3 className="text-xl font-semibold text-ink-primary">
                No conversations yet
              </h3>

              <p className="mt-3 text-ink-secondary">
                Upload your first document and start chatting with your notes.
              </p>

            </div>

          )}

        </section>

      </div>
    </main>
  );
}