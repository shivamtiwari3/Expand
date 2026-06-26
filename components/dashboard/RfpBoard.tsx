"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, CheckCircle2, Building2, GraduationCap, HeartPulse, ShoppingBag, Users, Zap, Wrench } from "lucide-react";
import { useDashboard } from "@/components/dashboard/DashboardProvider";
import { DATA, CATEGORY_LABEL, AED } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card-borders";
import type { Rfp, Category } from "@/lib/types";

// ─── Category styling ────────────────────────────────────────────────────────

const CATEGORY_COLOR: Record<Category, string> = {
  education:  "bg-blue-500/20 text-blue-300 border-blue-500/30",
  healthcare: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  retail:     "bg-orange-500/20 text-orange-300 border-orange-500/30",
  community:  "bg-purple-500/20 text-purple-300 border-purple-500/30",
  mobility:   "bg-amber-500/20 text-amber-300 border-amber-500/30",
  services:   "bg-rose-500/20 text-rose-300 border-rose-500/30",
};

const CATEGORY_DOT: Record<Category, string> = {
  education:  "bg-blue-400",
  healthcare: "bg-emerald-400",
  retail:     "bg-orange-400",
  community:  "bg-purple-400",
  mobility:   "bg-amber-400",
  services:   "bg-rose-400",
};

const CATEGORY_ICON: Record<Category, React.ElementType> = {
  education:  GraduationCap,
  healthcare: HeartPulse,
  retail:     ShoppingBag,
  community:  Users,
  mobility:   Zap,
  services:   Wrench,
};

// ─── Modal ───────────────────────────────────────────────────────────────────

interface ModalProps {
  rfp: Rfp;
  onClose: () => void;
}

