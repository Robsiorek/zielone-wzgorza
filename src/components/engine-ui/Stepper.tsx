"use client";

/**
 * Stepper — generic numeric +/- control (engine-ui)
 * ────────────────────────────────────────────────────────────────────────
 * Reusable numeric input composed of [−] [value] [+]. NOT domain-specific:
 * will be used by GuestPicker (adults, children, infants, pets) and by any
 * future quantity field (add-on units, kayaks, extra beds, …).
 *
 * API (handoff §5.6):
 *   `value`, `min`, `max`, `onChange`, `label` (aria-label), `disabled`.
 *   Extras kept minimal and orthogonal:
 *     - `step` (integer increment, default 1)
 *     - `size` ("md" default | "sm" compact)
 *     - `formatValue` (optional formatter for the displayed number)
 *
 * Accessibility:
 *   - The value displays via `role="spinbutton"` + `aria-valuenow/min/max`
 *     — the standard ARIA pattern for a stepper.
 *   - Keyboard (when the value element has focus):
 *       ArrowUp / ArrowRight  → increment by `step`
 *       ArrowDown / ArrowLeft → decrement by `step`
 *       Home                  → jump to min
 *       End                   → jump to max
 *   - Buttons are real `<button>` elements — Enter / Space for free.
 *   - Disabled buttons use the native `disabled` attribute; at min/max
 *     only the edge button is disabled (the other remains active).
 *
 * Visual:
 *   - All styling lives in engine-ui.css under `.eui-stepper*`.
 *   - No Tailwind, no inline colors. `size="sm"` uses a CSS modifier class
 *     and is wired through variable `--eui-stepper-btn-size` at the CSS
 *     level (see `.eui-stepper.eui-stepper-sm`).
 */

import * as React from "react";
import { Minus, Plus } from "lucide-react";

// ═══════════════════════════════════════════
// Types
// ═══════════════════════════════════════════

export type StepperSize = "sm" | "md";

export interface StepperProps {
  /** Current value (controlled). */
  value: number;
  /** Minimum allowed value (inclusive). */
  min: number;
  /** Maximum allowed value (inclusive). */
  max: number;
  /** Called with the next value. Receives a clamped integer. */
  onChange: (next: number) => void;
  /** Increment amount. Default 1. Must be a positive integer. */
  step?: number;
  /**
   * Accessible label — describes what is being counted
   * (e.g. "Liczba dorosłych"). Applied to the spinbutton AND to the
   * increment/decrement buttons as part of their aria-label.
   */
  label: string;
  /** Disables the whole control. */
  disabled?: boolean;
  /** Visual size. Default "md". */
  size?: StepperSize;
  /**
   * Optional display formatter. Return the text to render in place of the
   * raw number (e.g. `(n) => n === 0 ? "Brak" : String(n)`).
   * The raw number is always what's sent to `onChange` and to ARIA.
   */
  formatValue?: (value: number) => string;
  /** Extra className merged onto the root. */
  className?: string;
}

// ═══════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════

function clamp(n: number, min: number, max: number): number {
  if (n < min) return min;
  if (n > max) return max;
  return n;
}

function mergeClass(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

// ═══════════════════════════════════════════
// Component
// ═══════════════════════════════════════════

export const Stepper = React.forwardRef<HTMLDivElement, StepperProps>(
  function Stepper(
    {
      value,
      min,
      max,
      onChange,
      step = 1,
      label,
      disabled = false,
      size = "md",
      formatValue,
      className,
    },
    ref
  ) {
    const atMin = value <= min;
    const atMax = value >= max;

    const commit = React.useCallback(
      (next: number) => {
        if (disabled) return;
        const clamped = clamp(next, min, max);
        if (clamped === value) return;
        onChange(clamped);
      },
      [disabled, min, max, value, onChange]
    );

    const handleDecrement = () => commit(value - step);
    const handleIncrement = () => commit(value + step);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLSpanElement>) => {
      if (disabled) return;
      switch (e.key) {
        case "ArrowUp":
        case "ArrowRight":
          e.preventDefault();
          commit(value + step);
          break;
        case "ArrowDown":
        case "ArrowLeft":
          e.preventDefault();
          commit(value - step);
          break;
        case "Home":
          e.preventDefault();
          commit(min);
          break;
        case "End":
          e.preventDefault();
          commit(max);
          break;
      }
    };

    const rootClass = mergeClass(
      "eui-stepper",
      size === "sm" && "eui-stepper-sm",
      disabled && "eui-stepper-disabled",
      className
    );

    const displayed = formatValue ? formatValue(value) : String(value);

    return (
      <div ref={ref} className={rootClass}>
        <button
          type="button"
          className="eui-stepper-btn"
          onClick={handleDecrement}
          disabled={disabled || atMin}
          aria-label={`Zmniejsz: ${label}`}
          tabIndex={disabled ? -1 : 0}
        >
          <Minus size={size === "sm" ? 14 : 16} strokeWidth={2} aria-hidden="true" />
        </button>

        <span
          className="eui-stepper-value"
          role="spinbutton"
          aria-label={label}
          aria-valuenow={value}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-disabled={disabled || undefined}
          tabIndex={disabled ? -1 : 0}
          onKeyDown={handleKeyDown}
        >
          {displayed}
        </span>

        <button
          type="button"
          className="eui-stepper-btn"
          onClick={handleIncrement}
          disabled={disabled || atMax}
          aria-label={`Zwiększ: ${label}`}
          tabIndex={disabled ? -1 : 0}
        >
          <Plus size={size === "sm" ? 14 : 16} strokeWidth={2} aria-hidden="true" />
        </button>
      </div>
    );
  }
);
