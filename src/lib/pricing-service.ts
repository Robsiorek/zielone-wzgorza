/**
 * Pricing Service — single source of truth for reservation pricing.
 *
 * v5.0 — C1a: All amounts in minor units (grosze, Int).
 *
 * Used by:
 *   - POST /api/reservations (creation)
 *   - PATCH /api/reservations/[id] (edit — recalculate on resource change)
 *   - Future: frontend preview
 *
 * Pure function, no side effects, no DB calls.
 * ALL values are Int (grosze). No Decimal, no float arithmetic on money.
 */

export interface ResourcePriceInput {
  /** Cena za noc w groszach */
  pricePerNightMinor: number;
  /** Jeśli podane, nadpisuje pricePerNightMinor * nights (grosze) */
  pricePerStayMinor?: number | null;
  nights: number;
}

export interface AddonPriceInput {
  /** Cena jednostkowa w groszach */
  unitPriceMinor: number;
  quantity: number;
}

export interface PricingResult {
  /** Suma zasobów w groszach */
  resourcesTotalMinor: number;
  /** Suma addonów w groszach */
  addonsTotalMinor: number;
  /** Suma netto (zasoby + addony) w groszach */
  subtotalMinor: number;
  /** Rabat w groszach */
  discountMinor: number;
  /** Razem do zapłaty w groszach */
  totalMinor: number;
}

/**
 * Calculate reservation totals in minor units (grosze).
 *
 * For each resource: pricePerStayMinor overrides pricePerNightMinor * nights.
 * Addons: unitPriceMinor * quantity.
 * Total = subtotal - discount (min 0).
 *
 * All inputs and outputs are Int. No floating point.
 */
export function calculateReservationTotals(
  resources: ResourcePriceInput[],
  addons: AddonPriceInput[] = [],
  discountMinor: number = 0,
): PricingResult {
  const resourcesTotalMinor = resources.reduce((sum, r) => {
    const amount = r.pricePerStayMinor != null
      ? r.pricePerStayMinor
      : r.pricePerNightMinor * r.nights;
    return sum + amount;
  }, 0);

  const addonsTotalMinor = addons.reduce((sum, a) => {
    return sum + a.unitPriceMinor * a.quantity;
  }, 0);

  const subtotalMinor = resourcesTotalMinor + addonsTotalMinor;
  const totalMinor = Math.max(0, subtotalMinor - discountMinor);

  return {
    resourcesTotalMinor,
    addonsTotalMinor,
    subtotalMinor,
    discountMinor,
    totalMinor,
  };
}
