"use client";

/**
 * BookingEngine.tsx — Root orchestrator for the booking engine.
 *
 * B5a Phase 3: Routes between ExploreView and BookingWidget based on URL params.
 * - explore:  ExploreView (resource catalog)
 * - results:  Loading overlay → BookingWidget with pre-filled dates
 * - resource: Loading overlay → BookingWidget with pre-filled dates + resourceIntent
 *
 * Loading overlay contract:
 *   hideOverlay = minTimeElapsed && contentReady
 *   - minTimeElapsed: ~600ms anti-flash timer
 *   - contentReady: BookingWidget signals via onReady callback
 *   Overlay resets on mode change (explore ↔ results/resource).
 */

import React, { useMemo, useState, useEffect, useCallback } from "react";
import { parseBookingParams } from "@/lib/booking-params";
import { BookingWidget } from "./BookingWidget";
import { ExploreView } from "./ExploreView";

// ═══════════════════════════════════════════
// Types
// ═══════════════════════════════════════════

interface Props {
  searchParams: Record<string, string>;
}

// ═══════════════════════════════════════════
// Loading Overlay (results/resource entry)
// ═══════════════════════════════════════════

const OVERLAY_MESSAGES = [
  "Wczytujemy Twoje zapytanie...",
  "Sprawdzamy dostępność domków...",
];

function LoadingOverlay() {
  const [messageIdx, setMessageIdx] = useState(0);

  useEffect(() => {
    const msgTimer = setTimeout(() => setMessageIdx(1), 800);
    return () => clearTimeout(msgTimer);
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center animate-in fade-in duration-150">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
      {/* Card */}
      <div className="relative bg-card rounded-[20px] px-8 py-7 flex flex-col items-center gap-4"
        style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.12)", minWidth: 260 }}>
        {/* Spinner */}
        <div className="h-8 w-8 rounded-full border-[3px] border-muted border-t-primary animate-spin" />
        {/* Message */}
        <p className="text-[14px] font-medium text-foreground text-center transition-opacity duration-200">
          {OVERLAY_MESSAGES[messageIdx]}
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

  const needsOverlay = parsed.mode === "results" || parsed.mode === "resource";

  // Overlay state: both conditions must be true to dismiss
  const [minTimePassed, setMinTimePassed] = useState(false);
  const [contentReady, setContentReady] = useState(false);

  // Reset overlay state when mode changes (explore ↔ results/resource)
  useEffect(() => {
    if (needsOverlay) {
      setMinTimePassed(false);
      setContentReady(false);
      const timer = setTimeout(() => setMinTimePassed(true), 600);
      return () => clearTimeout(timer);
    } else {
      // Explore mode: no overlay needed
      setMinTimePassed(true);
      setContentReady(true);
    }
  }, [needsOverlay, parsed.checkIn, parsed.checkOut, parsed.resourceSlug]);

  // Stable callback for BookingWidget onReady
  const handleContentReady = useCallback(() => {
    setContentReady(true);
  }, []);

  const showOverlay = needsOverlay && !(minTimePassed && contentReady);

  // ── Explore: no valid dates → show catalog ──
  if (parsed.mode === "explore") {
    return <ExploreView />;
  }

  // ── Results / Resource: overlay until ready, then BookingWidget ──
  return (
    <>
      {showOverlay && <LoadingOverlay />}
      <BookingWidget
        initialDates={{
          checkIn: parsed.checkIn!,
          checkOut: parsed.checkOut!,
          adults: parsed.guests,
          children: 0,
        }}
        resourceIntent={parsed.mode === "resource" ? parsed.resourceSlug : null}
        onReady={handleContentReady}
      />
    </>
  );
}
