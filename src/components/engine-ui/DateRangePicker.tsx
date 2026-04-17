"use client";

/**
 * DateRangePicker — two-month range picker (engine-ui)
 * ────────────────────────────────────────────────────────────────────────
 * Shows two months side-by-side on desktop, collapses to one on mobile
 * (via engine-ui.css media query). Click a start day, then click an end
 * day; the band between them highlights. Hover previews the range while
 * only the start is set.
 *
 * API contract:
 *   value: { checkIn, checkOut }  — ISO "YYYY-MM-DD" strings or nulls
 *   onChange(value)               — called after every click
 *                                   (start-only, complete range, or reset)
 *   onComplete?(value)            — called ONCE when a complete range is
 *                                   selected. Parents typically use this
 *                                   to close the popover.
 *
 * Why two callbacks:
 *   The parent often wants to show feedback on every click (e.g. update
 *   the searchbar summary even before end is picked) but only close the
 *   popover when a full range exists. Keeping `onChange` granular and
 *   `onComplete` discrete is cleaner than inferring completeness from the
 *   value shape at every call site.
 *
 *   `onComplete` is IDEMPOTENT per final pair: it fires exactly once when
 *   the user transitions from an incomplete range to a specific complete
 *   range `(checkIn, checkOut)`. If the user picks the same pair twice in
 *   a row without any intervening reset, the second completion is a no-op.
 *   A reset (parent clearing the value, or the user starting a new range)
 *   re-arms the guard, so re-selecting the same pair then fires again.
 *
 * Date handling — LOCAL TIME, not UTC:
 *   Booking dates are local calendar days. UTC math around DST would cause
 *   off-by-one bugs. All comparisons are done on `YYYY-MM-DD` strings
 *   (lexical sort === chronological sort) or on Date objects constructed
 *   from `new Date(YYYY, MM-1, DD)` (local constructor). We never use
 *   `new Date(isoString)` which is UTC.
 *
 * Keyboard (Runda 1 scope):
 *   - Each day cell is a real <button>, so Enter/Space trigger selection
 *     for free.
 *   - Tab walks through days in DOM order (good enough for small ranges).
 *   - Full grid arrow-key navigation (up/down/left/right with wrap and
 *     month cross-over) is deferred to Runda 2 — the a11y pattern needs
 *     a roving tabindex + aria-activedescendant and is worth a dedicated
 *     pass rather than a half-implementation here (handoff §5.2).
 */

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isBefore,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { pl } from "date-fns/locale";
import { type DateRange } from "@/lib/booking-params";

// ═══════════════════════════════════════════
// Types
// ═══════════════════════════════════════════

export interface DateRangePickerProps {
  /** Current range (controlled). */
  value: DateRange;
  /** Fired after every click — start-only, complete, or reset. */
  onChange: (next: DateRange) => void;
  /** Fired once when a complete range is selected. */
  onComplete?: (next: Required<DateRange>) => void;
  /**
   * Earliest selectable day (inclusive). Defaults to "today" in local time.
   * Pass a Date; an ISO string is NOT accepted to avoid UTC bugs.
   */
  minDate?: Date;
  /** Latest selectable day (inclusive). Defaults to "no upper bound". */
  maxDate?: Date;
  /**
   * Month count. 2 on desktop, 1 on mobile — the CSS already collapses the
   * grid to one column below 640px, so the right-hand month visually hides;
   * here we still render two months for simplicity. Accepts 1 explicitly
   * if a caller wants a single-month layout regardless of viewport.
   */
  months?: 1 | 2;
  /** Extra className merged onto the root. */
  className?: string;
}

// ═══════════════════════════════════════════
// Date helpers — all LOCAL time
// ═══════════════════════════════════════════

/** Format a Date as `YYYY-MM-DD` using LOCAL components (no UTC). */
function toISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Parse `YYYY-MM-DD` into a local-midnight Date. */
function fromISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** True when `a` is strictly before `b` by calendar day. */
function isBeforeDay(a: Date, b: Date): boolean {
  return isBefore(startOfDay(a), startOfDay(b));
}

