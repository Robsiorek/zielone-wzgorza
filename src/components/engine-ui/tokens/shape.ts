/**
 * Shape + surface tokens — radius, border, shadow.
 *
 * Paired with CSS custom properties in globals.css (`--eui-radius-*`,
 * `--eui-elev-*`). These exports are for TS consumers; prefer the CSS
 * vars in stylesheets.
 */

/**
 * Border radius scale. Pick the right one based on container size:
 *   - badges, status dots → xs
 *   - checkbox, small chip → sm
 *   - input, small button → md
 *   - card, popover → lg
 *   - large surface → xl / 2xl
 *   - full-screen sheet → 3xl / 4xl
 *   - CTAs, pills, segments → pill
 */
export const RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 28,
  "4xl": 32,
  pill: 9999,
} as const;

export type Radius = keyof typeof RADIUS;

/**
 * Border tokens. Always 1px unless specified. Thicker borders belong to
 * focus rings, not static surfaces.
 */
export const BORDER = {
  /** 1px, color grey-50 → invisible-ish. For very subtle dividers. */
  hairlineSubtle: "1px solid var(--eui-grey-50)",
  /** 1px, grey-100 — default divider between sibling elements. */
  hairline: "1px solid var(--eui-grey-100)",
  /** 1px, grey-200 — input borders, chip outline. */
  default: "1px solid var(--eui-grey-200)",
  /** 1px, grey-300 — input hover border. */
  strong: "1px solid var(--eui-grey-300)",
  /** 1.5px, grey-900 — focused input, selected radio. */
  emphasis: "1.5px solid var(--eui-grey-900)",
  /** 2px, brand — focus ring outer layer. */
  focusRing: "2px solid var(--eui-brand)",
  /** None. */
  none: "none",
} as const;

/**
 * Elevation scale — each is a pair of (hairline border + drop shadow).
 * Pair, not one — border gives the edge, shadow gives the depth.
 *
 * Values reference `--eui-elev-*` CSS variables. Defined here as strings
 * for quick reference.
 */
export const ELEVATION = {
  /** Flush — no lift. */
  0: "none",
  /** Resting cards, searchbar at rest. */
  1: "var(--eui-elev-1)",
  /** Hover of elev-1. Button lift. */
  2: "var(--eui-elev-2)",
  /** Popover default. */
  3: "var(--eui-elev-3)",
  /** Active popover (being interacted with). */
  4: "var(--eui-elev-4)",
  /** Modal / sheet. */
  5: "var(--eui-elev-5)",
} as const;

export type Elevation = keyof typeof ELEVATION;

/**
 * Spacing scale. 2 → 80 px. Use the scale, never in-between values.
 * Mirrored as `--eui-space-N` in globals.css.
 */
export const SPACING = {
  1: 2,
  2: 4,
  3: 8,
  4: 12,
  5: 16,
  6: 24,
  7: 32,
  8: 40,
  9: 48,
  10: 64,
  11: 80,
} as const;

export type Spacing = keyof typeof SPACING;
