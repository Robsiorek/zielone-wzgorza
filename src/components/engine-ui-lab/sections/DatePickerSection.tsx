"use client";

import * as React from "react";
import { CalendarRange } from "lucide-react";
import { LabSection } from "../LabSection";
import { ComponentShowcase } from "../ComponentShowcase";
import { SpecimenInfo } from "../Specimen";
import { DebugPanel } from "../DebugPanel";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/engine-ui/primitives/Popover";
import { DatePickerTabs } from "@/components/engine-ui/DatePickerTabs";
import { type BookingSearchCriteria, DEFAULT_SEARCH_CRITERIA } from "@/lib/booking-params";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

const DURATION_LABELS: Record<string, string> = { weekend: "Weekend", "5days": "5 dni", week: "Tydzień" };

function formatDisplay(c: BookingSearchCriteria): string {
  if (c.mode === "exact") {
    if (!c.checkIn && !c.checkOut) return "Wybierz daty";
    const fmt = (iso: string) => {
      if (!iso) return "…";
      const [y, m, d] = iso.split("-").map(Number);
      return format(new Date(y, m - 1, d), "d MMM yyyy", { locale: pl });
    };
    return `${fmt(c.checkIn)} – ${fmt(c.checkOut)}`;
  }
  const dur = DURATION_LABELS[c.duration] ?? c.duration;
  if (!c.month) return `${dur} — wybierz miesiąc`;
  const [y, m] = c.month.split("-").map(Number);
  return `${dur} · ${format(new Date(y, m - 1, 1), "LLLL yyyy", { locale: pl })}`;
}

export function DatePickerSection() {
  const [criteria, setCriteria] = React.useState<BookingSearchCriteria>({ ...DEFAULT_SEARCH_CRITERIA });
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
    <LabSection id="datepicker" title="Picker dat" icon={<CalendarRange />}
      description="Dwa tryby: Dokładne (kalendarz) i Elastyczne (czas pobytu + miesiąc). Jeden union."
    >
      <ComponentShowcase title="DatePickerTabs" caption="Kliknij trigger, przełączaj tryby."
        info={
          <>
            <SpecimenInfo id="DatePickerTabs" hint="Dokładne + Elastyczne. Jeden value, jeden onChange." />
            <DebugPanel
              fields={[
                { label: "mode", value: criteria.mode },
                { label: "value", value: JSON.stringify(criteria) },
                { label: "onComplete", value: `${completeCount} wywołań` },
              ]}
              onReset={handleReset}
            />
          </>
        }
      >
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button type="button" style={{
              background: "var(--eui-grey-0)", border: "1px solid var(--eui-border-strong)",
              padding: "12px 24px", borderRadius: 9999, fontFamily: "inherit",
              fontSize: 14, fontWeight: 500, color: "var(--eui-text-primary)",
              cursor: "pointer", minWidth: 280,
            }}>
              {formatDisplay(criteria)}
            </button>
          </PopoverTrigger>
          <PopoverContent size="large" align="center" side="bottom" sideOffset={12}>
            <DatePickerTabs value={criteria} onChange={setCriteria} onExactComplete={handleComplete} />
          </PopoverContent>
        </Popover>
      </ComponentShowcase>
    </LabSection>
  );
}
