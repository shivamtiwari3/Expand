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
      animate={{ width: open ? 288 : 64 }}
      transition={{ type: "spring", stiffness: 320, damping: 34 }}
      className="relative z-20 flex h-full shrink-0 flex-col border-r border-border bg-surface/40 backdrop-blur"
      data-tour="sidebar"
    >
      {/* header / toggle */}
      <div className="flex items-center justify-between gap-2 border-b border-border/60 px-3 py-3">
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
          <div className="flex items-center gap-3 px-4 pt-3 text-[11px]">
            {(["critical", "emerging", "ok"] as Severity[]).map((s) => (
              <span key={s} className="flex items-center gap-1.5 text-foreground-muted">
                <span className="h-2 w-2 rounded-full" style={{ background: SEV_COLOR[s] }} />
                {counts[s]}
              </span>
            ))}
          </div>

          {/* search */}
          <div className="px-3 pt-3">
            <div className="flex items-center gap-2 rounded-md border border-border bg-background/40 px-2.5 py-1.5">
              <Search className="size-3.5 text-foreground-muted" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Find a district…"
                className="w-full bg-transparent text-xs text-foreground outline-none placeholder:text-foreground-muted"
              />
            </div>
          </div>

          {/* district list */}
          <div className="mt-2 flex-1 overflow-y-auto px-2 pb-2">
            {ranked.map((d) => {
              const sev = severity(d);
              const isSel = selected.name === d.name;
              return (
                <button
                  key={d.name}
                  onClick={() => setSelected(d.name)}
                  className={cn(
                    "group flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left transition",
                    isSel ? "bg-surface-active" : "hover:bg-surface",
                  )}
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: SEV_COLOR[sev] }}
                  />
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        "block truncate text-[13px]",
                        isSel ? "text-foreground" : "text-foreground/85",
                      )}
                    >
                      {d.name}
                    </span>
                    <span className="block font-mono text-[9px] uppercase tracking-wider text-foreground-muted">
                      {SEVERITY_LABEL[sev]}
                    </span>
                  </span>
                  <span className="shrink-0 font-mono text-[10px] text-foreground-muted">
                    {d.demand}
                  </span>
                </button>
              );
            })}
          </div>

          {/* category filter */}
          <div className="border-t border-border/60 px-3 py-3">
            <div className="mb-2 font-mono text-[9px] uppercase tracking-[0.18em] text-foreground-muted">
              Build categories
            </div>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORY_ORDER.map((c) => {
                const active = cats.includes(c);
                return (
                  <button
                    key={c}
                    onClick={() => toggleCat(c)}
                    title={CATEGORY_LABEL[c]}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] transition",
                      active
                        ? "border-accent/50 bg-accent/10 text-foreground"
                        : "border-border text-foreground-muted hover:text-foreground",
                    )}
                  >
                    <CategoryIcon category={c} size={12} />
                    <span className="max-w-[68px] truncate">{CATEGORY_LABEL[c]}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        // collapsed rail: severity dots per district
        <div className="flex-1 overflow-y-auto px-0 py-2">
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
                    isSel && "ring-2 ring-foreground",
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
