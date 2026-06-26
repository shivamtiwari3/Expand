"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { MetallicLogo } from "@/components/ui/metallic-logo";

const SLIDES = [
  { id: "title" },
  { id: "problem" },
  { id: "solution" },
  { id: "how" },
  { id: "product" },
  { id: "market" },
  { id: "tech" },
  { id: "cta" },
] as const;

const FEATURES = [
  {
    k: "01",
    title: "Gap Detection Engine",
    body: "Scores every area on how well residents are served — education, healthcare, transit, retail.",
  },
  {
    k: "02",
    title: "Demand Forecaster",
    body: "Projects what new residents will need in the next 12 months from price momentum and growth signals.",
  },
  {
    k: "03",
    title: "Proposals, Not Charts",
    body: "Generates RFPs with the need, vacant land, and investors — so a gap becomes something you act on.",
  },
  {
    k: "04",
    title: "K2 AI Copilot",
    body: "Ask in plain language. Get anonymous, tailored insights for your role, area, sectors and budget.",
  },
];

export default function PitchDeck() {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const deckRef = useRef<HTMLDivElement>(null);

  function goTo(index: number) {
    if (index < 0 || index >= SLIDES.length) return;
    setCurrent(index);
  }

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        setCurrent((c) => Math.min(c + 1, SLIDES.length - 1));
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setCurrent((c) => Math.max(c - 1, 0));
      }
      if (e.key === "Escape") {
        router.push("/");
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [router]);

  useEffect(() => {
    let startX = 0;
    function onTouchStart(e: TouchEvent) {
      startX = e.touches[0].clientX;
    }
    function onTouchEnd(e: TouchEvent) {
      const diff = startX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 60) {
        setCurrent((c) =>
          diff > 0
            ? Math.min(c + 1, SLIDES.length - 1)
            : Math.max(c - 1, 0)
        );
      }
    }
    window.addEventListener("touchstart", onTouchStart);
    window.addEventListener("touchend", onTouchEnd);
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  const progressPct = ((current + 1) / SLIDES.length) * 100;

  return (
    <div className="fixed inset-0 bg-background overflow-hidden" ref={deckRef}>
      {/* Grain */}
      <div className="grain-bg fixed inset-0 pointer-events-none" aria-hidden />

      {/* Progress bar */}
      <div
        className="fixed top-0 left-0 h-[2px] z-[200] transition-all duration-400"
        style={{
          width: `${progressPct}%`,
          background: "linear-gradient(90deg, var(--color-accent, #ced7e3), var(--color-foreground, #faf6ee))",
        }}
      />

      {/* Slides */}
      <div className="relative w-full h-full">
        {/* SLIDE 1: Title */}
        <Slide index={0} current={current}>
          <MetallicLogo size={80} className="mb-7" />
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-background/40 px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-foreground-muted backdrop-blur-md">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
            UAE AI PropTech &middot; Decision Intelligence
          </div>
          <h1 className="font-serif text-6xl md:text-8xl tracking-tight text-foreground text-center">
            Xpand
          </h1>
          <p className="mt-4 text-center text-lg md:text-xl text-foreground-muted max-w-2xl">
            See what every area is missing — before it&apos;s missed.
          </p>
          <div className="mt-10 grid w-full max-w-3xl grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-4">
            {[
              { v: "1,200+", k: "districts" },
              { v: "94,000+", k: "real amenities" },
              { v: "88,000+", k: "land parcels" },
              { v: "46,000+", k: "live listings" },
            ].map((s) => (
              <div key={s.k} className="bg-background/80 px-4 py-5 text-center">
                <div className="font-serif text-2xl text-foreground">{s.v}</div>
                <div className="mt-1 text-xs text-foreground-muted">{s.k}</div>
              </div>
            ))}
          </div>
        </Slide>

        {/* SLIDE 2: Problem */}
        <Slide index={1} current={current}>
          <div className="font-mono text-xs uppercase tracking-[0.22em] text-accent">
            The Problem
          </div>
          <h2 className="mt-3 font-serif text-4xl md:text-5xl tracking-tight text-foreground text-center">
            Communities grow.<br />Infrastructure doesn&apos;t keep up.
          </h2>
          <ul className="mt-8 max-w-[700px] w-full space-y-0 divide-y divide-border">
            {[
              { icon: "!", type: "critical" as const, title: "Invisible gaps.", body: "New residents move in, but no one knows the nearest clinic is 40 min away until it's an emergency." },
              { icon: "!", type: "critical" as const, title: "Reactive planning.", body: "Governments build schools after years of overcrowding — not before families arrive." },
              { icon: "?", type: "emerging" as const, title: "Disconnected investors.", body: "Capital is ready, land is available, but no one connects the demand to the opportunity." },
              { icon: "?", type: "emerging" as const, title: "Siloed data.", body: "Land records, population data, amenities, market listings — locked in separate systems across 7 emirates." },
            ].map((p) => (
              <li key={p.title} className="flex items-start gap-4 py-4">
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-lg grid place-items-center text-sm font-semibold ${
                    p.type === "critical"
                      ? "bg-[rgba(217,105,78,0.15)] text-[#d9694e]"
                      : "bg-[rgba(216,177,99,0.15)] text-[#d8b163]"
                  }`}
                >
                  {p.icon}
                </div>
                <div className="text-foreground-muted text-[0.95rem] leading-relaxed">
                  <strong className="text-foreground">{p.title}</strong> {p.body}
                </div>
              </li>
            ))}
          </ul>
        </Slide>

        {/* SLIDE 3: Solution */}
        <Slide index={2} current={current}>
          <div className="font-mono text-xs uppercase tracking-[0.22em] text-accent">
            The Solution
          </div>
          <h2 className="mt-3 font-serif text-4xl md:text-5xl tracking-tight text-foreground text-center">
            From raw data to<br />where to build next.
          </h2>
          <p className="mt-4 text-center text-foreground-muted max-w-xl">
            Xpand is an AI-powered decision intelligence platform that detects service gaps across the UAE, forecasts emerging demand, and turns each gap into an actionable proposal.
          </p>
          <div className="mt-9 grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-[860px] w-full">
            {[
              { n: "01", t: "Detect", b: "Joins land, population, demand & real OpenStreetMap amenities to score every area on how well its residents are served." },
              { n: "02", t: "Forecast", b: "Projects the next 12 months from price momentum and growth, then translates new residents into needed services." },
              { n: "03", t: "Connect", b: "Turns the widest gaps into open RFPs — the need, the vacant land, and the investors already interested." },
            ].map((c) => (
              <div
                key={c.n}
                className="rounded-xl border border-border bg-surface p-7 transition hover:-translate-y-0.5 hover:bg-surface-2 hover:shadow-[0_12px_30px_-10px_rgba(0,0,0,0.5)]"
              >
                <div className="font-mono text-xs text-accent">{c.n}</div>
                <h3 className="mt-2 font-serif text-xl text-foreground">{c.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-foreground-muted">{c.b}</p>
              </div>
            ))}
          </div>
        </Slide>

        {/* SLIDE 4: How It Works */}
        <Slide index={3} current={current}>
          <div className="font-mono text-xs uppercase tracking-[0.22em] text-accent">
            How It Works
          </div>
          <h2 className="mt-3 font-serif text-4xl md:text-5xl tracking-tight text-foreground text-center">
            Four steps. Zero sign-in.
          </h2>
          <div className="mt-12 flex flex-col sm:flex-row items-start gap-0 max-w-[860px] w-full relative">
            <div className="hidden sm:block absolute top-5 left-[60px] right-[60px] h-[1.5px] bg-border" />
            {[
              { n: "01", t: "Ingest", b: "Parcels, transactions, communities, OSM amenities, live listings — unified across 7 emirates." },
              { n: "02", t: "Score", b: "Gap detection engine rates each district by service coverage vs. resident demand." },
              { n: "03", t: "Forecast", b: "Demand forecaster projects 12-month need for schools, clinics, transit, retail." },
              { n: "04", t: "Propose", b: "K2 AI generates proposals, matching gaps to vacant land and ready investors." },
            ].map((s) => (
              <div key={s.n} className="flex-1 text-center px-3 relative">
                <div className="w-10 h-10 rounded-full border-[1.5px] border-accent bg-surface grid place-items-center mx-auto mb-4 relative z-10 font-mono text-xs text-accent">
                  {s.n}
                </div>
                <h4 className="font-serif text-base text-foreground mb-1">{s.t}</h4>
                <p className="text-xs text-foreground-muted leading-relaxed">{s.b}</p>
              </div>
            ))}
          </div>
        </Slide>

        {/* SLIDE 5: Product */}
        <Slide index={4} current={current}>
          <div className="font-mono text-xs uppercase tracking-[0.22em] text-accent">
            Product
          </div>
          <h2 className="mt-3 font-serif text-4xl md:text-5xl tracking-tight text-foreground text-center">
            The intelligence layer<br />for UAE communities.
          </h2>
          <div className="mt-9 grid grid-cols-1 sm:grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border max-w-[800px] w-full">
            {FEATURES.map((f) => (
              <div key={f.k} className="bg-background/80 p-7">
                <div className="font-mono text-xs text-accent">{f.k}</div>
                <h3 className="mt-3 font-serif text-xl text-foreground">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-foreground-muted">{f.body}</p>
              </div>
            ))}
          </div>
          <button
            onClick={() => router.push("/dashboard")}
            className="mt-8 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-5 py-2.5 text-sm text-foreground-muted transition hover:border-accent hover:text-foreground"
          >
            Try it live on the dashboard &rarr;
          </button>
        </Slide>

        {/* SLIDE 6: Market */}
        <Slide index={5} current={current}>
          <div className="font-mono text-xs uppercase tracking-[0.22em] text-accent">
            Market Opportunity
          </div>
          <h2 className="mt-3 font-serif text-4xl md:text-5xl tracking-tight text-foreground text-center">
            The UAE is building<br />at unprecedented scale.
          </h2>
          <p className="mt-4 text-center text-foreground-muted max-w-xl">
            With over $1 trillion in planned real estate development and a population growing 4%+ annually, the gap between where people live and what services exist is widening every month.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-12">
            {[
              { v: "$1T+", l: "Planned RE Development" },
              { v: "7", l: "Emirates Covered" },
              { v: "4%+", l: "Annual Pop. Growth" },
              { v: "$52B", l: "PropTech TAM (MENA)" },
            ].map((m) => (
              <div key={m.l} className="text-center">
                <div className="font-serif text-4xl md:text-5xl text-accent">{m.v}</div>
                <div className="mt-2 text-sm text-foreground-muted">{m.l}</div>
              </div>
            ))}
          </div>
        </Slide>

        {/* SLIDE 7: Tech */}
        <Slide index={6} current={current}>
          <div className="font-mono text-xs uppercase tracking-[0.22em] text-accent">
            Technology
          </div>
          <h2 className="mt-3 font-serif text-4xl md:text-5xl tracking-tight text-foreground text-center">
            Built for speed,<br />grounded in real data.
          </h2>
          <p className="mt-4 text-center text-foreground-muted max-w-xl">
            Every insight is grounded on computed numbers from real datasets — not hallucinated. K2 Think explains, never invents.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-2.5 max-w-[620px]">
            {["Next.js 16", "LangGraph", "LangChain", "MapLibre GL", "OpenStreetMap", "eVoost Data API", "Framer Motion", "K2 Think (AI)", "TypeScript", "Tailwind CSS 4"].map((t) => (
              <span key={t} className="px-3.5 py-1.5 rounded-md bg-surface border border-border text-sm text-foreground-muted transition hover:border-accent hover:text-foreground">
                {t}
              </span>
            ))}
          </div>
          <div className="mt-9 p-6 rounded-xl bg-surface border border-border max-w-[600px] w-full">
            <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-accent mb-2">Data Sources</div>
            <p className="text-sm text-foreground-muted leading-relaxed">
              eVoost / HuggingFace datasets (parcels, communities, transactions, investors) + real OpenStreetMap amenity extract + live UAE property listings via eVoost API.
            </p>
          </div>
        </Slide>

        {/* SLIDE 8: CTA */}
        <Slide index={7} current={current}>
          <MetallicLogo size={72} className="mb-7" />
          <h2 className="font-serif text-4xl md:text-5xl tracking-tight text-foreground text-center">
            Let&apos;s build smarter<br />communities. Together.
          </h2>
          <p className="mt-4 text-center text-foreground-muted max-w-xl">
            Xpand turns fragmented data into a unified intelligence layer — so the next school, clinic, or transit hub gets built where people need it, not where it&apos;s easiest to plan.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="mt-8 inline-flex items-center gap-2.5 rounded-full bg-gradient-to-b from-[#3a3a3a] to-[#1a1a1a] border border-[rgba(206,215,227,0.2)] px-7 py-3.5 text-foreground font-medium transition hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(0,0,0,0.3)] hover:border-[rgba(206,215,227,0.4)]"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-accent"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
            Open the Dashboard
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-accent"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
          <div className="mt-10 text-center">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent mb-2">Built for</div>
            <p className="text-sm text-foreground-muted">
              Abu Dhabi AI PropTech Challenge 2025<br />
              <span className="text-accent">Decision Intelligence Track</span>
            </p>
          </div>
        </Slide>
      </div>

      {/* Navigation */}
      <nav className="fixed bottom-9 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 bg-surface border border-border rounded-full px-4 py-2 backdrop-blur-lg">
        <button
          onClick={() => goTo(current - 1)}
          disabled={current === 0}
          className="w-8 h-8 rounded-full border border-border bg-surface-2 text-foreground grid place-items-center text-sm transition hover:bg-accent hover:text-background hover:border-accent disabled:opacity-30 disabled:pointer-events-none"
          aria-label="Previous slide"
        >
          &larr;
        </button>
        <div className="flex gap-1.5">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`w-[7px] h-[7px] rounded-full transition-all ${
                i === current
                  ? "bg-accent scale-[1.35]"
                  : "bg-border hover:bg-foreground-muted"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
        <button
          onClick={() => goTo(current + 1)}
          disabled={current === SLIDES.length - 1}
          className="w-8 h-8 rounded-full border border-border bg-surface-2 text-foreground grid place-items-center text-sm transition hover:bg-accent hover:text-background hover:border-accent disabled:opacity-30 disabled:pointer-events-none"
          aria-label="Next slide"
        >
          &rarr;
        </button>
      </nav>

      {/* Slide number */}
      <div className="fixed bottom-10 right-14 z-50 font-mono text-xs text-foreground-muted tracking-wide">
        {String(current + 1).padStart(2, "0")} / {String(SLIDES.length).padStart(2, "0")}
      </div>

      {/* Back to home */}
      <button
        onClick={() => router.push("/")}
        className="fixed top-5 left-5 z-50 flex items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-1.5 text-xs text-foreground-muted backdrop-blur-md transition hover:border-accent hover:text-foreground"
      >
        &larr; Back
      </button>
    </div>
  );
}

function Slide({
  index,
  current,
  children,
}: {
  index: number;
  current: number;
  children: React.ReactNode;
}) {
  const isActive = index === current;
  const isPrev = index < current;

  return (
    <div
      className={`absolute inset-0 flex flex-col items-center justify-center px-5 sm:px-20 py-16 transition-all duration-500 ease-out ${
        isActive
          ? "opacity-100 translate-x-0 pointer-events-auto"
          : isPrev
            ? "opacity-0 -translate-x-8 pointer-events-none"
            : "opacity-0 translate-x-8 pointer-events-none"
      }`}
      style={{ zIndex: isActive ? 10 : 1 }}
    >
      {children}
    </div>
  );
}
