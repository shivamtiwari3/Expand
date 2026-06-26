/**
 * Server-side CSV data loading and querying utilities.
 * Loads CSVs from public/data/ and provides typed query functions.
 */
import { readFileSync } from "fs";
import { join } from "path";

// ── CSV Parser ──────────────────────────────────────────────────────────
function parseCSV(filename: string): Record<string, string>[] {
  try {
    const filePath = join(process.cwd(), "public", "data", filename);
    const raw = readFileSync(filePath, "utf-8");
    const lines = raw.trim().split("\n");
    if (lines.length < 2) return [];
    const headers = lines[0].split(",").map((h) => h.trim());
    return lines.slice(1).map((line) => {
      const values = line.split(",").map((v) => v.trim());
      const row: Record<string, string> = {};
      headers.forEach((h, i) => {
        row[h] = values[i] || "";
      });
      return row;
    });
  } catch (err) {
    console.error(`[csv-data] Failed to load ${filename}:`, err);
    return [];
  }
}

// ── Lazy-loaded caches ──────────────────────────────────────────────────
let _osmAmenities: Record<string, string>[] | null = null;
let _listings: Record<string, string>[] | null = null;
let _investors: Record<string, string>[] | null = null;
let _parcels: Record<string, string>[] | null = null;
let _transactions: Record<string, string>[] | null = null;

function getOsmAmenities() {
  if (!_osmAmenities) _osmAmenities = parseCSV("osm_amenities.csv");
  return _osmAmenities;
}
function getListings() {
  if (!_listings) _listings = parseCSV("sample_listings.csv");
  return _listings;
}
function getInvestors() {
  if (!_investors) _investors = parseCSV("sample_investors.csv");
  return _investors;
}
function getParcels() {
  if (!_parcels) _parcels = parseCSV("sample_parcels.csv");
  return _parcels;
}
function getTransactions() {
  if (!_transactions) _transactions = parseCSV("sample_transactions.csv");
  return _transactions;
}

// ── Query Functions ─────────────────────────────────────────────────────

/** Count OSM amenities by district and/or category */
export function queryOsmAmenities(filters: {
  district?: string;
  category?: string;
}): { total: number; byCategory: Record<string, number>; byDistrict: Record<string, number> } {
  let rows = getOsmAmenities();
  if (filters.district) {
    const d = filters.district.toLowerCase();
    rows = rows.filter((r) => r.district?.toLowerCase() === d);
  }
  if (filters.category) {
    const c = filters.category.toLowerCase();
    rows = rows.filter((r) => r.category?.toLowerCase() === c);
  }
  const byCategory: Record<string, number> = {};
  const byDistrict: Record<string, number> = {};
  for (const r of rows) {
    byCategory[r.category] = (byCategory[r.category] || 0) + 1;
    byDistrict[r.district] = (byDistrict[r.district] || 0) + 1;
  }
  return { total: rows.length, byCategory, byDistrict };
}

/** Query property listings with filters */
export function queryListings(filters: {
  district?: string;
  listing_type?: string;
  property_type?: string;
  min_price?: number;
  max_price?: number;
  limit?: number;
}): { total: number; results: Record<string, string>[]; avgPrice: number; medianPrice: number } {
  let rows = getListings();
  if (filters.district) {
    const d = filters.district.toLowerCase();
    rows = rows.filter((r) => r.district?.toLowerCase() === d);
  }
  if (filters.listing_type) {
    rows = rows.filter((r) => r.listing_type === filters.listing_type);
  }
  if (filters.property_type) {
    rows = rows.filter((r) => r.property_type === filters.property_type);
  }
  if (filters.min_price) {
    rows = rows.filter((r) => Number(r.price_aed) >= filters.min_price!);
  }
  if (filters.max_price) {
    rows = rows.filter((r) => Number(r.price_aed) <= filters.max_price!);
  }
  const total = rows.length;
  const prices = rows.map((r) => Number(r.price_aed)).filter((p) => p > 0).sort((a, b) => a - b);
  const avgPrice = prices.length ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0;
  const medianPrice = prices.length ? prices[Math.floor(prices.length / 2)] : 0;
  const limit = filters.limit || 10;
  return { total, results: rows.slice(0, limit), avgPrice, medianPrice };
}

/** Query investor profiles */
export function queryInvestors(filters: {
  sector?: string;
  district?: string;
  risk_profile?: string;
}): { total: number; results: Record<string, string>[]; bySector: Record<string, number> } {
  let rows = getInvestors();
  if (filters.sector) {
    const s = filters.sector.toLowerCase();
    rows = rows.filter((r) => r.preferred_sector?.toLowerCase() === s);
  }
  if (filters.district) {
    const d = filters.district.toLowerCase();
    rows = rows.filter((r) => r.preferred_district?.toLowerCase() === d);
  }
  if (filters.risk_profile) {
    rows = rows.filter((r) => r.risk_profile === filters.risk_profile);
  }
  const bySector: Record<string, number> = {};
  for (const r of rows) {
    bySector[r.preferred_sector] = (bySector[r.preferred_sector] || 0) + 1;
  }
  return { total: rows.length, results: rows.slice(0, 20), bySector };
}

/** Query land parcels */
export function queryParcels(filters: {
  district?: string;
  status?: string;
  land_use?: string;
}): { total: number; results: Record<string, string>[]; byStatus: Record<string, number>; byUse: Record<string, number> } {
  let rows = getParcels();
  if (filters.district) {
    const d = filters.district.toLowerCase();
    rows = rows.filter((r) => r.district?.toLowerCase() === d);
  }
  if (filters.status) {
    rows = rows.filter((r) => r.current_status === filters.status);
  }
  if (filters.land_use) {
    rows = rows.filter((r) => r.land_use === filters.land_use);
  }
  const byStatus: Record<string, number> = {};
  const byUse: Record<string, number> = {};
  for (const r of rows) {
    byStatus[r.current_status] = (byStatus[r.current_status] || 0) + 1;
    byUse[r.land_use] = (byUse[r.land_use] || 0) + 1;
  }
  return { total: rows.length, results: rows.slice(0, 15), byStatus, byUse };
}

/** Query transaction history */
export function queryTransactions(filters: {
  district?: string;
  asset_type?: string;
  start_date?: string;
  end_date?: string;
}): { total: number; totalValue: number; avgPrice: number; results: Record<string, string>[]; byType: Record<string, number> } {
  let rows = getTransactions();
  if (filters.district) {
    const d = filters.district.toLowerCase();
    rows = rows.filter((r) => r.district?.toLowerCase() === d);
  }
  if (filters.asset_type) {
    rows = rows.filter((r) => r.asset_type === filters.asset_type);
  }
  if (filters.start_date) {
    rows = rows.filter((r) => r.date >= filters.start_date!);
  }
  if (filters.end_date) {
    rows = rows.filter((r) => r.date <= filters.end_date!);
  }
  const byType: Record<string, number> = {};
  let totalValue = 0;
  for (const r of rows) {
    byType[r.asset_type] = (byType[r.asset_type] || 0) + 1;
    totalValue += Number(r.transaction_value_aed) || 0;
  }
  const avgPrice = rows.length ? Math.round(totalValue / rows.length) : 0;
  return { total: rows.length, totalValue, avgPrice, results: rows.slice(0, 15), byType };
}
