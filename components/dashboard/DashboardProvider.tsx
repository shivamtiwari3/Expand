"use client";

import React, { createContext, useContext, useMemo, useState } from "react";
import type { District, Category } from "@/lib/types";
import { DISTRICTS } from "@/lib/data";
import { severityScore } from "@/lib/engine";
import { CATEGORY_ORDER } from "./category-icons";
import type { RailTab } from "./onboarding-steps";

export type DataLayer = "amenities" | "listings" | "parcels" | "transactions" | "communities" | "live";

export const DATA_LAYERS: { key: DataLayer; label: string; color: string }[] = [
  { key: "amenities", label: "OSM Amenities", color: "#4fc3f7" },
  { key: "listings", label: "Listings", color: "#ab47bc" },
  { key: "parcels", label: "Land Parcels", color: "#66bb6a" },
  { key: "transactions", label: "Transactions", color: "#ffa726" },
  { key: "communities", label: "Communities", color: "#ef5350" },
  { key: "live", label: "Live API", color: "#26c6da" },
];

interface DashboardCtx {
  selected: District;
  setSelected: (name: string) => void;
  hovered: string | null;
  setHovered: (name: string | null) => void;
  cats: Category[];
  toggleCat: (c: Category) => void;
  allCats: Category[];
  railTab: RailTab;
  setRailTab: (tab: RailTab) => void;
  layers: DataLayer[];
  toggleLayer: (l: DataLayer) => void;
}

const Ctx = createContext<DashboardCtx | null>(null);

const DEFAULT = [...DISTRICTS].sort((a, b) => severityScore(b) - severityScore(a))[0];

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [selectedName, setSelectedName] = useState<string>(DEFAULT.name);
  const [hovered, setHovered] = useState<string | null>(null);
  const [cats, setCats] = useState<Category[]>(CATEGORY_ORDER);
  const [railTab, setRailTab] = useState<RailTab>("insights");
  const [layers, setLayers] = useState<DataLayer[]>([]);

  const value = useMemo<DashboardCtx>(() => {
    const selected = DISTRICTS.find((d) => d.name === selectedName) ?? DEFAULT;
    const toggleCat = (c: Category) =>
      setCats((prev) =>
        prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
      );
    const toggleLayer = (l: DataLayer) =>
      setLayers((prev) =>
        prev.includes(l) ? prev.filter((x) => x !== l) : [...prev, l],
      );
    return {
      selected,
      setSelected: setSelectedName,
      hovered,
      setHovered,
      cats,
      toggleCat,
      allCats: CATEGORY_ORDER,
      railTab,
      setRailTab,
      layers,
      toggleLayer,
    };
  }, [selectedName, hovered, cats, railTab, layers]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDashboard(): DashboardCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useDashboard must be used within DashboardProvider");
  return ctx;
}
