"use client";

/**
 * FlexibleDatePicker — "Elastyczne" date selection (engine-ui)
 * ────────────────────────────────────────────────────────────────────────
 * Airbnb-style flexible date picker with two selection steps:
 *
 *   1. Duration — how long is the stay? (Weekend / 5 dni / Tydzień)
 *   2. Month   — when? Horizontal carousel of months with arrow nav.
 *
 * The backend will use (duration, month) to search for availability gaps
 * in the timeline and propose matching resources. That wiring happens in
 * a later phase — here we only build the UI.
 *
 * Month carousel:
 *   - Shows 12 months ahead from the current month
 *   - Horizontally scrollable with snap-to-card
 *   - Left/right arrows for desktop, swipe for mobile
 *   - Active month has a bold border ring
 */

import * as React from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { format, addMonths, startOfMonth } from "date-fns";
import { pl } from "date-fns/locale";
import { type FlexibleDuration } from "@/lib/booking-params";

// ═══════════════════════════════════════════
// Types
// ═══════════════════════════════════════════

export { type FlexibleDuration };

export interface FlexibleDateSelection {
  duration: FlexibleDuration;
  /** ISO month string "YYYY-MM" or "" if no month selected yet. */
  month: string;
}

export interface FlexibleDatePickerProps {
  value: FlexibleDateSelection;
  onChange: (next: FlexibleDateSelection) => void;
  /** How many months ahead to show. Default 12. */
  monthsAhead?: number;
  className?: string;
}

// ═══════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════

const DURATIONS: { value: FlexibleDuration; label: string }[] = [
  { value: "weekend", label: "Weekend" },
  { value: "5days", label: "5 dni" },
  { value: "week", label: "Tydzień" },
];

/** Format a Date to "YYYY-MM" for month identification. */
function toMonthKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

/** Format month name + year for display: "Lipiec 2026". */
function formatMonthLabel(date: Date): { name: string; year: string } {
  return {
    name: format(date, "LLLL", { locale: pl }),
    year: format(date, "yyyy"),
  };
}

// ═══════════════════════════════════════════
// Component
// ═══════════════════════════════════════════

export function FlexibleDatePicker({
  value,
  onChange,
  monthsAhead = 12,
  className,
}: FlexibleDatePickerProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // ── Build month list ──
  const months = React.useMemo(() => {
    const now = startOfMonth(new Date());
    return Array.from({ length: monthsAhead }, (_, i) => {
      const date = addMonths(now, i);
      const key = toMonthKey(date);
      const label = formatMonthLabel(date);
      return { date, key, ...label };
    });
  }, [monthsAhead]);

  // ── Duration change ──
  const handleDuration = (dur: FlexibleDuration) => {
    onChange({ ...value, duration: dur });
  };

  // ── Month change ──
  const handleMonth = (key: string) => {
    onChange({ ...value, month: key });
  };

  // ── Carousel scroll ──
  const scrollBy = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = 128 + 12; // card width + gap
    const amount = cardWidth * 2; // scroll 2 cards at a time
    el.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  const rootClass = ["eui-flexible-picker", className]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={rootClass}>
      {/* ── Duration section ── */}
      <div className="eui-flexible-section">
        <h3 className="eui-flexible-title">
          Jak długi ma być Twój pobyt?
        </h3>
        <div className="eui-flexible-durations">
          {DURATIONS.map((d) => (
            <button
              key={d.value}
              type="button"
              className={[
                "eui-flexible-pill",
                value.duration === d.value && "eui-flexible-pill-active",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => handleDuration(d.value)}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Month carousel section ── */}
      <div className="eui-flexible-section">
        <h3 className="eui-flexible-title">
          Kiedy planujesz swój pobyt?
        </h3>
        <div className="eui-flexible-carousel">
          <button
            type="button"
            className="eui-flexible-carousel-nav eui-flexible-carousel-prev"
            onClick={() => scrollBy("left")}
            aria-label="Poprzednie miesiące"
          >
            <ChevronLeft size={18} aria-hidden="true" />
          </button>

          <div ref={scrollRef} className="eui-flexible-months">
            {months.map((m) => (
              <button
                key={m.key}
                type="button"
                className={[
                  "eui-flexible-month-card",
                  value.month === m.key && "eui-flexible-month-active",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => handleMonth(m.key)}
                aria-pressed={value.month === m.key}
              >
                <Calendar
                  size={28}
                  strokeWidth={1.5}
                  className="eui-flexible-month-icon"
                  aria-hidden="true"
                />
                <span className="eui-flexible-month-name">{m.name}</span>
                <span className="eui-flexible-month-year">{m.year}</span>
              </button>
            ))}
          </div>

          <button
            type="button"
            className="eui-flexible-carousel-nav eui-flexible-carousel-next"
            onClick={() => scrollBy("right")}
            aria-label="Następne miesiące"
          >
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
