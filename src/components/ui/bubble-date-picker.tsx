"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

const MONTHS_PL = [
  "Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec",
  "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień",
];

const DAYS_PL = ["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"];

interface BubbleDatePickerProps {
  value: string; // "YYYY-MM-DD" or ""
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  min?: string;
  max?: string;
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

function formatDisplay(str: string): string {
  if (!str) return "";
  const d = parseDate(str);
  if (!d) return str;
  return `${d.getDate()} ${MONTHS_PL[d.getMonth()].substring(0, 3).toLowerCase()} ${d.getFullYear()}`;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; // Monday = 0
}

export function BubbleDatePicker({
  value,
  onChange,
  label,
  placeholder = "Wybierz datę",
  className,
  min,
  max,
}: BubbleDatePickerProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 296 });

  // Calendar view state — initialize from value or today
  const initial = useMemo(() => {
    const d = parseDate(value) || new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [viewYear, setViewYear] = useState(initial.year);
  const [viewMonth, setViewMonth] = useState(initial.month);
  const [slideDir, setSlideDir] = useState<"left" | "right" | null>(null);

  // When value changes externally, sync the view
  useEffect(() => {
    const d = parseDate(value);
    if (d) {
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    }
  }, [value]);

  // Position dropdown relative to trigger via portal
  useEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const dropH = 380;
      const dropW = 296;
      const viewH = window.innerHeight;
      const viewW = window.innerWidth;
      const spaceBelow = viewH - rect.bottom;

      const top = spaceBelow >= dropH
        ? rect.bottom + 6
        : rect.top - dropH - 6;

      // If dropdown would overflow right edge, align to right side of trigger
      let left = rect.left;
      if (left + dropW > viewW - 8) {
        left = rect.right - dropW;
      }
      // Safety: never go off-screen left
      left = Math.max(8, left);

      setDropdownPos({
        top: Math.max(8, top),
        left,
        width: dropW,
      });
    }
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (
        triggerRef.current && !triggerRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  const prevMonth = useCallback(() => {
    setSlideDir("right");
    setViewMonth(prev => {
      if (prev === 0) {
        setViewYear(y => y - 1);
        return 11;
      }
      return prev - 1;
    });
  }, []);

  const nextMonth = useCallback(() => {
    setSlideDir("left");
    setViewMonth(prev => {
      if (prev === 11) {
        setViewYear(y => y + 1);
        return 0;
      }
      return prev + 1;
    });
  }, []);

  const goToToday = useCallback(() => {
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    setSlideDir(null);
  }, []);

  const selectDay = useCallback((day: number) => {
    const selected = new Date(viewYear, viewMonth, day);
    onChange(formatDate(selected));
    setOpen(false);
  }, [viewYear, viewMonth, onChange]);

  const today = new Date();
  const todayStr = formatDate(today);
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfWeek(viewYear, viewMonth);

  const minDate = parseDate(min || "");
  const maxDate = parseDate(max || "");

  const isDisabled = (day: number): boolean => {
    const d = new Date(viewYear, viewMonth, day);
    if (minDate && d < minDate) return true;
    if (maxDate && d > maxDate) return true;
    return false;
  };

  // Build calendar grid
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  const remainder = cells.length % 7;
  if (remainder > 0) {
    for (let i = 0; i < 7 - remainder; i++) cells.push(null);
  }

  // Reset slide animation
  useEffect(() => {
    if (slideDir) {
      const t = setTimeout(() => setSlideDir(null), 200);
      return () => clearTimeout(t);
    }
  }, [slideDir, viewMonth]);

  const calendarDropdown = open && typeof window !== "undefined" ? createPortal(
    <div
      ref={dropdownRef}
      style={{
        position: "fixed",
        top: dropdownPos.top,
        left: dropdownPos.left,
        width: 296,
        zIndex: 99999,
        border: "1px solid hsl(var(--border))",
        boxShadow: "0 8px 32px hsl(220 15% 12% / 0.12), 0 4px 8px hsl(220 15% 12% / 0.06)",
        animation: "scaleIn 0.15s cubic-bezier(0.16, 1, 0.3, 1) both",
      }}
      className="rounded-2xl bg-card p-3"
    >
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          onClick={prevMonth}
          className="h-8 w-8 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-150"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={goToToday}
          className="text-[13px] font-semibold text-foreground hover:text-primary transition-colors duration-150 px-2 py-1 rounded-lg"
        >
          {MONTHS_PL[viewMonth]} {viewYear}
        </button>

        <button
          type="button"
          onClick={nextMonth}
          className="h-8 w-8 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-150"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Day names header */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS_PL.map((day) => (
          <div
            key={day}
            className="h-8 flex items-center justify-center text-[11px] font-semibold text-muted-foreground/60 select-none"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div
        className="grid grid-cols-7"
        key={`${viewYear}-${viewMonth}`}
        style={
          slideDir
            ? {
                animation: `${slideDir === "left" ? "slideCalLeft" : "slideCalRight"} 0.18s cubic-bezier(0.16, 1, 0.3, 1) both`,
              }
            : undefined
        }
      >
        {cells.map((day, i) => {
          if (day === null) {
            return <div key={`empty-${i}`} className="h-9" />;
          }

          const dateStr = formatDate(new Date(viewYear, viewMonth, day));
          const isSelected = dateStr === value;
          const isToday = dateStr === todayStr;
          const disabled = isDisabled(day);

          return (
            <button
              key={day}
              type="button"
              disabled={disabled}
              onClick={() => selectDay(day)}
              className={cn(
                "h-9 w-full rounded-xl text-[13px] font-medium transition-all duration-150 relative",
                disabled && "opacity-30 cursor-not-allowed",
                !disabled && !isSelected && "hover:bg-primary/8 hover:text-primary",
                isSelected
                  ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                  : isToday
                    ? "text-primary font-semibold"
                    : "text-foreground"
              )}
            >
              {day}
              {isToday && !isSelected && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>

      {/* Quick actions */}
      <div
        className="mt-2 pt-2 flex items-center justify-between"
        style={{ borderTop: "1px solid hsl(var(--border) / 0.5)" }}
      >
        <button
          type="button"
          onClick={() => {
            onChange(todayStr);
            setOpen(false);
          }}
          className="text-[11px] font-medium text-primary hover:text-primary/80 transition-colors duration-150"
        >
          Dzisiaj
        </button>
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
            className="text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors duration-150"
          >
            Wyczyść
          </button>
        )}
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <div className={cn("relative", className)}>
      {label && (
        <label className="text-[12px] font-semibold text-muted-foreground block mb-1.5">
          {label}
        </label>
      )}

      {/* Trigger button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex h-11 w-full items-center justify-between rounded-2xl bg-card px-4 text-[13px] transition-all duration-200 outline-none",
          open
            ? "ring-2 ring-primary/10"
            : "hover:border-muted-foreground/25",
          !value && "text-muted-foreground/60"
        )}
        style={{
          border: open
            ? "1px solid hsl(var(--primary))"
            : "1px solid hsl(var(--border))",
        }}
      >
        <span className={value ? "text-foreground" : "text-muted-foreground/60"}>
          {value ? formatDisplay(value) : placeholder}
        </span>
        <Calendar
          className={cn(
            "h-4 w-4 shrink-0 transition-colors duration-200",
            open ? "text-primary" : "text-muted-foreground"
          )}
        />
      </button>

      {calendarDropdown}
    </div>
  );
}
