"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, ChevronLeft, Sparkles, RotateCcw } from "lucide-react";
import { DISTRICTS, CATEGORY_LABEL } from "@/lib/data";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CategoryIcon, CATEGORY_ORDER } from "./category-icons";

const ROLES = ["Investor", "Resident", "City planner", "Operator"] as const;
const BUDGETS = ["Under AED 5M", "AED 5–20M", "AED 20–60M", "AED 60M+"] as const;

const EMIRATES = Array.from(new Set(DISTRICTS.map((d) => d.emirate ?? "Abu Dhabi")));

export default function InsightsForm() {
  const [step, setStep] = useState(0);
  const [role, setRole] = useState<string>("");
  const [emirate, setEmirate] = useState<string>("");
  const [area, setArea] = useState<string>("");
  const [sectors, setSectors] = useState<Category[]>([]);
  const [budget, setBudget] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ text: string; source: string } | null>(null);

  const areas = useMemo(
    () => DISTRICTS.filter((d) => (d.emirate ?? "Abu Dhabi") === emirate),
    [emirate],
  );

  const toggleSector = (c: Category) =>
    setSectors((s) => (s.includes(c) ? s.filter((x) => x !== c) : [...s, c]));

  const canNext =
    (step === 0 && role) ||
    (step === 1 && emirate) ||
    (step === 2 && sectors.length > 0) ||
    step === 3;

  async function submit() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "insights",
          insights: { role, emirate, area: area || undefined, sectors, budget: budget || "any" },
        }),
      });
      const data = await res.json();
      setResult({ text: data.text ?? "No insight.", source: data.source });
    } catch {
      setResult({ text: "Could not reach K2. Try again.", source: "" });
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setStep(0);
    setRole("");
    setEmirate("");
    setArea("");
    setSectors([]);
    setBudget("");
    setResult(null);
  }

  if (result || loading) {
    return (
      <div className="flex h-full flex-col p-5">
        <div className="mb-3 flex items-center gap-2">
          <span className="grid size-6 place-items-center rounded-md bg-accent/15 text-accent">
            <Sparkles className="size-3.5" />
          </span>
          <h3 className="font-serif text-lg text-foreground">Your tailored insight</h3>
        </div>
        {loading ? (
          <div className="space-y-2">
            <p className="font-mono text-[10px] uppercase tracking-widest text-foreground-muted animate-pulse">
              K2 is reasoning over the data…
            </p>
            <div className="space-y-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-3 animate-pulse rounded bg-surface-2" style={{ width: i === 3 ? "55%" : "100%" }} />
              ))}
            </div>
          </div>
        ) : (
          <>
            <p className="flex-1 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
              {result?.text}
            </p>
            {result?.source && (
              <div className="mt-3 font-mono text-[9px] uppercase tracking-widest text-foreground-muted">
                {result.source === "k2" ? "K2 Think · live" : "rule-based"} · anonymous, no sign-in
              </div>
            )}
            <button
              onClick={reset}
              className="mt-4 inline-flex items-center gap-1.5 self-start rounded-md border border-border px-3 py-1.5 text-xs text-foreground-muted transition hover:text-foreground"
            >
              <RotateCcw className="size-3.5" /> Start over
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col p-5">
      <div className="mb-1 flex items-center gap-2 text-[11px] text-foreground-muted">
        <ShieldCheck className="size-3.5 text-ok" />
        Anonymous · no sign-in · nothing is stored
      </div>
      <h3 className="font-serif text-lg text-foreground">Get tailored opportunity insights</h3>

      {/* progress */}
      <div className="mt-3 mb-4 flex gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition",
              i <= step ? "bg-accent" : "bg-surface-2",
            )}
          />
        ))}
      </div>

      <div className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.22 }}
          >
            {step === 0 && (
              <Field label="I am a…">
                <div className="grid grid-cols-2 gap-2">
                  {ROLES.map((r) => (
                    <Choice key={r} active={role === r} onClick={() => setRole(r)}>
                      {r}
                    </Choice>
                  ))}
                </div>
              </Field>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <Field label="Which emirate?">
                  <div className="grid grid-cols-2 gap-2">
                    {EMIRATES.map((e) => (
                      <Choice
                        key={e}
                        active={emirate === e}
                        onClick={() => {
                          setEmirate(e);
                          setArea("");
                        }}
                      >
                        {e}
                      </Choice>
                    ))}
                  </div>
                </Field>
                {emirate && (
                  <Field label="Area (optional)">
                    <select
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      className="w-full rounded-md border border-border bg-background/50 px-3 py-2 text-sm text-foreground outline-none"
                    >
                      <option value="">Whole emirate</option>
                      {areas.map((d) => (
                        <option key={d.name} value={d.name}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                )}
              </div>
            )}

            {step === 2 && (
              <Field label="Sectors of interest">
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORY_ORDER.map((c) => (
                    <Choice key={c} active={sectors.includes(c)} onClick={() => toggleSector(c)}>
                      <CategoryIcon category={c} size={14} />
                      <span className="truncate">{CATEGORY_LABEL[c]}</span>
                    </Choice>
                  ))}
                </div>
              </Field>
            )}

            {step === 3 && (
              <Field label="Budget band">
                <div className="grid grid-cols-2 gap-2">
                  {BUDGETS.map((b) => (
                    <Choice key={b} active={budget === b} onClick={() => setBudget(b)}>
                      {b}
                    </Choice>
                  ))}
                </div>
              </Field>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* nav */}
      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="inline-flex items-center gap-1 text-xs text-foreground-muted transition hover:text-foreground disabled:opacity-0"
        >
          <ChevronLeft className="size-3.5" /> Back
        </button>
        {step < 3 ? (
          <button
            onClick={() => canNext && setStep((s) => s + 1)}
            disabled={!canNext}
            className="rounded-lg bg-accent px-5 py-2 text-sm font-medium text-accent-foreground transition hover:bg-accent-hover disabled:opacity-40"
          >
            Continue
          </button>
        ) : (
          <button
            onClick={submit}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-5 py-2 text-sm font-medium text-accent-foreground transition hover:bg-accent-hover"
          >
            <Sparkles className="size-4" /> Get insights
          </button>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.15em] text-foreground-muted">
        {label}
      </div>
      {children}
    </div>
  );
}

function Choice({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-[13px] transition",
        active
          ? "border-accent/60 bg-accent/10 text-foreground"
          : "border-border text-foreground/80 hover:border-foreground-muted hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
