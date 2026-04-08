/**
 * format.ts — Central money formatting & parsing.
 *
 * C1a: All financial values are stored as Int (grosze / minor units).
 * These two functions are the ONLY way to convert between user-facing
 * złotówki and internal grosze.
 *
 * RULES:
 *   - Components NEVER do manual `* 100` or `/ 100`
 *   - Use `parseMoneyToMinor(input)` for form inputs → API
 *   - Use `formatMoneyMinor(minor)` for API/DB → display
 */

/**
 * Convert a known-clean number (zł) to minor units (grosze).
 * Use for computed values in form state where the value is already a number.
 * For string inputs from forms, use parseMoneyToMinor() instead.
 *
 * @example toMinor(350) → 35000
 * @example toMinor(120.50) → 12050
 */
export function toMinor(zl: number): number {
  return Math.round(zl * 100);
}

/**
 * Convert minor units to zł number for input field values.
 * NOT for display text — use formatMoneyMinor() for that.
 *
 * @example fromMinor(35000) → 350
 * @example fromMinor(12050) → 120.5
 */
export function fromMinor(minor: number): number {
  return minor / 100;
}

const moneyFormatter = new Intl.NumberFormat("pl-PL", {
  style: "currency",
  currency: "PLN",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/**
 * Format minor units (grosze) → user-facing string.
 *
 * @example formatMoneyMinor(35000) → "350 zł"
 * @example formatMoneyMinor(12050) → "120,50 zł"
 * @example formatMoneyMinor(0) → "0 zł"
 */
export function formatMoneyMinor(minor: number): string {
  return moneyFormatter.format(minor / 100);
}

/**
 * Parse user input (złotówki) → minor units (grosze).
 *
 * Handles:
 *   - Polish decimal separator: "350,50" → 35050
 *   - Dot separator: "350.50" → 35050
 *   - Whitespace/spaces: " 1 200,50 " → 120050
 *   - Integer input: "350" → 35000
 *   - Max 2 decimal places (truncates/rounds standard: half-up)
 *
 * @returns Int (grosze), always >= 0. Returns 0 for invalid input.
 *
 * @example parseMoneyToMinor("350") → 35000
 * @example parseMoneyToMinor("350,50") → 35050
 * @example parseMoneyToMinor("1 200.99") → 120099
 * @example parseMoneyToMinor("") → 0
 * @example parseMoneyToMinor("abc") → 0
 */
export function parseMoneyToMinor(input: string): number {
  if (!input || typeof input !== "string") return 0;

  // Strip whitespace and non-breaking spaces
  let cleaned = input.replace(/\s/g, "");

  // Replace Polish comma with dot
  cleaned = cleaned.replace(",", ".");

  // Remove any characters that aren't digits or dot
  cleaned = cleaned.replace(/[^\d.]/g, "");

  if (!cleaned) return 0;

  const parsed = parseFloat(cleaned);
  if (isNaN(parsed) || parsed < 0) return 0;

  // Round to nearest grosz (standard half-up rounding)
  return Math.round(parsed * 100);
}

/**
 * Sync helper: build legacy Decimal fields from Minor fields.
 *
 * Given an object with *Minor keys, returns a flat object with
 * the corresponding legacy Decimal values (minor / 100).
 *
 * @example
 *   syncLegacyFromMinor({ subtotalMinor: 35000, discountMinor: 500, totalMinor: 34500 })
 *   → { subtotal: 350, discount: 5, total: 345 }
 *
 * @example
 *   syncLegacyFromMinor({ pricePerUnitMinor: 20000, totalPriceMinor: 60000 })
 *   → { pricePerUnit: 200, totalPrice: 600 }
 */
export function syncLegacyFromMinor(minorData: Record<string, number>): Record<string, number> {
  const legacy: Record<string, number> = {};
  for (const [key, value] of Object.entries(minorData)) {
    if (key.endsWith("Minor")) {
      const legacyKey = key.slice(0, -5); // Remove "Minor" suffix
      legacy[legacyKey] = value / 100;
    }
  }
  return legacy;
}

/**
 * Combine minor + legacy fields for Prisma create/update.
 *
 * Returns a single object with both *Minor (Int) and legacy Decimal fields.
 * This is the ONLY correct way to build financial data for DB writes.
 *
 * @example
 *   withLegacySync({ subtotalMinor: 35000, discountMinor: 500, totalMinor: 34500 })
 *   → { subtotalMinor: 35000, discountMinor: 500, totalMinor: 34500, subtotal: 350, discount: 5, total: 345 }
 */
export function withLegacySync(minorData: Record<string, number>): Record<string, number> {
  return { ...minorData, ...syncLegacyFromMinor(minorData) };
}
