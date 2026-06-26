import { StateGraph, Annotation, START, END } from "@langchain/langgraph";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { k2, extractAnswer, useK2 } from "./model";
import {
  districtFactsTool,
  forecastTool,
  matchTool,
  liveMarketTool,
  rankGapsTool,
  osmAmenitiesTool,
  liveAmenitiesTool,
  propertyListingsTool,
  investorProfilesTool,
  landParcelsTool,
  transactionHistoryTool,
  liveEvoostTool,
  communityMetricsTool,
  cityMeta,
} from "./tools";
import { DISTRICTS, getDistrict, DATA, CATEGORIES } from "@/lib/data";
import { forecast, severity, severityScore, SEVERITY_LABEL, venturesForDistrict } from "@/lib/engine";
import type { Category } from "@/lib/types";

const SYSTEM = new SystemMessage(
  `You are Xpand, an analyst for Abu Dhabi real estate and community planning.
Speak in plain, non-technical language a property owner, planner or investor understands.
Use ONLY the numbers in the provided context — never invent figures, never call synthetic data real market data.
Be concise and concrete: short sentences, no buzzwords, no markdown headers, no lists unless asked.
Reason in at most two short sentences, then give the answer. Wrap the final user-facing answer in <answer></answer> and put nothing else inside the tags.`
);

const CAT_WORDS: Record<string, Category> = {
  school: "education", nurser: "education", educat: "education",
  clinic: "healthcare", hospital: "healthcare", health: "healthcare", pharmac: "healthcare",
  shop: "retail", retail: "retail", store: "retail",
  park: "community", community: "community",
  transit: "mobility", bus: "mobility", metro: "mobility", mobilit: "mobility",
  service: "services",
};

export interface InsightsInput {
  role: string;
  emirate?: string;
  area?: string;
  sectors: Category[];
  budget: string;
}

// ── Graph state ─────────────────────────────────────────────────────
const State = Annotation.Root({
  mode: Annotation<string>,
  district: Annotation<string | undefined>(),
  question: Annotation<string | undefined>(),
  insights: Annotation<InsightsInput | undefined>(),
  context: Annotation<string>({ reducer: (_, b) => b, default: () => "" }),
  answer: Annotation<string>({ reducer: (_, b) => b, default: () => "" }),
  source: Annotation<string>({ reducer: (_, b) => b, default: () => "" }),
});
type S = typeof State.State;

function detectDistrict(q?: string): string | undefined {
  if (!q) return undefined;
  const lo = q.toLowerCase();
  return DISTRICTS.find((d) => lo.includes(d.name.toLowerCase()))?.name;
}
function detectCategory(q?: string): Category | undefined {
  if (!q) return undefined;
  const lo = q.toLowerCase();
  for (const k in CAT_WORDS) if (lo.includes(k)) return CAT_WORDS[k];
  return undefined;
}

// Top gap districts in an emirate for a set of categories (for insights).
function emirateGapSummary(emirate: string | undefined, sectors: Category[]): string {
  const pool = DATA.districts.filter((d) => !emirate || d.emirate === emirate);
  const cats = sectors.length ? sectors : CATEGORIES;
  const lines = cats.map((cat) => {
    const ranked = [...pool]
      .map((d) => ({ d, g: d.gaps.find((x) => x.category === cat) }))
      .filter((x) => x.g)
      .sort((a, b) => (b.g!.shortfall) - (a.g!.shortfall))
      .slice(0, 3);
    if (!ranked.length) return null;
    return `${ranked[0].g!.label}: widest gaps in ${ranked
      .map((x) => `${x.d.name} (${x.d.emirate}, ${x.g!.count} today, demand ${x.d.demand})`)
      .join("; ")}`;
  });
  return lines.filter(Boolean).join("\n");
}

