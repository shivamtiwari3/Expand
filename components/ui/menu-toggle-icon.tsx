"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface MenuToggleIconProps extends React.SVGProps<SVGSVGElement> {
  open: boolean;
  duration?: number;
}

/**
 * Animated burger ↔ X icon.
 */
export function MenuToggleIcon({
  open,
  duration = 300,
  className,
  ...props
}: MenuToggleIconProps) {
  const style = { transitionDuration: `${duration}ms` } as React.CSSProperties;

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("[&_line]:transition-all [&_line]:ease-out", className)}
      style={style}
      aria-hidden
      {...props}
    >
      <line
        x1="4"
        y1="7"
        x2="20"
        y2="7"
        style={{
          ...style,
          transformOrigin: "12px 7px",
          transform: open ? "translateY(5px) rotate(45deg)" : "none",
        }}
      />
      <line
        x1="4"
        y1="12"
        x2="20"
        y2="12"
        style={{
          ...style,
          opacity: open ? 0 : 1,
        }}
      />
      <line
        x1="4"
        y1="17"
        x2="20"
        y2="17"
        style={{
          ...style,
          transformOrigin: "12px 17px",
          transform: open ? "translateY(-5px) rotate(-45deg)" : "none",
        }}
      />
    </svg>
  );
}
