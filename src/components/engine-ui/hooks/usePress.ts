"use client";

/**
 * usePress — pointer-agnostic press state with correct cancellation.
 *
 * React's onClick fires on release, not press — we can't use it to show
 * a visual "pressed" feedback. Native :active works for mouse but breaks
 * on touch (fires on touchstart, sticks if the user swipes off). Radix
 * has its own press primitive but heavy for simple cases.
 *
 * This hook gives you:
 *   - isPressed: boolean you read during render
 *   - pressProps: spread on the interactive element
 *
 * Cancellation rules:
 *   - pointer leaves the element → pressed = false
 *   - pointer released ANYWHERE → pressed = false
 *   - Escape key during keyboard press → pressed = false
 *
 * Keyboard:
 *   - Space/Enter hold → pressed = true
 *   - Release or Escape → pressed = false
 *
 * This intentionally does NOT handle activation (the "click" firing) —
 * that's the native element's job. `usePress` is purely visual feedback.
 *
 * Usage:
 *   const { isPressed, pressProps } = usePress({ disabled });
 *   <button {...pressProps} style={{ transform: isPressed ? 'scale(0.94)' : 'none' }}>
 */

import * as React from "react";

export interface PressOptions {
  disabled?: boolean;
  /** Called on press start — e.g. haptic feedback, analytics. */
  onPressStart?: () => void;
  /** Called on press end (whether activated or cancelled). */
  onPressEnd?: () => void;
}

export interface PressResult {
  isPressed: boolean;
  pressProps: {
    onPointerDown: (e: React.PointerEvent) => void;
    onPointerUp: (e: React.PointerEvent) => void;
    onPointerCancel: (e: React.PointerEvent) => void;
    onPointerLeave: (e: React.PointerEvent) => void;
    onKeyDown: (e: React.KeyboardEvent) => void;
    onKeyUp: (e: React.KeyboardEvent) => void;
  };
}

export function usePress({ disabled, onPressStart, onPressEnd }: PressOptions = {}): PressResult {
  const [isPressed, setIsPressed] = React.useState(false);
  const isPressedRef = React.useRef(false);

  const start = React.useCallback(() => {
    if (disabled) return;
    if (!isPressedRef.current) {
      isPressedRef.current = true;
      setIsPressed(true);
      onPressStart?.();
    }
  }, [disabled, onPressStart]);

  const end = React.useCallback(() => {
    if (isPressedRef.current) {
      isPressedRef.current = false;
      setIsPressed(false);
      onPressEnd?.();
    }
  }, [onPressEnd]);

  const pressProps: PressResult["pressProps"] = {
    onPointerDown: (e) => {
      // Left button only (primary).
      if (e.button !== 0) return;
      start();
    },
    onPointerUp: () => end(),
    onPointerCancel: () => end(),
    onPointerLeave: () => end(),
    onKeyDown: (e) => {
      if (disabled) return;
      if (e.key === "Enter" || e.key === " ") {
        if (e.repeat) return; // Don't re-fire on held keys.
        start();
      }
    },
    onKeyUp: (e) => {
      if (e.key === "Enter" || e.key === " " || e.key === "Escape") {
        end();
      }
    },
  };

  return { isPressed, pressProps };
}
