/**
 * Operational Times — resolve check-in/out times per category.
 *
 * D 159-162: ResourceCategory.checkInTimeOverride → fallback → CompanySettings.
 * Uses date-fns-tz for DST-safe Warsaw local → UTC conversion.
 *
 * Usage:
 *   const { checkInTime, checkOutTime } = await resolveOperationalTimes(tx, categoryId);
 *   const startAt = combineDateAndTime("2026-04-01", checkInTime);
 *   const endAt = combineDateAndTime("2026-04-05", checkOutTime);
 */

import { fromZonedTime } from "date-fns-tz";

const TIMEZONE = "Europe/Warsaw";

// ── Time format validation ──

const TIME_REGEX = /^\d{2}:\d{2}$/;

export function isValidTimeFormat(time: string | null | undefined): boolean {
  if (!time) return true; // null = use global
  if (!TIME_REGEX.test(time)) return false;
  const [h, m] = time.split(":").map(Number);
  return h >= 0 && h <= 23 && m >= 0 && m <= 59;
}

// ── Resolve times ──

interface OperationalTimes {
  checkInTime: string;   // "HH:MM"
  checkOutTime: string;  // "HH:MM"
}

/**
 * Resolve check-in/out times for a category.
 * Priority: category override → global CompanySettings.
 *
 * @param tx - Prisma transaction or client
 * @param categoryId - ResourceCategory ID (loads category + global settings)
 */
export async function resolveOperationalTimes(
  tx: any,
  categoryId: string
): Promise<OperationalTimes> {
  // Load category + global in parallel
  const [category, settings] = await Promise.all([
    tx.resourceCategory.findUnique({
      where: { id: categoryId },
      select: { checkInTimeOverride: true, checkOutTimeOverride: true },
    }),
    tx.companySettings.findFirst({
      select: { checkInTime: true, checkOutTime: true },
    }),
  ]);

  const globalCheckIn = settings?.checkInTime || "15:00";
  const globalCheckOut = settings?.checkOutTime || "11:00";

  return {
    checkInTime: category?.checkInTimeOverride || globalCheckIn,
    checkOutTime: category?.checkOutTimeOverride || globalCheckOut,
  };
}

/**
 * Combine a date string (YYYY-MM-DD) with a time string (HH:MM)
 * in Europe/Warsaw timezone → UTC Date for DB storage.
 *
 * DST-safe: uses date-fns-tz fromZonedTime (formerly zonedTimeToUtc).
 *
 * Example:
 *   combineDateAndTime("2026-04-01", "15:00") → Date(2026-04-01T13:00:00.000Z) in CEST
 *   combineDateAndTime("2026-01-15", "15:00") → Date(2026-01-15T14:00:00.000Z) in CET
 */
export function combineDateAndTime(dateStr: string, timeStr: string): Date {
  // Build local datetime string: "2026-04-01T15:00:00"
  const localDatetime = `${dateStr}T${timeStr}:00`;

  // Convert Warsaw local → UTC (DST-aware)
  return fromZonedTime(localDatetime, TIMEZONE);
}

/**
 * Extract date string (YYYY-MM-DD) from a Date object.
 * Used when we need the business date from a reservation's checkIn/checkOut.
 */
export function toDateStr(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().split("T")[0];
}
