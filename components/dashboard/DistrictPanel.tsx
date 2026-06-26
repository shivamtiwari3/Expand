"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDashboard } from "@/components/dashboard/DashboardProvider";
import { getLive, AED, num, AREA_TYPE_LABEL } from "@/lib/data";
import { severity, SEVERITY_LABEL, forecast, makeRfp } from "@/lib/engine";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card-borders";
import type { District, LiveDistrict, Forecast } from "@/lib/types";

// ── AI recommendation state ──────────────────────────────────────────────────
interface AiResult {
  text: string;
  source: string;
}

function useAiRecommendation(d: District) {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<AiResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Cancel any in-flight request
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setLoading(true);
    setResult(null);
    setError(null);

    fetch("/api/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "district", district: d.name }),
      signal: ctrl.signal,
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setResult({ text: data.text, source: data.source });
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setError("Could not load recommendation.");
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });

    return () => ctrl.abort();
  }, [d.name]);

  return { loading, result, error };
}

// ── Sub-components ───────────────────────────────────────────────────────────

function MicroLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("font-mono text-[9px] uppercase tracking-widest text-foreground-muted", className)}>
      {children}
    </span>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-mono text-[10px] uppercase tracking-[0.15em] text-foreground-muted mb-3">
      {children}
    </h3>
  );
}

function Divider() {
  return <div className="h-px bg-border my-5 opacity-60" />;
}

// ── Stat strip ───────────────────────────────────────────────────────────────
interface StatTileProps {
  label: string;
  value: string;
}

function StatTile({ label, value }: StatTileProps) {
  return (
    <div className="flex flex-col gap-1 rounded-lg bg-surface/50 border border-border px-3 py-2.5 min-w-0">
      <MicroLabel>{label}</MicroLabel>
      <span className="font-mono text-sm text-foreground leading-none">{value}</span>
    </div>
  );
}

// ── Gap bar row ───────────────────────────────────────────────────────────────
interface GapRowProps {
  label: string;
  count: number;
  shortfall: number;
  maxShortfall: number;
  sev: "ok" | "emerging" | "critical";
}

function GapRow({ label, count, shortfall, maxShortfall, sev }: GapRowProps) {
  const pct = maxShortfall > 0 ? Math.min(100, (shortfall / maxShortfall) * 100) : 0;
  const barColor =
    sev === "critical"
      ? "var(--color-critical)"
      : sev === "emerging"
        ? "var(--color-emerging)"
        : "var(--color-ok)";

  return (
    <div className="flex items-center gap-3 py-1.5">
      <div className="w-28 shrink-0">
        <span className="font-mono text-xs text-foreground leading-none">{label}</span>
        <div className="text-[10px] text-foreground-muted mt-0.5">{count} on ground</div>
      </div>
      <div className="flex-1 h-1.5 rounded-full bg-surface-2 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{ background: barColor }}
        />
      </div>
      <span className="font-mono text-[10px] text-foreground-muted w-10 text-right shrink-0">
        -{shortfall}
      </span>
    </div>
  );
}