function mergeClass(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

// ═══════════════════════════════════════════
// Month-grid building
// ═══════════════════════════════════════════

/**
 * Returns the days that should appear in a month grid, padded to complete
 * weeks starting on Monday (ISO / PL). Days from neighbouring months are
 * included so the grid always has 6 rows × 7 columns and never "jumps".
 */
function buildMonthGrid(monthStart: Date): Date[] {
  const gridStart = startOfWeek(startOfMonth(monthStart), { weekStartsOn: 1 });
  const gridEnd = endOfWeek(endOfMonth(monthStart), { weekStartsOn: 1 });
  return eachDayOfInterval({ start: gridStart, end: gridEnd });
}

/** ISO weekday headers in Polish: Pn, Wt, Śr, Cz, Pt, So, Nd. */
const WEEKDAY_LABELS = ["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"];

// ═══════════════════════════════════════════
// Component
// ═══════════════════════════════════════════

export function DateRangePicker({
  value,
  onChange,
  onComplete,
  minDate,
  maxDate,
  months = 2,
  className,
}: DateRangePickerProps) {
  // ── Derived state: effective minDate (today if not supplied) ──
  const effectiveMin = React.useMemo(
    () => startOfDay(minDate ?? new Date()),
    [minDate]
  );

  // ── Visible left-hand month ──
  // Initialize so that the checkIn (if any) is visible; otherwise show
  // the current month. Never rewind past `effectiveMin`.
  const [leftMonth, setLeftMonth] = React.useState<Date>(() => {
    const anchor = value.checkIn ? fromISO(value.checkIn) : new Date();
    const m = startOfMonth(anchor);
    return isBeforeDay(m, startOfMonth(effectiveMin))
      ? startOfMonth(effectiveMin)
      : m;
  });

  // ── Hover state for preview range (start set, end not set) ──
  const [hoverDay, setHoverDay] = React.useState<Date | null>(null);

  // ── Parse committed range into Date objects once per render ──
  const checkInDate = value.checkIn ? fromISO(value.checkIn) : null;
  const checkOutDate = value.checkOut ? fromISO(value.checkOut) : null;

  // ── Idempotency guard for onComplete ──
  // Tracks the last complete range we already reported. Even if render
  // paths or external state quirks re-enter `handleDayClick` with the
  // same transition, we never fire `onComplete` twice for the same pair.
  // Reset on any partial/empty state so a subsequent re-selection of the
  // same range (after clearing) will correctly fire once.
  const lastReportedCompleteRef = React.useRef<string | null>(null);

  // Keep the ref in sync with external value changes: if the parent
  // clears the range, we must be able to fire onComplete again when the
  // user picks the same two days a second time.
  React.useEffect(() => {
    if (!value.checkIn || !value.checkOut) {
      lastReportedCompleteRef.current = null;
    }
  }, [value.checkIn, value.checkOut]);

  // ── Month navigation ──
  const canGoPrev = isBeforeDay(startOfMonth(effectiveMin), leftMonth);
  const canGoNext = maxDate ? isBeforeDay(addMonths(leftMonth, 1), startOfMonth(maxDate)) : true;

  const handlePrev = () => {
    if (!canGoPrev) return;
    setLeftMonth((prev) => addMonths(prev, -1));
  };
  const handleNext = () => {
    if (!canGoNext) return;
    setLeftMonth((prev) => addMonths(prev, 1));
  };

  // ── Click on a day ──
  const handleDayClick = (day: Date) => {
    // Gate: disabled days (past or beyond max) never reach here because
    // <button disabled> swallows the click — but we guard anyway.
    if (isBeforeDay(day, effectiveMin)) return;
    if (maxDate && isBeforeDay(maxDate, day)) return;

    const iso = toISO(day);

    // Case A: nothing picked yet → this is checkIn.
    if (!checkInDate) {
      onChange({ checkIn: iso, checkOut: null });
      return;
    }

    // Case B: only checkIn picked → pick checkOut.
    if (checkInDate && !checkOutDate) {
      // Clicking a day before checkIn restarts the range from there.
      if (isBeforeDay(day, checkInDate)) {
        onChange({ checkIn: iso, checkOut: null });
        return;
      }
      // Clicking the same day clears (degenerate range is meaningless).
      if (isSameDay(day, checkInDate)) {
        onChange({ checkIn: null, checkOut: null });
        return;
      }
      const next = { checkIn: toISO(checkInDate), checkOut: iso };
      onChange(next);
      // Fire onComplete only on TRANSITION from incomplete → complete,
      // and never twice for the same final pair.
      const key = `${next.checkIn}|${next.checkOut}`;
      if (lastReportedCompleteRef.current !== key) {
        lastReportedCompleteRef.current = key;
        onComplete?.({ checkIn: next.checkIn, checkOut: next.checkOut });
      }
      return;
    }

    // Case C: complete range exists → new click starts over.
    onChange({ checkIn: iso, checkOut: null });
  };

  // ── Range highlighting logic ──
  // When both dates are set, highlight [checkIn..checkOut].
  // When only checkIn is set and hoverDay is after it, preview that.
  const getDayState = (day: Date) => {
    const isMin = isBeforeDay(day, effectiveMin);
    const isMax = maxDate ? isBeforeDay(maxDate, day) : false;
    const disabled = isMin || isMax;

    const isCheckIn = checkInDate ? isSameDay(day, checkInDate) : false;
    const isCheckOut = checkOutDate ? isSameDay(day, checkOutDate) : false;
    const isSelected = isCheckIn || isCheckOut;

    let isInRange = false;
    let isRangeStart = false;
    let isRangeEnd = false;
    let isPreview = false;

    if (checkInDate && checkOutDate) {
      // Completed range
      if (
        isBeforeDay(checkInDate, day) &&
        isBeforeDay(day, checkOutDate)
      ) {
        isInRange = true;
      }
      if (isCheckIn) isRangeStart = true;
      if (isCheckOut) isRangeEnd = true;
    } else if (checkInDate && !checkOutDate && hoverDay) {
      // Preview range while hovering
      if (
        isBeforeDay(checkInDate, hoverDay) &&
        isBeforeDay(checkInDate, day) &&
        !isBeforeDay(hoverDay, day)
      ) {
        isPreview = true;
      }
    }

    return { disabled, isSelected, isInRange, isRangeStart, isRangeEnd, isPreview };
  };

  // ── Render a single month grid ──
  const renderMonth = (monthStart: Date) => {
    const grid = buildMonthGrid(monthStart);
    const title = format(monthStart, "LLLL yyyy", { locale: pl });

    return (
      <div className="eui-datepicker-month" key={monthStart.toISOString()}>
        <div className="eui-datepicker-month-title">{title}</div>
        <div className="eui-datepicker-weekdays" aria-hidden="true">
          {WEEKDAY_LABELS.map((w) => (
            <div key={w} className="eui-datepicker-weekday">
              {w}
            </div>
          ))}
        </div>
        <div className="eui-datepicker-days" role="grid">
          {grid.map((day) => {
            const inCurrentMonth = isSameMonth(day, monthStart);
            const state = getDayState(day);

            // Cells from neighbouring months are rendered blank so the
            // grid dimensions stay stable (6×7) without breaking the
            // range band visual.
            if (!inCurrentMonth) {
              return (
                <div
                  key={day.toISOString()}
                  className="eui-datepicker-day eui-day-outside"
                  aria-hidden="true"
                />
              );
            }

            const classes = mergeClass(
              "eui-datepicker-day",
              state.isSelected && "eui-day-selected",
              state.isRangeStart && "eui-day-range-start",
              state.isRangeEnd && "eui-day-range-end",
              state.isInRange && !state.isSelected && "eui-day-in-range",
              state.isPreview && "eui-day-preview-range"
            );

            const isoDay = toISO(day);
            const ariaLabel = format(day, "d MMMM yyyy", { locale: pl });

            return (
              <button
                key={isoDay}
                type="button"
                className={classes}
                disabled={state.disabled}
                onClick={() => handleDayClick(day)}
                onMouseEnter={() => setHoverDay(day)}
                onMouseLeave={() =>
                  setHoverDay((prev) => (prev && isSameDay(prev, day) ? null : prev))
                }
                aria-label={ariaLabel}
                aria-pressed={state.isSelected ? "true" : undefined}
                role="gridcell"
              >
                <span className="eui-datepicker-day-inner">{day.getDate()}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // ── Compose ──
  const rightMonth = addMonths(leftMonth, 1);
  const rootClass = mergeClass("eui-datepicker", className);

  return (
    <div className={rootClass}>
      {/* Arrows + months in a single row. Arrows are positioned absolutely
          at the level of month titles (Airbnb pattern). */}
      <div className="eui-datepicker-body">
        <button
          type="button"
          className="eui-datepicker-nav eui-datepicker-nav-prev"
          onClick={handlePrev}
          disabled={!canGoPrev}
          aria-label="Poprzedni miesiąc"
        >
          <ChevronLeft size={20} aria-hidden="true" />
        </button>

        <div className="eui-datepicker-months">
          {renderMonth(leftMonth)}
          {months === 2 && renderMonth(rightMonth)}
        </div>

        <button
          type="button"
          className="eui-datepicker-nav eui-datepicker-nav-next"
          onClick={handleNext}
          disabled={!canGoNext}
          aria-label="Następny miesiąc"
        >
          <ChevronRight size={20} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
