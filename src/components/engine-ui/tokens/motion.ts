/**
 * Motion tokens — canonical timing + easing values for engine-ui.
 *
 * Import from here instead of hardcoding ms / cubic-bezier values. This
 * is the single source of motion truth. When a component feels "too
 * slow" or "too fast" you adjust ONE value here, not 40 files.
 *
 * Mirrored as CSS custom properties in globals.css under `.engine-root`.
 * Keep the two in sync.
 */

export const DURATION = {
  /** 100ms — pressed feedback on click, instant scale. */
  instant: 100,
  /** 120ms — micro interactions (icon color swap, small fade). */
  fast: 120,
  /** 180ms — default hover/focus. Most transitions use this. */
  base: 180,
  /** 240ms — state changes, popover enter, segment toggle. */
  slow: 240,
  /** 300ms — slide-ins, cross-panel transitions. */
  slower: 300,
  /** 400ms — larger layout shifts. Absolute ceiling. */
  ceiling: 400,
} as const;

export const EASING = {
  /** Default. Most transitions use this. */
  standard: "cubic-bezier(0.2, 0, 0, 1)",
  /** Element entering view. Quick start, slow settle. */
  enter: "cubic-bezier(0.1, 0.9, 0.2, 1)",
  /** Element leaving. Slow start, quick exit. */
  exit: "cubic-bezier(0.4, 0, 1, 1)",
  /** Subtle spring with ~1.04 overshoot. Reserved for "delight"
   *  micro-interactions (liked-heart, successfully-applied). Max 10%
   *  of your transitions. */
  spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
  /** Mechanical. Loading indicators only. */
  linear: "linear",
} as const;

/**
 * Scale presets for press + hover lift effects.
 *
 * Rule of thumb: press scales DOWN (feedback "I received your click"),
 * hover scales UP only on media (photo cards). Buttons don't scale on
 * hover — they lift via shadow.
 */
export const SCALE = {
  /** Pressed state — button, pill, chip. 0.94 is perceptible but not
   *  cartoonish. */
  press: 0.94,
  /** Hover on interactive media (image card). Subtle bloom. */
  mediaHover: 1.02,
  /** Hover on "delight" icons (heart favorite). */
  iconHover: 1.08,
} as const;

/**
 * Common transform presets (for use with transform: property directly).
 */
export const TRANSFORM = {
  pressDown: `scale(${SCALE.press})`,
  liftHover: "translateY(-1px)",
  none: "none",
} as const;

/**
 * Opacity presets.
 */
export const OPACITY = {
  /** Disabled controls. Not 0.5 (too visible) or 0.3 (too ghostly). */
  disabled: 0.4,
  /** Muted labels — caption over strong context. */
  muted: 0.7,
  /** Overlay scrim on modal backdrop. */
  backdrop: 0.5,
} as const;

/**
 * Full transition strings — shortcuts for common combos.
 *
 * Usage: `style={{ transition: TRANSITION.hover }}`
 */
export const TRANSITION = {
  /** Hover: background + color, 180ms standard. */
  hover: `background-color ${DURATION.base}ms ${EASING.standard}, color ${DURATION.base}ms ${EASING.standard}`,
  /** Focus ring appearing. Fast so it feels reactive to keyboard. */
  focus: `box-shadow ${DURATION.fast}ms ${EASING.standard}`,
  /** Press — scale down instant, scale up standard. */
  press: `transform ${DURATION.instant}ms ${EASING.standard}`,
  /** Popover enter. */
  popoverIn: `opacity ${DURATION.slow}ms ${EASING.enter}, transform ${DURATION.slow}ms ${EASING.enter}`,
  /** Popover exit. */
  popoverOut: `opacity ${DURATION.fast}ms ${EASING.exit}, transform ${DURATION.fast}ms ${EASING.exit}`,
  /** Lift via shadow (hover on cards). */
  lift: `box-shadow ${DURATION.base}ms ${EASING.standard}, transform ${DURATION.base}ms ${EASING.standard}`,
  /** Color-only for text/icons. */
  color: `color ${DURATION.fast}ms ${EASING.standard}`,
  /** All — use sparingly, browsers can be unpredictable. */
  all: `all ${DURATION.base}ms ${EASING.standard}`,
} as const;

/** Type for consumer-facing size enums. */
export type MotionDuration = keyof typeof DURATION;
export type MotionEasing = keyof typeof EASING;
