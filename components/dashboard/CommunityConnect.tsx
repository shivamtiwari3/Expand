"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, CheckCircle2, Users, Building2, ChevronRight } from "lucide-react";
import { useDashboard } from "@/components/dashboard/DashboardProvider";
import { DATA, DISTRICTS, num } from "@/lib/data";
import { venturesForDistrict } from "@/lib/engine";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card-borders";
import type { Venture, District } from "@/lib/types";

// ── Modal ────────────────────────────────────────────────────────────────────

interface ConnectModalProps {
  venture: Venture | null;
  onClose: () => void;
}

function ConnectModal({ venture, onClose }: ConnectModalProps) {
  const [name, setName] = useState("");
  const [firm, setFirm] = useState("");
  const [capital, setCapital] = useState("AED <15M");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Prefill message when venture changes
  useEffect(() => {
    if (venture) {
      setMessage(`Interested in backing ${venture.name} (${venture.kind}).`);
      setSubmitted(false);
      setName("");
      setFirm("");
      setCapital("AED <15M");
      setTimeout(() => firstInputRef.current?.focus(), 100);
    }
  }, [venture]);

  // Esc key close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <motion.div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter: "blur(8px)", backgroundColor: "rgba(20,19,18,0.7)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={(e) => {
        if (e.target === backdropRef.current) onClose();
      }}
    >
      <motion.div
        className="relative w-full max-w-md rounded-2xl border border-border bg-surface shadow-2xl"
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border px-6 py-5">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-foreground-muted mb-1">
              Connect with founder
            </p>
            <h3 className="font-serif text-xl text-foreground leading-tight">
              {venture?.name}
            </h3>
            <p className="mt-0.5 text-sm text-foreground-muted">
              {venture?.founder}
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-foreground-muted transition-colors hover:border-accent hover:text-foreground"
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <AnimatePresence mode="wait">
            {submitted ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-4 py-6 text-center"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-accent/30 bg-accent/10">
                  <CheckCircle2 size={28} className="text-accent" />
                </div>
                <div>
                  <p className="font-serif text-lg text-foreground">
                    Intro sent to {venture?.founder}.
                  </p>
                  <p className="mt-1 text-sm text-foreground-muted">
                    {venture?.name} will reach out.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="mt-2 rounded-lg bg-accent px-5 py-2.5 font-mono text-sm text-accent-foreground transition-colors hover:bg-accent-hover"
                >
                  Close
                </button>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit}
                className="flex flex-col gap-4"
              >
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1.5">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-foreground-muted">
                      Your name
                    </span>
                    <input
                      ref={firstInputRef}
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jane Smith"
                      className="rounded-md border border-border bg-surface-2 px-3 py-2.5 text-sm text-foreground placeholder:text-foreground-muted/50 outline-none focus:border-accent/60 transition-colors"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-foreground-muted">
                      Firm / Fund
                    </span>
                    <input
                      required
                      value={firm}
                      onChange={(e) => setFirm(e.target.value)}
                      placeholder="Apex Capital"
                      className="rounded-md border border-border bg-surface-2 px-3 py-2.5 text-sm text-foreground placeholder:text-foreground-muted/50 outline-none focus:border-accent/60 transition-colors"
                    />
                  </label>
                </div>

                <label className="flex flex-col gap-1.5">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-foreground-muted">
                    Capital range
                  </span>
                  <select
                    value={capital}
                    onChange={(e) => setCapital(e.target.value)}
                    className="rounded-md border border-border bg-surface-2 px-3 py-2.5 text-sm text-foreground outline-none focus:border-accent/60 transition-colors appearance-none"
                  >
                    <option>AED &lt;15M</option>
                    <option>AED 15–60M</option>
                    <option>AED 60M+</option>
                  </select>
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-foreground-muted">
                    Message
                  </span>
                  <textarea
                    required
                    rows={3}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="resize-none rounded-md border border-border bg-surface-2 px-3 py-2.5 text-sm text-foreground placeholder:text-foreground-muted/50 outline-none focus:border-accent/60 transition-colors"
                  />
                </label>

                <button
                  type="submit"
                  className="flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-3 font-mono text-sm text-accent-foreground transition-colors hover:bg-accent-hover"
                >
                  <Send size={14} />
                  Send intro
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Venture Card ─────────────────────────────────────────────────────────────

