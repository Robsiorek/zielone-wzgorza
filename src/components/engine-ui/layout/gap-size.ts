/**
 * GapSize — unified spacing contract for Part 7 layout components.
 *
 * Named keys ("xs"-"2xl") map to design tokens. Numeric keys (1-11) provide
 * an escape hatch for edge cases that don't fit the canonical scale.
 */

export type GapSize =
  | "none" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl"
  | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

const NAMED_TO_TOKEN: Record<string, number> = {
  none: 0,
  xs: 2,
  sm: 3,
  md: 4,
  lg: 5,
  xl: 6,
  "2xl": 7,
};

export function gapToVar(size: GapSize): string {
  if (typeof size === "number") {
    const clamped = Math.max(0, Math.min(11, size));
    return `var(--eui-space-${clamped})`;
  }

  const tokenIndex = NAMED_TO_TOKEN[size];
  if (tokenIndex === undefined) {
    return "var(--eui-space-4)";
  }

  return `var(--eui-space-${tokenIndex})`;
}
