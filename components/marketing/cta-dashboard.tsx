"use client";

import { useRouter } from "next/navigation";
import { LiquidMetalButton } from "@/components/ui/liquid-metal-button";

export function CtaDashboard({ label = "Open the dashboard" }: { label?: string }) {
  const router = useRouter();
  return <LiquidMetalButton label={label} onClick={() => router.push("/dashboard")} />;
}
