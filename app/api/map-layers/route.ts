import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

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
  } catch {
    return [];
  }
}

function getDistrictCoords(): Record<string, { lat: number; lng: number }> {
  const rows = parseCSV("districts.csv");
  const map: Record<string, { lat: number; lng: number }> = {};
  for (const r of rows) {
    map[r.district] = { lat: parseFloat(r.latitude), lng: parseFloat(r.longitude) };
  }
  return map;
}

function jitter(base: number, range = 0.012): number {
  return base + (Math.random() - 0.5) * range * 2;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const district = searchParams.get("district");
  const layers = (searchParams.get("layers") || "").split(",").filter(Boolean);

  const districtCoords = getDistrictCoords();
  const result: Record<string, any[]> = {};

  if (layers.includes("amenities")) {
    let rows = parseCSV("osm_amenities.csv");
    if (district) rows = rows.filter((r) => r.district?.toLowerCase() === district.toLowerCase());
    result.amenities = rows.slice(0, 500).map((r) => ({
      id: r.amenity_id,
      lat: parseFloat(r.latitude),
      lng: parseFloat(r.longitude),
      category: r.category,
      subtype: r.subtype,
      name: r.name,
      district: r.district,
    }));
  }

  if (layers.includes("listings")) {
    let rows = parseCSV("sample_listings.csv");
    if (district) rows = rows.filter((r) => r.district?.toLowerCase() === district.toLowerCase());
    result.listings = rows.slice(0, 300).map((r) => ({
      id: r.listing_id,
      lat: parseFloat(r.latitude),
      lng: parseFloat(r.longitude),
      type: r.listing_type,
      propertyType: r.property_type,
      bedrooms: parseInt(r.bedrooms),
      price: parseInt(r.price_aed),
      size: parseInt(r.size_sqm),
      status: r.status,
      district: r.district,
      community: r.community,
      furnished: r.furnished === "true",
    }));
  }

  if (layers.includes("parcels")) {
    let rows = parseCSV("sample_parcels.csv");
    if (district) rows = rows.filter((r) => r.district?.toLowerCase() === district.toLowerCase());
    result.parcels = rows.slice(0, 200).map((r) => {
      const coords = districtCoords[r.district] || { lat: 24.45, lng: 54.65 };
      return {
        id: r.parcel_id,
        lat: jitter(coords.lat),
        lng: jitter(coords.lng),
        zone: r.zone,
        landUse: r.land_use,
        size: parseInt(r.parcel_size_sqm),
        status: r.current_status,
        potential: parseInt(r.development_potential_score),
        value: parseInt(r.estimated_value_aed),
        district: r.district,
      };
    });
  }

  if (layers.includes("transactions")) {
    let rows = parseCSV("sample_transactions.csv");
    if (district) rows = rows.filter((r) => r.district?.toLowerCase() === district.toLowerCase());
    rows = rows.slice(0, 200);
    result.transactions = rows.map((r) => {
      const coords = districtCoords[r.district] || { lat: 24.45, lng: 54.65 };
      return {
        id: r.transaction_id,
        lat: jitter(coords.lat, 0.008),
        lng: jitter(coords.lng, 0.008),
        date: r.date,
        assetType: r.asset_type,
        value: parseInt(r.transaction_value_aed),
        size: parseInt(r.size_sqm),
        pricePerSqm: parseInt(r.price_per_sqm),
        buyerType: r.buyer_type,
        district: r.district,
      };
    });
  }

  if (layers.includes("communities")) {
    let rows = parseCSV("sample_communities.csv");
    if (district) rows = rows.filter((r) => r.district?.toLowerCase() === district.toLowerCase());
    result.communities = rows.map((r) => {
      const coords = districtCoords[r.district] || { lat: 24.45, lng: 54.65 };
      return {
        id: r.community_id,
        lat: jitter(coords.lat, 0.006),
        lng: jitter(coords.lng, 0.006),
        population: parseInt(r.population_estimate),
        occupancy: parseFloat(r.occupancy_rate),
        serviceDemand: parseInt(r.service_demand_index),
        mobility: parseInt(r.mobility_score),
        experience: parseInt(r.resident_experience_score),
        opportunity: r.optimization_opportunity,
        district: r.district,
      };
    });
  }

  if (layers.includes("live")) {
    const apiKey = process.env.UAE_DATA_API_KEY;
    if (apiKey) {
      try {
        const url = `https://uae-data-api.evoost-ai.workers.dev/v1/listings/search?emirate=Abu%20Dhabi&transaction_type=sale&limit=50`;
        const res = await fetch(url, {
          headers: { "x-api-key": apiKey, "Content-Type": "application/json" },
        });
        if (res.ok) {
          const data = await res.json();
          const listings = data.listings || data.results || [];
          result.live = listings
            .filter((l: any) => l.latitude && l.longitude)
            .slice(0, 100)
            .map((l: any, i: number) => ({
              id: `live-${i}`,
              lat: parseFloat(l.latitude),
              lng: parseFloat(l.longitude),
              title: l.title || l.name || "Live listing",
              price: l.price || l.price_aed || 0,
              type: l.transaction_type || "sale",
              area: l.area || l.district || "",
              bedrooms: l.bedrooms || 0,
              size: l.size_sqm || l.built_up_area || 0,
            }));
        } else {
          result.live = [];
        }
      } catch {
        result.live = [];
      }
    } else {
      result.live = [];
    }
  }

  return NextResponse.json(result);
}
