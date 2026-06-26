// Extend the Abu Dhabi challenge dataset with indicative entries for the rest
// of the UAE, using the SAME schema (lib/types.ts) and the SAME gap math as
// build_data.py (shortfall = max(0, city_median_per100k - per100k)). Non-AD
// figures are marked synthetic:true and emirate-tagged. Idempotent: re-running
// strips previously-added synthetic districts first.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_PATH = path.join(__dirname, "..", "lib", "xpand-data.json");

const data = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
const CATS = Object.keys(data.categoryLabel); // education, healthcare, retail, community, mobility, services
const LABEL = data.categoryLabel;

// keep only the original (non-synthetic) districts → idempotent
data.districts = data.districts.filter((d) => !d.synthetic);

// tag the originals as Abu Dhabi
for (const d of data.districts) if (!d.emirate) d.emirate = "Abu Dhabi";

// city-median per-100k per category, from the real AD districts
const medianPc = {};
for (const c of CATS) {
  const pcs = data.districts
    .map((d) => (d.amenityByCat[c] / (d.population || 1)) * 1e5)
    .sort((a, b) => a - b);
  medianPc[c] = pcs[Math.floor(pcs.length / 2)] || 0;
}

// deterministic PRNG so runs are stable
function rng(seedStr) {
  let h = 2166136261;
  for (let i = 0; i < seedStr.length; i++) {
    h ^= seedStr.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const ri = (r, a, b) => Math.round(a + (b - a) * r());
const rf = (r, a, b, d = 1) => Math.round((a + (b - a) * r()) * 10 ** d) / 10 ** d;

const USES = ["residential", "mixed_use", "community", "commercial", "hospitality", "industrial"];
const SECTORS = ["residential", "commercial", "mixed_use", "industrial", "logistics", "hospitality", "community"];

// emirate → price band + areas (real lat/lng)
const EMIRATES = {
  Dubai: { sale: [12000, 22000], areas: [
    ["Downtown Dubai", 25.197, 55.274, "central", "premium"],
    ["Dubai Marina", 25.08, 55.14, "waterfront", "leisure"],
    ["Business Bay", 25.187, 55.263, "central", "business"],
    ["Jumeirah Village Circle", 25.06, 55.207, "mainland", "affordable"],
    ["Deira", 25.271, 55.317, "central", "heritage"],
    ["Dubai Silicon Oasis", 25.121, 55.378, "mainland", "tech"],
    ["Al Barsha", 25.111, 55.196, "mainland", "family"],
  ]},
  Sharjah: { sale: [6000, 9500], areas: [
    ["Al Majaz", 25.327, 55.383, "waterfront", "family"],
    ["Muwailih", 25.302, 55.48, "mainland", "affordable"],
    ["Al Khan", 25.327, 55.363, "coastal", "family"],
  ]},
  Ajman: { sale: [4500, 7000], areas: [
    ["Al Nuaimiya", 25.398, 55.479, "central", "affordable"],
    ["Ajman Corniche", 25.411, 55.435, "waterfront", "leisure"],
  ]},
  "Umm Al Quwain": { sale: [3800, 6000], areas: [
    ["UAQ Marina", 25.563, 55.659, "waterfront", "leisure"],
    ["Al Salamah", 25.546, 55.553, "mainland", "affordable"],
  ]},
  "Ras Al Khaimah": { sale: [4500, 8000], areas: [
    ["Al Hamra Village", 25.69, 55.78, "waterfront", "leisure"],
    ["Al Nakheel", 25.789, 55.943, "central", "family"],
    ["Mina Al Arab", 25.667, 55.793, "coastal", "leisure"],
  ]},
  Fujairah: { sale: [4000, 7000], areas: [
    ["Fujairah City", 25.128, 56.339, "coastal", "family"],
    ["Dibba Al-Fujairah", 25.592, 56.273, "coastal", "leisure"],
  ]},
};

const added = [];
for (const [emirate, cfg] of Object.entries(EMIRATES)) {
  for (const [name, lat, lng, areaType, profile] of cfg.areas) {
    const r = rng(name + emirate);
    const population = ri(r, 55000, 360000);

    // amenities deliberately below the AD median for some categories → real gaps
    const amenityByCat = {};
    for (const c of CATS) {
      const expected = (medianPc[c] * population) / 1e5;
      const def = 0.12 + r() * 0.8; // 12%–92% of expected
      amenityByCat[c] = Math.max(0, Math.round(expected * def));
    }
    const amenities = Object.values(amenityByCat).reduce((a, b) => a + b, 0);

    const gaps = [];
    for (const c of CATS) {
      const pc = (amenityByCat[c] / (population || 1)) * 1e5;
      const shortfall = Math.round(Math.max(0, medianPc[c] - pc) * 10) / 10;
      if (shortfall > 0 || amenityByCat[c] === 0) {
        gaps.push({ category: c, label: LABEL[c], count: amenityByCat[c], shortfall });
      }
    }
    gaps.sort((a, b) => (b.count === 0 ? 1 : 0) - (a.count === 0 ? 1 : 0) || b.shortfall - a.shortfall);

    const vacantByUse = {};
    let vacantTotal = 0;
    for (const u of USES) {
      const count = ri(r, 0, 5);
      vacantTotal += count;
      vacantByUse[u] = {
        count,
        avgPotential: count ? rf(r, 50, 85) : 0,
        avgValueM: count ? rf(r, 18, 90) : 0,
      };
    }

    const investorsBySector = {};
    const nSec = ri(r, 2, 4);
    for (let i = 0; i < nSec; i++) {
      const s = SECTORS[ri(r, 0, SECTORS.length - 1)];
      investorsBySector[s] = (investorsBySector[s] || 0) + ri(r, 1, 3);
    }

    added.push({
      name,
      emirate,
      synthetic: true,
      areaType,
      profile,
      baseSale: ri(r, cfg.sale[0], cfg.sale[1]),
      yield: rf(r, 6, 9),
      infra: ri(r, 48, 90),
      lat,
      lng,
      x: Math.round(((lng - 54.0) / (56.6 - 54.0)) * 1e4) / 1e4,
      y: Math.round(((25.95 - lat) / (25.95 - 24.0)) * 1e4) / 1e4,
      established: ri(r, 1995, 2020),
      population,
      vacantTotal,
      vacantByUse,
      demand: ri(r, 42, 86),
      mobility: rf(r, 34, 82),
      experience: rf(r, 45, 86),
      momentum: rf(r, 4, 34),
      amenities,
      amenityByCat,
      gaps,
      investorsBySector,
      investorFit: rf(r, 60, 86),
    });
  }
}

data.districts.push(...added);
data.meta.districts = data.districts.length;
data.meta.emirates = 7;

fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
console.log(`Total districts: ${data.districts.length} (added ${added.length} across ${Object.keys(EMIRATES).length} emirates)`);
console.log("Emirate counts:", data.districts.reduce((m, d) => ((m[d.emirate] = (m[d.emirate] || 0) + 1), m), {}));
