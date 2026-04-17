"use client";

/**
 * DatePickerSection — DatePickerTabs showcase
 * ────────────────────────────────────────────────────────────────────────
 * Demonstrates the full "Dokładne / Elastyczne" date picker using a
 * single BookingSearchCriteria discriminated union. The mode field
 * determines which tab is active — no separate mode state.
 */

import * as React from "react";
import { LabSection } from "../LabSection";
import { ComponentShowcase } from "../ComponentShowcase";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/engine-ui/primitives/Popover";
import { DatePickerTabs } from "@/components/engine-ui/DatePickerTabs";
import {
  type BookingSearchCriteria,
  DEFAULT_SEARCH_CRITERIA,
} from "@/lib/booking-params";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

const DURATION_LABELS: Record<string, string> = {
  weekend: "Weekend",
  "5days": "5 dni",
  week: "Tydzień",
};

function formatDisplay(criteria: BookingSearchCriteria): string {
  if (criteria.mode === "exact") {
    if (!criteria.checkIn && !criteria.checkOut) return "Wybierz daty";
    const fmt = (iso: string) => {
      if (!iso) return "…";
      const [y, m, d] = iso.split("-").map(Number);
      return format(new Date(y, m - 1, d), "d MMM yyyy", { locale: pl });
    };
    return `${fmt(criteria.checkIn)} – ${fmt(criteria.checkOut)}`;
  }
  // flexible
  const dur = DURATION_LABELS[criteria.duration] ?? criteria.duration;
  if (!criteria.month) return `${dur} — wybierz miesiąc`;
  const [y, m] = criteria.month.split("-").map(Number);
  const monthName = format(new Date(y, m - 1, 1), "LLLL yyyy", { locale: pl });
  return `${dur} · ${monthName}`;
}

export function DatePickerSection() {
  const [criteria, setCriteria] = React.useState<BookingSearchCriteria>({
    ...DEFAULT_SEARCH_CRITERIA,
  });
  const [completeCount, setCompleteCount] = React.useState(0);
  const [open, setOpen] = React.useState(false);

  const handleComplete = () => {
    setCompleteCount((c) => c + 1);
    window.setTimeout(() => setOpen(false), 280);
  };

  const handleReset = () => {
    setCriteria({ ...DEFAULT_SEARCH_CRITERIA });
    setCompleteCount(0);
  };

  return (
    <LabSection
      id="datepicker"
      title="Picker dat"
      description="Dwa tryby: Dokładne (kalendarz) i Elastyczne (czas pobytu + miesiąc). Jeden kontrakt danych: BookingSearchCriteria (discriminated union). Przełączanie tabów zachowuje dane obu trybów."
    >
      <ComponentShowcase
        title="Picker dat — Dokładne / Elastyczne"
        caption="Kliknij trigger, przełączaj tryby. Jeden value, jeden onChange. Mode = tab."
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                style={{
                  background: "var(--eui-grey-0)",
                  border: "1px solid var(--eui-border-strong)",
                  padding: "12px 24px",
                  borderRadius: 9999,
                  fontFamily: "inherit",
                  fontSize: 14,
                  fontWeight: 500,
                  color: "var(--eui-text-primary)",
                  cursor: "pointer",
                  minWidth: 280,
                }}
              >
                {formatDisplay(criteria)}
              </button>
            </PopoverTrigger>
            <PopoverContent size="large" align="center" side="bottom" sideOffset={12}>
              <DatePickerTabs
                value={criteria}
                onChange={setCriteria}
                onExactComplete={handleComplete}
              />
            </PopoverContent>
          </Popover>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 4,
              padding: 12,
              borderRadius: 8,
              backgroundColor: "var(--eui-grey-50)",
              fontSize: 13,
              color: "var(--eui-text-secondary)",
              maxWidth: 400, width: "100%", wordBreak: "break-all", boxSizing: "border-box",
              textAlign: "center",
              fontFamily: "ui-monospace, Menlo, monospace",
            }}
          >
            <div><strong>value:</strong> {JSON.stringify(criteria)}</div>
            <div><strong>onComplete:</strong> {completeCount}</div>
          </div>

          <button
            type="button"
            onClick={handleReset}
            style={{
              background: "transparent",
              border: "none",
              fontFamily: "inherit",
              fontSize: 13,
              fontWeight: 600,
              color: "var(--eui-text-primary)",
              textDecoration: "underline",
              textUnderlineOffset: 3,
              cursor: "pointer",
            }}
          >
            Wyczyść
          </button>
        </div>
      </ComponentShowcase>
    </LabSection>
  );
}
