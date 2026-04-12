"use client";

/**
 * Z-INDEX LAYERS — jedyne źródło prawdy dla warstw panelu.
 *
 * Skala 100–700 z jasnymi interwałami.
 * Floating dropdowns są PONIŻEJ topbara na poziomie strony,
 * ale POWYŻEJ SlidePanel gdy są wewnątrz niego (via FloatingZContext).
 *
 * Tailwind classes z-[4]..z-[10] w kalendarzu i contencie — osobna
 * warstwa lokalna, nie koliduje ze skalą globalną.
 */

import { createContext, useContext } from "react";

export const Z = {
  /** Page-level floating: dropdowns, selects, tooltips, datepickers */
  DROPDOWN: 100,

  /** App chrome: sticky topbar, desktop sidebar */
  TOPBAR: 200,

  /** Topbar user menu dropdown (above topbar, below modal) */
  TOPBAR_MENU: 210,

  /** Mobile sidebar full-screen overlay */
  SIDEBAR_MOBILE: 250,

  /** Full-screen slide panel (overlay + content) */
  SLIDE_PANEL: 300,

  /** Dropdowns inside slide panels — above panel, below confirm */
  PANEL_DROPDOWN: 400,

  /** Confirm dialogs — above everything except toast */
  CONFIRM: 500,

  /** Toast notifications — always visible */
  TOAST: 600,

  /** App-wide loading overlay (topbar full-screen spinner) */
  LOADING: 700,
} as const;

/**
 * Context for floating z-index. Default = Z.DROPDOWN (page level).
 * SlidePanel provides Z.PANEL_DROPDOWN so dropdowns inside it
 * render above the panel overlay.
 */
export const FloatingZContext = createContext<number>(Z.DROPDOWN);

/**
 * Hook to read current floating z-index from context.
 * Used by useFloatingDropdown hook and standalone Floating UI components.
 */
export function useFloatingZ(): number {
  return useContext(FloatingZContext);
}
