import {
  GraduationCap,
  HeartPulse,
  ShoppingBag,
  Trees,
  Bus,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { Category } from "@/lib/types";

export const CATEGORY_ICON: Record<Category, LucideIcon> = {
  education: GraduationCap,
  healthcare: HeartPulse,
  retail: ShoppingBag,
  community: Trees,
  mobility: Bus,
  services: Wrench,
};

export const CATEGORY_ORDER: Category[] = [
  "education",
  "healthcare",
  "retail",
  "community",
  "mobility",
  "services",
];

export function CategoryIcon({
  category,
  size = 16,
  className,
}: {
  category: Category;
  size?: number;
  className?: string;
}) {
  const Icon = CATEGORY_ICON[category];
  return <Icon size={size} className={className} aria-hidden />;
}
