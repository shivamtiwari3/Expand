"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, ArrowUp, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDashboard } from "./DashboardProvider";

interface Msg {
  role: "user" | "ai";
  text: string;
  source?: string;
}

const GREETING: Msg = {
  role: "ai",
  text: "Hi — I'm K2, grounded on Xpand's UAE service-gap data. Ask me where to build, which areas are underserved, or what a district needs.",
  source: "k2",
};

const SUGGESTIONS = [
  "Which areas are most underserved for schools?",
  "Where should I build clinics next year?",
  "Which affordable areas lack transit?",
];

export default function AskK2() {
  const { selected } = useDashboard();
  const [msgs, setMsgs] = useState<Msg[]>([GREETING]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/chat")
      .then((r) => r.json())
      .then((rows: { role: string; content: string }[]) => {
        if (rows.length > 0) {
          const loaded: Msg[] = rows.map((r) => ({
            role: r.role as "user" | "ai",
            text: r.content,
          }));
          setMsgs([GREETING, ...loaded]);
        }
      })
      .catch(() => {})
      .finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, loading]);

  async function ask(question: string) {
    if (!question.trim() || loading) return;
    setQ("");
    setMsgs((m) => [...m, { role: "user", text: question }]);
    setLoading(true);
    fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "user", content: question, district: selected.name }),
    }).catch(() => {});
    try {
      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "qa", question }),
      });
      const data = await res.json();
      const aiText = data.text ?? "No answer.";
      setMsgs((m) => [...m, { role: "ai", text: aiText, source: data.source }]);
      fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "ai", content: aiText, district: selected.name }),
      }).catch(() => {});
    } catch {
      setMsgs((m) => [...m, { role: "ai", text: "Could not reach K2. Try again." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="grid size-6 place-items-center rounded-md bg-accent/15 text-accent">
            <Sparkles className="size-3.5" />
          </span>
          <div>
            <div className="text-sm font-medium text-foreground">Talk to Xpand</div>
            <div className="font-mono text-[9px] uppercase tracking-wider text-foreground-muted">
              Direct line to K2 Think
            </div>
          </div>
        </div>
        {msgs.length > 1 && (
          <button
            onClick={() => {
              fetch("/api/chat", { method: "DELETE" }).catch(() => {});
              setMsgs([GREETING]);
            }}
            className="grid size-7 place-items-center rounded-md text-foreground-muted transition hover:bg-surface-2 hover:text-foreground"
            title="Clear chat"
          >
            <Trash2 className="size-3.5" />
          </button>
        )}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {msgs.map((m, i) => (
          <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap",
                m.role === "user"
                  ? "bg-accent/15 text-foreground rounded-br-sm"
                  : "bg-surface-2 text-foreground/90 rounded-bl-sm",
              )}
            >
              {m.text}
              {m.role === "ai" && m.source && (
                <div className="mt-1.5 font-mono text-[8px] uppercase tracking-wider text-foreground-muted">
                  {m.source === "k2" ? "K2 Think · live" : "rule-based"}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-sm bg-surface-2 px-3.5 py-2.5">
              <span className="flex gap-1">
                <span className="size-1.5 animate-pulse rounded-full bg-foreground-muted" />
                <span className="size-1.5 animate-pulse rounded-full bg-foreground-muted [animation-delay:150ms]" />
                <span className="size-1.5 animate-pulse rounded-full bg-foreground-muted [animation-delay:300ms]" />
              </span>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {hydrated && msgs.length <= 1 && (
        <div className="flex flex-wrap gap-1.5 px-4 pb-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => ask(s)}
              className="rounded-full border border-border px-2.5 py-1 text-[11px] text-foreground-muted transition hover:border-accent/50 hover:text-foreground"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="border-t border-border/60 p-3">
        <div className="flex items-end gap-2 rounded-xl border border-border bg-background/50 px-3 py-2">
          <textarea
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                ask(q);
              }
            }}
            rows={1}
            placeholder={`Ask about ${selected.name} or anywhere in the UAE…`}
            className="max-h-28 flex-1 resize-none bg-transparent text-[13px] text-foreground outline-none placeholder:text-foreground-muted"
          />
          <button
            onClick={() => ask(q)}
            disabled={loading || !q.trim()}
            aria-label="Send"
            className="grid size-8 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground transition hover:bg-accent-hover disabled:opacity-40"
          >
            <ArrowUp className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
