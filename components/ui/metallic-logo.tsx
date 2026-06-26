import { cn } from "@/lib/utils";

interface MetallicLogoProps {
  className?: string;
  /** size in px of the square mark */
  size?: number;
  /** animate the sheen sweep */
  animate?: boolean;
}

/**
 * The Xpand mark rendered as brushed chrome: the user's logo is used as an
 * alpha mask (public/xpand-mark.png) and filled with an animated metallic
 * gradient in the Andrej palette (#ced7e3 accent + cream highlights).
 */
export function MetallicLogo({ className, size = 32, animate = true }: MetallicLogoProps) {
  return (
    <span
      aria-label="Xpand"
      role="img"
      className={cn("metallic-mark", animate && "metallic-mark--animate", className)}
      style={{ width: size, height: size }}
    />
  );
}
