"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, MapPin, ScrollText, Sparkles, Users } from "lucide-react";
import { LiquidMetalButton } from "@/components/ui/liquid-metal-button";
import { DATA, LIVE, num } from "@/lib/data";

const DEMO_STEPS = [
  {
    n: "01",
    title: "Scan the map",
    body: "39 districts across 7 emirates — coloured by how underserved residents are today.",
    icon: MapPin,
  },
  {
    n: "02",
    title: "Read the gaps",
    body: "Schools, clinics, transit, retail — scored from real OSM amenities plus challenge datasets.",
    icon: Sparkles,
  },
  {
    n: "03",
    title: "Open an RFP",
    body: "Each critical gap becomes a proposal with land, need and matched investors.",
    icon: ScrollText,
  },
  {
    n: "04",
    title: "Ask K2",
    body: "Plain-language Q&A and an anonymous advisor wizard — grounded on computed numbers.",
    icon: Users,
  },
];

export function DemoFlowSections() {
  const router = useRouter();

  return (
    <>
      {/* Map preview */}
      <section id="map" className="scroll-mt-20 border-t border-border/50 py-20">
        <div className="mx-auto max-w-6xl px-5">
          <SectionIntro
            kicker="Interactive demo"
            title="Every emirate on one map."
            body="Pan from Abu Dhabi to Ras Al Khaimah. Districts pulse by severity; diamond pins mark where Xpand recommends building next."
          />
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            className="relative overflow-hidden rounded-2xl border border-border bg-surface/40"
          >
            <div className="demo-map-preview absolute inset-0 opacity-40" aria-hidden />
            <div className="relative grid gap-px bg-border sm:grid-cols-3">
              {[
                { label: "Critical gaps", v: "12", c: "var(--color-critical)" },
                { label: "Emerging", v: "18", c: "var(--color-emerging)" },
                { label: "Well served", v: "9", c: "var(--color-ok)" },
              ].map((s) => (
                <div key={s.label} className="bg-background/90 px-6 py-8">
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground-muted">
                    {s.label}
                  </div>
                  <div className="mt-2 font-serif text-4xl" style={{ color: s.c }}>
                    {s.v}
                  </div>
                  <div className="mt-1 text-xs text-foreground-muted">districts · live model</div>
                </div>
              ))}
            </div>
            <div className="relative border-t border-border bg-background/80 px-6 py-5 text-sm text-foreground-muted">
              {num(DATA.meta.amenities)} real amenities · {num(DATA.meta.parcels)} parcels ·{" "}
              {num(LIVE.total)} live listings
            </div>
          </motion.div>
        </div>
      </section>

      {/* Gaps */}
      <section id="gaps" className="scroll-mt-20 py-20">
        <div className="mx-auto max-w-6xl px-5">
          <SectionIntro
            kicker="Gap engine"
            title="Not a heatmap — a ranked story per district."
            body="Xpand joins land, population, price momentum and OpenStreetMap amenities. The AI never freelances: every recommendation cites computed gaps and forecast."
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {DEMO_STEPS.map((s, i) => (
              <motion.div
                key={s.n}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                className="rounded-xl border border-border bg-background/60 p-5"
              >
                <s.icon className="size-4 text-accent" />
                <div className="mt-3 font-mono text-xs text-accent">{s.n}</div>
                <h3 className="mt-1 font-serif text-lg text-foreground">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-foreground-muted">{s.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* RFPs */}
      <section id="rfps" className="scroll-mt-20 border-y border-border/50 py-20">
        <div className="mx-auto max-w-6xl px-5">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <SectionIntro
              kicker="Opportunities"
              title="Gaps become proposals."
              body="Open RFPs bundle the service need, vacant parcel options and investors already interested — so planners and funds can move from insight to action in one screen."
              className="mb-0"
            />
            <div className="space-y-3">
              {["School capacity · Al Reem Island", "Primary care · Khalifa City", "Transit hub · Dubai South"].map(
                (r, i) => (
                  <motion.div
                    key={r}
                    initial={{ opacity: 0, x: 16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center justify-between rounded-lg border border-border bg-surface/30 px-4 py-3"
                  >
                    <span className="text-sm text-foreground">{r}</span>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-accent">
                      Open RFP
                    </span>
                  </motion.div>
                ),
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Community */}
      <section id="community" className="scroll-mt-20 py-20">
        <div className="mx-auto max-w-6xl px-5 text-center">
          <SectionIntro
            kicker="Community connect"
            title="Operators matched to district gaps."
            body="Ventures and operators who can fill a gap — surfaced next to the data that explains why they're a fit."
            centered
          />
        </div>
      </section>

      {/* Copilot CTA */}
      <section id="copilot" className="scroll-mt-20 border-t border-border/50 py-20">
        <div className="relative isolate mx-auto max-w-3xl px-5 text-center">
          <div className="grain-bg" aria-hidden />
          <div className="relative z-10">
            <SectionIntro
              kicker="60-second tour"
              title="Walk the demo flow live."
              body="Guided onboarding inside the dashboard — map, gaps, RFPs, K2 chat and advisor wizard. Built for the 3-minute PropTech pitch."
              centered
            />
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <LiquidMetalButton
                label="Start guided tour"
                onClick={() => router.push("/dashboard?tour=1")}
              />
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm text-foreground-muted transition hover:border-accent/50 hover:text-foreground"
              >
                Open dashboard
                <ArrowRight className="size-4" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function SectionIntro({
  kicker,
  title,
  body,
  centered,
  className = "",
}: {
  kicker: string;
  title: string;
  body: string;
  centered?: boolean;
  className?: string;
}) {
  return (
    <div className={`mb-10 ${centered ? "text-center" : ""} ${className}`}>
      <div className="font-mono text-xs uppercase tracking-[0.22em] text-accent">{kicker}</div>
      <h2 className="mt-2 font-serif text-3xl tracking-tight text-foreground md:text-4xl">{title}</h2>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-foreground-muted md:text-base mx-auto">
        {body}
      </p>
    </div>
  );
}
