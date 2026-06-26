"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Sparkles, X } from "lucide-react";
import { MetallicLogo } from "@/components/ui/metallic-logo";
import { cn } from "@/lib/utils";
import { useDashboard } from "./DashboardProvider";
import {
  ONBOARDING_KEY,
  ONBOARDING_STEPS,
  type OnboardingStep,
} from "./onboarding-steps";

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function measureTarget(selector: string): Rect | null {
  const el = document.querySelector(selector);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  const pad = 8;
  return {
    top: Math.max(8, r.top - pad),
    left: Math.max(8, r.left - pad),
    width: r.width + pad * 2,
    height: r.height + pad * 2,
  };
}

export default function OnboardingTour() {
  const searchParams = useSearchParams();
  const forceTour = searchParams.get("tour") === "1";
  const { setSelected, setRailTab } = useDashboard();

  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [spot, setSpot] = useState<Rect | null>(null);
  const [cardPos, setCardPos] = useState<{ top: number; left: number } | null>(null);

  const step: OnboardingStep = ONBOARDING_STEPS[stepIdx];
  const isLast = stepIdx === ONBOARDING_STEPS.length - 1;
  const isFirst = stepIdx === 0;

  const finish = useCallback(() => {
    setActive(false);
    try {
      localStorage.setItem(ONBOARDING_KEY, "complete");
    } catch {
      /* ignore */
    }
  }, []);

  const go = useCallback(
    (idx: number) => {
      const next = ONBOARDING_STEPS[idx];
      if (!next) return;
      if (next.district) setSelected(next.district);
      if (next.tab) setRailTab(next.tab);
      setStepIdx(idx);
    },
    [setRailTab, setSelected],
  );

  useEffect(() => {
    setMounted(true);
    let seen = false;
    try {
      seen = localStorage.getItem(ONBOARDING_KEY) === "complete";
    } catch {
      seen = false;
    }
    if (forceTour || !seen) {
      setActive(true);
      setStepIdx(0);
    }
  }, [forceTour]);

  useEffect(() => {
    if (!active || !mounted) return;

    const s = ONBOARDING_STEPS[stepIdx];
    if (s.district) setSelected(s.district);
    if (s.tab) setRailTab(s.tab);

    const update = () => {
      if (s.target) {
        const el = document.querySelector(s.target);
        el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
        const rect = measureTarget(s.target);
        const valid = rect && rect.width > 8 && rect.height > 8 ? rect : null;
        setSpot(valid);
        if (valid) {
          setCardPos({
            top: Math.min(valid.top + valid.height + 12, window.innerHeight - 220),
            left: Math.min(Math.max(16, valid.left), window.innerWidth - 16 - 352),
          });
        } else {
          setCardPos(null);
        }
      } else {
        setSpot(null);
        setCardPos(null);
      }
    };

    update();
    const t = window.setTimeout(update, 320);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [active, mounted, stepIdx, setRailTab, setSelected]);

  if (!mounted || !active) return null;

  const card = (
    <motion.div
      key={step.id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn(
        "pointer-events-auto z-[210] w-[min(16rem,calc(100vw-2rem))] rounded-lg border border-border bg-surface/95 p-3 shadow-xl backdrop-blur-xl",
        spot && cardPos ? "fixed" : "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
      )}
      style={
        spot && cardPos
          ? { top: cardPos.top, left: cardPos.left }
          : undefined
      }
    >
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {isFirst ? (
            <MetallicLogo size={18} />
          ) : (
            <Sparkles className="size-3 text-accent" />
          )}
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-accent">
            {stepIdx + 1}/{ONBOARDING_STEPS.length}
          </span>
        </div>
        <button
          type="button"
          onClick={finish}
          aria-label="Skip tour"
          className="rounded p-0.5 text-foreground-muted transition hover:bg-surface-active hover:text-foreground"
        >
          <X className="size-3.5" />
        </button>
      </div>
      <h2 className="text-sm font-semibold tracking-tight text-foreground">{step.title}</h2>
      <p className="mt-1 text-[11px] leading-snug text-foreground-muted line-clamp-3">{step.body}</p>
      <div className="mt-3 flex items-center justify-between gap-1">
        <button
          type="button"
          disabled={isFirst}
          onClick={() => go(stepIdx - 1)}
          className="flex items-center gap-0.5 rounded px-1.5 py-1 text-[10px] text-foreground-muted transition hover:text-foreground disabled:opacity-30"
        >
          <ChevronLeft className="size-3" />
          Back
        </button>
        <div className="flex gap-0.5">
          {ONBOARDING_STEPS.map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-0.5 w-2.5 rounded-full transition",
                i === stepIdx ? "bg-accent" : "bg-border",
              )}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => (isLast ? finish() : go(stepIdx + 1))}
          className="flex items-center gap-0.5 rounded bg-accent px-2 py-1 text-[10px] font-medium text-accent-foreground transition hover:bg-accent-hover"
        >
          {isLast ? "Go" : "Next"}
          {!isLast && <ChevronRight className="size-3" />}
        </button>
      </div>
    </motion.div>
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] pointer-events-none">
        {/* dim + spotlight */}
        {spot ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="pointer-events-auto absolute rounded-lg ring-2 ring-accent/80"
            style={{
              top: spot.top,
              left: spot.left,
              width: spot.width,
              height: spot.height,
              boxShadow: "0 0 0 9999px rgba(10, 9, 8, 0.82)",
            }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="pointer-events-auto absolute inset-0 bg-background/85 backdrop-blur-sm"
          />
        )}

        {/* tap outside to skip on welcome/done */}
        {!spot && (
          <button
            type="button"
            className="pointer-events-auto absolute inset-0"
            aria-label="Dismiss overlay"
            onClick={finish}
          />
        )}

        {card}
      </div>
    </AnimatePresence>
  );
}

/** Header chip — replay the product tour */
export function TourReplayButton() {
  return (
    <a
      href="/dashboard?tour=1"
      className="hidden items-center gap-1.5 rounded-md border border-border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-foreground-muted transition hover:border-accent/50 hover:text-foreground sm:inline-flex"
    >
      <Sparkles className="size-3" />
      Tour
    </a>
  );
}