// ── Shimmer loading ───────────────────────────────────────────────────────────
function Shimmer({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2 animate-pulse">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-3 rounded bg-surface-2"
          style={{ width: i === lines - 1 ? "60%" : "100%" }}
        />
      ))}
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────
function PanelContent({ d }: { d: District }) {
  const sev = severity(d);
  const f: Forecast = forecast(d, 12);
  const l: LiveDistrict | undefined = getLive(d.name);
  const rfp = makeRfp(d);
  const { loading: aiLoading, result: aiResult, error: aiError } = useAiRecommendation(d);

  const maxShortfall = d.gaps.length
    ? Math.max(...d.gaps.map((g) => g.shortfall))
    : 1;

  const topNeeds = f.needs.filter((n) => n.add > 0).slice(0, 3);

  const cleanSamples = (l?.samples ?? [])
    .filter((s) => s.title !== "browser-json-capture")
    .slice(0, 2);

  const sevBadgeClass = cn(
    "rounded-full px-2 py-0.5 text-xs",
    sev === "ok" && "sev-ok sev-bg-ok",
    sev === "emerging" && "sev-emerging sev-bg-emerging",
    sev === "critical" && "sev-critical sev-bg-critical",
  );

  return (
    <div className="p-6 space-y-0">

      {/* ── 1. Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2 mb-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <h2 className="font-serif text-2xl text-foreground leading-tight">{d.name}</h2>
          <span className={sevBadgeClass}>{SEVERITY_LABEL[sev]}</span>
        </div>
        <MicroLabel>{AREA_TYPE_LABEL[d.areaType] ?? d.areaType}</MicroLabel>
      </div>

      {/* ── 2. Stat strip ─────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-2 mb-1">
        <StatTile label="Population" value={num(d.population)} />
        <StatTile label="Demand" value={`${d.demand}/100`} />
        <StatTile label="Mobility" value={`${d.mobility}/100`} />
        <StatTile label="Vacant" value={String(d.vacantTotal)} />
        <StatTile label="Momentum" value={`${d.momentum}%`} />
        <StatTile label="Yield" value={`${d.yield}%`} />
      </div>

      <Divider />

      {/* ── 3. What's missing ─────────────────────────────────────── */}
      <div>
        <SectionTitle>What's missing</SectionTitle>
        {d.gaps.length === 0 ? (
          <p className="text-sm text-foreground-muted">Well served across services.</p>
        ) : (
          <div className="space-y-0.5">
            {d.gaps.map((g) => (
              <GapRow
                key={g.category}
                label={g.label}
                count={g.count}
                shortfall={g.shortfall}
                maxShortfall={maxShortfall}
                sev={sev}
              />
            ))}
          </div>
        )}
      </div>

      <Divider />

      {/* ── 4. 12-month forecast ─────────────────────────────────── */}
      <div>
        <SectionTitle>Next 12 months</SectionTitle>
        <p className="text-sm text-foreground mb-2">
          <span className="text-accent font-mono">+{num(f.newResidents)}</span> residents{" "}
          <span className="text-foreground-muted">({f.growthPct}% growth)</span>
        </p>
        {topNeeds.length > 0 && (
          <ul className="space-y-1">
            {topNeeds.map((n) => (
              <li key={n.category} className="flex items-center gap-2 text-xs text-foreground-muted">
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: "var(--color-emerging)" }}
                />
                <span>
                  <span className="text-foreground font-mono">{n.add}</span> more {n.label}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Divider />

      {/* ── 5. Xpand recommends (AI) ─────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <SectionTitle>Xpand recommends</SectionTitle>
          {!aiLoading && aiResult && (
            <span className="font-mono text-[9px] uppercase tracking-widest rounded-full px-2 py-0.5 bg-surface-2 text-foreground-muted border border-border ml-auto mb-3">
              {aiResult.source === "k2" ? "K2 Think · live" : "rule-based"}
            </span>
          )}
        </div>

        {aiLoading && (
          <div className="space-y-3">
            <p className="font-mono text-[10px] uppercase tracking-widest text-foreground-muted animate-pulse">
              Reading the data…
            </p>
            <Shimmer lines={4} />
          </div>
        )}

        {!aiLoading && aiError && (
          <p className="text-sm text-foreground-muted italic">{aiError}</p>
        )}

        {!aiLoading && aiResult && (
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
            {aiResult.text}
          </p>
        )}
      </div>

      <Divider />

      {/* ── 6. Live market ───────────────────────────────────────── */}
      <div>
        <SectionTitle>Live market</SectionTitle>
        {!l ? (
          <p className="text-sm text-foreground-muted">No live listings for this area.</p>
        ) : (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
              <span className="text-foreground">
                <span className="font-mono text-accent">{num(l.listings)}</span>{" "}
                <span className="text-foreground-muted">listings</span>
              </span>
              <span className="text-foreground-muted">
                <span className="font-mono text-foreground">{l.saleCount}</span> sale ·{" "}
                <span className="font-mono text-foreground">{l.rentCount}</span> rent
              </span>
              {l.medSale > 0 && (
                <span className="text-foreground-muted">
                  Median{" "}
                  <span className="font-mono text-foreground">{AED(l.medSale)}</span>
                  {l.medSalePerSqm > 0 && (
                    <> · ~AED <span className="font-mono text-foreground">{num(l.medSalePerSqm)}</span>/sqm</>
                  )}
                </span>
              )}
            </div>
            {cleanSamples.length > 0 && (
              <ul className="space-y-1.5 mt-2">
                {cleanSamples.map((s, i) => (
                  <li
                    key={i}
                    className="text-xs text-foreground-muted rounded-md bg-surface/40 border border-border px-3 py-2 leading-snug"
                  >
                    <span className="text-foreground">{s.title}</span>
                    <span className="ml-2 font-mono text-[10px]">
                      {AED(s.price)} · {s.ptype}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <Divider />

      {/* ── 7. Open proposal footer ──────────────────────────────── */}
      <div className="rounded-lg border border-border bg-surface/30 px-4 py-3">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <MicroLabel className="text-accent">{rfp.id}</MicroLabel>
            </div>
            <p className="text-sm text-foreground font-medium">{rfp.need}</p>
            <p className="font-mono text-[10px] text-foreground-muted mt-1">
              {rfp.vacantParcels} parcels · {rfp.matchedInvestors} investors
            </p>
          </div>
        </div>
        <p className="font-mono text-[9px] uppercase tracking-widest text-foreground-muted mt-2 opacity-60">
          See Opportunities below
        </p>
      </div>
    </div>
  );
}

// ── Exported component ────────────────────────────────────────────────────────
export default function DistrictPanel() {
  const { selected } = useDashboard();

  return (
    <Card className="h-full overflow-auto" data-tour="district-panel">
      <AnimatePresence mode="wait">
        <motion.div
          key={selected.name}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
        >
          <PanelContent d={selected} />
        </motion.div>
      </AnimatePresence>
    </Card>
  );
}
