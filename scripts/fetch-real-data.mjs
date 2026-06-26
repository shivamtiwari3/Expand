#!/usr/bin/env node
// Fetches REAL amenity data from OpenStreetMap Overpass API for all 39 UAE districts
// Results saved to /public/uae_real_amenities.json

import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OVERPASS_URL = "https://maps.mail.ru/osm/tools/overpass/api/interpreter";

// Known bounds from community-pulse research [south, west, north, east]
const KNOWN_BOUNDS = {
  "Saadiyat Island": [24.52, 54.38, 24.58, 54.47],
  "Al Maryah Island": [24.49, 54.37, 24.51, 54.41],
  "Yas Island": [24.47, 54.57, 24.52, 54.65],
  "Al Reem Island": [24.48, 54.38, 24.51, 54.42],
  "Khalifa City": [24.39, 54.55, 24.44, 54.64],
  "Mohammed Bin Zayed City": [24.29, 54.50, 24.36, 54.60],
  "Mussafah": [24.32, 54.46, 24.39, 54.55],
  "Al Shamkha": [24.31, 54.68, 24.38, 54.76],
  "Corniche": [24.45, 54.31, 24.49, 54.37],
  "Al Raha Beach": [24.44, 54.55, 24.47, 54.62],
  "Dubai Marina": [25.07, 55.12, 25.10, 55.16],
  "Downtown Dubai": [25.185, 55.26, 25.21, 55.29],
  "Jumeirah Village Circle": [25.04, 55.19, 25.08, 55.23],
  "Business Bay": [25.17, 55.25, 25.20, 55.28],
  "Al Barsha": [25.09, 55.18, 25.13, 55.22],
  "Deira": [25.25, 55.30, 25.29, 55.36],
  "Dubai Silicon Oasis": [25.10, 55.36, 25.14, 55.40],
  "Al Majaz": [25.32, 55.37, 25.36, 55.41],
  "Muwailih": [25.29, 55.43, 25.33, 55.47],
  "Fujairah City": [25.10, 56.30, 25.16, 56.36],
};

// Load districts from xpand-data.json
const dataPath = join(__dirname, "..", "lib", "xpand-data.json");
const xpandData = JSON.parse(readFileSync(dataPath, "utf-8"));
const districts = xpandData.districts.map((d) => ({
  name: d.name,
  emirate: d.emirate,
  lat: d.lat,
  lng: d.lng,
  population: d.population || 50000,
  bounds: KNOWN_BOUNDS[d.name] || [
    d.lat - 0.025,
    d.lng - 0.025,
    d.lat + 0.025,
    d.lng + 0.025,
  ],
}));

console.log(`Loaded ${districts.length} districts from xpand-data.json`);

// Overpass query categories matching Xpand's amenity taxonomy
function buildOverpassQuery(bounds) {
  const [south, west, north, east] = bounds;
  const bbox = `${south},${west},${north},${east}`;

  return `[out:json][timeout:30];
(
  // Education: schools & nurseries
  node["amenity"="school"](${bbox});
  way["amenity"="school"](${bbox});
  node["amenity"="kindergarten"](${bbox});
  way["amenity"="kindergarten"](${bbox});
  node["amenity"="university"](${bbox});
  way["amenity"="university"](${bbox});
  node["amenity"="college"](${bbox});
  way["amenity"="college"](${bbox});

  // Healthcare: clinics & pharmacies
  node["amenity"="hospital"](${bbox});
  way["amenity"="hospital"](${bbox});
  node["amenity"="clinic"](${bbox});
  way["amenity"="clinic"](${bbox});
  node["amenity"="pharmacy"](${bbox});
  node["amenity"="doctors"](${bbox});
  node["amenity"="dentist"](${bbox});
  node["healthcare"](${bbox});

  // Retail: shops & daily retail
  node["shop"="supermarket"](${bbox});
  node["shop"="convenience"](${bbox});
  node["shop"="mall"](${bbox});
  way["shop"="mall"](${bbox});
  node["shop"="grocery"](${bbox});
  node["shop"="bakery"](${bbox});
  node["amenity"="marketplace"](${bbox});
  way["amenity"="marketplace"](${bbox});

  // Mobility: transit & stops
  node["highway"="bus_stop"](${bbox});
  node["amenity"="bus_station"](${bbox});
  way["amenity"="bus_station"](${bbox});
  node["railway"="station"](${bbox});
  way["railway"="station"](${bbox});
  node["railway"="tram_stop"](${bbox});
  node["amenity"="taxi"](${bbox});
  node["amenity"="parking"](${bbox});
  way["amenity"="parking"](${bbox});

  // Community: parks & community space
  node["leisure"="park"](${bbox});
  way["leisure"="park"](${bbox});
  node["leisure"="playground"](${bbox});
  way["leisure"="playground"](${bbox});
  node["leisure"="garden"](${bbox});
  way["leisure"="garden"](${bbox});
  node["amenity"="community_centre"](${bbox});
  way["amenity"="community_centre"](${bbox});
  node["amenity"="place_of_worship"](${bbox});
  way["amenity"="place_of_worship"](${bbox});
  node["amenity"="library"](${bbox});
  way["amenity"="library"](${bbox});
);
out center;`;
}

