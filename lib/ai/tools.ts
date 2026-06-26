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
import {
  queryOsmAmenities,
  queryListings,
  queryInvestors,
  queryParcels,
  queryTransactions,
} from "@/lib/csv-data";

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

// ── New data tools: real OSM amenities, listings, investors, parcels, transactions ──

export const osmAmenitiesTool = new DynamicStructuredTool({
  name: "osm_amenities",
  description:
    "Query the real OpenStreetMap amenities dataset (3155 POIs). Returns counts by district and/or category (education, healthcare, retail, community, mobility).",
  schema: z.object({
    district: z.string().optional().describe("filter by district name"),
    category: z
      .string()
      .optional()
      .describe("filter by category: education, healthcare, retail, community, mobility"),
  }),
  func: async ({ district, category }) => {
    const result = queryOsmAmenities({ district, category });
    if (result.total === 0)
      return `No OSM amenities found${district ? ` in ${district}` : ""}${category ? ` for ${category}` : ""}.`;
    const catSummary = Object.entries(result.byCategory)
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ");
    const distSummary = Object.entries(result.byDistrict)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ");
    return `Total: ${result.total} amenities. By category: ${catSummary}. Top districts: ${distSummary}.`;
  },
});

export const liveAmenitiesTool = new DynamicStructuredTool({
  name: "live_amenities",
  description:
    "Fetch LIVE real-time amenity counts from OpenStreetMap Overpass API for a specific district. Returns current education, healthcare, retail, mobility, community counts.",
  schema: z.object({
    district: z.string().describe("exact district name to query live"),
  }),
  func: async ({ district }) => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
      const res = await fetch(
        `${baseUrl}/api/live-amenities?district=${encodeURIComponent(district)}`
      );
      if (!res.ok) return `Live amenities API returned ${res.status} for "${district}".`;
      const data = await res.json();
      return `Live OSM data for ${district}: education=${data.education}, healthcare=${data.healthcare}, retail=${data.retail}, mobility=${data.mobility}, community=${data.community}, total=${data.total}. Source: ${data.source}, fetched ${data.timestamp}.`;
    } catch (err: any) {
      return `Failed to fetch live amenities for "${district}": ${err.message}`;
    }
  },
});

export const propertyListingsTool = new DynamicStructuredTool({
  name: "property_listings",
  description:
    "Query the property listings dataset (6000 listings). Filter by district, listing type (sale/rent), property type, price range. Returns count, average and median prices.",
  schema: z.object({
    district: z.string().optional().describe("filter by district name"),
    listing_type: z
      .string()
      .optional()
      .describe("sale or rent"),
    property_type: z
      .string()
      .optional()
      .describe("apartment, villa, townhouse, studio, penthouse, etc."),
    min_price: z.number().optional().describe("minimum price in AED"),
    max_price: z.number().optional().describe("maximum price in AED"),
  }),
  func: async ({ district, listing_type, property_type, min_price, max_price }) => {
    const result = queryListings({ district, listing_type, property_type, min_price, max_price, limit: 5 });
    if (result.total === 0)
      return `No listings found matching the criteria.`;
    const sample = result.results
      .slice(0, 3)
      .map(
        (r) =>
          `${r.property_type} in ${r.district} (${r.listing_type}): AED ${Number(r.price_aed).toLocaleString()}, ${r.size_sqm}sqm, ${r.bedrooms}BR`
      )
      .join("; ");
    return `Found ${result.total} listings. Avg price: AED ${result.avgPrice.toLocaleString()}, Median: AED ${result.medianPrice.toLocaleString()}. Sample: ${sample}.`;
  },
});

