/**
 * Engine UI hooks — barrel export.
 *
 * All hooks are client-only ("use client" directive at file top).
 * Safe to import from server components, but the hook will only
 * execute on the client.
 */

export { useFocusVisible } from "./useFocusVisible";
export type { FocusVisibleResult } from "./useFocusVisible";

export { usePress } from "./usePress";
export type { PressOptions, PressResult } from "./usePress";

export { useHover } from "./useHover";
export type { HoverOptions, HoverResult } from "./useHover";

export { useReducedMotion } from "./useReducedMotion";
export { useKeyboardShortcut } from "./useKeyboardShortcut";
export type { ShortcutOptions } from "./useKeyboardShortcut";
export { useFocusTrap } from "./useFocusTrap";

export { useDelayedLoading } from "./useDelayedLoading";
export type { UseDelayedLoadingOptions } from "./useDelayedLoading";

export { useIsMobile } from "./useIsMobile";
