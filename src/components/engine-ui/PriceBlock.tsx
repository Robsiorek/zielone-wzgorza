"use client";

/**
 * PriceBlock — price display for result cards (engine-ui)
 * ────────────────────────────────────────────────────────────────────────
 * Shows per-night price (always), optional total + nights count,
 * and an optional badge ("Najlepsza cena").
 *
 * All amounts are in minor units (grosze) — formatted to PLN display
 * inside this component. No floats cross the boundary.
 */

export interface PriceBlockProps {
  /** Per-night price in minor units (grosze). */
  perNightMinor: number;
  /** Total stay price in minor units. */
  totalMinor?: number;
  /** Number of nights. */
  nights?: number;
  /** Badge text, e.g. "Najlepsza cena". */
  badge?: string;
  /** Currency code. */
  currency: string;
  className?: string;
}

/**
 * Format minor units to display string.
 * 18900 → "189 zł", 18950 → "189,50 zł"
 */
function formatPrice(minor: number, currency: string): string {
  const major = Math.floor(minor / 100);
  const cents = minor % 100;
  const symbol = currency === "PLN" ? "zł" : currency;
  if (cents === 0) return `${major} ${symbol}`;
  return `${major},${String(cents).padStart(2, "0")} ${symbol}`;
}

export function PriceBlock({
  perNightMinor,
  totalMinor,
  nights,
  badge,
  currency,
  className,
}: PriceBlockProps) {
  const rootClass = ["eui-price-block", className].filter(Boolean).join(" ");

  return (
    <div className={rootClass}>
      {badge && <span className="eui-price-badge">{badge}</span>}
      <div className="eui-price-main">
        <span className="eui-price-amount">{formatPrice(perNightMinor, currency)}</span>
        <span className="eui-price-unit">/ noc</span>
      </div>
      {totalMinor != null && nights != null && nights > 0 && (
        <div className="eui-price-total">
          {formatPrice(totalMinor, currency)} łącznie · {nights}{" "}
          {nights === 1 ? "noc" : nights < 5 ? "noce" : "nocy"}
        </div>
      )}
    </div>
  );
}
