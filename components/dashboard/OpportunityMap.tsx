"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DISTRICTS } from "@/lib/data";
import { severity, SEVERITY_LABEL } from "@/lib/engine";
import type { District, Severity } from "@/lib/types";
import { useDashboard } from "./DashboardProvider";

const SEV_COLOR: Record<Severity, string> = {
  ok: "#7fa89c",
  emerging: "#d8b163",
  critical: "#d9694e",
};

type Box = { x: number; y: number; w: number; h: number };
const FULL: Box = { x: 0, y: 0, w: 1000, h: 720 };
const ZOOM: Box = { x: 40, y: 278, w: 600, h: 432 };

// Stylised emirate outlines (Abu Dhabi dominant, west/south — geographically true).
const EMIRATES = [
  { name: "Abu Dhabi", main: true, d: "M40 300 L120 250 L300 258 L430 298 L560 330 L642 422 L620 560 L515 662 L320 692 L140 660 L58 520 Z", cx: 300, cy: 475 },
  { name: "Dubai", d: "M560 300 L662 250 L722 302 L700 382 L618 402 L560 360 Z", cx: 638, cy: 332 },
  { name: "Sharjah", d: "M662 240 L760 208 L802 260 L760 322 L700 300 L662 270 Z", cx: 730, cy: 268 },
  { name: "Ajman", d: "M730 204 L772 193 L788 226 L750 238 Z", cx: 760, cy: 220 },
  { name: "Umm Al Quwain", d: "M788 184 L838 173 L858 210 L816 226 L790 210 Z", cx: 824, cy: 202 },
  { name: "Ras Al Khaimah", d: "M838 150 L908 138 L932 202 L880 236 L845 200 Z", cx: 886, cy: 186 },
  { name: "Fujairah", d: "M902 250 L952 240 L962 322 L910 362 L884 300 Z", cx: 928, cy: 302 },
] as const;

function nodePos(d: District) {
  return { x: 90 + d.x * 480, y: 320 + d.y * 330 };
}

