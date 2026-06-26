/** User-facing label for AI response provenance. */
export function sourceLabel(source?: string): string {
  if (source === "k2") return "K2 Think · live";
  return "Xpand engine · grounded";
}

export function isK2Source(source?: string): boolean {
  return source === "k2";
}
