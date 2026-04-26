"use client";

import * as React from "react";
import { Users } from "lucide-react";
import { LabSection } from "../LabSection";
import { ComponentShowcase } from "../ComponentShowcase";
import { SpecimenInfo } from "../Specimen";
import { DebugPanel } from "../DebugPanel";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/engine-ui/primitives/Popover";
import { GuestPicker } from "@/components/engine-ui/GuestPicker";
import { type BookingParty, DEFAULT_BOOKING_PARTY, effectiveGuests } from "@/lib/booking-params";

function summarize(party: BookingParty): string {
  const eff = effectiveGuests(party);
  const parts = [`${eff} gości`];
  if (party.infants > 0) parts.push(`${party.infants} małe`);
  if (party.pets > 0) parts.push(`${party.pets} zwierz.`);
  return parts.join(", ");
}

function GuestPickerDemo({
  title, caption, allowPets, specimenId, specimenHint,
}: {
  title: string; caption: string; allowPets: boolean;
  specimenId: string; specimenHint: string;
}) {
  const [party, setParty] = React.useState<BookingParty>(DEFAULT_BOOKING_PARTY);
  const [open, setOpen] = React.useState(false);
  const [applyCount, setApplyCount] = React.useState(0);

  return (
    <ComponentShowcase title={title} caption={caption}
      info={
        <>
          <SpecimenInfo id={specimenId} hint={specimenHint} />
          <DebugPanel fields={[
            { label: "party", value: JSON.stringify(party) },
            { label: "onChange", value: `${applyCount} wywołań` },
          ]} />
        </>
      }
    >
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button type="button" style={{
            background: "var(--eui-grey-0)", border: "1px solid var(--eui-border-strong)",
            padding: "12px 24px", borderRadius: 9999, fontFamily: "inherit",
            fontSize: 14, fontWeight: 500, color: "var(--eui-text-primary)", cursor: "pointer",
          }}>
            {summarize(party)}
          </button>
        </PopoverTrigger>
        <PopoverContent size="medium" align="center" side="bottom" sideOffset={12}>
          <GuestPicker
            value={party}
            onChange={(next) => { setParty(next); setApplyCount((c) => c + 1); }}
            onApply={() => setOpen(false)}
            allowPets={allowPets}
            petsPolicyHref={allowPets ? "https://zielonewzgorza.eu/warunki-pobytu-ze-zwierzeciem" : undefined}
          />
        </PopoverContent>
      </Popover>
    </ComponentShowcase>
  );
}

export function GuestPickerSection() {
  return (
    <LabSection id="guestpicker" title="Picker gości" icon={<Users />}
      description="Cztery kategorie gości. Draft + commit model: Zastosuj commituje, Wyczyść resetuje draft."
    >
      <GuestPickerDemo title="Standardowy" caption="Wszystkie wiersze widoczne."
        allowPets specimenId="allowPets=true" specimenHint="Domyślny. Pełna lista kategorii." />
      <GuestPickerDemo title="Bez zwierząt" caption="Wiersz zwierząt usunięty z DOM."
        allowPets={false} specimenId="allowPets=false" specimenHint="Obiekt bez zwierząt." />
    </LabSection>
  );
}
