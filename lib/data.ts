import raw from "./xpand-data.json";
import liveRaw from "./live-snapshot.json";
import type {
  XpandData,
  District,
  LiveSnapshot,
  LiveDistrict,
  Category,
} from "./types";

export const DATA = raw as unknown as XpandData;
export const LIVE = liveRaw as unknown as LiveSnapshot;

export const DISTRICTS: District[] = DATA.districts;
export const CATEGORY_LABEL = DATA.categoryLabel;
export const CATEGORIES = Object.keys(DATA.categoryLabel) as Category[];

export function getDistrict(name: string): District | undefined {
  return DISTRICTS.find((d) => d.name === name);
}

export function getLive(name: string): LiveDistrict | undefined {
  return LIVE.districts[name];
}

export const AED = (n: number) =>
  n >= 1_000_000
    ? `AED ${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`
    : n >= 1000
      ? `AED ${(n / 1000).toFixed(0)}k`
      : `AED ${n}`;

export const num = (n: number) => n.toLocaleString("en-US");

// Plain-language area framing, no jargon.
export const AREA_TYPE_LABEL: Record<string, string> = {
  island: "Island",
  waterfront: "Waterfront",
  central: "City centre",
  mainland: "Mainland",
  coastal: "Coastal",
  border: "Border town",
};
