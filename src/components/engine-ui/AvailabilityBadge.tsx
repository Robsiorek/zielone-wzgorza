"use client";

/**
 * AvailabilityBadge — availability status indicator (engine-ui)
 * ────────────────────────────────────────────────────────────────────────
 * Three states: available (green), limited (amber), unavailable (grey).
 * Renders as a small inline badge with a dot indicator + text.
 */

import type { AvailabilityStatus } from "./results-types";

const DEFAULT_LABELS: Record<AvailabilityStatus, string> = {
  available: "Dostępne",
  limited: "Ostatnie miejsca",
  unavailable: "Niedostępne",
};

export interface AvailabilityBadgeProps {
  status: AvailabilityStatus;
  /** Override default label. */
  label?: string;
  className?: string;
}

export function AvailabilityBadge({
  status,
  label,
  className,
}: AvailabilityBadgeProps) {
  const text = label ?? DEFAULT_LABELS[status];

  const rootClass = [
    "eui-avail-badge",
    `eui-avail-${status}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={rootClass}>
      <span className="eui-avail-dot" aria-hidden="true" />
      {text}
    </span>
  );
}
