"use client";

/**
 * useFocusVisible — distinguish keyboard focus from mouse focus.
 *
 * Problem: native `:focus` fires on mouse click too, causing the focus
 * ring to appear during normal clicking — visual noise. We want the
 * ring ONLY when the user is navigating via keyboard (Tab, Arrow keys,
 * Enter to activate).
 *
 * Modern CSS has `:focus-visible` which handles this correctly, but
 * imperative code (portals, animations, conditional class logic)
 * sometimes needs to know the state. This hook provides it.
 *
 * Usage:
 *   const { isFocusVisible, focusProps } = useFocusVisible<HTMLButtonElement>();
 *   <button ref={focusProps.ref} onFocus={focusProps.onFocus} onBlur={focusProps.onBlur}>
 *     {isFocusVisible && <FocusRing />}
 *   </button>
 *
 * Usually you don't need this — just use CSS `:focus-visible`. Reach for
 * this hook when the focus ring can't be pure CSS (e.g. painted on a
 * sibling element, or part of a complex compound component).
 */

import * as React from "react";

let globalKeyboardMode = false;
const listeners = new Set<(v: boolean) => void>();

// Initialize once on module load. Tracks whether the last user input
// was keyboard or pointer. Any component using the hook subscribes.
if (typeof window !== "undefined") {
  const onKeydown = (e: KeyboardEvent) => {
    // Ignore modifier-only presses. Real navigation keys flip the flag.
    if (e.metaKey || e.altKey || e.ctrlKey) return;
    if (!globalKeyboardMode) {
      globalKeyboardMode = true;
      listeners.forEach((l) => l(true));
    }
  };
  const onPointerDown = () => {
    if (globalKeyboardMode) {
      globalKeyboardMode = false;
      listeners.forEach((l) => l(false));
    }
  };
  window.addEventListener("keydown", onKeydown, true);
  window.addEventListener("mousedown", onPointerDown, true);
  window.addEventListener("pointerdown", onPointerDown, true);
  window.addEventListener("touchstart", onPointerDown, true);
}

export interface FocusVisibleResult<T extends HTMLElement> {
  /** True when the currently-focused element was focused via keyboard. */
  isFocusVisible: boolean;
  /** Props to spread on the focusable element. */
  focusProps: {
    ref: React.RefObject<T>;
    onFocus: (e: React.FocusEvent<T>) => void;
    onBlur: (e: React.FocusEvent<T>) => void;
  };
}

export function useFocusVisible<T extends HTMLElement>(): FocusVisibleResult<T> {
  const ref = React.useRef<T>(null);
  const [isFocused, setIsFocused] = React.useState(false);
  const [keyboardMode, setKeyboardMode] = React.useState(globalKeyboardMode);

  React.useEffect(() => {
    const listener = (v: boolean) => setKeyboardMode(v);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const isFocusVisible = isFocused && keyboardMode;

  return {
    isFocusVisible,
    focusProps: {
      ref,
      onFocus: () => setIsFocused(true),
      onBlur: () => setIsFocused(false),
    },
  };
}