interface VentureCardProps {
  venture: Venture;
  isFit: boolean;
  selectedName: string;
  index: number;
  onConnect: (v: Venture) => void;
}

function VentureCard({ venture, isFit, selectedName, index, onConnect }: VentureCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
    >
      <Card
        className={cn(
          "transition-all duration-300",
          isFit && "ring-1 ring-accent/40 shadow-[0_0_24px_rgba(206,215,227,0.07)]"
        )}
      >
        <div className="flex flex-col gap-3 p-4">
          {/* Name + fit tag */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-serif text-base leading-tight text-foreground">
                {venture.name}
              </h4>
              <p className="mt-0.5 font-mono text-[10px] text-foreground-muted">
                Founded by {venture.founder}
              </p>
            </div>
            <AnimatePresence>
              {isFit && (
                <motion.span
                  key="fit-tag"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                  className="shrink-0 rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-accent"
                >
                  Fits {selectedName}
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          {/* Chips */}
          <div className="flex flex-wrap gap-1.5">
            <span className="rounded-full border border-border bg-surface-2 px-2.5 py-0.5 font-mono text-[10px] text-foreground-muted">
              {venture.kind}
            </span>
            <span className="rounded-full border border-border bg-surface-2 px-2.5 py-0.5 font-mono text-[10px] text-foreground-muted">
              {venture.sector}
            </span>
          </div>

          {/* Ask + Need */}
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-foreground">
              Seeking{" "}
              <span className={cn("text-accent", isFit && "font-semibold")}>
                {venture.ask}
              </span>
            </p>
            <p className="font-mono text-[11px] text-foreground-muted">
              Builds: {venture.need}
            </p>
          </div>

          {/* CTA */}
          <button
            onClick={() => onConnect(venture)}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 font-mono text-xs transition-all duration-200",
              isFit
                ? "border-accent bg-accent text-accent-foreground hover:bg-accent-hover"
                : "border-border text-foreground-muted hover:border-accent/50 hover:text-foreground"
            )}
          >
            Connect
            <ChevronRight size={12} />
          </button>
        </div>
      </Card>
    </motion.div>
  );
}

// ── Investor Panel ────────────────────────────────────────────────────────────

interface InvestorPanelProps {
  selected: District;
}

