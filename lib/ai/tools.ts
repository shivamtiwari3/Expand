import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { DATA, DISTRICTS, getDistrict, getLive } from "@/lib/data";
import {
  forecast,
  groundingFor,
  severity,
  SEVERITY_LABEL,
  severityScore,
  venturesForDistrict,
  makeRfp,
} from "@/lib/engine";

// LangChain tools — the AI's typed access to every dataset (districts,
// parcels, communities, transactions, investors, OSM amenities, live listings).

export const districtFactsTool = new DynamicStructuredTool({
  name: "district_facts",
  description:
    "Full computed profile for one district: population, demand, mobility, service gaps, vacant land, momentum, yield and investor interest.",
  schema: z.object({ name: z.string().describe("exact district name") }),
  func: async ({ name }) => {
    const d = getDistrict(name);
    if (!d) return `No district named "${name}".`;
    return `${groundingFor(d)} Overall status: ${SEVERITY_LABEL[severity(d)]}.`;
  },
});

export const rankGapsTool = new DynamicStructuredTool({
  name: "rank_service_gaps",
  description:
    "Rank districts by how underserved they are right now (worst service gaps + highest demand). Use for city-wide questions.",
  schema: z.object({
    limit: z.number().optional().describe("how many districts, default 8"),
    category: z
      .string()
      .optional()
      .describe("optional: filter to one of education/healthcare/retail/community/mobility/services"),
  }),
  func: async ({ limit = 8, category }) => {
    let list = [...DISTRICTS];
    if (category) {
      list = list.filter((d) => d.gaps.some((g) => g.category === category));
      list.sort((a, b) => {
        const ga = a.gaps.find((g) => g.category === category)?.shortfall ?? 0;
        const gb = b.gaps.find((g) => g.category === category)?.shortfall ?? 0;
        return gb - ga;
      });
    } else {
      list.sort((a, b) => severityScore(b) - severityScore(a));
    }
    return list
      .slice(0, limit)
      .map(
        (d) =>
          `${d.name} (${SEVERITY_LABEL[severity(d)]}): missing ${
            d.gaps.map((g) => g.label).join(", ") || "little"
          }; demand ${d.demand}/100; ${d.vacantTotal} vacant parcels.`
      )
      .join("\n");
  },
});

export const forecastTool = new DynamicStructuredTool({
  name: "forecast_demand",
  description:
    "Project a district's population growth over N months and the amenities it will need to keep today's service ratios.",
  schema: z.object({
    name: z.string(),
    horizonMonths: z.number().optional().describe("default 12"),
  }),
  func: async ({ name, horizonMonths = 12 }) => {
    const d = getDistrict(name);
    if (!d) return `No district named "${name}".`;
    const f = forecast(d, horizonMonths);
    const needs = f.needs
      .filter((n) => n.add > 0)
      .map((n) => `${n.add} more ${n.label} (have ${n.current})`)
      .join(", ");
    return `${name}: +${f.newResidents.toLocaleString()} residents in ${horizonMonths} months (${f.growthPct}% growth). Needs: ${needs || "no new amenities"}.`;
  },
});

export const matchTool = new DynamicStructuredTool({
  name: "match_investors_and_ventures",
  description:
    "For a district, return investor interest by sector and the operator/founder ventures whose offering fills its gaps, plus the open RFP.",
  schema: z.object({ name: z.string() }),
  func: async ({ name }) => {
    const d = getDistrict(name);
    if (!d) return `No district named "${name}".`;
    const inv = Object.entries(d.investorsBySector)
      .map(([k, v]) => `${v} ${k}`)
      .join(", ");
    const ventures = venturesForDistrict(d)
      .map((v) => `${v.name} (${v.kind}, seeking ${v.ask})`)
      .join("; ");
    const rfp = makeRfp(d);
    return `Investors interested: ${inv || "few"} (avg fit ${d.investorFit}/100). Ventures that fit: ${ventures || "none yet"}. Open RFP ${rfp.id}: ${rfp.need}, ${rfp.vacantParcels} parcels, ${rfp.matchedInvestors} matched investors.`;
  },
});

export const liveMarketTool = new DynamicStructuredTool({
  name: "live_market",
  description:
    "Real current listings for a district from the eVoost live API snapshot: counts and median sale/rent prices.",
  schema: z.object({ name: z.string() }),
  func: async ({ name }) => {
    const l = getLive(name);
    if (!l) return `No live listings for "${name}".`;
    return `${name} live market: ${l.listings} listings (${l.saleCount} sale, ${l.rentCount} rent). Median sale ${l.medSale ? "AED " + l.medSale.toLocaleString() : "n/a"}${l.medSalePerSqm ? `, ~AED ${l.medSalePerSqm.toLocaleString()}/sqm` : ""}.`;
  },
});

export const TOOLS = [
  districtFactsTool,
  rankGapsTool,
  forecastTool,
  matchTool,
  liveMarketTool,
];

export const cityMeta = () =>
  `Dataset: ${DATA.meta.districts} districts, ${DATA.meta.parcels} parcels, ${DATA.meta.communities} communities, ${DATA.meta.transactions} transactions, ${DATA.meta.investors} investors, ${DATA.meta.amenities} real OSM amenities.`;
