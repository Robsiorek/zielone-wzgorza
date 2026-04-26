"use client";

/**
 * useKeyboardShortcut — register a keyboard shortcut with proper cleanup.
 *
 * Used for Escape to close popover/modal, Arrow keys in datepicker, etc.
 * Handles the common gotchas:
 *   - Only fires when the target is not an input/textarea (so typing
 *     doesn't accidentally trigger a shortcut)
 *   - Accepts modifiers (Meta/Ctrl/Alt/Shift)
 *   - Cleanup on unmount
 *
 * For a local-scope shortcut (only when a specific element is focused),
 * put `onKeyDown` directly on that element instead. This hook is for
 * GLOBAL shortcuts (ESC from anywhere closes modal).
 */

import * as React from "react";

export interface ShortcutOptions {
  /** The key to match (e.g. "Escape", "k", "ArrowDown"). Case-insensitive. */
  key: string;
  /** Modifiers required. */
  meta?: boolean;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  /** Called on match. */
  handler: (e: KeyboardEvent) => void;
  /** Disable the shortcut (e.g. modal not open). */
  disabled?: boolean;
  /** Allow firing when an input/textarea is focused. Default false. */
  allowInInput?: boolean;
}

const INPUT_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

export function useKeyboardShortcut({
  key,
  meta,
  ctrl,
  alt,
  shift,
  handler,
  disabled,
  allowInInput,
}: ShortcutOptions): void {
  const handlerRef = React.useRef(handler);
  handlerRef.current = handler;

  React.useEffect(() => {
    if (disabled || typeof window === "undefined") return;

    const listener = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== key.toLowerCase()) return;
      if (!!meta !== e.metaKey) return;
      if (!!ctrl !== e.ctrlKey) return;
      if (!!alt !== e.altKey) return;
      if (!!shift !== e.shiftKey) return;

      if (!allowInInput) {
        const target = e.target as HTMLElement | null;
        if (target && INPUT_TAGS.has(target.tagName)) return;
        if (target && target.isContentEditable) return;
      }

      handlerRef.current(e);
    };

    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [key, meta, ctrl, alt, shift, disabled, allowInInput]);
}
