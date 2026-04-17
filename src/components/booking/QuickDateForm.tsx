"use client";

/**
 * QuickDateForm.tsx — Compact date + guests search form for Explore View.
 *
 * B5a Phase 3: Horizontal on desktop, stacked on mobile.
 * Uses shared booking-params.ts layer exclusively:
 *   - validateDateRange() for validation
 *   - normalizeGuests() for guest normalization
 * Does NOT build URLs itself — calls onSearch callback, parent navigates.
 *
 * Uses existing BubbleRangePicker for date selection.
 */

import React, { useState, useEffect, useRef } from "react";
import { Search, Users, Minus, Plus } from "lucide-react";
import { BubbleRangePicker } from "@/components/ui/bubble-range-picker";
import { validateDateRange, normalizeGuests, getLocalToday } from "@/lib/booking-params";

// ═══════════════════════════════════════════
// Types
// ═══════════════════════════════════════════

interface Props {
  /** Called when user submits valid dates + guests */
  onSearch: (checkIn: string, checkOut: string, guests: number) => void;
  /** Called on every date/guest change (for parent to track current values) */
  onChange?: (checkIn: string, checkOut: string, guests: number) => void;
  /** Initial values (e.g. from previous search) */
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialGuests?: number;
}

// ═══════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════

function getTomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getDefaultCheckout(): string {
  const d = new Date();
  d.setDate(d.getDate() + 3);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// ═══════════════════════════════════════════
// Component
// ═══════════════════════════════════════════

export function QuickDateForm({ onSearch, onChange, initialCheckIn, initialCheckOut, initialGuests }: Props) {
  const [checkIn, setCheckIn] = useState(initialCheckIn || getTomorrow());
  const [checkOut, setCheckOut] = useState(initialCheckOut || getDefaultCheckout());
  const [guests, setGuests] = useState(normalizeGuests(initialGuests));
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  const today = getLocalToday();

  // Report changes to parent for date tracking (ResourceCard CTA navigation)
  useEffect(() => {
    onChange?.(checkIn, checkOut, guests);
  }, [checkIn, checkOut, guests, onChange]);

  function handleRangeChange(ci: string, co: string) {
    setCheckIn(ci);
    setCheckOut(co);
    setError("");
  }

  function handleSubmit() {
    const validation = validateDateRange(checkIn, checkOut);
    if (!validation.valid) {
      setError(validation.error || "");
      return;
    }
    onSearch(checkIn, checkOut, guests);
  }

  return (
    <div ref={formRef} className="bg-card rounded-2xl border-2 border-border overflow-visible">
      {/* ── Compact bar (always visible) ── */}
      <div className="p-3 sm:p-4">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
          {/* Date display / toggle */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex-1 min-w-0 text-left px-3 py-2.5 rounded-xl border-2 border-border hover:border-primary/40 transition-colors"
          >
            <span className="text-[11px] text-muted-foreground block">Termin</span>
            <span className="text-[13px] font-medium text-foreground truncate block">
              {checkIn && checkOut
                ? `${checkIn.split("-").reverse().join(".")} — ${checkOut.split("-").reverse().join(".")}`
                : "Wybierz daty"
              }
            </span>
          </button>

          {/* Guests compact */}
          <div className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border-2 border-border flex-shrink-0">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            <button
              onClick={() => setGuests(Math.max(1, guests - 1))}
              disabled={guests <= 1}
              className="h-7 w-7 rounded-lg border border-border flex items-center justify-center hover:border-primary hover:text-primary transition-colors disabled:opacity-30"
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="text-[14px] font-bold w-5 text-center">{guests}</span>
            <button
              onClick={() => setGuests(Math.min(20, guests + 1))}
              className="h-7 w-7 rounded-lg border border-border flex items-center justify-center hover:border-primary hover:text-primary transition-colors"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>

          {/* Search button */}
          <button
            onClick={handleSubmit}
            className="bg-primary hover:bg-primary/90 text-white rounded-xl text-[13px] font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] px-5 flex-shrink-0"
            style={{ height: 44 }}
          >
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Szukaj</span>
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-2 bg-destructive/10 text-destructive text-[12px] px-3 py-2 rounded-lg text-center font-medium">
            {error}
          </div>
        )}
      </div>

      {/* ── Expanded calendar ── */}
      {expanded && (
        <div className="border-t border-border/50 p-4" style={{ overflow: "visible" }}>
          <BubbleRangePicker
            checkIn={checkIn}
            checkOut={checkOut}
            onChange={(ci: string, co: string) => {
              handleRangeChange(ci, co);
            }}
            min={today}
          />
          <div className="mt-3 flex justify-end">
            <button
              onClick={() => setExpanded(false)}
              className="text-[12px] font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Gotowe
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
