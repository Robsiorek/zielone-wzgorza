/**
 * Root page (/) — Booking engine entry point.
 *
 * B5a: Server component that reads searchParams and delegates to BookingEngine.
 * Replaces old redirect to /admin/dashboard.
 *
 * App Router searchParams can be string | string[] | undefined per key.
 * We normalize to Record<string, string> (first value wins) before passing
 * to the client component.
 *
 * URL examples:
 *   / → explore mode (resource catalog)
 *   /?checkIn=2026-07-10&checkOut=2026-07-14&guests=2 → results mode (availability)
 *   /?checkIn=2026-07-10&checkOut=2026-07-14&resource=domek-hobbita-1 → resource mode (detail/quote)
 */

import { BookingEngine } from "@/components/booking/BookingEngine";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Record<string, string | string[] | undefined>;
}

/** Normalize App Router searchParams → Record<string, string> (first value wins) */
function normalizeParams(raw: Record<string, string | string[] | undefined>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, val] of Object.entries(raw)) {
    if (val === undefined) continue;
    out[key] = Array.isArray(val) ? val[0] : val;
  }
  return out;
}

export default function EngineRootPage({ searchParams }: Props) {
  return <BookingEngine searchParams={normalizeParams(searchParams)} />;
}
