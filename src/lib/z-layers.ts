"use client";

/**
 * Z-INDEX LAYERS — jedyne źródło prawdy dla warstw panelu.
 *
 * Skala 100–700 z jasnymi interwałami.
 * Floating dropdowns są PONIŻEJ topbara na poziomie strony,
 * ale POWYŻEJ SlidePanel gdy są wewnątrz niego (via FloatingZContext).
 * Tooltipy są POWYŻEJ topbara (zawsze czytelne).
 *
 * FloatingPortalRootContext: SlidePanel dostarcza ref do div-a wewnątrz
 * panelu. Dropdowny renderują się w tym div-ie zamiast na body,
 * dzięki czemu header panelu je przykrywa.
 */

import { createContext, useContext, type RefObject } from "react";

export const Z = {
  /** Page-level floating: dropdowns, selects, datepickers */
  DROPDOWN: 100,

  /** App chrome: sticky topbar, desktop sidebar */
  TOPBAR: 200,

  /** Topbar user menu dropdown (above topbar, below modal) */
  TOPBAR_MENU: 210,

  /** Tooltips — always readable, above topbar */
  TOOLTIP: 220,

  /** Mobile sidebar full-screen overlay */
  SIDEBAR_MOBILE: 250,

  /** Full-screen slide panel (overlay + content) */
  SLIDE_PANEL: 300,

  /** Dropdowns inside slide panels — inside panel stacking context */
  PANEL_DROPDOWN: 10,

  /** Confirm dialogs — above everything except toast */
  CONFIRM: 500,

  /** Toast notifications — always visible */
  TOAST: 600,

  /** App-wide loading overlay (topbar full-screen spinner) */
  LOADING: 700,
} as const;

/**
 * Context for floating z-index. Default = Z.DROPDOWN (page level).
 * SlidePanel provides Z.PANEL_DROPDOWN (local stacking context).
 */
export const FloatingZContext = createContext<number>(Z.DROPDOWN);

/**
 * Context for FloatingPortal root element.
 * Default = null (renders to document.body).
 * SlidePanel provides a ref to a div inside the panel so dropdowns
 * render within the panel's stacking context (below header).
 */
export const FloatingPortalRootContext = createContext<RefObject<HTMLElement | null> | null>(null);

/**
 * Hook to read current floating z-index from context.
 */
export function useFloatingZ(): number {
  return useContext(FloatingZContext);
}

/**
 * Hook to read portal root from context.
 * Returns the HTMLElement to pass to FloatingPortal root prop,
 * or undefined (= render to body).
 */
export function useFloatingPortalRoot(): HTMLElement | undefined {
  const ref = useContext(FloatingPortalRootContext);
  return ref?.current ?? undefined;
}