// Classify OSM element into our categories
function classifyElement(el) {
  const tags = el.tags || {};

  // Education
  if (
    ["school", "kindergarten", "university", "college"].includes(tags.amenity)
  ) {
    return "education";
  }

  // Healthcare
  if (
    ["hospital", "clinic", "pharmacy", "doctors", "dentist"].includes(
      tags.amenity
    ) ||
    tags.healthcare
  ) {
    return "healthcare";
  }

  // Retail
  if (
    ["supermarket", "convenience", "mall", "grocery", "bakery"].includes(
      tags.shop
    ) ||
    tags.amenity === "marketplace"
  ) {
    return "retail";
  }

  // Mobility
  if (
    tags.highway === "bus_stop" ||
    ["bus_station", "taxi", "parking"].includes(tags.amenity) ||
    ["station", "tram_stop"].includes(tags.railway)
  ) {
    return "mobility";
  }

  // Community
  if (
    ["park", "playground", "garden"].includes(tags.leisure) ||
    ["community_centre", "place_of_worship", "library"].includes(tags.amenity)
  ) {
    return "community";
  }

  return null;
}

// Fetch data from Overpass with retries
async function fetchOverpass(query, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(OVERPASS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `data=${encodeURIComponent(query)}`,
      });

      if (response.status === 429 || response.status === 504) {
        console.log(
          `  Rate limited/timeout (${response.status}), waiting ${attempt * 5}s...`
        );
        await sleep(attempt * 5000);
        continue;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.elements || [];
    } catch (err) {
      if (attempt === retries) {
        console.error(`  FAILED after ${retries} attempts: ${err.message}`);
        return [];
      }
      console.log(`  Attempt ${attempt} failed: ${err.message}, retrying...`);
      await sleep(attempt * 3000);
    }
  }
  return [];
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Main execution
async function main() {
  const results = {};
  let totalAmenities = 0;

  console.log(`\nFetching real amenity data for ${districts.length} districts...`);
  console.log("=".repeat(60));

  for (let i = 0; i < districts.length; i++) {
    const district = districts[i];
    const progress = `[${i + 1}/${districts.length}]`;

    console.log(
      `\n${progress} ${district.name} (${district.emirate})`
    );
    console.log(
      `  Bounds: [${district.bounds.map((b) => b.toFixed(4)).join(", ")}]`
    );

    const query = buildOverpassQuery(district.bounds);
    const elements = await fetchOverpass(query);

    // Classify elements into categories
    const categorized = {
      education: [],
      healthcare: [],
      retail: [],
      mobility: [],
      community: [],
    };

    for (const el of elements) {
      const category = classifyElement(el);
      if (category && categorized[category]) {
        const lat = el.lat || el.center?.lat;
        const lng = el.lon || el.center?.lon;
        if (lat && lng) {
          categorized[category].push({
            id: el.id,
            type: el.type,
            lat,
            lng,
            name: el.tags?.name || el.tags?.["name:en"] || null,
            subtype:
              el.tags?.amenity ||
              el.tags?.shop ||
              el.tags?.leisure ||
              el.tags?.highway ||
              el.tags?.railway ||
              el.tags?.healthcare ||
              null,
          });
        }
      }
    }

    const counts = {};
    let districtTotal = 0;
    for (const [cat, items] of Object.entries(categorized)) {
      counts[cat] = items.length;
      districtTotal += items.length;
    }
    totalAmenities += districtTotal;

    console.log(
      `  Found ${districtTotal} amenities: edu=${counts.education} health=${counts.healthcare} retail=${counts.retail} mobility=${counts.mobility} community=${counts.community}`
    );

    results[district.name] = {
      name: district.name,
      emirate: district.emirate,
      lat: district.lat,
      lng: district.lng,
      population: district.population,
      bounds: district.bounds,
      fetchedAt: new Date().toISOString(),
      counts,
      total: districtTotal,
      amenities: categorized,
    };

    // Rate limiting: wait 2s between requests
    if (i < districts.length - 1) {
      await sleep(2000);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log(`DONE! Total amenities fetched: ${totalAmenities}`);
  console.log(`Districts processed: ${Object.keys(results).length}`);

  // Save results
  const outputPath = join(__dirname, "..", "public", "uae_real_amenities.json");
  const output = {
    meta: {
      generatedAt: new Date().toISOString(),
      source: "OpenStreetMap Overpass API",
      districts: Object.keys(results).length,
      totalAmenities,
      categories: ["education", "healthcare", "retail", "mobility", "community"],
    },
    districts: results,
  };

  writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`\nSaved to: ${outputPath}`);

  // Print summary table
  console.log("\n--- Summary ---");
  console.log(
    "District".padEnd(30) +
      "Edu".padStart(5) +
      "Health".padStart(7) +
      "Retail".padStart(7) +
      "Mob".padStart(5) +
      "Comm".padStart(6) +
      "Total".padStart(7)
  );
  console.log("-".repeat(67));
  for (const [name, data] of Object.entries(results)) {
    const c = data.counts;
    console.log(
      name.padEnd(30) +
        String(c.education).padStart(5) +
        String(c.healthcare).padStart(7) +
        String(c.retail).padStart(7) +
        String(c.mobility).padStart(5) +
        String(c.community).padStart(6) +
        String(data.total).padStart(7)
    );
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
