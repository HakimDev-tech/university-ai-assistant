import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowDownRight, ArrowRight, BookOpenText, FileSearch, Quote } from "lucide-react";
import MarginMark from "@/components/MarginMark";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <div>
      <section className="site-shell landing-grid">
        <div className="landing-copy">
          <div className="eyebrow flex items-center gap-3">
            <span className="inline-block h-px w-7 bg-brand-600" />
            A study system for people who check the work
          </div>
          <h1 className="landing-title">
            Make knowledge<br />traceable.<br /><em>Keep the source.</em>
          </h1>
          <p className="landing-description">
            Margin turns your course PDFs into a workspace for careful questions.
            Every answer stays tied to the passages that support it, so you can
            verify the idea before you learn it.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/signup" className="btn-primary">Open your study desk <ArrowRight size={15} /></Link>
            <Link href="/login" className="btn-secondary">Sign in</Link>
          </div>
          <div className="mt-12 flex flex-wrap gap-x-7 gap-y-3 border-t border-border pt-5">
            <span className="eyebrow inline-flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-success" /> Source-linked answers</span>
            <span className="eyebrow inline-flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-brand-600" /> Your private library</span>
          </div>
        </div>

        <aside className="landing-aside" aria-label="Example of a source-linked answer">
          <div className="flex items-center justify-between">
            <span className="eyebrow">Margin / Evidence study</span>
            <span className="font-mono text-[10px] text-ink-muted">DEMO · 01</span>
          </div>
          <div className="paper-sheet my-7">
            <div className="eyebrow">Question / 04</div>
            <p className="font-display mt-3 text-[26px] leading-tight tracking-tight">What is the role of a limiting reagent?</p>
            <div className="rule my-5" />
            <div className="eyebrow">Answer / grounded in your notes</div>
            <p className="mt-3 text-[13px] leading-7 text-ink-secondary">
              The limiting reagent is consumed first and determines the maximum amount of product that can form.
            </p>
            <div className="paper-note mt-5">
              <span className="font-mono text-[9px] uppercase tracking-widest text-brand-700">Source 03 · Page 12</span>
              <p className="mt-1">“The reactant that is completely consumed limits the quantity of product formed.”</p>
            </div>
            <div className="paper-line mt-5" /><div className="paper-line" /><div className="paper-line short" />
          </div>
          <div className="flex items-end justify-between gap-4">
            <p className="max-w-[220px] text-xs leading-6 text-ink-secondary">A visual example only. Real answers cite passages retrieved from your uploaded material.</p>
            <BookOpenText size={24} strokeWidth={1} />
          </div>
        </aside>
      </section>

      <section id="method" className="site-shell py-16 md:py-20">
        <div className="section-kicker eyebrow">Built around the material, not the model</div>
        <div className="grid gap-5 pb-10 md:grid-cols-[1fr_1.2fr] md:items-end">
          <h2 className="font-display max-w-xl text-4xl leading-tight tracking-tight md:text-5xl">An answer is a starting point. The source is the reference.</h2>
          <p className="max-w-lg text-sm leading-7 text-ink-secondary md:justify-self-end">Most chat tools optimize for a convincing response. Margin is built around a different question: can you trace this answer back to the material you are studying?</p>
        </div>
        <div id="principles" className="feature-grid">
          <article className="feature-item">
            <span className="feature-index">01 / RETRIEVE</span>
            <div className="mt-5 flex h-9 w-9 items-center justify-center border border-border"><FileSearch size={17} strokeWidth={1.5} /></div>
            <h3 className="feature-title">Start with your material</h3>
            <p className="feature-copy">Bring in course PDFs or text notes. Relevant passages are retrieved before an answer is generated.</p>
          </article>
          <article className="feature-item md:pl-6 md:border-l md:border-border">
            <span className="feature-index">02 / TRACE</span>
            <div className="mt-5 flex h-9 w-9 items-center justify-center border border-border"><Quote size={17} strokeWidth={1.5} /></div>
            <h3 className="feature-title">Inspect the evidence</h3>
            <p className="feature-copy">Open the cited excerpts, compare the wording, and decide whether the answer actually follows from the source.</p>
          </article>
          <article className="feature-item md:pl-6 md:border-l md:border-border">
            <span className="feature-index">03 / CONTINUE</span>
            <div className="mt-5 flex h-9 w-9 items-center justify-center border border-border"><BookOpenText size={17} strokeWidth={1.5} /></div>
            <h3 className="feature-title">Keep your study thread</h3>
            <p className="feature-copy">Return to previous document conversations without losing the material or the question that started them.</p>
          </article>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="site-shell flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="wordmark">
            <MarginMark size={34} />
            <span className="wordmark-name">MARGIN</span>
          </div>
          <p className="text-xs text-ink-muted">Built for learning that can be checked.</p>
          <Link href="/signup" className="inline-flex items-center gap-2 text-xs font-semibold hover:text-brand-700">Create a study desk <ArrowDownRight size={14} /></Link>
        </div>
      </footer>
    </div>
  );
}
