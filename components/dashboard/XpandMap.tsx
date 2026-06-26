"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Map,
  MapMarker,
  MarkerContent,
  MarkerTooltip,
  MapControls,
  type MapRef,
} from "@/components/ui/map";
import { DISTRICTS, AED } from "@/lib/data";
import { severity, SEVERITY_LABEL, recommendedSites } from "@/lib/engine";
import type { Severity } from "@/lib/types";
import { useDashboard, DATA_LAYERS, type DataLayer } from "./DashboardProvider";
import { CategoryIcon } from "./category-icons";
import { Sparkles, Layers, Database, MapPin, Building, TrendingUp, Users, Wifi } from "lucide-react";

const SEV_COLOR: Record<Severity, string> = {
  ok: "#7fa89c",
  emerging: "#d8b163",
  critical: "#d9694e",
};

const LAYER_ICONS: Record<DataLayer, typeof MapPin> = {
  amenities: Database,
  listings: Building,
  parcels: MapPin,
  transactions: TrendingUp,
  communities: Users,
  live: Wifi,
};

const UAE_CENTER: [number, number] = [55.25, 24.95];

interface LayerData {
  amenities?: any[];
  listings?: any[];
  parcels?: any[];
  transactions?: any[];
  communities?: any[];
  live?: any[];
}