function RespondModal({ rfp, onClose }: ModalProps) {
  const [name, setName] = useState("");
  const [org, setOrg] = useState("");
  const [message, setMessage] = useState(
    `We'd like to propose a ${rfp.need} project in ${rfp.district}.`
  );
  const [submitted, setSubmitted] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Esc to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Focus first input on open
  useEffect(() => {
    if (!submitted) firstInputRef.current?.focus();
  }, [submitted]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const CategoryIcon = CATEGORY_ICON[rfp.category];

  return (
    <motion.div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={handleOverlayClick}
    >
      {/* Backdrop blur layer */}
      <div className="absolute inset-0 backdrop-blur-sm" />

      <motion.div
        className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-surface/95 shadow-2xl overflow-hidden"
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        role="dialog"
        aria-modal="true"
        aria-label={`Respond to RFP: ${rfp.need} in ${rfp.district}`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4 border-b border-border/50">
          <div className="flex items-center gap-3 min-w-0">
            <div className={cn(
              "flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center border",
              CATEGORY_COLOR[rfp.category]
            )}>
              <CategoryIcon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="font-mono text-xs text-foreground/40 tracking-widest uppercase">{rfp.id}</p>
              <h2 className="font-serif text-base text-foreground leading-tight truncate">{rfp.district}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-foreground/40 hover:text-foreground hover:bg-white/5 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Need headline */}
        <div className="px-6 py-4 border-b border-border/30">
          <p className="text-xs text-foreground/40 uppercase tracking-widest font-mono mb-1">Opportunity</p>
          <p className="text-foreground font-medium text-sm leading-relaxed">{rfp.need}</p>
        </div>

        <AnimatePresence mode="wait">
          {!submitted ? (
            <motion.form
              key="form"
              onSubmit={handleSubmit}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-6 py-5 space-y-4"
            >
              <div>
                <label className="block text-xs font-mono text-foreground/50 mb-1.5 uppercase tracking-wider">
                  Your Name
                </label>
                <input
                  ref={firstInputRef}
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Layla Al Nouri"
                  className="w-full rounded-lg border border-border bg-white/5 px-3 py-2.5 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-1 focus:ring-accent/60 focus:border-accent/60 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-foreground/50 mb-1.5 uppercase tracking-wider">
                  Organisation
                </label>
                <input
                  type="text"
                  required
                  value={org}
                  onChange={(e) => setOrg(e.target.value)}
                  placeholder="e.g. Gulf Capital Partners"
                  className="w-full rounded-lg border border-border bg-white/5 px-3 py-2.5 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-1 focus:ring-accent/60 focus:border-accent/60 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-foreground/50 mb-1.5 uppercase tracking-wider">
                  Message
                </label>
                <textarea
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-border bg-white/5 px-3 py-2.5 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-1 focus:ring-accent/60 focus:border-accent/60 transition-colors resize-none leading-relaxed"
                />
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-accent text-accent-foreground hover:bg-accent-hover py-2.5 text-sm font-medium transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                Send Proposal
              </button>
            </motion.form>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="px-6 py-8 flex flex-col items-center text-center gap-4"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-foreground font-medium mb-1">Proposal sent</p>
                <p className="text-sm text-foreground/50 leading-relaxed">
                  The {rfp.district} planning desk will be in touch.
                </p>
              </div>
              <button
                onClick={onClose}
                className="mt-2 rounded-lg bg-accent text-accent-foreground hover:bg-accent-hover px-6 py-2.5 text-sm font-medium transition-colors"
              >
                Done
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

// ─── Stat cell ───────────────────────────────────────────────────────────────

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-mono text-[10px] text-foreground/35 uppercase tracking-widest leading-none">{label}</span>
      <span className="font-mono text-xs text-foreground/80 leading-none">{value}</span>
    </div>
  );
}

// ─── RFP Card ─────────────────────────────────────────────────────────────────

interface RfpCardProps {
  rfp: Rfp;
  index: number;
  onRespond: (rfp: Rfp) => void;
}

function RfpCard({ rfp, index, onRespond }: RfpCardProps) {
  const { setSelected } = useDashboard();
  const CategoryIcon = CATEGORY_ICON[rfp.category];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{
        layout: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.25, delay: index * 0.05 },
        y: { duration: 0.3, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] },
        scale: { duration: 0.2 },
      }}
    >
      <Card className="h-full flex flex-col bg-surface/40">
        <div className="flex flex-col gap-4 h-full p-5">
          {/* Top row: id + category chip */}
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-[10px] text-accent/70 tracking-widest uppercase">{rfp.id}</span>
            <span className={cn(
              "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono border",
              CATEGORY_COLOR[rfp.category]
            )}>
              <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", CATEGORY_DOT[rfp.category])} />
              {CATEGORY_LABEL[rfp.category]}
            </span>
          </div>

          {/* District name */}
          <div>
            <button
              onClick={() => setSelected(rfp.district)}
              className="font-serif text-lg text-foreground leading-snug text-left hover:text-accent transition-colors group"
            >
              {rfp.district}
              <span className="ml-1 opacity-0 group-hover:opacity-50 transition-opacity text-xs font-sans">↗</span>
            </button>
          </div>

          {/* Need — prominent */}
          <div className="flex items-start gap-2.5 flex-1">
            <div className={cn(
              "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border mt-0.5",
              CATEGORY_COLOR[rfp.category]
            )}>
              <CategoryIcon className="w-3.5 h-3.5" />
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed font-medium">{rfp.need}</p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 pt-3 border-t border-border/30">
            <Stat label="Demand" value={`${rfp.demand}/100`} />
            <Stat label="Vacant Parcels" value={rfp.vacantParcels} />
            <Stat label="Investors" value={rfp.matchedInvestors} />
            <Stat label="Est. Value" value={`AED ${rfp.valueBandM}M`} />
          </div>

          {/* Respond button */}
          <button
            onClick={() => onRespond(rfp)}
            className="mt-auto w-full rounded-lg bg-accent text-accent-foreground hover:bg-accent-hover py-2.5 text-xs font-mono tracking-wider uppercase transition-colors"
          >
            Respond to RFP
          </button>
        </div>
      </Card>
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function RfpBoard() {
  const rfps = DATA.rfps;

  // Derive unique categories present in data
  const categories: Category[] = Array.from(
    new Set(rfps.map((r) => r.category))
  ) as Category[];

  const [activeCategory, setActiveCategory] = useState<Category | "all">("all");
  const [activeRfp, setActiveRfp] = useState<Rfp | null>(null);

  const filtered = activeCategory === "all"
    ? rfps
    : rfps.filter((r) => r.category === activeCategory);

  const handleRespond = useCallback((rfp: Rfp) => setActiveRfp(rfp), []);
  const handleCloseModal = useCallback(() => setActiveRfp(null), []);

  return (
    <>
      <section className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-accent/70" />
            <h2 className="font-serif text-xl text-foreground">Requests for Proposals</h2>
          </div>
          <p className="text-sm text-foreground/45 font-mono">
            {filtered.length} open {filtered.length === 1 ? "opportunity" : "opportunities"} — under-served districts inviting development
          </p>
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCategory("all")}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono border transition-colors",
              activeCategory === "all"
                ? "bg-accent/20 text-accent border-accent/40"
                : "bg-transparent text-foreground/50 border-border/40 hover:border-border hover:text-foreground/70"
            )}
          >
            All
            <span className="text-[10px] opacity-60">{rfps.length}</span>
          </button>

          {categories.map((cat) => {
            const count = rfps.filter((r) => r.category === cat).length;
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono border transition-colors",
                  isActive
                    ? cn("border", CATEGORY_COLOR[cat])
                    : "bg-transparent text-foreground/50 border-border/40 hover:border-border hover:text-foreground/70"
                )}
              >
                <span className={cn("w-1.5 h-1.5 rounded-full", CATEGORY_DOT[cat])} />
                {CATEGORY_LABEL[cat]}
                <span className="text-[10px] opacity-60">{count}</span>
              </button>
            );
          })}
        </div>

        {/* Grid */}
        <motion.div
          layout
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          <AnimatePresence mode="popLayout">
            {filtered.map((rfp, index) => (
              <RfpCard
                key={rfp.id}
                rfp={rfp}
                index={index}
                onRespond={handleRespond}
              />
            ))}
          </AnimatePresence>
        </motion.div>

        {filtered.length === 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-sm text-foreground/35 font-mono py-12"
          >
            No RFPs in this category yet.
          </motion.p>
        )}
      </section>

      {/* Modal portal */}
      <AnimatePresence>
        {activeRfp && (
          <RespondModal key={activeRfp.id} rfp={activeRfp} onClose={handleCloseModal} />
        )}
      </AnimatePresence>
    </>
  );
}
