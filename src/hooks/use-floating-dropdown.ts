"use client";

/**
 * useFloatingDropdown — wspólny hook Floating UI dla WSZYSTKICH
 * dropdownów, pickerów i popupów w panelu.
 *
 * Enkapsuluje: useFloating + strategy:fixed + offset + flip + shift
 * + size + autoUpdate + useClick/useHover + useDismiss.
 *
 * Komponent renderuje <FloatingPortal> sam — hook daje refs i style.
 *
 * Z-index pochodzi z FloatingZContext:
 * - domyślnie Z.DROPDOWN (100) — poniżej topbara
 * - wewnątrz SlidePanel → Z.PANEL_DROPDOWN (400) — powyżej panelu
 *
 * ADR-20: Jedyny system pozycjonowania panelu.
 *
 * WAŻNE (Rules of Hooks): Wszystkie hooki Floating UI (useClick, useHover,
 * useFocus, useDismiss) są wywoływane ZAWSZE na top level z flagą `enabled`.
 * NIGDY w useMemo, warunku ani helperze.
 */

import { useState, useMemo } from "react";
import {
  useFloating,
  offset,
  flip,
  shift,
  size,
  autoUpdate,
  useClick,
  useHover,
  useFocus,
  useDismiss,
  useInteractions,
  type Placement,
} from "@floating-ui/react";
import { useFloatingZ, useFloatingPortalRoot } from "@/lib/z-layers";

export interface UseFloatingDropdownOptions {
  /** Placement relative to trigger. Default: 'bottom-start' */
  placement?: Placement;
  /** Offset in px between trigger and dropdown. Default: 6 */
  offsetPx?: number;
  /** Match dropdown width to trigger width. Default: false */
  matchWidth?: boolean;
  /** Fixed dropdown width in px. Takes priority over matchWidth. */
  fixedWidth?: number;
  /** Max height of dropdown in px. */
  maxHeight?: number;
  /** Interaction mode. Default: 'click' */
  interaction?: "click" | "hover";
  /** Hover delay config (only for interaction='hover'). */
  hoverDelay?: { open: number; close: number };
  /**
   * Controlled open state. When provided, hook uses this value
   * instead of internal state (standard controlled component pattern).
   */
  open?: boolean;
  /**
   * Initial open state for uncontrolled mode. Default: false.
   */
  defaultOpen?: boolean;
  /**
   * Callback when open state changes. Works in both controlled
   * and uncontrolled mode.
   */
  onOpenChange?: (open: boolean) => void;
}

export function useFloatingDropdown(options: UseFloatingDropdownOptions = {}) {
  const {
    placement = "bottom-start",
    offsetPx = 6,
    matchWidth = false,
    fixedWidth,
    maxHeight,
    interaction = "click",
    hoverDelay = { open: 200, close: 0 },
    open: controlledOpen,
    defaultOpen = false,
    onOpenChange,
  } = options;

  // ── z-index from context (Z.DROPDOWN on page, Z.PANEL_DROPDOWN in SlidePanel) ──
  const zIndex = useFloatingZ();

  // ── Portal root from context (body on page, div inside SlidePanel) ──
  const portalRoot = useFloatingPortalRoot();

  // ── Controlled vs uncontrolled open state ──
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;

  const handleOpenChange = (next: boolean) => {
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  };

  // ── Middleware (pure functions — useMemo is OK here) ──
  const middleware = useMemo(() => {
    const mw = [
      offset(offsetPx),
      flip({ padding: 8 }),
      shift({ padding: 8 }),
    ];

    if (fixedWidth) {
      mw.push(
        size({
          apply({ elements }) {
            Object.assign(elements.floating.style, {
              width: `${fixedWidth}px`,
              ...(maxHeight ? { maxHeight: `${maxHeight}px` } : {}),
            });
          },
        })
      );
    } else if (matchWidth) {
      mw.push(
        size({
          apply({ rects, elements }) {
            Object.assign(elements.floating.style, {
              width: `${rects.reference.width}px`,
              ...(maxHeight ? { maxHeight: `${maxHeight}px` } : {}),
            });
          },
        })
      );
    } else if (maxHeight) {
      mw.push(
        size({
          apply({ elements }) {
            Object.assign(elements.floating.style, {
              maxHeight: `${maxHeight}px`,
            });
          },
        })
      );
    }

    return mw;
  }, [offsetPx, fixedWidth, matchWidth, maxHeight]);

  // ── Floating core ──
  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: handleOpenChange,
    placement,
    strategy: "fixed",
    middleware,
    whileElementsMounted: autoUpdate,
  });

  // ── Interaction hooks — ALWAYS called at top level (Rules of Hooks) ──
  // Tryb przełączany przez `enabled` flag, NIGDY przez warunek/useMemo.
  const click = useClick(context, { enabled: interaction === "click" });
  const hover = useHover(context, {
    enabled: interaction === "hover",
    delay: hoverDelay,
  });
  const focus = useFocus(context, { enabled: interaction === "hover" });
  const dismiss = useDismiss(context);

  const { getReferenceProps, getFloatingProps } = useInteractions([
    click,
    hover,
    focus,
    dismiss,
  ]);

  // ── Merge zIndex from context into floatingStyles ──
  const styles = useMemo(
    () => ({ ...floatingStyles, zIndex, pointerEvents: "auto" as const }),
    [floatingStyles, zIndex]
  );

  return {
    refs,
    floatingStyles: styles,
    context,
    getReferenceProps,
    getFloatingProps,
    open: isOpen,
    setOpen: handleOpenChange,
    /** Pass to <FloatingPortal root={portalRoot}>. undefined = body. */
    portalRoot,
  };
}
