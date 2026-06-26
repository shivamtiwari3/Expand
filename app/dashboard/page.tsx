import { Suspense } from "react";
import { DashboardProvider } from "@/components/dashboard/DashboardProvider";
import { XpandHeader } from "@/components/marketing/xpand-header";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import XpandMap from "@/components/dashboard/XpandMap";
import RightRail from "@/components/dashboard/RightRail";
import OnboardingTour from "@/components/dashboard/OnboardingTour";
import { TourReplayButton } from "@/components/dashboard/OnboardingTour";

function TourFallback() {
  return null;
}

export default function DashboardPage() {
  return (
    <DashboardProvider>
      <Suspense fallback={<TourFallback />}>
        <OnboardingTour />
      </Suspense>
      <div className="flex h-screen flex-col overflow-hidden">
        <XpandHeader trailing={<TourReplayButton />} />
        <div className="flex min-h-0 flex-1">
          <DashboardSidebar />
          <div className="relative min-w-0 flex-1" data-tour="map">
            <XpandMap />
          </div>
          <aside className="hidden w-[400px] shrink-0 flex-col border-l border-border bg-surface/20 lg:flex">
            <RightRail />
          </aside>
        </div>
      </div>
    </DashboardProvider>
  );
}
