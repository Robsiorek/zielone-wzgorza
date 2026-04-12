"use client";

/**
 * BubbleRangePicker — DS range date picker.
 *
 * Single calendar, user selects checkIn then checkOut.
 * Range highlighted between dates. Floating UI portal (ADR-20).
 * Polish locale.
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { FloatingPortal } from "@floating-ui/react";
import { useFloatingDropdown } from "@/hooks/use-floating-dropdown";

const MONTHS_PL = [
  "Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec",
  "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień",
];
const DAYS_PL = ["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"];

interface BubbleRangePickerProps {
  checkIn: string;   // "YYYY-MM-DD" or ""
  checkOut: string;  // "YYYY-MM-DD" or ""
  onChange: (checkIn: string, checkOut: string) => void;
  min?: string;
}

function parseDate(str: string): Date | null {
  if (!str) return null;
  const [y, m, d] = str.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDisplayShort(str: string): string {
  if (!str) return "";
  const d = parseDate(str);
  if (!d) return str;
  return `${d.getDate()} ${MONTHS_PL[d.getMonth()].substring(0, 3).toLowerCase()}`;
}

function formatDisplayFull(str: string): string {
  if (!str) return "";
  const d = parseDate(str);
  if (!d) return str;
  const dayNames = ["niedziela", "poniedziałek", "wtorek", "środa", "czwartek", "piątek", "sobota"];
  return `${dayNames[d.getDay()]}, ${d.getDate()} ${MONTHS_PL[d.getMonth()].toLowerCase()}`;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function nightsBetween(a: string, b: string): number {
  if (!a || !b) return 0;
  const diff = new Date(b).getTime() - new Date(a).getTime();
  return Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)));
}

export function BubbleRangePicker({ checkIn, checkOut, onChange, min }: BubbleRangePickerProps) {
  // Selection state
  const [selectionPhase, setSelectionPhase] = useState<"checkIn" | "checkOut">(checkIn ? "checkOut" : "checkIn");
  const [hoverDate, setHoverDate] = useState<string | null>(null);

  // ── Floating UI (ADR-20) — onOpenChange handles selectionPhase ──
  const { refs, floatingStyles, getReferenceProps, getFloatingProps, open, setOpen, portalRoot } =
    useFloatingDropdown({
      placement: "bottom",
      fixedWidth: 320,
      onOpenChange: (nextOpen) => {
        if (nextOpen) {
          // Prepare selectionPhase when opening
          if (!checkIn) setSelectionPhase("checkIn");
          else if (!checkOut) setSelectionPhase("checkOut");
          else setSelectionPhase("checkIn"); // restart selection
        }
      },
    });

  const initial = useMemo(() => {
    const d = parseDate(checkIn) || new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [viewYear, setViewYear] = useState(initial.year);
  const [viewMonth, setViewMonth] = useState(initial.month);

  const minDate = parseDate(min || "");
  const nights = nightsBetween(checkIn, checkOut);

  const prevMonth = useCallback(() => {
    setViewMonth(prev => {
      if (prev === 0) { setViewYear(y => y - 1); return 11; }
      return prev - 1;
    });
  }, []);

  const nextMonth = useCallback(() => {
    setViewMonth(prev => {
      if (prev === 11) { setViewYear(y => y + 1); return 0; }
      return prev + 1;
    });
  }, []);

  function handleDayClick(dateStr: string) {
    if (selectionPhase === "checkIn") {
      onChange(dateStr, "");
      setSelectionPhase("checkOut");
    } else {
      // checkOut phase
      if (dateStr <= checkIn) {
        // Clicked before or same as checkIn — restart
        onChange(dateStr, "");
        setSelectionPhase("checkOut");
      } else {
        onChange(checkIn, dateStr);
        setSelectionPhase("checkIn");
        setOpen(false);
      }
    }
  }

  function isDisabled(dateStr: string): boolean {
    if (minDate) {
      const d = parseDate(dateStr);
      if (d && d < minDate) return true;
    }
    return false;
  }

  function getDayClass(dateStr: string): string {
    const ciDate = parseDate(checkIn);
    const coDate = parseDate(checkOut || (selectionPhase === "checkOut" && hoverDate ? hoverDate : ""));
    const d = parseDate(dateStr)!;

    const isCheckIn = ciDate && sameDay(d, ciDate);
    const isCheckOut = coDate && sameDay(d, coDate);
    const isInRange = ciDate && coDate && d > ciDate && d < coDate;

    if (isCheckIn && isCheckOut) return "bg-primary text-white rounded-full font-bold";
    if (isCheckIn) return "bg-primary text-white rounded-l-full font-bold";
    if (isCheckOut) return "bg-primary text-white rounded-r-full font-bold";
    if (isInRange) return "bg-primary/10 text-primary";

    return "hover:bg-muted rounded-lg";
  }

  // Build calendar
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfWeek(viewYear, viewMonth);
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  const remainder = cells.length % 7;
  if (remainder > 0) for (let i = 0; i < 7 - remainder; i++) cells.push(null);

  const todayStr = formatDate(new Date());

  return (
    <div>
      <button
        ref={refs.setReference}
        type="button"
        {...getReferenceProps()}
        className={cn(
          "w-full rounded-2xl border-2 border-border px-4 py-3 flex items-center gap-3 text-left transition-colors",
          "hover:border-primary",
          open && "border-primary"
        )}
      >
        <CalendarDays className="h-4 w-4 text-primary flex-shrink-0" />
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] text-muted-foreground leading-none mb-0.5">Przyjazd</p>
            <p className="text-[13px] font-semibold truncate">{checkIn ? formatDisplayFull(checkIn) : "Wybierz datę"}</p>
          </div>
          <span className="text-muted-foreground text-[12px] flex-shrink-0">→</span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] text-muted-foreground leading-none mb-0.5">Wyjazd</p>
            <p className="text-[13px] font-semibold truncate">{checkOut ? formatDisplayFull(checkOut) : "Wybierz datę"}</p>
          </div>
        </div>
        {nights > 0 && (
          <span className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full flex-shrink-0">
            {nights} {nights === 1 ? "noc" : nights < 5 ? "noce" : "nocy"}
          </span>
        )}
      </button>

      {/* Calendar dropdown — Floating UI portal (ADR-20) */}
      {open && (
        <FloatingPortal root={portalRoot}>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
          >
            <div
              className="rounded-2xl bg-card p-4"
              style={{
                border: "1px solid hsl(var(--border))",
                animation: "scaleIn 0.15s cubic-bezier(0.16, 1, 0.3, 1) both",
              }}
            >
              {/* Phase indicator */}
              <div className="flex items-center justify-center gap-3 mb-3">
                <div className={cn(
                  "text-[12px] font-semibold px-3 py-1 rounded-full transition-colors",
                  selectionPhase === "checkIn" ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                )}>
                  {checkIn ? formatDisplayShort(checkIn) : "Przyjazd"}
                </div>
                <span className="text-[11px] text-muted-foreground">→</span>
                <div className={cn(
                  "text-[12px] font-semibold px-3 py-1 rounded-full transition-colors",
                  selectionPhase === "checkOut" ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                )}>
                  {checkOut ? formatDisplayShort(checkOut) : "Wyjazd"}
                </div>
              </div>

              {/* Month navigation */}
              <div className="flex items-center justify-between mb-2">
                <button type="button" onClick={prevMonth}
                  className="h-8 w-8 rounded-xl flex items-center justify-center hover:bg-muted transition-colors">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-[13px] font-semibold">
                  {MONTHS_PL[viewMonth]} {viewYear}
                </span>
                <button type="button" onClick={nextMonth}
                  className="h-8 w-8 rounded-xl flex items-center justify-center hover:bg-muted transition-colors">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 mb-1">
                {DAYS_PL.map(d => (
                  <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground py-1">{d}</div>
                ))}
              </div>

              {/* Days grid */}
              <div className="grid grid-cols-7">
                {cells.map((day, i) => {
                  if (day === null) return <div key={`e-${i}`} />;
                  const dateStr = formatDate(new Date(viewYear, viewMonth, day));
                  const disabled = isDisabled(dateStr);
                  const isToday = dateStr === todayStr;
                  const dayClass = getDayClass(dateStr);

                  return (
                    <button
                      key={dateStr}
                      type="button"
                      disabled={disabled}
                      onClick={() => handleDayClick(dateStr)}
                      onMouseEnter={() => selectionPhase === "checkOut" && checkIn && setHoverDate(dateStr)}
                      onMouseLeave={() => setHoverDate(null)}
                      className={cn(
                        "h-9 text-[13px] transition-colors relative",
                        disabled && "opacity-30 cursor-not-allowed",
                        !disabled && dayClass,
                      )}
                    >
                      {day}
                      {isToday && !dayClass.includes("bg-primary") && (
                        <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-primary" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Nights count */}
              {checkIn && checkOut && (
                <div className="mt-3 text-center">
                  <span className="text-[12px] font-semibold text-primary">
                    {nights} {nights === 1 ? "noc" : nights < 5 ? "noce" : "nocy"}
                  </span>
                </div>
              )}
            </div>
          </div>
        </FloatingPortal>
      )}
    </div>
  );
}
