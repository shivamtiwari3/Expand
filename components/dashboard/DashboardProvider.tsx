"use client";

import React, { createContext, useContext, useMemo, useState } from "react";
import type { District, Category } from "@/lib/types";
import { DISTRICTS } from "@/lib/data";
import { severityScore } from "@/lib/engine";
import { CATEGORY_ORDER } from "./category-icons";
import type { RailTab } from "./onboarding-steps";

interface DashboardCtx {
  selected: District;
  setSelected: (name: string) => void;
  hovered: string | null;
  setHovered: (name: string | null) => void;
  /** Amenity categories currently shown on the map / in recommendations. */
  cats: Category[];
  toggleCat: (c: Category) => void;
  allCats: Category[];
  railTab: RailTab;
  setRailTab: (tab: RailTab) => void;
}

const Ctx = createContext<DashboardCtx | null>(null);

// default to the highest-severity district so the demo opens on a real story
const DEFAULT = [...DISTRICTS].sort((a, b) => severityScore(b) - severityScore(a))[0];

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [selectedName, setSelectedName] = useState<string>(DEFAULT.name);
  const [hovered, setHovered] = useState<string | null>(null);
  const [cats, setCats] = useState<Category[]>(CATEGORY_ORDER);
  const [railTab, setRailTab] = useState<RailTab>("insights");

  const value = useMemo<DashboardCtx>(() => {
    const selected = DISTRICTS.find((d) => d.name === selectedName) ?? DEFAULT;
    const toggleCat = (c: Category) =>
      setCats((prev) =>
        prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
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
    };
  }, [selectedName, hovered, cats, railTab]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDashboard(): DashboardCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useDashboard must be used within DashboardProvider");
  return ctx;
}
