"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { PanelLeftClose, PanelLeft, Search } from "lucide-react";
import { DISTRICTS, CATEGORY_LABEL } from "@/lib/data";
import { severity, severityScore, SEVERITY_LABEL } from "@/lib/engine";
import type { Severity } from "@/lib/types";
import { useDashboard } from "./DashboardProvider";
import { CategoryIcon, CATEGORY_ORDER } from "./category-icons";
import { cn } from "@/lib/utils";

const SEV_COLOR: Record<Severity, string> = {
  ok: "#7fa89c",
  emerging: "#d8b163",
  critical: "#d9694e",
};

const SEV_LABEL_SHORT: Record<Severity, string> = {
  ok: "Served",
  emerging: "Emerging",
  critical: "Critical",
};

export default function DashboardSidebar() {
  const { selected, setSelected, cats, toggleCat } = useDashboard();
  const [open, setOpen] = useState(true);
  const [q, setQ] = useState("");

  const ranked = useMemo(
    () =>
      [...DISTRICTS]
        .sort((a, b) => severityScore(b) - severityScore(a))
        .filter((d) => d.name.toLowerCase().includes(q.toLowerCase())),
    [q],
  );

  const counts = useMemo(() => {
    const c = { critical: 0, emerging: 0, ok: 0 } as Record<Severity, number>;
    for (const d of DISTRICTS) c[severity(d)] += 1;
    return c;
  }, []);

  return (
    <motion.aside
      initial={false}
      animate={{ width: open ? 300 : 56 }}
      transition={{ type: "spring", stiffness: 320, damping: 34 }}
      className="relative z-20 flex h-full shrink-0 flex-col border-r border-border bg-surface/40 backdrop-blur"
      data-tour="sidebar"
    >
      {/* header / toggle */}
      <div className="flex items-center justify-between gap-2 border-b border-border/60 px-4 py-3.5">
        {open && (
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-foreground-muted">
            Districts · {DISTRICTS.length}
          </span>
        )}
        <button
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
          className="ml-auto grid size-7 place-items-center rounded-md border border-border text-foreground-muted transition hover:border-accent/60 hover:text-foreground"
        >
          {open ? <PanelLeftClose className="size-4" /> : <PanelLeft className="size-4" />}
        </button>
      </div>

      {open ? (
        <>
          {/* severity summary */}
          <div className="flex items-center gap-4 px-4 py-3 border-b border-border/40">
            {(["critical", "emerging", "ok"] as Severity[]).map((s) => (
              <span key={s} className="flex items-center gap-1.5 text-[11px] text-foreground-muted">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: SEV_COLOR[s] }} />
                <span className="font-mono">{counts[s]}</span>
                <span className="hidden sm:inline text-[10px]">{SEV_LABEL_SHORT[s]}</span>
              </span>
            ))}
          </div>

          {/* search */}
          <div className="px-3 pt-3 pb-1">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-background/50 px-3 py-2 focus-within:border-accent/50 transition-colors">
              <Search className="size-3.5 shrink-0 text-foreground-muted" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Find a district…"
                className="w-full bg-transparent text-xs text-foreground outline-none placeholder:text-foreground-muted"
              />
            </div>
          </div>

          {/* district list */}
          <div className="mt-1 flex-1 overflow-y-auto px-2 pb-2 scrollbar-thin">
            {ranked.map((d) => {
              const sev = severity(d);
              const isSel = selected.name === d.name;
              return (
                <button
                  key={d.name}
                  onClick={() => setSelected(d.name)}
                  className={cn(
                    "group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-150",
                    isSel
                      ? "bg-accent/10 border border-accent/20"
                      : "border border-transparent hover:bg-surface hover:border-border/50",
                  )}
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-white/10"
                    style={{ background: SEV_COLOR[sev] }}
                  />
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        "block truncate text-[13px] leading-tight",
                        isSel ? "text-foreground font-medium" : "text-foreground/85",
                      )}
                    >
                      {d.name}
                    </span>
                    <span className="block font-mono text-[9px] uppercase tracking-wider text-foreground-muted mt-0.5">
                      {SEVERITY_LABEL[sev]}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "shrink-0 rounded-md px-1.5 py-0.5 font-mono text-[10px]",
                      isSel
                        ? "bg-accent/15 text-accent"
                        : "text-foreground-muted",
                    )}
                  >
                    {d.demand}
                  </span>
                </button>
              );
            })}
          </div>

          {/* category filter */}
          <div className="border-t border-border/60 px-3 py-3.5">
            <div className="mb-2.5 font-mono text-[9px] uppercase tracking-[0.18em] text-foreground-muted">
              Build categories
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {CATEGORY_ORDER.map((c) => {
                const active = cats.includes(c);
                return (
                  <button
                    key={c}
                    onClick={() => toggleCat(c)}
                    title={CATEGORY_LABEL[c]}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[10px] transition-all duration-150",
                      active
                        ? "border-accent/50 bg-accent/10 text-foreground"
                        : "border-border text-foreground-muted hover:border-border hover:bg-surface/50 hover:text-foreground",
                    )}
                  >
                    <CategoryIcon category={c} size={13} />
                    <span className="truncate">{CATEGORY_LABEL[c]}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 overflow-y-auto py-2">
          {ranked.map((d) => {
            const sev = severity(d);
            const isSel = selected.name === d.name;
            return (
              <button
                key={d.name}
                onClick={() => setSelected(d.name)}
                title={`${d.name} · ${SEVERITY_LABEL[sev]}`}
                className="flex w-full justify-center py-1.5"
              >
                <span
                  className={cn(
                    "h-3 w-3 rounded-full ring-offset-2 ring-offset-background transition",
                    isSel && "ring-2 ring-accent",
                  )}
                  style={{ background: SEV_COLOR[sev] }}
                />
              </button>
            );
          })}
        </div>
      )}
    </motion.aside>
  );
}