export const investorProfilesTool = new DynamicStructuredTool({
  name: "investor_profiles",
  description:
    "Query investor profiles (200 investors). Filter by preferred sector, district, or risk profile (conservative/balanced/aggressive).",
  schema: z.object({
    sector: z.string().optional().describe("preferred sector: residential, commercial, industrial, mixed_use, hospitality, retail"),
    district: z.string().optional().describe("preferred district"),
    risk_profile: z.string().optional().describe("conservative, balanced, or aggressive"),
  }),
  func: async ({ sector, district, risk_profile }) => {
    const result = queryInvestors({ sector, district, risk_profile });
    if (result.total === 0) return `No investors found matching the criteria.`;
    const sectorSummary = Object.entries(result.bySector)
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ");
    const sample = result.results
      .slice(0, 3)
      .map((r) => `${r.investor_type} (${r.preferred_sector}, ${r.capital_range_aed}, ${r.risk_profile})`)
      .join("; ");
    return `Found ${result.total} investors. By sector: ${sectorSummary}. Sample: ${sample}.`;
  },
});

export const landParcelsTool = new DynamicStructuredTool({
  name: "land_parcels",
  description:
    "Query land parcels (600 parcels). Filter by district, status (vacant/under_development/developed), or land use (residential/commercial/industrial/mixed_use).",
  schema: z.object({
    district: z.string().optional().describe("filter by district"),
    status: z.string().optional().describe("vacant, under_development, or developed"),
    land_use: z.string().optional().describe("residential, commercial, industrial, or mixed_use"),
  }),
  func: async ({ district, status, land_use }) => {
    const result = queryParcels({ district, status, land_use });
    if (result.total === 0) return `No parcels found matching the criteria.`;
    const statusSummary = Object.entries(result.byStatus).map(([k, v]) => `${k}: ${v}`).join(", ");
    const useSummary = Object.entries(result.byUse).map(([k, v]) => `${k}: ${v}`).join(", ");
    const sample = result.results
      .slice(0, 3)
      .map((r) => `${r.parcel_id} in ${r.district}: ${r.land_use}, ${r.current_status}, ${r.parcel_size_sqm}sqm, est AED ${Number(r.estimated_value_aed).toLocaleString()}`)
      .join("; ");
    return `Found ${result.total} parcels. By status: ${statusSummary}. By use: ${useSummary}. Sample: ${sample}.`;
  },
});

export const transactionHistoryTool = new DynamicStructuredTool({
  name: "transaction_history",
  description:
    "Query real estate transaction history (5000 transactions). Filter by district, asset type (apartment/villa/townhouse/land/commercial), or date range.",
  schema: z.object({
    district: z.string().optional().describe("filter by district"),
    asset_type: z.string().optional().describe("apartment, villa, townhouse, land, or commercial"),
    start_date: z.string().optional().describe("start date (YYYY-MM-DD)"),
    end_date: z.string().optional().describe("end date (YYYY-MM-DD)"),
  }),
  func: async ({ district, asset_type, start_date, end_date }) => {
    const result = queryTransactions({ district, asset_type, start_date, end_date });
    if (result.total === 0) return `No transactions found matching the criteria.`;
    const typeSummary = Object.entries(result.byType).map(([k, v]) => `${k}: ${v}`).join(", ");
    return `Found ${result.total} transactions. Total value: AED ${result.totalValue.toLocaleString()}, Avg: AED ${result.avgPrice.toLocaleString()}. By type: ${typeSummary}.`;
  },
});