// ── Node: gather context from all datasets via LangChain tools ───────
async function gather(s: S): Promise<Partial<S>> {
  if (s.mode === "insights" && s.insights) {
    const { emirate, area, sectors } = s.insights;
    const parts: string[] = [cityMeta()];
    if (area) {
      const named = getDistrict(area);
      if (named) {
        const [facts, listings, parcels, investors] = await Promise.all([
          districtFactsTool.invoke({ name: named.name }),
          propertyListingsTool.invoke({ district: named.name }),
          landParcelsTool.invoke({ district: named.name }),
          investorProfilesTool.invoke({ district: named.name }),
        ]);
        parts.push(facts, listings, parcels, investors);
      }
    }
    parts.push(emirateGapSummary(emirate, sectors));
    return { context: parts.join("\n") };
  }

  if (s.mode === "district" && s.district) {
    const [facts, fc, match, live, osm, listings, parcels, transactions, community, liveApi] = await Promise.all([
      districtFactsTool.invoke({ name: s.district }),
      forecastTool.invoke({ name: s.district, horizonMonths: 12 }),
      matchTool.invoke({ name: s.district }),
      liveMarketTool.invoke({ name: s.district }),
      osmAmenitiesTool.invoke({ district: s.district }),
      propertyListingsTool.invoke({ district: s.district }),
      landParcelsTool.invoke({ district: s.district }),
      transactionHistoryTool.invoke({ district: s.district }),
      communityMetricsTool.invoke({ district: s.district }),
      liveEvoostTool.invoke({ transaction_type: "sale", limit: 10 }),
    ]);
    return { context: [cityMeta(), facts, fc, match, live, osm, listings, parcels, transactions, community, liveApi].join("\n") };
  }
  // city-wide Q&A
  const cat = detectCategory(s.question);
  const named = detectDistrict(s.question);
  const parts = [cityMeta(), await rankGapsTool.invoke({ limit: 8, category: cat })];
  if (named) {
    const [facts, osm, listings, transactions] = await Promise.all([
      districtFactsTool.invoke({ name: named }),
      osmAmenitiesTool.invoke({ district: named }),
      propertyListingsTool.invoke({ district: named }),
      transactionHistoryTool.invoke({ district: named }),
    ]);
    parts.push(facts, osm, listings, transactions);
  }
  return { context: parts.join("\n") };
}

// ── Rule-based engine responses (fast, no external API) ─────────────
function engineDistrict(name?: string): string {
  const d = name ? getDistrict(name) : undefined;
  if (!d) return "Select a district on the map to see what it needs.";
  const f = forecast(d, 12);
  const top = d.gaps[0];
  const needs = f.needs.filter((n) => n.add > 0).slice(0, 2);
  const ventures = venturesForDistrict(d).slice(0, 2);
  const investors = Object.values(d.investorsBySector).reduce((a, b) => a + b, 0);
  const who =
    ventures.length > 0
      ? ventures.map((v) => v.name).join(" and ")
      : `${investors} interested investors`;

  const s1 = top
    ? `${d.name} (${d.emirate ?? "Abu Dhabi"}) is short on ${top.label} — only ${top.count} on the ground while demand sits at ${d.demand}/100.`
    : `${d.name} is broadly well served today, with demand at ${d.demand}/100.`;

  const s2 = needs.length
    ? `Over the next 12 months expect ~${f.newResidents.toLocaleString()} more residents (${f.growthPct}% growth), needing about ${needs.map((n) => `${n.add} ${n.label}`).join(" and ")}.`
    : `Population should grow about ${f.growthPct}% without major new amenities.`;

  const s3 = `With ${d.vacantTotal} vacant parcels available, ${who} ${ventures.length ? "are" : "is"} well placed to build here.`;

  return [s1, s2, s3].join(" ");
}

function engineQa(question?: string): string {
  const cat = detectCategory(question);
  const pool = cat
    ? DATA.districts.filter((d) => d.gaps.some((g) => g.category === cat))
    : DATA.districts;
  const ranked = [...pool]
    .sort((a, b) => severityScore(b) - severityScore(a))
    .slice(0, 3);
  const top = ranked[0];
  if (!top) return "No major service gaps stand out in the current UAE dataset.";
  const gap = cat ? top.gaps.find((g) => g.category === cat) : top.gaps[0];
  const label = gap?.label ?? "amenities";
  const names = ranked.map((d) => d.name).join(", ");

  return [
    `The widest ${label} gaps right now are in ${names}.`,
    `${top.name} has only ${gap?.count ?? 0} ${label} today with demand at ${top.demand}/100 and ${top.vacantTotal} vacant parcels.`,
    `${Object.values(top.investorsBySector).reduce((a, b) => a + b, 0)} investors already show interest — a strong place to act next.`,
  ].join(" ");
}

