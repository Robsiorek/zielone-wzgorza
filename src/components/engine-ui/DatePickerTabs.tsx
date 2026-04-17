"use client";

/**
 * DatePickerTabs — "Dokładne / Elastyczne" date picker wrapper (engine-ui)
 * ────────────────────────────────────────────────────────────────────────
 * Single-contract wrapper combining SegmentedControl with:
 *   - "Dokładne"    → DateRangePicker (existing exact-date calendar)
 *   - "Elastyczne"  → FlexibleDatePicker (duration + month carousel)
 *
 * Works on ONE `BookingSearchCriteria` discriminated union — the tab
 * state IS the `value.mode` field. No separate mode prop needed.
 *
 * Internal UX cache: when the user switches tabs, the component caches
 * the inactive mode's data locally so they don't lose their selections.
 * The parent only ever sees the active mode's data via `onChange`.
 */

import * as React from "react";
import { SegmentedControl } from "./SegmentedControl";
import { DateRangePicker } from "./DateRangePicker";
import {
  FlexibleDatePicker,
  type FlexibleDateSelection,
} from "./FlexibleDatePicker";
import type {
  BookingSearchCriteria,
  DateRange,
  BookingParty,
} from "@/lib/booking-params";

// ═══════════════════════════════════════════
// Types
// ═══════════════════════════════════════════

export interface DatePickerTabsProps {
  /** Current search criteria — mode field determines active tab. */
  value: BookingSearchCriteria;
  /** Called on every change (tab switch, date pick, duration/month). */
  onChange: (next: BookingSearchCriteria) => void;
  /** Called once when a complete exact range is selected. */
  onExactComplete?: (next: BookingSearchCriteria) => void;
  /** Extra className on the root. */
  className?: string;
}

// ═══════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════

const MODE_OPTIONS = [
  { value: "exact" as const, label: "Dokładne" },
  { value: "flexible" as const, label: "Elastyczne" },
];

// ═══════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════

function getParty(c: BookingSearchCriteria): BookingParty {
  return { adults: c.adults, children: c.children, infants: c.infants, pets: c.pets };
}

// ═══════════════════════════════════════════
// Component
// ═══════════════════════════════════════════

export function DatePickerTabs({
  value,
  onChange,
  onExactComplete,
  className,
}: DatePickerTabsProps) {
  // ── UX cache for inactive mode ──
  const exactCacheRef = React.useRef<{ checkIn: string; checkOut: string }>({
    checkIn: value.mode === "exact" ? value.checkIn : "",
    checkOut: value.mode === "exact" ? value.checkOut : "",
  });
  const flexCacheRef = React.useRef<{ duration: "weekend" | "5days" | "week"; month: string }>({
    duration: value.mode === "flexible" ? value.duration : "weekend",
    month: value.mode === "flexible" ? value.month : "",
  });

  // Keep cache in sync with active mode
  React.useEffect(() => {
    if (value.mode === "exact") {
      exactCacheRef.current = { checkIn: value.checkIn, checkOut: value.checkOut };
    } else {
      flexCacheRef.current = { duration: value.duration, month: value.month };
    }
  }, [value]);

  const party = getParty(value);

  // ── Tab switch ──
  const handleModeChange = (newMode: string) => {
    if (newMode === value.mode) return;
    if (newMode === "flexible") {
      if (value.mode === "exact") {
        exactCacheRef.current = { checkIn: value.checkIn, checkOut: value.checkOut };
      }
      onChange({ ...party, mode: "flexible", duration: flexCacheRef.current.duration, month: flexCacheRef.current.month });
    } else {
      if (value.mode === "flexible") {
        flexCacheRef.current = { duration: value.duration, month: value.month };
      }
      onChange({ ...party, mode: "exact", checkIn: exactCacheRef.current.checkIn, checkOut: exactCacheRef.current.checkOut });
    }
  };

  // ── Exact handlers ──
  const handleExactChange = (next: DateRange) => {
    if (value.mode !== "exact") return;
    onChange({ ...party, mode: "exact", checkIn: next.checkIn ?? "", checkOut: next.checkOut ?? "" });
  };

  const handleExactComplete = () => {
    if (value.mode !== "exact") return;
    onExactComplete?.(value);
  };

  // ── Flexible handlers ──
  const handleFlexibleChange = (next: FlexibleDateSelection) => {
    onChange({ ...party, mode: "flexible", duration: next.duration, month: next.month });
  };

  const rootClass = ["eui-datepicker-tabs", className].filter(Boolean).join(" ");

  return (
    <div className={rootClass}>
      <div className="eui-datepicker-tabs-header">
        <SegmentedControl options={MODE_OPTIONS} value={value.mode} onChange={handleModeChange} />
      </div>
      <div className="eui-datepicker-tabs-body">
        {/* Both panels are always in DOM. CSS grid-template-rows: 0fr/1fr
            animates the height smoothly. Inner wrapper clips overflow. */}
        <div
          className={["eui-datepicker-tabs-panel", value.mode === "exact" && "eui-panel-active"].filter(Boolean).join(" ")}
          role="tabpanel"
          aria-hidden={value.mode !== "exact"}
        >
          <div className="eui-datepicker-tabs-panel-inner">
            <DateRangePicker
              value={{
                checkIn: (value.mode === "exact" ? value.checkIn : exactCacheRef.current.checkIn) || null,
                checkOut: (value.mode === "exact" ? value.checkOut : exactCacheRef.current.checkOut) || null,
              }}
              onChange={handleExactChange}
              onComplete={handleExactComplete}
            />
          </div>
        </div>
        <div
          className={["eui-datepicker-tabs-panel", value.mode === "flexible" && "eui-panel-active"].filter(Boolean).join(" ")}
          role="tabpanel"
          aria-hidden={value.mode !== "flexible"}
        >
          <div className="eui-datepicker-tabs-panel-inner">
            <FlexibleDatePicker
              value={{
                duration: value.mode === "flexible" ? value.duration : flexCacheRef.current.duration,
                month: value.mode === "flexible" ? value.month : flexCacheRef.current.month,
              }}
              onChange={handleFlexibleChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
