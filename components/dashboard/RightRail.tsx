"use client";

import { Building2, ScrollText, Users, Sparkles, Compass } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDashboard } from "./DashboardProvider";
import DistrictPanel from "./DistrictPanel";
import RfpBoard from "./RfpBoard";
import CommunityConnect from "./CommunityConnect";
import AskK2 from "./AskK2";
import InsightsForm from "./InsightsForm";
import type { RailTab } from "./onboarding-steps";

const TABS: { id: RailTab; label: string; icon: typeof Building2 }[] = [
  { id: "insights", label: "District", icon: Building2 },
  { id: "rfps", label: "RFPs", icon: ScrollText },
  { id: "community", label: "Community", icon: Users },
  { id: "ask", label: "Ask K2", icon: Sparkles },
  { id: "advisor", label: "Advisor", icon: Compass },
];

export default function RightRail({ initial = "insights" }: { initial?: RailTab }) {
  const { railTab, setRailTab } = useDashboard();
  const tab = railTab ?? initial;

  return (
    <div className="flex h-full flex-col" data-tour="right-rail">
      {/* tab bar */}
      <div className="flex shrink-0 items-center gap-0.5 overflow-x-auto border-b border-border bg-surface/40 px-1.5 py-2 scrollbar-none">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setRailTab(t.id)}
              className={cn(
                "flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-1.5 text-[11px] transition",
                active
                  ? "bg-surface-active text-foreground"
                  : "text-foreground-muted hover:bg-surface hover:text-foreground",
              )}
            >
              <Icon className="size-3.5 shrink-0" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* content */}
      <div className="min-h-0 flex-1 overflow-hidden">
        {tab === "insights" && <DistrictPanel />}
        {tab === "rfps" && (
          <div className="h-full overflow-y-auto p-4" data-tour="rfps">
            <RfpBoard />
          </div>
        )}
        {tab === "community" && (
          <div className="h-full overflow-y-auto p-4" data-tour="community">
            <CommunityConnect />
          </div>
        )}
        {tab === "ask" && (
          <div className="h-full" data-tour="ask-k2">
            <AskK2 />
          </div>
        )}
        {tab === "advisor" && (
          <div className="h-full overflow-y-auto" data-tour="advisor">
            <InsightsForm />
          </div>
        )}
      </div>
    </div>
  );
}