function engineInsights(i?: InsightsInput): string {
  if (!i) return engineQa(undefined);
  const pool = DATA.districts.filter((d) => !i.emirate || d.emirate === i.emirate);
  const sectors = i.sectors.length ? i.sectors : CATEGORIES;
  const picks: { d: (typeof DATA.districts)[0]; g: (typeof DATA.districts)[0]["gaps"][0] }[] = [];

  for (const cat of sectors) {
    const best = [...pool]
      .map((d) => ({ d, g: d.gaps.find((x) => x.category === cat)! }))
      .filter((x) => x.g)
      .sort((a, b) => b.g.shortfall - a.g.shortfall)[0];
    if (best) picks.push(best);
  }
  picks.sort((a, b) => b.g.shortfall - a.g.shortfall);
  const top = picks[0];
  const focus = i.area ? i.area : i.emirate || "the UAE";

  if (!top) {
    return [
      `As a ${i.role} focused on ${focus} with a ${i.budget} budget, service coverage looks broadly balanced in your sectors.`,
      `Explore districts on the map where demand exceeds 70/100 for sharper openings.`,
      `This guidance is anonymous — no sign-in and nothing stored.`,
    ].join(" ");
  }

  const second = picks[1];
  return [
    `As a ${i.role} with a ${i.budget} budget in ${focus}, the clearest opening is ${top.d.name}: only ${top.g.count} ${top.g.label} today against demand ${top.d.demand}/100.`,
    second
      ? `${second.d.name} is the next best fit for ${second.g.label} (${second.g.count} today, demand ${second.d.demand}/100).`
      : `${top.d.vacantTotal} vacant parcels are available in ${top.d.name} for development.`,
    `Next step: review open RFPs in these districts or connect with matching ventures on the Community tab. Anonymous — no sign-in required.`,
  ].join(" ");
}

function routeAfterGather(_s: S): "synthesize" | "finalize" {
  return useK2 ? "synthesize" : "finalize";
}

// ── Node: synthesize with K2 (only when XPAND_AI_PROVIDER=k2) ───────
async function synthesize(s: S): Promise<Partial<S>> {
  let task: string;
  if (s.mode === "insights" && s.insights) {
    const { role, emirate, area, sectors, budget } = s.insights;
    const focus = area ? `${area} (${emirate})` : emirate || "the UAE";
    task = `A ${role} is exploring ${sectors.length ? sectors.join(", ") : "any sector"} around ${focus} with a ${budget} budget. Using ONLY the context, give anonymous, practical guidance in 3-4 short sentences: where the biggest service gaps are for their sectors, the one or two specific areas to focus on, and a concrete next step. No sign-in or personal data needed. Put ONLY the guidance inside <answer></answer>.`;
  } else if (s.mode === "district") {
    task = `In 3 short sentences (under 60 words total), tell me what ${s.district} is missing, what should be built, and who should build it. Put ONLY those sentences inside <answer></answer>.`;
  } else {
    task = `Question: ${s.question || "Which districts are most underserved?"}\nAnswer in plain language, naming specific districts and the amenities they lack. Under 70 words. Put ONLY the answer inside <answer></answer>.`;
  }
  try {
    const res = await k2.invoke([
      SYSTEM,
      new HumanMessage(`Context (real computed figures):\n${s.context}\n\n${task}`),
    ]);
    const content = typeof res.content === "string" ? res.content : String(res.content);
    return { answer: extractAnswer(content), source: "k2" };
  } catch (err) {
    console.error("[xpand-ai] K2 call failed:", err instanceof Error ? err.message : err);
    return { answer: "", source: "" };
  }
}

// ── Node: finalize ──────────────────────────────────────────────────
function finalize(s: S): Partial<S> {
  if (s.answer && s.answer.length > 0) return { source: "k2" };
  const text =
    s.mode === "district"
      ? engineDistrict(s.district)
      : s.mode === "insights"
        ? engineInsights(s.insights)
        : engineQa(s.question);
  return { answer: text, source: "engine" };
}

const graph = new StateGraph(State)
  .addNode("gather", gather)
  .addNode("synthesize", synthesize)
  .addNode("finalize", finalize)
  .addEdge(START, "gather")
  .addConditionalEdges("gather", routeAfterGather, {
    synthesize: "synthesize",
    finalize: "finalize",
  })
  .addEdge("synthesize", "finalize")
  .addEdge("finalize", END)
  .compile();

export async function runXpandAI(input: {
  mode: string;
  district?: string;
  question?: string;
  insights?: InsightsInput;
}): Promise<{ text: string; source: string }> {
  const mode =
    input.mode === "qa" ? "qa" : input.mode === "insights" ? "insights" : "district";
  const out = await graph.invoke({
    mode,
    district: input.district,
    question: input.question,
    insights: input.insights,
  });
  return { text: out.answer, source: out.source };
}
