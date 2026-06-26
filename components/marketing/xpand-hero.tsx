"use client";

import { useRouter } from "next/navigation";
import { LiquidMetalButton } from "@/components/ui/liquid-metal-button";
import { MetallicLogo } from "@/components/ui/metallic-logo";
import { DATA, LIVE, num } from "@/lib/data";

const HEADLINE = "See what every area is missing — before it’s missed.".split(" ");

const STATS = [
  { v: num(DATA.meta.districts), k: "districts" },
  { v: num(DATA.meta.amenities), k: "real amenities (OSM)" },
  { v: num(DATA.meta.parcels), k: "land parcels" },
  { v: num(LIVE.total), k: "live listings" },
];

export function XpandHero() {
  const router = useRouter();
  return (
    <section id="top" className="relative isolate overflow-hidden">
      <div className="grain-bg" aria-hidden />
      <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-5 pt-20 pb-14 text-center">
        <MetallicLogo size={64} className="mb-7" />
        <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-background/40 px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-foreground-muted backdrop-blur-md">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
          UAE AI PropTech · Decision Intelligence
        </span>

        <h1 className="max-w-4xl font-serif text-5xl leading-[0.98] tracking-tight text-foreground sm:text-6xl md:text-7xl">
          {HEADLINE.map((w, i) => (
            <span
              key={i}
              className="te-word"
              style={{ animationDelay: `${i * 0.07}s` }}
            >
              {w}
              {i < HEADLINE.length - 1 ? "\u00A0" : ""}
            </span>
          ))}
        </h1>

        <p className="mx-auto mt-7 max-w-2xl text-balance text-base leading-relaxed text-foreground-muted md:text-lg">
          Xpand reads land, resident demand, market momentum and real amenities across
          the UAE to show where service gaps are now and where they appear next — then
          turns each gap into a proposal and connects it to the investors and operators
          who can fill it.
        </p>

        <div className="mt-9 flex flex-col items-center gap-3">
          <LiquidMetalButton label="Open the dashboard" onClick={() => router.push("/dashboard")} />
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-foreground-muted">
            Anonymous · no sign-in
          </span>
        </div>

        <dl className="mt-12 grid w-full max-w-3xl grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.k} className="bg-background/80 px-4 py-5">
              <dt className="font-serif text-2xl text-foreground">{s.v}</dt>
              <dd className="mt-1 text-xs text-foreground-muted">{s.k}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