function InvestorPanel({ selected }: InvestorPanelProps) {
  // Aggregate across ALL districts
  const globalBySector = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const d of DISTRICTS) {
      for (const [sector, count] of Object.entries(d.investorsBySector)) {
        acc[sector] = (acc[sector] ?? 0) + count;
      }
    }
    return acc;
  }, []);

  const topSectors = useMemo(() => {
    return Object.entries(globalBySector)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
  }, [globalBySector]);

  const maxCount = topSectors[0]?.[1] ?? 1;

  const localSectors = useMemo(() => {
    return Object.entries(selected.investorsBySector)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [selected]);

  return (
    <div className="flex flex-col gap-5">
      {/* Headline numbers */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
          <div className="flex items-center gap-2 mb-1">
            <Users size={13} className="text-accent" />
            <span className="font-mono text-[9px] uppercase tracking-widest text-foreground-muted">
              Total investors
            </span>
          </div>
          <p className="font-serif text-2xl text-foreground">
            {num(DATA.meta.investors ?? 0)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
          <div className="flex items-center gap-2 mb-1">
            <Building2 size={13} className="text-accent" />
            <span className="font-mono text-[9px] uppercase tracking-widest text-foreground-muted">
              Districts
            </span>
          </div>
          <p className="font-serif text-2xl text-foreground">
            {num(DATA.meta.districts ?? DISTRICTS.length)}
          </p>
        </div>
      </div>

      {/* Global sector bars */}
      <div className="rounded-xl border border-border bg-surface/40 px-4 py-4">
        <p className="font-mono text-[9px] uppercase tracking-widest text-foreground-muted mb-3">
          Investor interest by sector — all districts
        </p>
        <div className="flex flex-col gap-2.5">
          {topSectors.map(([sector, count], i) => (
            <motion.div
              key={sector}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04, duration: 0.3 }}
              className="flex items-center gap-3"
            >
              <span className="w-24 shrink-0 font-mono text-[10px] text-foreground-muted truncate capitalize">
                {sector}
              </span>
              <div className="relative flex-1 h-1.5 rounded-full bg-surface-2 overflow-hidden">
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-full bg-accent/50"
                  initial={{ width: 0 }}
                  animate={{ width: `${(count / maxCount) * 100}%` }}
                  transition={{ delay: i * 0.04 + 0.1, duration: 0.5, ease: "easeOut" }}
                />
              </div>
              <span className="w-6 shrink-0 text-right font-mono text-[10px] text-foreground-muted">
                {count}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Selected district breakdown */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selected.name}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.25 }}
          className="rounded-xl border border-border bg-surface/40 px-4 py-4"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="font-mono text-[9px] uppercase tracking-widest text-foreground-muted">
              {selected.name} — investor breakdown
            </p>
            <span className="rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 font-mono text-[9px] text-accent">
              avg fit {selected.investorFit}/100
            </span>
          </div>

          {localSectors.length > 0 ? (
            <div className="flex flex-col gap-2">
              {localSectors.map(([sector, count]) => (
                <div key={sector} className="flex items-center justify-between">
                  <span className="font-mono text-[11px] text-foreground-muted capitalize">
                    {sector}
                  </span>
                  <span className="font-mono text-[11px] text-foreground">
                    {count} investor{count !== 1 ? "s" : ""}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="font-mono text-[11px] text-foreground-muted">
              No investor data for this district.
            </p>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function CommunityConnect() {
  const { selected } = useDashboard();
  const [connectVenture, setConnectVenture] = useState<Venture | null>(null);

  const fitVentures = useMemo(() => venturesForDistrict(selected), [selected]);
  const fitNames = useMemo(() => new Set(fitVentures.map((v) => v.name)), [fitVentures]);

  const ventures = DATA.ventures;

  // Sort: fit ventures first, then the rest
  const sortedVentures = useMemo(() => {
    return [...ventures].sort((a, b) => {
      const af = fitNames.has(a.name) ? 1 : 0;
      const bf = fitNames.has(b.name) ? 1 : 0;
      return bf - af;
    });
  }, [ventures, fitNames]);

  return (
    <>
      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        {/* LEFT — Ventures */}
        <div className="flex-1 min-w-0">
          <div className="mb-4 flex items-center gap-3">
            <h2 className="font-serif text-xl text-foreground">
              Ventures &amp; operators
            </h2>
            <span className="rounded-full border border-border bg-surface-2 px-2 py-0.5 font-mono text-[10px] text-foreground-muted">
              {ventures.length}
            </span>
          </div>

          {fitVentures.length > 0 && (
            <motion.p
              key={selected.name}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-4 font-mono text-[11px] text-foreground-muted"
            >
              {fitVentures.length} venture{fitVentures.length !== 1 ? "s" : ""} match{fitVentures.length === 1 ? "es" : ""} {selected.name}&apos;s gaps
            </motion.p>
          )}

          <div className="flex flex-col gap-3">
            <AnimatePresence initial={false}>
              {sortedVentures.map((venture, i) => (
                <VentureCard
                  key={venture.name}
                  venture={venture}
                  isFit={fitNames.has(venture.name)}
                  selectedName={selected.name}
                  index={i}
                  onConnect={setConnectVenture}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* RIGHT — Investor interest */}
        <div className="w-full lg:w-72 xl:w-80 shrink-0">
          <div className="mb-4">
            <h2 className="font-serif text-xl text-foreground">
              Investor interest
            </h2>
          </div>
          <InvestorPanel selected={selected} />
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {connectVenture && (
          <ConnectModal
            key={connectVenture.name}
            venture={connectVenture}
            onClose={() => setConnectVenture(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
