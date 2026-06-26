"use client";

import { useEffect, useRef } from "react";
import {
  Map,
  MapMarker,
  MarkerContent,
  MarkerTooltip,
  MapControls,
  type MapRef,
} from "@/components/ui/map";
import { DISTRICTS } from "@/lib/data";
import { severity, SEVERITY_LABEL, recommendedSites } from "@/lib/engine";
import type { Severity } from "@/lib/types";
import { useDashboard } from "./DashboardProvider";
import { CategoryIcon } from "./category-icons";
import { Sparkles } from "lucide-react";

const SEV_COLOR: Record<Severity, string> = {
  ok: "#7fa89c",
  emerging: "#d8b163",
  critical: "#d9694e",
};

// Whole-UAE starting view; fitBounds refines it once the map is ready.
const UAE_CENTER: [number, number] = [55.25, 24.95];

export default function XpandMap() {
  const { selected, setSelected, setHovered, cats } = useDashboard();
  const mapRef = useRef<MapRef | null>(null);
  const first = useRef(true);

  // Fit the whole UAE on first load (poll until the map instance exists).
  useEffect(() => {
    let tries = 0;
    const lngs = DISTRICTS.map((d) => d.lng);
    const lats = DISTRICTS.map((d) => d.lat);
    const bounds: [[number, number], [number, number]] = [
      [Math.min(...lngs), Math.min(...lats)],
      [Math.max(...lngs), Math.max(...lats)],
    ];
    const id = setInterval(() => {
      tries += 1;
      const map = mapRef.current;
      if (map) {
        clearInterval(id);
        map.fitBounds(bounds, { padding: 70, duration: 0 });
      } else if (tries > 40) {
        clearInterval(id);
      }
    }, 120);
    return () => clearInterval(id);
  }, []);

  // Fly to the selected district whenever it changes (but not on first paint).
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const map = mapRef.current;
    if (!map) return;
    map.flyTo({
      center: [selected.lng, selected.lat],
      zoom: Math.max(map.getZoom(), 11.5),
      duration: 1300,
      essential: true,
    });
  }, [selected.name, selected.lat, selected.lng]);

  const sites = recommendedSites(selected).filter((s) => cats.includes(s.category));

  return (
    <div className="relative h-full w-full">
      <Map
        ref={mapRef}
        theme="dark"
        center={UAE_CENTER}
        zoom={6.6}
        className="h-full w-full"
      >
        {/* District dots — colour = urgency, size = demand */}
        {DISTRICTS.map((d) => {
          const sev = severity(d);
          const color = SEV_COLOR[sev];
          const size = 12 + (d.demand / 100) * 14;
          const isSel = selected.name === d.name;
          return (
            <MapMarker
              key={d.name}
              longitude={d.lng}
              latitude={d.lat}
              onClick={() => setSelected(d.name)}
              onMouseEnter={() => setHovered(d.name)}
              onMouseLeave={() => setHovered(null)}
            >
              <MarkerContent>
                <div
                  className={[
                    "xpand-dot relative",
                    sev === "critical" && "xpand-pulse",
                    isSel && "xpand-dot--selected",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  style={{
                    width: size,
                    height: size,
                    background: color,
                    color,
                    opacity: isSel ? 1 : 0.92,
                  }}
                />
                {isSel && (
                  <span className="pointer-events-none absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded bg-background/85 px-1.5 py-0.5 text-[10px] font-medium text-foreground shadow">
                    {d.name}
                  </span>
                )}
              </MarkerContent>
              <MarkerTooltip>
                <div className="space-y-0.5">
                  <div className="font-semibold">{d.name}</div>
                  <div className="opacity-80">
                    {SEVERITY_LABEL[sev]} · demand {d.demand}/100
                  </div>
                </div>
              </MarkerTooltip>
            </MapMarker>
          );
        })}

        {/* K2 recommendation pins for the selected district */}
        {sites.map((s) => (
          <MapMarker key={s.id} longitude={s.lng} latitude={s.lat}>
            <MarkerContent>
              <div className="xpand-recpin" style={{ color: SEV_COLOR[s.severity] }}>
                <CategoryIcon category={s.category} size={15} className="text-foreground" />
              </div>
            </MarkerContent>
            <MarkerTooltip>
              <div className="space-y-0.5">
                <div className="flex items-center gap-1 font-semibold">
                  <Sparkles className="size-3" /> Build {s.count} {s.label}
                </div>
                <div className="opacity-80">{s.rationale}</div>
              </div>
            </MarkerTooltip>
          </MapMarker>
        ))}

        <MapControls position="bottom-right" showZoom showFullscreen />
      </Map>

      {/* Heading overlay */}
      <div className="pointer-events-none absolute left-4 top-4 z-10 max-w-xs">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent">
          Live opportunity map
        </div>
        <h2 className="mt-1 font-serif text-xl leading-tight text-foreground drop-shadow">
          {selected.name}
        </h2>
        <p className="mt-1 text-xs text-foreground-muted">
          Diamond pins show where Xpand recommends building — reasoned by K2 Think.
        </p>
      </div>

      {/* Legend */}
      <Legend />
    </div>
  );
}

function Legend() {
  return (
    <div className="absolute bottom-4 left-4 z-10 rounded-lg border border-border bg-surface/80 px-3 py-2.5 backdrop-blur">
      <div className="mb-2 font-mono text-[9px] uppercase tracking-[0.18em] text-foreground-muted">
        Service-gap urgency
      </div>
      <div className="flex flex-col gap-1.5">
        {(["critical", "emerging", "ok"] as Severity[]).map((s) => (
          <span key={s} className="flex items-center gap-2 text-[11px] text-foreground">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ background: SEV_COLOR[s] }}
            />
            {SEVERITY_LABEL[s]}
          </span>
        ))}
        <span className="mt-1 flex items-center gap-2 text-[11px] text-foreground">
          <span
            className="inline-grid h-3.5 w-3.5 place-items-center rounded-[4px_4px_4px_1px] border"
            style={{ color: "#d9694e", transform: "rotate(45deg)" }}
          />
          Recommended build site
        </span>
      </div>
    </div>
  );
}
