"use client";

/**
 * BookingEngine.tsx — Root orchestrator for the booking engine.
 *
 * B5a: Parses URL params → determines mode → delegates to view.
 * - explore:  ExploreView (resource catalog) — Phase 3
 * - results:  BookingWidget with pre-filled dates (auto-skip: Phase 5)
 * - resource: BookingWidget with pre-filled dates + slug stored (auto-skip: Phase 5)
 *
 * Phase 2 behavior: dates are pre-filled in StepDates form, user still clicks
 * "Szukaj" to proceed. Full auto-skip to StepResults/StepQuote is Phase 5.
 *
 * Design: thin orchestration layer — no fetching, no heavy UI.
 * Uses parseBookingParams() which returns mode + fallbackReason in one call.
 */

import React, { useMemo } from "react";
import { parseBookingParams } from "@/lib/booking-params";
import { BookingWidget } from "./BookingWidget";

// ═══════════════════════════════════════════
// Types
// ═══════════════════════════════════════════

interface Props {
  searchParams: Record<string, string>;
}

// ═══════════════════════════════════════════
// Explore View placeholder (Phase 3)
// ═══════════════════════════════════════════

function ExploreViewPlaceholder() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5">
      <div className="text-center space-y-3 max-w-md">
        <div className="text-4xl">🏡</div>
        <h1 className="text-2xl font-bold text-foreground">
          Zielone Wzgórza
        </h1>
        <p className="text-[14px] text-muted-foreground">
          Silnik rezerwacyjny — widok katalogu w przygotowaniu (Faza 3)
        </p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// Main component
// ═══════════════════════════════════════════

export function BookingEngine({ searchParams }: Props) {
  const parsed = useMemo(
    () => parseBookingParams(searchParams),
    [searchParams]
  );

  // ── Explore: no valid dates → show catalog (Phase 3 will replace placeholder) ──
  if (parsed.mode === "explore") {
    return <ExploreViewPlaceholder />;
  }

  // ── Results / Resource: pass pre-filled dates to BookingWidget ──
  // Phase 2: dates pre-filled in StepDates, user clicks "Szukaj" manually.
  // Phase 5: auto-skip to StepResults (results) or StepQuote (resource).
  return (
    <BookingWidget
      initialDates={{
        checkIn: parsed.checkIn!,
        checkOut: parsed.checkOut!,
        adults: parsed.guests,
        children: 0,
      }}
      resourceIntent={parsed.mode === "resource" ? parsed.resourceSlug : null}
    />
  );
}
