import type {
  District,
  Severity,
  Forecast,
  Category,
  Rfp,
  Venture,
} from "./types";
import { DATA, CATEGORY_LABEL } from "./data";

// ── Gap severity ────────────────────────────────────────────────────
// Combines the worst service shortfall with current demand pressure.
export function severityScore(d: District): number {
  const topShortfall = d.gaps.length ? d.gaps[0].shortfall : 0;
  const zeroCats = d.gaps.filter((g) => g.count === 0).length;
  return topShortfall * 6 + d.demand * 0.6 + zeroCats * 12;
}

export function severity(d: District): Severity {
  const s = severityScore(d);
  if (s >= 80) return "critical";
  if (s >= 50) return "emerging";
  return "ok";
}

export const SEVERITY_LABEL: Record<Severity, string> = {
  ok: "Well served",
  emerging: "Emerging gap",
  critical: "Critical gap",
};

// ── Demand forecaster ───────────────────────────────────────────────
// No listings feed exists in the synthetic data, so we project growth from
// price momentum (transaction trend) + occupancy/population pressure, then
// translate new residents into amenities needed to hold today's service ratio.
const RESIDENTS_PER: Record<Category, number> = {
  education: 6000, // residents per school/nursery
  healthcare: 9000, // per clinic/pharmacy
  retail: 2500, // per daily-retail cluster
  community: 4000, // per park/community space
  mobility: 5000, // per transit node
  services: 7000, // per everyday-service point
};

export function forecast(d: District, horizonMonths = 12): Forecast {
  // momentum (price % change) as a growth proxy, floored so every area grows a little
  const annualGrowth = Math.max(0.012, d.momentum / 100 * 0.45 + 0.02);
  const growthPct = annualGrowth * (horizonMonths / 12);
  const newResidents = Math.round(d.population * growthPct);

  const needs = (Object.keys(RESIDENTS_PER) as Category[]).map((cat) => {
    const current = d.amenityByCat[cat] ?? 0;
    const needed = Math.ceil((d.population + newResidents) / RESIDENTS_PER[cat]);
    return {
      category: cat,
      label: CATEGORY_LABEL[cat],
      current,
      needed,
      add: Math.max(0, needed - current),
    };
  });
  needs.sort((a, b) => b.add - a.add);

  return {
    horizonMonths,
    growthPct: Math.round(growthPct * 1000) / 10,
    newResidents,
    needs,
  };
}

// ── Recommended build sites (the map pins) ──────────────────────────
// Turns a district's worst gaps into concrete points to build, placed in a
// ring around the district centre so each shows up as its own pin on the map.
export interface RecSite {
  id: string;
  district: string;
  category: Category;
  label: string;
  count: number; // how many to build over the next year
  rationale: string;
  lat: number;
  lng: number;
  severity: Severity;
}

export function recommendedSites(d: District, max = 4): RecSite[] {
  const f = forecast(d, 12);
  const addByCat = new Map(f.needs.map((n) => [n.category, n.add]));
  const sev = severity(d);
  const ranked = [...d.gaps]
    .sort(
      (a, b) =>
        (b.count === 0 ? 1 : 0) - (a.count === 0 ? 1 : 0) ||
        b.shortfall - a.shortfall,
    )
    .slice(0, max);

  return ranked.map((g, i) => {
    const angle = (Math.PI * 2 * i) / Math.max(1, ranked.length) + 0.7;
    const radius = 0.016 + (i % 2) * 0.007; // ~1.8–2.5 km in degrees
    const count = addByCat.get(g.category) ?? Math.max(1, Math.round(g.shortfall));
    return {
      id: `${d.name}-${g.category}`,
      district: d.name,
      category: g.category,
      label: g.label,
      count,
      rationale:
        g.count === 0
          ? `No ${g.label.toLowerCase()} on the ground today`
          : `Only ${g.count} today — short by ${g.shortfall}`,
      lat: d.lat + Math.sin(angle) * radius,
      lng: d.lng + Math.cos(angle) * radius,
      severity: sev,
    };
  });
}

// ── Matching ────────────────────────────────────────────────────────
// Ventures whose offering fills a district's top gaps.
export function venturesForDistrict(d: District): Venture[] {
  const needs = new Set(d.gaps.map((g) => g.label));
  const scored = DATA.ventures.map((v) => ({
    v,
    fit: needs.has(v.need) ? 2 : (d.investorsBySector[v.sector] ? 1 : 0),
  }));
  return scored
    .filter((s) => s.fit > 0)
    .sort((a, b) => b.fit - a.fit)
    .map((s) => s.v);
}

export function districtForRfp(id: string): District | undefined {
  const rfp = DATA.rfps.find((r) => r.id === id);
  return rfp ? DATA.districts.find((d) => d.name === rfp.district) : undefined;
}

export function rfpForDistrict(name: string): Rfp | undefined {
  return DATA.rfps.find((r) => r.district === name);
}

// Synthesize an RFP on the fly for districts that don't have a seeded one.
export function makeRfp(d: District): Rfp {
  const existing = rfpForDistrict(d.name);
  if (existing) return existing;
  const top = d.gaps[0];
  return {
    id: `RFP-${d.name.slice(0, 3).toUpperCase()}`,
    district: d.name,
    need: top ? top.label : "mixed amenities",
    category: top ? top.category : "services",
    demand: d.demand,
    vacantParcels: d.vacantTotal,
    matchedInvestors: Object.values(d.investorsBySector).reduce((a, b) => a + b, 0),
    valueBandM: Math.round(Math.max(8, d.baseSale / 1000 * 1.2) * 10) / 10,
  };
}

// Compact, factual grounding string fed to the LLM so explanations stay honest.
export function groundingFor(d: District): string {
  const f = forecast(d, 12);
  const gaps = d.gaps
    .map((g) => `${g.label}: ${g.count} today (shortfall ${g.shortfall})`)
    .join("; ");
  const needs = f.needs
    .filter((n) => n.add > 0)
    .slice(0, 3)
    .map((n) => `${n.add} more ${n.label}`)
    .join(", ");
  return [
    `District: ${d.name} (${d.areaType}, ${d.profile}).`,
    `Population ~${d.population.toLocaleString()}, service demand ${d.demand}/100, mobility ${d.mobility}/100, resident experience ${d.experience}/100.`,
    `Price momentum ${d.momentum}%. Vacant parcels available: ${d.vacantTotal}. Base sale AED ${d.baseSale}/sqm, gross yield ${d.yield}%.`,
    `Service gaps — ${gaps || "none significant"}.`,
    `12-month forecast: +${f.newResidents.toLocaleString()} residents (${f.growthPct}% growth) → needs ${needs || "no new amenities"}.`,
    `Investor interest: ${d.investorsBySector ? Object.entries(d.investorsBySector).map(([k, v]) => `${v} in ${k}`).join(", ") : "none"} (avg fit ${d.investorFit}/100).`,
  ].join(" ");
}
