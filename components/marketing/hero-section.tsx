"use client";

import { GradientBackground } from "@/components/marketing/gradient-bg";
import { TextEffect } from "@/components/ui/text-effect";
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";
import { MetallicLogo } from "@/components/ui/metallic-logo";
import Link from "next/link";

export function HeroSection() {
  return (
    <section className="relative isolate min-h-[92vh] overflow-hidden">
      <GradientBackground />

      <div className="relative z-10 flex min-h-[92vh] flex-col items-center justify-center px-4 pt-24 pb-16">
        <div className="mb-10 flex flex-col items-center text-center">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-background/40 px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-foreground-muted backdrop-blur-md">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
            ANDREJ × RESEARCH-LM · Open beta
          </span>

          <TextEffect
            per="word"
            preset="blur"
            className="font-serif text-5xl leading-[0.98] tracking-tight text-foreground sm:text-6xl md:text-7xl lg:text-[88px] max-w-4xl"
          >
            Automated frontier AI lab. Reason at the research level.
          </TextEffect>

          <p className="mx-auto mt-8 max-w-2xl text-balance text-base leading-relaxed text-foreground-muted md:text-lg">
            A browser-native research workspace and IDE where Andrej orchestrates the full
            ML loop — exploratory analysis, feature engineering pipeline, neural architecture design,
            training runs, and paper drafting — with collaborative reasoning visible at every layer.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-foreground-muted">
              <img src="/k2-logo.svg" alt="K2" className="h-3.5 w-auto opacity-80" />
              <span>Built with K2 Think</span>
            </div>
            <Link href="/workspace">
              <HoverBorderGradient containerClassName="rounded-full">
                <span className="text-sm font-medium tracking-tight">
                  Enter the Lab →
                </span>
              </HoverBorderGradient>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
