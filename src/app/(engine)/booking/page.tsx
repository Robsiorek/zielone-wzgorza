/**
 * /booking → 307 redirect to / (preserves query params).
 *
 * B5a: Legacy URL — root (/) is now the engine entry point.
 * Using 307 (temporary) per brief: "Twardego 301 dopiero gdy stabilne".
 *
 * App Router searchParams can be string | string[] | undefined per key,
 * so we normalize safely before building the query string.
 */

import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Record<string, string | string[] | undefined>;
}

/** Safely build query string from App Router searchParams */
function buildQueryString(params: Record<string, string | string[] | undefined>): string {
  const sp = new URLSearchParams();
  for (const [key, val] of Object.entries(params)) {
    if (val === undefined) continue;
    if (Array.isArray(val)) {
      for (const v of val) sp.append(key, v);
    } else {
      sp.set(key, val);
    }
  }
  return sp.toString();
}

export default function LegacyBookingRedirect({ searchParams }: Props) {
  const query = buildQueryString(searchParams);
  redirect(`/${query ? `?${query}` : ""}`);
}