export default function XpandMap() {
  const { selected, setSelected, setHovered, cats, layers, toggleLayer } = useDashboard();
  const mapRef = useRef<MapRef | null>(null);
  const first = useRef(true);
  const [layerData, setLayerData] = useState<LayerData>({});
  const [loading, setLoading] = useState(false);
  const [showLayerPanel, setShowLayerPanel] = useState(false);

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

  // Fetch layer data when layers or selected district change
  useEffect(() => {
    if (layers.length === 0) {
      setLayerData({});
      return;
    }
    let cancelled = false;
    setLoading(true);
    const params = new URLSearchParams();
    params.set("layers", layers.join(","));
    params.set("district", selected.name);
    fetch(`/api/map-layers?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setLayerData(data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [layers, selected.name]);

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
        {/* District dots */}
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

        {/* K2 recommendation pins */}
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

        {/* ─── DATA LAYER: OSM Amenities ─── */}
        {layerData.amenities?.map((a) => (
          <MapMarker key={a.id} longitude={a.lng} latitude={a.lat}>
            <MarkerContent>
              <div
                className="grid h-3 w-3 place-items-center rounded-full opacity-80"
                style={{ background: "#4fc3f7" }}
              />
            </MarkerContent>
            <MarkerTooltip>
              <div className="space-y-0.5">
                <div className="font-semibold text-[#4fc3f7]">{a.name}</div>
                <div className="opacity-80">{a.category} · {a.subtype}</div>
                <div className="opacity-60">{a.district}</div>
              </div>
            </MarkerTooltip>
          </MapMarker>
        ))}

        {/* ─── DATA LAYER: Listings ─── */}
        {layerData.listings?.map((l) => (
          <MapMarker key={l.id} longitude={l.lng} latitude={l.lat}>
            <MarkerContent>
              <div
                className="grid h-3.5 w-3.5 place-items-center rounded-sm opacity-80"
                style={{ background: l.type === "sale" ? "#ab47bc" : "#7c4dff" }}
              />
            </MarkerContent>
            <MarkerTooltip>
              <div className="space-y-0.5">
                <div className="font-semibold" style={{ color: "#ab47bc" }}>
                  {l.propertyType} · {l.bedrooms}BR
                </div>
                <div className="opacity-80">
                  {AED(l.price)} · {l.size}sqm · {l.type}
                </div>
                <div className="opacity-60">{l.community}, {l.district}</div>
              </div>
            </MarkerTooltip>
          </MapMarker>
        ))}

        {/* ─── DATA LAYER: Land Parcels ─── */}
        {layerData.parcels?.map((p) => (
          <MapMarker key={p.id} longitude={p.lng} latitude={p.lat}>
            <MarkerContent>
              <div
                className="h-3 w-3 rotate-45 opacity-75"
                style={{
                  background: p.status === "vacant" ? "#66bb6a" : p.status === "under_development" ? "#ffca28" : "#8d6e63",
                  borderRadius: 2,
                }}
              />
            </MarkerContent>
            <MarkerTooltip>
              <div className="space-y-0.5">
                <div className="font-semibold text-[#66bb6a]">
                  {p.id} · {p.landUse}
                </div>
                <div className="opacity-80">
                  {p.size.toLocaleString()}sqm · {p.status} · potential {p.potential}/100
                </div>
                <div className="opacity-60">{AED(p.value)} · {p.district}</div>
              </div>
            </MarkerTooltip>
          </MapMarker>
        ))}

        {/* ─── DATA LAYER: Transactions ─── */}
        {layerData.transactions?.map((t) => (
          <MapMarker key={t.id} longitude={t.lng} latitude={t.lat}>
            <MarkerContent>
              <div
                className="grid h-2.5 w-2.5 place-items-center rounded-full border opacity-70"
                style={{ background: "#ffa726", borderColor: "#e65100" }}
              />
            </MarkerContent>
            <MarkerTooltip>
              <div className="space-y-0.5">
                <div className="font-semibold text-[#ffa726]">
                  {t.assetType} · {t.date}
                </div>
                <div className="opacity-80">
                  {AED(t.value)} · {t.size}sqm · {t.pricePerSqm} AED/sqm
                </div>
                <div className="opacity-60">{t.buyerType} · {t.district}</div>
              </div>
            </MarkerTooltip>
          </MapMarker>
        ))}

        {/* ─── DATA LAYER: Communities ─── */}
        {layerData.communities?.map((c) => (
          <MapMarker key={c.id} longitude={c.lng} latitude={c.lat}>
            <MarkerContent>
              <div
                className="grid h-4 w-4 place-items-center rounded-full border-2 opacity-80"
                style={{ borderColor: "#ef5350", background: "rgba(239,83,80,0.2)" }}
              >
                <Users className="h-2.5 w-2.5 text-[#ef5350]" />
              </div>
            </MarkerContent>
            <MarkerTooltip>
              <div className="space-y-0.5">
                <div className="font-semibold text-[#ef5350]">
                  {c.district} · Pop {c.population.toLocaleString()}
                </div>
                <div className="opacity-80">
                  Occupancy {Math.round(c.occupancy * 100)}% · Service demand {c.serviceDemand}/100
                </div>
                <div className="opacity-60">
                  Mobility {c.mobility}/100 · Experience {c.experience}/100
                </div>
                <div className="text-[#ef5350] text-[10px]">{c.opportunity?.replace(/_/g, " ")}</div>
              </div>
            </MarkerTooltip>
          </MapMarker>
        ))}

        {/* ─── DATA LAYER: Live eVoost API ─── */}
        {layerData.live?.map((l) => (
          <MapMarker key={l.id} longitude={l.lng} latitude={l.lat}>
            <MarkerContent>
              <div className="relative grid h-4 w-4 place-items-center">
                <div className="absolute inset-0 animate-ping rounded-full bg-[#26c6da] opacity-30" />
                <div
                  className="h-3 w-3 rounded-full border"
                  style={{ background: "#26c6da", borderColor: "#00838f" }}
                />
              </div>
            </MarkerContent>
            <MarkerTooltip>
              <div className="space-y-0.5">
                <div className="font-semibold text-[#26c6da]">
                  {l.title}
                </div>
                <div className="opacity-80">
                  {l.price ? AED(l.price) : "Price N/A"} · {l.type}
                </div>
                <div className="opacity-60">{l.area} · {l.bedrooms}BR · {l.size}sqm</div>
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

      {/* Data Layers toggle panel */}
      <div className="absolute right-4 top-4 z-20">
        <button
          onClick={() => setShowLayerPanel((v) => !v)}
          className="flex items-center gap-1.5 rounded-md border border-border bg-surface/90 px-2.5 py-1.5 text-xs text-foreground backdrop-blur transition hover:border-accent/60"
        >
          <Layers className="size-3.5" />
          Data layers
          {layers.length > 0 && (
            <span className="ml-1 rounded-full bg-accent/20 px-1.5 text-[10px] text-accent">
              {layers.length}
            </span>
          )}
        </button>
        {showLayerPanel && (
          <div className="mt-2 w-52 rounded-lg border border-border bg-surface/95 p-2.5 shadow-xl backdrop-blur">
            <div className="mb-2 font-mono text-[9px] uppercase tracking-[0.18em] text-foreground-muted">
              Toggle data sources
            </div>
            {DATA_LAYERS.map((dl) => {
              const Icon = LAYER_ICONS[dl.key];
              const active = layers.includes(dl.key);
              return (
                <button
                  key={dl.key}
                  onClick={() => toggleLayer(dl.key)}
                  className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[11px] transition ${
                    active
                      ? "bg-accent/10 text-foreground"
                      : "text-foreground-muted hover:text-foreground hover:bg-surface"
                  }`}
                >
                  <span
                    className="grid h-4 w-4 place-items-center rounded"
                    style={{ background: active ? dl.color + "33" : "transparent" }}
                  >
                    <Icon className="size-3" style={{ color: active ? dl.color : undefined }} />
                  </span>
                  <span className="flex-1">{dl.label}</span>
                  {active && (
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: dl.color }} />
                  )}
                </button>
              );
            })}
            {loading && (
              <div className="mt-2 text-center text-[10px] text-foreground-muted animate-pulse">
                Loading data...
              </div>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      <Legend activeLayers={layers} />
    </div>
  );
}

function Legend({ activeLayers }: { activeLayers: DataLayer[] }) {
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
      {activeLayers.length > 0 && (
        <>
          <div className="mt-3 mb-1.5 border-t border-border/60 pt-2 font-mono text-[9px] uppercase tracking-[0.18em] text-foreground-muted">
            Active data layers
          </div>
          <div className="flex flex-col gap-1">
            {DATA_LAYERS.filter((dl) => activeLayers.includes(dl.key)).map((dl) => (
              <span key={dl.key} className="flex items-center gap-2 text-[11px] text-foreground">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ background: dl.color }}
                />
                {dl.label}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
