"use client";

/**
 * GuestPickerSection — GuestPicker showcase
 * ────────────────────────────────────────────────────────────────────────
 * Shows the guest picker's commit model in action:
 *   - +/- mutates the draft silently
 *   - "Wyczyść" resets draft only (no parent update visible)
 *   - "Zastosuj" is the sole commit point (subtitle updates only then)
 *
 * Two demos: standard (allowPets=true) and no-pets policy (allowPets=false)
 * to verify the row is actually hidden, not just disabled.
 */

import * as React from "react";
import { LabSection } from "../LabSection";
import { ComponentShowcase } from "../ComponentShowcase";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/engine-ui/primitives/Popover";
import { GuestPicker } from "@/components/engine-ui/GuestPicker";
import {
  type BookingParty,
  DEFAULT_BOOKING_PARTY,
  effectiveGuests,
} from "@/lib/booking-params";

function summarize(party: BookingParty): string {
  const eff = effectiveGuests(party);
  const bits: string[] = [`${eff} ${eff === 1 ? "gość" : eff < 5 ? "gości" : "gości"}`];
  if (party.infants > 0) bits.push(`${party.infants} małe`);
  if (party.pets > 0) bits.push(`${party.pets} zwierz.`);
  return bits.join(", ");
}

function GuestPickerDemo({
  title,
  allowPets,
  caption,
}: {
  title: string;
  allowPets: boolean;
  caption: string;
}) {
  const [party, setParty] = React.useState<BookingParty>(DEFAULT_BOOKING_PARTY);
  const [open, setOpen] = React.useState(false);
  const [applyCount, setApplyCount] = React.useState(0);

  return (
    <ComponentShowcase title={title} caption={caption}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
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
                minWidth: 220,
              }}
            >
              {summarize(party)}
            </button>
          </PopoverTrigger>
          <PopoverContent size="medium" align="center" side="bottom" sideOffset={12}>
            <GuestPicker
              value={party}
              onChange={(next) => {
                setParty(next);
                setApplyCount((c) => c + 1);
              }}
              onApply={() => setOpen(false)}
              allowPets={allowPets}
              petsPolicyHref={
                allowPets
                  ? "https://zielonewzgorza.eu/warunki-pobytu-ze-zwierzeciem"
                  : undefined
              }
            />
          </PopoverContent>
        </Popover>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
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
            <strong>parent state:</strong> {JSON.stringify(party)}
          </div>
          <div style={{ fontSize: 12 }}>onChange wywołań: {applyCount}</div>
        </div>
      </div>
    </ComponentShowcase>
  );
}

export function GuestPickerSection() {
  return (
    <LabSection
      id="guestpicker"
      title="Picker gości"
      description="Cztery kategorie: dorośli, dzieci, małe dzieci, zwierzęta. Draft state wewnątrz picker'a: przyciski +/- nie wywołują onChange, dopiero Zastosuj commituje zmiany do rodzica. Wyczyść to tylko lokalny reset."
    >
      <GuestPickerDemo
        title="Standardowy (allowPets=true)"
        allowPets={true}
        caption="Wszystkie cztery wiersze widoczne. Policz onChange — zmienia się tylko przy Zastosuj."
      />
      <GuestPickerDemo
        title="Polityka bez zwierząt (allowPets=false)"
        allowPets={false}
        caption="Wiersz zwierząt jest usunięty z DOM, nie tylko wyłączony. Użytkownik nie jest wprowadzany w błąd co do polityki obiektu."
      />
    </LabSection>
  );
}
