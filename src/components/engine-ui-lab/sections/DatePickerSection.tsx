"use client";

/**
 * DatePickerSection — DateRangePicker showcase
 * ────────────────────────────────────────────────────────────────────────
 * Shows the date picker inside a Popover (its native habitat). The state
 * is controlled locally so the user can play with it. Logs `onComplete`
 * to the subtitle for verification of idempotency.
 */

import * as React from "react";
import { LabSection } from "../LabSection";
import { ComponentShowcase } from "../ComponentShowcase";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/engine-ui/primitives/Popover";
import { DateRangePicker } from "@/components/engine-ui/DateRangePicker";
import type { DateRange } from "@/lib/booking-params";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

function formatRange(range: DateRange): string {
  if (!range.checkIn && !range.checkOut) return "Wybierz daty";
  const fmt = (iso: string | null) => {
    if (!iso) return "…";
    const [y, m, d] = iso.split("-").map(Number);
    return format(new Date(y, m - 1, d), "d MMM yyyy", { locale: pl });
  };
  return `${fmt(range.checkIn)} – ${fmt(range.checkOut)}`;
}

export function DatePickerSection() {
  const [range, setRange] = React.useState<DateRange>({ checkIn: null, checkOut: null });
  const [completeCount, setCompleteCount] = React.useState(0);
  const [lastComplete, setLastComplete] = React.useState<string | null>(null);
  const [open, setOpen] = React.useState(false);

  const handleComplete = (next: Required<DateRange>) => {
    setCompleteCount((c) => c + 1);
    setLastComplete(`${next.checkIn} → ${next.checkOut}`);
    // Let the user see the filled state briefly, then close.
    window.setTimeout(() => setOpen(false), 280);
  };

  const handleReset = () => {
    setRange({ checkIn: null, checkOut: null });
    setCompleteCount(0);
    setLastComplete(null);
  };

  return (
    <LabSection
      id="datepicker"
      title="Picker dat"
      description="Dwa miesiące obok siebie, kliknij dzień rozpoczęcia, potem dzień zakończenia. Najechanie kursorem pokazuje podgląd zakresu. Klawiatura: Enter/Space na komórkach dni, Tab między dniami."
    >
      <ComponentShowcase
        title="Picker dat w popoverze"
        caption="Kliknij trigger, wybierz zakres. Licznik onComplete sprawdza, że callback odpala się dokładnie raz na pełne wybranie zakresu."
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
                {formatRange(range)}
              </button>
            </PopoverTrigger>
            <PopoverContent size="large" align="center" side="bottom" sideOffset={12}>
              <DateRangePicker
                value={range}
                onChange={setRange}
                onComplete={handleComplete}
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
              maxWidth: 360, width: "100%", wordBreak: "break-all", boxSizing: "border-box",
              textAlign: "center",
            }}
          >
            <div>
              <strong>onComplete wywołań:</strong> {completeCount}
            </div>
            {lastComplete && (
              <div style={{ fontFamily: "ui-monospace, Menlo, monospace" }}>
                ostatni: {lastComplete}
              </div>
            )}
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
