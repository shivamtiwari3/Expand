"use client";

import { useRouter } from "next/navigation";

export function ViewPitchButton() {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push("/pitch")}
      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-foreground-muted transition hover:border-accent hover:text-foreground hover:bg-surface-2"
    >
      <svg
        width="12"
        height="12"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="M4 4h16v12H4zM8 20h8M12 16v4" />
      </svg>
      Pitch Deck
    </button>
  );
}
