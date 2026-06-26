"use client";

import { useState } from "react";

const SUGGESTIONS = [
  "Which districts are most underserved for schools?",
  "Where should I build clinics next year?",
  "Which affordable areas lack transit?",
];

export default function AiCopilot() {
  const [q, setQ] = useState(SUGGESTIONS[0]);
  const [answer, setAnswer] = useState<string | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function ask(question: string) {
    setLoading(true);
    setAnswer(null);
    setSource(null);
    try {
      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "qa", question }),
      });
      const data = await res.json();
      setAnswer(data.text ?? "No answer.");
      setSource(data.source ?? null);
    } catch {
      setAnswer("Could not reach the model. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="copilot" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-16">
      <div className="mb-6">
        <div className="font-mono text-xs uppercase tracking-[0.22em] text-accent">
          Ask Xpand
        </div>
        <h2 className="mt-2 font-serif text-3xl tracking-tight text-foreground md:text-4xl">
          Ask the city a question.
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-foreground-muted">
          Plain-language answers grounded only in the data — gaps, demand, vacant land and
          investor interest. Powered by K2 Think, with a transparent fallback.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-surface/50 p-5">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && q.trim() && ask(q)}
            placeholder="Ask about gaps, demand, or where to build…"
            className="flex-1 rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-foreground-muted"
          />
          <button
            onClick={() => q.trim() && ask(q)}
            disabled={loading || !q.trim()}
            className="rounded-lg bg-accent px-6 py-3 text-sm font-medium text-accent-foreground transition hover:bg-accent-hover active:scale-[0.98] disabled:opacity-40"
          >
            {loading ? "Thinking…" : "Ask"}
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => {
                setQ(s);
                ask(s);
              }}
              className="rounded-full border border-border px-3 py-1 text-xs text-foreground-muted transition hover:border-foreground-muted hover:text-foreground"
            >
              {s}
            </button>
          ))}
        </div>

        <div className="mt-5 min-h-[96px] whitespace-pre-wrap rounded-lg border border-dashed border-border bg-background/60 p-4 text-sm leading-relaxed text-foreground/90">
          {loading
            ? "Reading the data…"
            : answer ?? "Ask a question to see a grounded answer."}
        </div>
        {source && (
          <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-foreground-muted">
            source: {source === "k2" ? "K2 Think (live)" : "rule-based fallback"}
          </div>
        )}
      </div>
    </section>
  );
}
