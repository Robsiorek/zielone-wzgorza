/**
 * Date utilities for Zielone Wzgórza admin panel.
 *
 * ZASADY:
 * 1. Daty pobytowe (rezerwacje, blokady, sezony) = string YYYY-MM-DD, bez czasu
 * 2. Timestamps (createdAt, updatedAt, logi) = ISO DateTime, timezone OK
 * 3. API przyjmuje i zwraca daty jako string YYYY-MM-DD
 * 4. Date object tylko tam, gdzie wymagany (Prisma, display)
 *
 * ZAKAZANE:
 * - new Date("YYYY-MM-DD") — JS parsuje jako UTC
 * - toISOString() dla dat pobytowych
 * - manipulowanie godziną (np. 12:00 hack)
 * - str.split("T")[0] na ISO timestamps z Prisma (Prisma zwraca DATE jako
 *   midnight local → UTC, np. "2026-04-01T22:00:00.000Z" dla daty 2026-04-02
 *   w Polsce UTC+2. Obcięcie T daje zły dzień!)
 *
 * DOZWOLONE:
 * - dateForDB("2026-03-05") → Date z explicit UTC midnight → Prisma → PostgreSQL DATE
 * - parseLocalDate("2026-03-05") → Date w local timezone → TYLKO do display
 * - operacje na stringach YYYY-MM-DD (porównania, nightsBetween)
 */

// ═══════════════════════════════════════════
// INTERNAL — extract YYYY-MM-DD from any input
// ═══════════════════════════════════════════

/** Extract the correct date string from either "YYYY-MM-DD" or ISO timestamp.
 *  For ISO timestamps (from Prisma): uses LOCAL timezone interpretation,
 *  because Prisma serializes DATE columns as local midnight → UTC. */
function extractDateStr(str: string): string {
  if (!str.includes("T")) return str;
  // ISO timestamp from Prisma — parse and extract LOCAL date
  // "2026-04-01T22:00:00.000Z" in Poland (UTC+2) = April 2 local
  const d = new Date(str);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// ═══════════════════════════════════════════
// DATABASE — Date object for Prisma writes/queries
// ═══════════════════════════════════════════

/** Convert "YYYY-MM-DD" (or Prisma ISO timestamp) to UTC midnight Date for Prisma.
 *  "2026-03-05" → 2026-03-05T00:00:00.000Z → PostgreSQL DATE = 2026-03-05 */
export function dateForDB(str: string): Date {
  const dateOnly = extractDateStr(str);
  return new Date(dateOnly + "T00:00:00.000Z");
}

// ═══════════════════════════════════════════
// DISPLAY — Date object for UI formatting only
// ═══════════════════════════════════════════

/** Parse "YYYY-MM-DD" (or Prisma ISO timestamp) to local Date for display.
 *  Do NOT pass this to Prisma — use dateForDB instead. */
export function parseLocalDate(str: string): Date {
  const dateOnly = extractDateStr(str);
  const [y, m, d] = dateOnly.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// ═══════════════════════════════════════════
// STRING OPERATIONS — no Date objects needed
// ═══════════════════════════════════════════

/** Format Date to "YYYY-MM-DD" using LOCAL timezone. */
export function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Get today as "YYYY-MM-DD" in local timezone. */
export function todayStr(): string {
  return toDateStr(new Date());
}

/** Calculate nights between two date strings (YYYY-MM-DD or ISO).
 *  Uses UTC dates internally — no timezone issues. */
export function nightsBetween(startStr: string, endStr: string): number {
  const s = dateForDB(startStr).getTime();
  const e = dateForDB(endStr).getTime();
  return Math.max(0, Math.round((e - s) / (1000 * 60 * 60 * 24)));
}

/** Compare two "YYYY-MM-DD" strings. Returns -1, 0, or 1. */
export function compareDates(a: string, b: string): number {
  const sa = extractDateStr(a);
  const sb = extractDateStr(b);
  if (sa < sb) return -1;
  if (sa > sb) return 1;
  return 0;
}

// ═══════════════════════════════════════════
// POLISH DISPLAY HELPERS
// ═══════════════════════════════════════════

/** Format date string for Polish display (e.g. "5 marca 2026"). */
export function fmtDatePL(str: string): string {
  return parseLocalDate(str).toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" });
}

/** Format date string for short Polish display (e.g. "5 mar 2026"). */
export function fmtDateShortPL(str: string): string {
  return parseLocalDate(str).toLocaleDateString("pl-PL", { day: "numeric", month: "short", year: "numeric" });
}
