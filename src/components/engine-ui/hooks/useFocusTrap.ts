"use client";

/**
 * useFocusTrap — trap keyboard focus inside a container.
 *
 * When a modal or sheet is open, Tab/Shift-Tab should cycle within the
 * modal, not escape to the page behind. This hook attaches to a ref and
 * enforces that behavior.
 *
 * Behavior:
 *   - On activation: focus moves to the first focusable element inside
 *     (unless one already has focus via `autoFocus`)
 *   - Tab from the last focusable → first
 *   - Shift+Tab from the first → last
 *   - On deactivation: focus returns to the element that was focused
 *     before the trap activated (restoreFocus)
 *
 * Usage:
 *   const trapRef = React.useRef<HTMLDivElement>(null);
 *   useFocusTrap(trapRef, isOpen);
 *   return <div ref={trapRef}>...</div>;
 */

import * as React from "react";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

export function useFocusTrap(
  ref: React.RefObject<HTMLElement>,
  active: boolean
): void {
  const restoreRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    if (!active || !ref.current) return;

    restoreRef.current = document.activeElement as HTMLElement | null;
    const container = ref.current;

    // Move initial focus in, unless something inside already has it.
    const alreadyFocused =
      document.activeElement && container.contains(document.activeElement);
    if (!alreadyFocused) {
      const first = container.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      first?.focus({ preventScroll: true });
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const focusables = Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      ).filter(
        (el) => !el.hasAttribute("aria-hidden") && el.offsetParent !== null
      );
      if (focusables.length === 0) {
        e.preventDefault();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const current = document.activeElement as HTMLElement;

      if (e.shiftKey && current === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && current === last) {
        e.preventDefault();
        first.focus();
      }
    };

    container.addEventListener("keydown", onKeyDown);
    return () => {
      container.removeEventListener("keydown", onKeyDown);
      // Restore focus to the previously focused element.
      if (restoreRef.current && typeof restoreRef.current.focus === "function") {
        restoreRef.current.focus({ preventScroll: true });
      }
    };
  }, [ref, active]);
}
