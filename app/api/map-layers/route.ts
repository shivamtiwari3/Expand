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

const EXTRA_AREA_COORDS: Record<string, { lat: number; lng: number }> = {
  "Al Bandar": { lat: 24.455, lng: 54.61 },
  "Al Danah": { lat: 24.49, lng: 54.37 },
  "Al Hudayriat Island": { lat: 24.43, lng: 54.28 },
  "Al Jubail Island": { lat: 24.55, lng: 54.5 },
  "Al Marjan Island": { lat: 25.82, lng: 55.73 },
  "Al Mina": { lat: 24.51, lng: 54.38 },
  "Al Muroor": { lat: 24.45, lng: 54.4 },
  "Al Mushrif": { lat: 24.46, lng: 54.39 },
  "Al Nahyan": { lat: 24.47, lng: 54.37 },
  "Al Raha Gardens": { lat: 24.46, lng: 54.59 },
  "Al Bahia": { lat: 24.54, lng: 54.66 },
  "Al Falah": { lat: 24.38, lng: 54.59 },
  "Baniyas": { lat: 24.54, lng: 54.62 },
  "Fahid Island": { lat: 24.46, lng: 54.34 },
  "Ghantoot": { lat: 24.84, lng: 55.04 },
  "Golf Gardens": { lat: 24.43, lng: 54.58 },
  "Shakhbout City": { lat: 24.36, lng: 54.63 },
  "Shams Abu Dhabi": { lat: 24.49, lng: 54.4 },
  "Al Samha": { lat: 24.4, lng: 54.72 },
  "Al Shahama": { lat: 24.55, lng: 54.63 },
  "Zayed City": { lat: 24.37, lng: 54.5 },
  "Al Zahiyah": { lat: 24.48, lng: 54.36 },
  "Capital Centre": { lat: 24.44, lng: 54.58 },
  "Hydra Village": { lat: 24.48, lng: 54.75 },
  "Madinat Al Riyadh": { lat: 24.36, lng: 54.48 },
  "Sas Al Nakhl": { lat: 24.41, lng: 54.49 },
  "Danet Abu Dhabi": { lat: 24.46, lng: 54.38 },
  "Al Wathba": { lat: 24.22, lng: 54.63 },
};

function getDistrictCoords(): Record<string, { lat: number; lng: number }> {
  const map: Record<string, { lat: number; lng: number }> = { ...EXTRA_AREA_COORDS };
  try {
    const filePath = join(process.cwd(), "lib", "xpand-data.json");
    const raw = readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw);
    for (const d of data.districts) {
      map[d.name] = { lat: d.lat, lng: d.lng };
    }
  } catch {}
  const rows = parseCSV("districts.csv");
  for (const r of rows) {
    if (!map[r.district]) {
      map[r.district] = { lat: parseFloat(r.latitude), lng: parseFloat(r.longitude) };
    }
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
        const allLive: any[] = [];
        for (let page = 1; page <= 5; page++) {
          const url = `https://uae-data-api.evoost-ai.workers.dev/v1/listings/search?emirate=Abu%20Dhabi&limit=100&page=${page}`;
          const res = await fetch(url, {
            headers: { "x-api-key": apiKey, Accept: "application/json" },
          });
          if (!res.ok) break;
          const data = await res.json();
          const items = data.items || [];
          if (!items.length) break;
          allLive.push(...items);
          if (allLive.filter((l: any) => l.area && districtCoords[l.area]).length >= 80) break;
        }
        result.live = allLive
          .filter((l: any) => l.area && districtCoords[l.area])
          .slice(0, 100)
          .map((l: any, i: number) => {
            const coords = districtCoords[l.area];
            return {
              id: l.id || `live-${i}`,
              lat: jitter(coords.lat, 0.015),
              lng: jitter(coords.lng, 0.015),
              title: l.title || "Live listing",
              price: l.price || 0,
              type: l.transaction_type || "sale",
              area: l.area || "",
              bedrooms: l.bedrooms || 0,
              size: l.built_up_area_sqm || 0,
            };
          });
      } catch {
        result.live = [];
      }
    } else {
      result.live = [];
    }
  }

  return NextResponse.json(result);
}
