import { XpandHeader } from "@/components/marketing/xpand-header";
import { XpandHero } from "@/components/marketing/xpand-hero";
import { CtaDashboard } from "@/components/marketing/cta-dashboard";
import { DemoFlowSections } from "@/components/marketing/demo-flow-sections";
import { LIVE, DATA } from "@/lib/data";

const FEATURES = [
  {
    k: "01",
    title: "Gap detection engine",
    body: "Joins land, population, demand and real OpenStreetMap amenities to score every area on how well its residents are served right now.",
  },
  {
    k: "02",
    title: "Demand forecaster",
    body: "Projects the next 12 months from price momentum and growth, then translates new residents into the schools, clinics, transit and retail each area will need.",
  },
  {
    k: "03",
    title: "Proposals, not just charts",
    body: "Turns the widest gaps into open RFPs — the need, the vacant land, and the investors already interested — so a gap becomes something you can act on.",
  },
  {
    k: "04",
    title: "K2 plans with you",
    body: "Ask K2 in plain language, or get anonymous, tailored insights for your role, area, sectors and budget — no sign-in, nothing stored.",
  },
];

export default function Home() {
  return (
    <>
      <XpandHeader />
      <main className="w-full">
        <XpandHero />

        {/* Features */}
        <section className="mx-auto max-w-6xl px-5 py-20">
          <div className="mb-10 text-center">
            <div className="font-mono text-xs uppercase tracking-[0.22em] text-accent">
              How Xpand works
            </div>
            <h2 className="mt-2 font-serif text-3xl tracking-tight text-foreground md:text-4xl">
              From raw data to where to build next.
            </h2>
          </div>
          <div className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2">
            {FEATURES.map((f) => (
              <div key={f.k} className="bg-background/80 p-7">
                <div className="font-mono text-xs text-accent">{f.k}</div>
                <h3 className="mt-3 font-serif text-xl text-foreground">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-foreground-muted">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        <DemoFlowSections />

        {/* CTA */}
        <section className="relative isolate overflow-hidden border-t border-border/50">
          <div className="grain-bg" aria-hidden />
          <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center px-5 py-24 text-center">
            <h2 className="font-serif text-4xl tracking-tight text-foreground md:text-5xl">
              Explore the whole UAE on the map.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-foreground-muted">
              Zoom from Abu Dhabi to Ras Al Khaimah, see service gaps light up by urgency, and let
              K2 show you exactly where to build.
            </p>
            <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row">
              <CtaDashboard />
              <a
                href="/dashboard?tour=1"
                className="text-sm text-foreground-muted underline-offset-4 transition hover:text-foreground hover:underline"
              >
                Or take the 60s guided tour →
              </a>
            </div>
          </div>
        </section>

        <footer className="mx-auto max-w-6xl px-5 py-10 text-xs leading-relaxed text-foreground-muted">
          <p>
            Built for the Abu Dhabi AI PropTech Challenge. Abu Dhabi figures aggregate the
            challenge&apos;s datasets (eVoost / HuggingFace{" "}
            <span className="font-mono">eVoost/abu-dhabi-ai-proptech-challenge</span> — parcels,
            communities, transactions, investors) joined with the real OpenStreetMap amenity
            extract, plus live listings via the eVoost UAE data API (snapshot {LIVE.fetchedAt}).
            Coverage for Dubai, Sharjah, Ajman, Umm Al Quwain, Ras Al Khaimah and Fujairah uses the
            same schema with indicative figures (real coordinates, modelled metrics) and is marked
            synthetic. {DATA.meta.districts} areas across 7 emirates. AI explanations by K2 Think,
            grounded on the computed numbers.
          </p>
        </footer>
      </main>
    </>
  );
}
