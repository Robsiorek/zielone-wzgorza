"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { LabSection } from "../LabSection";
import { ComponentShowcase } from "../ComponentShowcase";
import { SpecimenInfo } from "../Specimen";
import { DebugPanel } from "../DebugPanel";
import { SearchBar } from "@/components/engine-ui/SearchBar";
import type { BookingSearchCriteria } from "@/lib/booking-params";
import { DEFAULT_SEARCH_CRITERIA } from "@/lib/booking-params";

function SearchBarDemo({
  variant,
  specimenId,
  specimenHint,
  caption,
}: {
  variant: "hero" | "compact";
  specimenId: string;
  specimenHint: string;
  caption: string;
}) {
  const [criteria, setCriteria] = React.useState<BookingSearchCriteria>({ ...DEFAULT_SEARCH_CRITERIA });
  const [submissions, setSubmissions] = React.useState<BookingSearchCriteria[]>([]);

  return (
    <ComponentShowcase
      title={variant === "hero" ? "Wariant hero" : "Wariant compact"}
      caption={caption}
      info={
        <>
          <SpecimenInfo id={specimenId} hint={specimenHint} />
          <DebugPanel
            fields={[
              { label: "mode", value: criteria.mode },
              { label: "criteria", value: JSON.stringify(criteria) },
              { label: "onSearch", value: `${submissions.length} wywołań` },
              ...(submissions.length > 0 ? [{ label: "ostatni", value: JSON.stringify(submissions[submissions.length - 1]) }] : []),
            ]}
          />
        </>
      }
    >
      <div style={{ width: "100%", maxWidth: variant === "hero" ? 860 : 480, margin: "0 auto" }}>
        <SearchBar
          variant={variant}
          value={criteria}
          onChange={setCriteria}
          onSearch={(c) => setSubmissions((prev) => [...prev, c])}
          petsPolicyHref="https://zielonewzgorza.eu/warunki-pobytu-ze-zwierzeciem"
        />
      </div>
    </ComponentShowcase>
  );
}

export function SearchBarSection() {
  return (
    <LabSection id="searchbar" title="Pasek wyszukiwania" icon={<Search />}
      description="Jeden komponent z dwoma wariantami. Segmenty Kiedy i Kto z popoverami."
    >
      <SearchBarDemo variant="hero" specimenId="variant=hero · 60px" specimenHint="Landing page. Centralny element hero." caption="Pill-shape, duże cele dotyku." />
      <SearchBarDemo variant="compact" specimenId="variant=compact · 48px" specimenHint="Sticky navbar na wynikach i detalach." caption="Identyczna logika, mniejsze proporcje." />
    </LabSection>
  );
}