export const liveEvoostTool = new DynamicStructuredTool({
  name: "live_evoost_listings",
  description:
    "Fetch LIVE real-time property listings from the eVoost UAE Data API. Returns actual scraped data from property portals. Use for current market prices and live supply information.",
  schema: z.object({
    transaction_type: z.string().optional().describe("sale or rent, default sale"),
    limit: z.number().optional().describe("max results, default 20"),
  }),
  func: async ({ transaction_type = "sale", limit = 20 }) => {
    const apiKey = process.env.UAE_DATA_API_KEY;
    if (!apiKey) return "Live eVoost API not configured (no API key).";
    try {
      const url = `https://uae-data-api.evoost-ai.workers.dev/v1/listings/search?emirate=Abu%20Dhabi&transaction_type=${transaction_type}&limit=${limit}`;
      const res = await fetch(url, {
        headers: { "x-api-key": apiKey, "Content-Type": "application/json" },
      });
      if (!res.ok) return `eVoost API error: ${res.status}`;
      const data = await res.json();
      const listings = data.listings || data.results || [];
      if (!listings.length) return "No live listings returned from eVoost API.";
      const summary = listings.slice(0, 5).map((l: any) =>
        `${l.title || l.name || "Listing"}: AED ${(l.price || l.price_aed || 0).toLocaleString()}, ${l.bedrooms || "?"}BR, ${l.area || l.district || "??"}`
      ).join("; ");
      return `Live eVoost API: ${listings.length} ${transaction_type} listings in Abu Dhabi. Samples: ${summary}. Data is real/scraped — may have mislabeled types or null fields.`;
    } catch (err: any) {
      return `Failed to query eVoost API: ${err.message}`;
    }
  },
});

export const communityMetricsTool = new DynamicStructuredTool({
  name: "community_metrics",
  description:
    "Query community-level quality-of-life metrics (90 communities). Returns population, occupancy rate, service demand, mobility score, resident experience, and optimization opportunities.",
  schema: z.object({
    district: z.string().optional().describe("filter by district name"),
  }),
  func: async ({ district }) => {
    const rows = (() => {
      const all = parseCSVForTool("sample_communities.csv");
      if (!district) return all;
      return all.filter((r) => r.district?.toLowerCase() === district.toLowerCase());
    })();
    if (!rows.length) return `No community data found${district ? ` for ${district}` : ""}.`;
    const totalPop = rows.reduce((s, r) => s + (parseInt(r.population_estimate) || 0), 0);
    const avgDemand = Math.round(rows.reduce((s, r) => s + (parseInt(r.service_demand_index) || 0), 0) / rows.length);
    const avgMobility = Math.round(rows.reduce((s, r) => s + (parseInt(r.mobility_score) || 0), 0) / rows.length);
    const avgExp = Math.round(rows.reduce((s, r) => s + (parseInt(r.resident_experience_score) || 0), 0) / rows.length);
    const opportunities = rows.map((r) => r.optimization_opportunity).filter(Boolean);
    const topOps = [...new Set(opportunities)].slice(0, 5).join(", ");
    return `${rows.length} communities${district ? ` in ${district}` : ""}. Total pop: ${totalPop.toLocaleString()}. Avg service demand: ${avgDemand}/100, mobility: ${avgMobility}/100, resident experience: ${avgExp}/100. Top optimization opportunities: ${topOps || "N/A"}.`;
  },
});

function parseCSVForTool(filename: string): Record<string, string>[] {
  const { readFileSync } = require("fs");
  const { join } = require("path");
  try {
    const filePath = join(process.cwd(), "public", "data", filename);
    const raw = readFileSync(filePath, "utf-8");
    const lines = raw.trim().split("\n");
    if (lines.length < 2) return [];
    const headers = lines[0].split(",").map((h: string) => h.trim());
    return lines.slice(1).map((line: string) => {
      const values = line.split(",").map((v: string) => v.trim());
      const row: Record<string, string> = {};
      headers.forEach((h: string, i: number) => { row[h] = values[i] || ""; });
      return row;
    });
  } catch { return []; }
}

export const TOOLS = [
  districtFactsTool,
  rankGapsTool,
  forecastTool,
  matchTool,
  liveMarketTool,
  osmAmenitiesTool,
  liveAmenitiesTool,
  propertyListingsTool,
  investorProfilesTool,
  landParcelsTool,
  transactionHistoryTool,
  liveEvoostTool,
  communityMetricsTool,
];

export const cityMeta = () =>
  `Dataset: ${DATA.meta.districts} districts, ${DATA.meta.parcels} parcels, ${DATA.meta.communities} communities, ${DATA.meta.transactions} transactions, ${DATA.meta.investors} investors, ${DATA.meta.amenities} real OSM amenities. Plus live eVoost API (real scraped listings) and live OSM Overpass API.`;