export default function OpportunityMap() {
  const { selected, setSelected, setHovered } = useDashboard();
  const [zoomed, setZoomed] = useState(true);
  const [hover, setHover] = useState<District | null>(null);

  const [vb, setVb] = useState<Box>(ZOOM);
  const vbRef = useRef<Box>(ZOOM);
  const raf = useRef<number>(0);

  const tween = useCallback((to: Box) => {
    const from = { ...vbRef.current };
    const t0 = performance.now();
    const dur = 720;
    cancelAnimationFrame(raf.current);
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - k, 3);
      const cur: Box = {
        x: from.x + (to.x - from.x) * e,
        y: from.y + (to.y - from.y) * e,
        w: from.w + (to.w - from.w) * e,
        h: from.h + (to.h - from.h) * e,
      };
      vbRef.current = cur;
      setVb(cur);
      if (k < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
  }, []);

  useEffect(() => {
    tween(zoomed ? ZOOM : FULL);
  }, [zoomed, tween]);
  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const onEnter = (d: District) => {
    setHover(d);
    setHovered(d.name);
  };
  const onLeave = () => {
    setHover(null);
    setHovered(null);
  };

  const critical = DISTRICTS.filter((d) => severity(d) === "critical").length;

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-border bg-surface/40">
      {/* Heading */}
      <div className="pointer-events-none absolute left-5 top-4 z-10">
        <h3 className="font-serif text-lg leading-none text-foreground">
          {zoomed ? "Abu Dhabi · service-gap map" : "United Arab Emirates"}
        </h3>
        <p className="mt-1 text-xs text-foreground-muted">
          {zoomed
            ? `${DISTRICTS.length} districts · ${critical} in critical gap · larger, redder = bigger gap`
            : "Tap Abu Dhabi to explore where services are missing"}
        </p>
      </div>

      {/* Zoom control */}
      <div className="absolute right-4 top-4 z-10">
        <button
          onClick={() => setZoomed((z) => !z)}
          className="rounded-md border border-border bg-surface/80 px-3 py-1.5 text-xs text-foreground-muted backdrop-blur transition hover:border-accent/60 hover:text-foreground"
        >
          {zoomed ? "↖ View all emirates" : "Zoom into Abu Dhabi ↘"}
        </button>
      </div>

      {/* Legend */}
      <div className="pointer-events-none absolute bottom-4 left-5 z-10 flex items-center gap-4 text-[11px] text-foreground-muted">
        {(["critical", "emerging", "ok"] as Severity[]).map((s) => (
          <span key={s} className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: SEV_COLOR[s] }} />
            {SEVERITY_LABEL[s]}
          </span>
        ))}
      </div>

      <svg
        viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
        preserveAspectRatio="xMidYMid meet"
        className="block h-full w-full"
        style={{ aspectRatio: "1000 / 720" }}
        role="img"
        aria-label="Map of Abu Dhabi districts coloured by service-gap severity"
      >
        <defs>
          <radialGradient id="adfill" cx="40%" cy="45%" r="75%">
            <stop offset="0%" stopColor="#2b2826" />
            <stop offset="100%" stopColor="#201d1c" />
          </radialGradient>
          <filter id="soft" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>

        {/* Emirate shapes */}
        {EMIRATES.map((e) => {
          const isAd = "main" in e && e.main;
          const op = zoomed ? (isAd ? 0.55 : 0.08) : isAd ? 0.92 : 0.78;
          return (
            <g key={e.name} style={{ transition: "opacity 0.6s ease" }} opacity={op}>
              <path
                d={e.d}
                fill={isAd ? "url(#adfill)" : "var(--color-surface-2)"}
                stroke="var(--color-border)"
                strokeWidth={1.5}
                style={{ cursor: isAd && !zoomed ? "pointer" : "default" }}
                onClick={() => {
                  if (isAd && !zoomed) setZoomed(true);
                }}
              />
              {!zoomed && (
                <text
                  x={e.cx}
                  y={e.cy}
                  textAnchor="middle"
                  className="select-none"
                  fontSize={isAd ? 20 : 13}
                  fontWeight={isAd ? 600 : 400}
                  fill={isAd ? "var(--color-foreground)" : "var(--color-foreground-muted)"}
                  style={{ pointerEvents: "none" }}
                >
                  {e.name}
                </text>
              )}
            </g>
          );
        })}

        {/* District nodes */}
        <g
          style={{
            transition: "opacity 0.5s ease",
            opacity: zoomed ? 1 : 0,
            pointerEvents: zoomed ? "auto" : "none",
          }}
        >
          {DISTRICTS.map((d) => {
            const p = nodePos(d);
            const sev = severity(d);
            const r = 7 + (d.demand / 100) * 7;
            const isSel = selected.name === d.name;
            const isHot = hover?.name === d.name;
            const showLabel = isSel || isHot || sev === "critical";
            return (
              <g key={d.name} style={{ cursor: "pointer" }}
                 onClick={() => setSelected(d.name)}
                 onMouseEnter={() => onEnter(d)}
                 onMouseLeave={onLeave}>
                {(isSel || sev === "critical") && (
                  <circle cx={p.x} cy={p.y} r={r + 6} fill={SEV_COLOR[sev]} opacity={0.16} filter="url(#soft)" />
                )}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={r}
                  fill={SEV_COLOR[sev]}
                  fillOpacity={isHot || isSel ? 1 : 0.85}
                  stroke={isSel ? "var(--color-foreground)" : "rgba(0,0,0,0.35)"}
                  strokeWidth={isSel ? 2.5 : 1}
                />
                {showLabel && (
                  <text
                    x={p.x}
                    y={p.y + r + 13}
                    textAnchor="middle"
                    fontSize={11.5}
                    fill="var(--color-foreground)"
                    style={{ pointerEvents: "none", paintOrder: "stroke" }}
                    stroke="var(--color-background)"
                    strokeWidth={3}
                    strokeLinejoin="round"
                  >
                    {d.name}
                  </text>
                )}
              </g>
            );
          })}

          {/* Tooltip */}
          {hover && (() => {
            const p = nodePos(hover);
            const sev = severity(hover);
            const gap = hover.gaps[0];
            const l1 = hover.name;
            const l2 = `${SEVERITY_LABEL[sev]} · demand ${hover.demand}/100`;
            const l3 = gap ? `Short on ${gap.label}` : "Broadly well served";
            const w = Math.max(l1.length, l2.length, l3.length) * 6.4 + 26;
            const h = 60;
            const above = p.y - h - 18 > vbRef.current.y;
            const ty = above ? p.y - h - 16 : p.y + 18;
            let tx = p.x - w / 2;
            tx = Math.max(vbRef.current.x + 6, Math.min(tx, vbRef.current.x + vbRef.current.w - w - 6));
            return (
              <g style={{ pointerEvents: "none" }}>
                <rect x={tx} y={ty} width={w} height={h} rx={8}
                  fill="var(--color-surface)" stroke="var(--color-border)" strokeWidth={1} />
                <rect x={tx} y={ty} width={4} height={h} rx={2} fill={SEV_COLOR[sev]} />
                <text x={tx + 14} y={ty + 20} fontSize={13} fontWeight={600} fill="var(--color-foreground)">{l1}</text>
                <text x={tx + 14} y={ty + 37} fontSize={11} fill="var(--color-foreground-muted)">{l2}</text>
                <text x={tx + 14} y={ty + 52} fontSize={11} fill={SEV_COLOR[sev]}>{l3}</text>
              </g>
            );
          })()}
        </g>
      </svg>
    </div>
  );
}
