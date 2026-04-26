/**
 * Cursor tokens — explicit cursor map per interaction state.
 *
 * User preference: lots of pointer cursor, everywhere interactive.
 * Airbnb-level — if it's clickable, user sees the pointer.
 *
 * RULE: Any element with `onClick`, `role="button"`, `<a>` with href,
 * `<button>`, or behaves like a link, MUST have `cursor: pointer`.
 * Default browser behavior doesn't always give this (especially on
 * <div> with onClick or on Radix Trigger primitives).
 */

export const CURSOR = {
  /** Default arrow. Non-interactive text, images without links. */
  default: "default",
  /** Pointer — hand icon. Every clickable element. */
  pointer: "pointer",
  /** I-beam. Text selection surfaces (inputs, textareas). */
  text: "text",
  /** Not-allowed. Disabled controls. */
  notAllowed: "not-allowed",
  /** Grabbable (draggable). */
  grab: "grab",
  /** Being grabbed. */
  grabbing: "grabbing",
  /** Help. Tooltipped labels. Used sparingly. */
  help: "help",
  /** Wait. Only for full-page loading states. */
  wait: "wait",
  /** Zoom-in. Used on clickable images that open gallery. */
  zoomIn: "zoom-in",
  /** Zoom-out. Used on gallery images. */
  zoomOut: "zoom-out",
  /** Crosshair. Map overlay interactions. */
  crosshair: "crosshair",
  /** Col-resize. Resize handles. */
  colResize: "col-resize",
} as const;

export type Cursor = keyof typeof CURSOR;

/**
 * Focus ring tokens — keyboard focus outline.
 *
 * Used by `useFocusVisible` + Pressable. Never apply via `:focus`
 * (mouse clicks trigger it too, causing visual noise). Only via
 * `:focus-visible`.
 */
export const FOCUS_RING = {
  /** Standard — 2px brand, 2px offset. */
  standard: {
    outline: "none",
    boxShadow: "0 0 0 2px var(--eui-surface-raised), 0 0 0 4px var(--eui-brand)",
  },
  /** Inverted — on dark backgrounds. White inner, brand outer. */
  inverse: {
    outline: "none",
    boxShadow: "0 0 0 2px var(--eui-grey-900), 0 0 0 4px var(--eui-grey-0)",
  },
  /** Tight — for elements within cards, no offset. */
  tight: {
    outline: "none",
    boxShadow: "0 0 0 2px var(--eui-brand)",
  },
  /** None. Apply explicitly when you genuinely want no ring (rare). */
  none: {
    outline: "none",
    boxShadow: "none",
  },
} as const;

export type FocusRingVariant = keyof typeof FOCUS_RING;
