// Shared types for the Xpand dashboard. All aggregates are precomputed in
// lib/xpand-data.json from the challenge sample CSVs (joined on district)
// plus the real OSM amenity extract. See xpand/build_data.py.

export type Category =
  | "education"
  | "healthcare"
  | "retail"
  | "community"
  | "mobility"
  | "services";

export interface Gap {
  category: Category;
  label: string;
  count: number;
  shortfall: number;
}

export interface VacantUse {
  count: number;
  avgPotential: number;
  avgValueM: number;
}

export interface District {
  name: string;
  emirate?: string; // grouping; non-AD entries are indicative (see `synthetic`)
  synthetic?: boolean; // true = plausible/indicative figures, not from the AD challenge feed
  areaType: string;
  profile: string;
  baseSale: number;
  yield: number;
  infra: number;
  lat: number;
  lng: number;
  x: number; // normalized 0..1 (lng)
  y: number; // normalized 0..1 (inverted lat, top=north)
  established: number;
  population: number;
  vacantTotal: number;
  vacantByUse: Record<string, VacantUse>;
  demand: number;
  mobility: number;
  experience: number;
  momentum: number;
  amenities: number;
  amenityByCat: Record<Category, number>;
  gaps: Gap[];
  investorsBySector: Record<string, number>;
  investorFit: number;
}

export interface Rfp {
  id: string;
  district: string;
  need: string;
  category: Category;
  demand: number;
  vacantParcels: number;
  matchedInvestors: number;
  valueBandM: number;
}

export interface Venture {
  name: string;
  founder: string;
  kind: string;
  sector: string;
  ask: string;
  need: string;
}

export interface XpandData {
  meta: Record<string, number>;
  categoryLabel: Record<Category, string>;
  sectorUse: Record<string, string>;
  districts: District[];
  rfps: Rfp[];
  ventures: Venture[];
}

export interface LiveDistrict {
  listings: number;
  saleCount: number;
  rentCount: number;
  medSale: number;
  medRent: number;
  medSalePerSqm: number;
  samples: { title: string; type: string; price: number; ptype: string }[];
}

export interface LiveSnapshot {
  fetchedAt: string;
  total: number;
  districts: Record<string, LiveDistrict>;
}

export type Severity = "ok" | "emerging" | "critical";

export interface Forecast {
  horizonMonths: number;
  growthPct: number;
  newResidents: number;
  needs: { category: Category; label: string; current: number; needed: number; add: number }[];
}
