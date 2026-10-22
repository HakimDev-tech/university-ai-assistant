import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import FileUpload from "@/components/FileUpload";
import Link from "next/link";
import { ArrowUpRight, BookOpenText, Clock3, FileText, LibraryBig } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: sessions } = await supabase
    .from("chat_sessions")
    .select("id, title, document_id, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(50);

  const safeSessions = sessions ?? [];
  const greetingName = user.email?.split("@")[0] ?? "student";

  return (
    <main className="site-shell py-9 md:py-14">
      <div className="flex flex-col gap-6 border-b border-border pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="eyebrow mb-4">Personal study desk / 001</div>
          <h1 className="workspace-heading">Make room for<br className="hidden sm:block" /> understanding.</h1>
          <p className="mt-4 max-w-lg text-sm leading-7 text-ink-secondary">
            Welcome back, {greetingName}. Add a source, ask a careful question, and keep the evidence close.
          </p>
        </div>
        <div className="flex items-center gap-3 border border-border bg-surface px-4 py-3">
          <LibraryBig size={19} strokeWidth={1.4} />
          <div>
            <div className="font-mono text-xl leading-none">{String(safeSessions.length).padStart(2, "0")}</div>
            <div className="eyebrow mt-1">Saved threads</div>
          </div>
        </div>
      </div>

      <div className="workspace-layout mt-8 md:mt-10">
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="eyebrow">01 / Add a source</div>
              <h2 className="mt-2 font-display text-2xl tracking-tight">Bring your course material in</h2>
            </div>
            <FileText size={21} strokeWidth={1.3} className="text-brand-700" />
          </div>
          <div className="card">
            <p className="mb-5 max-w-md text-xs leading-6 text-ink-secondary">
              Start with a searchable PDF or plain-text file. Margin will prepare its passages for source-linked questions.
            </p>
            <FileUpload />
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-border pt-4">
              <span className="eyebrow">PDF / TXT</span>
              <span className="eyebrow">Private by account</span>
              <span className="eyebrow">Evidence-first answers</span>
            </div>
          </div>
          <div className="mt-5 flex gap-3 border-l-2 border-brand-500 py-1 pl-4">
            <div>
              <div className="text-xs font-semibold">A note on accuracy</div>
              <p className="mt-1 text-xs leading-6 text-ink-secondary">Answers are only as good as the passages retrieved. Open the source excerpts before relying on a result.</p>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <div className="eyebrow">02 / Return to your work</div>
              <h2 className="mt-2 font-display text-2xl tracking-tight">Recent study threads</h2>
            </div>
            <span className="font-mono text-[10px] text-ink-muted">{String(safeSessions.length).padStart(2, "0")} ITEMS</span>
          </div>
          <div className="card min-h-[250px]">
            {safeSessions.length > 0 ? (
              <div>
                {safeSessions.map((session, index) => (
                  <Link key={session.id} href={`/chat/${session.id}`} className="session-row group">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="mt-1 font-mono text-[10px] text-brand-700">{String(index + 1).padStart(2, "0")}</span>
                      <div className="min-w-0">
                        <h3 className="session-title truncate">{session.title || "Untitled study thread"}</h3>
                        <p className="mt-2 inline-flex items-center gap-1.5 text-[10px] text-ink-muted">
                          <Clock3 size={11} />
                          {session.updated_at ? new Date(session.updated_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "Date unavailable"}
                        </p>
                      </div>
                    </div>
                    <ArrowUpRight size={16} strokeWidth={1.5} className="shrink-0 text-ink-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand-700" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex min-h-[220px] flex-col items-start justify-center">
                <BookOpenText size={27} strokeWidth={1.1} className="text-brand-700" />
                <h3 className="mt-5 font-display text-2xl">Your first thread starts with a source.</h3>
                <p className="mt-2 max-w-xs text-xs leading-6 text-ink-secondary">Upload a lecture note or course PDF. Your conversations will be listed here for later.</p>
              </div>
            )}
          </div>
        </section>
      </div>
      <footer className="mt-12 flex flex-col gap-2 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
        <span className="eyebrow">Margin / Personal library</span>
        <span className="text-[11px] text-ink-muted">Your material remains the reference. The model is a study aid.</span>
      </footer>
    </main>
  );
}
