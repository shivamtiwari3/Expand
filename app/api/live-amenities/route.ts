import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

const OVERPASS_URL = "https://maps.mail.ru/osm/tools/overpass/api/interpreter";

interface DistrictData {
  name: string;
  emirate: string;
  bounds: [number, number, number, number];
}

function loadDistricts(): DistrictData[] {
  try {
    const filePath = join(process.cwd(), "lib", "xpand-data.json");
    const raw = readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw);
    return data.districts.map((d: any) => ({
      name: d.name,
      emirate: d.emirate,
      bounds: [d.lat - 0.025, d.lng - 0.025, d.lat + 0.025, d.lng + 0.025] as [number, number, number, number],
    }));
  } catch {
    return [];
  }
}

function buildOverpassQuery(bounds: [number, number, number, number]): string {
  const [south, west, north, east] = bounds;
  const bbox = `${south},${west},${north},${east}`;

  return `
[out:json][timeout:30];
(
  // Education
  node["amenity"~"school|university|kindergarten"](${bbox});
  way["amenity"~"school|university|kindergarten"](${bbox});
  relation["amenity"~"school|university|kindergarten"](${bbox});
);
out count;

(
  // Healthcare
  node["amenity"~"hospital|clinic|pharmacy|doctors|dentist"](${bbox});
  way["amenity"~"hospital|clinic|pharmacy|doctors|dentist"](${bbox});
  relation["amenity"~"hospital|clinic|pharmacy|doctors|dentist"](${bbox});
);
out count;

(
  // Retail
  node["shop"](${bbox});
  way["shop"](${bbox});
  relation["shop"](${bbox});
);
out count;

(
  // Mobility
  node["highway"="bus_stop"](${bbox});
  node["railway"](${bbox});
  node["amenity"="bus_station"](${bbox});
  way["railway"](${bbox});
  way["amenity"="bus_station"](${bbox});
);
out count;

(
  // Community
  node["leisure"="park"](${bbox});
  way["leisure"="park"](${bbox});
  node["amenity"="community_centre"](${bbox});
  way["amenity"="community_centre"](${bbox});
  node["amenity"="library"](${bbox});
  way["amenity"="library"](${bbox});
  node["amenity"="place_of_worship"](${bbox});
  way["amenity"="place_of_worship"](${bbox});
);
out count;
`;
}

async function queryOverpass(district: DistrictData): Promise<{
  education: number;
  healthcare: number;
  retail: number;
  mobility: number;
  community: number;
}> {
  const query = buildOverpassQuery(district.bounds);

  const response = await fetch(OVERPASS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `data=${encodeURIComponent(query)}`,
  });

  if (!response.ok) {
    throw new Error(`Overpass API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  // The response contains multiple count elements corresponding to each query block
  const counts = data.elements
    ?.filter((el: any) => el.type === "count")
    .map((el: any) => el.tags?.total ? parseInt(el.tags.total, 10) : 0) || [];

  return {
    education: counts[0] || 0,
    healthcare: counts[1] || 0,
    retail: counts[2] || 0,
    mobility: counts[3] || 0,
    community: counts[4] || 0,
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const districtParam = searchParams.get("district");
    const emirateParam = searchParams.get("emirate");

    const allDistricts = loadDistricts();

    if (allDistricts.length === 0) {
      return NextResponse.json(
        { error: "Failed to load district data" },
        { status: 500 }
      );
    }

    // Filter districts based on query params
    let targetDistricts: DistrictData[];

    if (districtParam) {
      targetDistricts = allDistricts.filter(
        (d) => d.name.toLowerCase() === districtParam.toLowerCase()
      );
      if (targetDistricts.length === 0) {
        return NextResponse.json(
          { error: `District "${districtParam}" not found` },
          { status: 404 }
        );
      }
    } else if (emirateParam) {
      targetDistricts = allDistricts.filter(
        (d) => d.emirate.toLowerCase() === emirateParam.toLowerCase()
      );
      if (targetDistricts.length === 0) {
        return NextResponse.json(
          { error: `No districts found for emirate "${emirateParam}"` },
          { status: 404 }
        );
      }
    } else {
      // Default: return all districts
      targetDistricts = allDistricts;
    }

    const results = [];
    const timestamp = new Date().toISOString();

    for (let i = 0; i < targetDistricts.length; i++) {
      const district = targetDistricts[i];

      try {
        const counts = await queryOverpass(district);
        const total =
          counts.education +
          counts.healthcare +
          counts.retail +
          counts.mobility +
          counts.community;

        results.push({
          district: district.name,
          emirate: district.emirate,
          education: counts.education,
          healthcare: counts.healthcare,
          retail: counts.retail,
          mobility: counts.mobility,
          community: counts.community,
          total,
          source: "OpenStreetMap Overpass API (live)",
          timestamp,
        });
      } catch (err: any) {
        results.push({
          district: district.name,
          emirate: district.emirate,
          education: 0,
          healthcare: 0,
          retail: 0,
          mobility: 0,
          community: 0,
          total: 0,
          source: "OpenStreetMap Overpass API (live)",
          timestamp,
          error: err.message || "Query failed",
        });
      }

      // Rate limit: 2s delay between sequential queries (skip after last)
      if (i < targetDistricts.length - 1) {
        await delay(2000);
      }
    }

    // Return single object if querying one district, array otherwise
    if (districtParam && results.length === 1) {
      return NextResponse.json(results[0]);
    }

    return NextResponse.json({
      count: results.length,
      results,
      timestamp,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
