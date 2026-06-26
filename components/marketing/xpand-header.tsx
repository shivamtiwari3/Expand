"use client";

import { MetallicLogo } from "@/components/ui/metallic-logo";
import type { ReactNode } from "react";

const LINKS = [
  { label: "Map", href: "#map" },
  { label: "Gaps", href: "#gaps" },
  { label: "Opportunities", href: "#rfps" },
  { label: "Community", href: "#community" },
  { label: "Ask Xpand", href: "#copilot" },
];

export function XpandHeader({ trailing }: { trailing?: ReactNode }) {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-lg">
      <nav className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-5">
        <a href="/#top" className="flex items-center gap-2.5">
          <MetallicLogo size={26} />
          <span className="font-serif text-base font-medium tracking-tight text-foreground">
            Xpand
          </span>
        </a>
        <div className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-md px-3 py-1.5 text-sm text-foreground-muted transition hover:bg-surface hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {trailing}
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-foreground-muted">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
            Built with K2 Think
          </div>
        </div>
      </nav>
    </header>
  );
}
