"use client";

/**
 * SearchBarSection — SearchBar showcase
 * ────────────────────────────────────────────────────────────────────────
 * Both variants, each with its own independent state using the
 * BookingSearchCriteria discriminated union.
 */

import * as React from "react";
import { LabSection } from "../LabSection";
import { ComponentShowcase } from "../ComponentShowcase";
import { SearchBar } from "@/components/engine-ui/SearchBar";
import type { BookingSearchCriteria } from "@/lib/booking-params";
import { DEFAULT_SEARCH_CRITERIA } from "@/lib/booking-params";

function SearchBarDemo({
  variant,
  caption,
}: {
  variant: "hero" | "compact";
  caption: string;
}) {
  const [criteria, setCriteria] = React.useState<BookingSearchCriteria>({
    ...DEFAULT_SEARCH_CRITERIA,
  });
  const [submissions, setSubmissions] = React.useState<BookingSearchCriteria[]>([]);

  return (
    <ComponentShowcase
      title={variant === "hero" ? "Wariant hero (landing)" : "Wariant compact (sticky nav)"}
      caption={caption}
      stage="transparent"
    >
      <div
        style={{
          width: "100%",
          padding: variant === "hero" ? "48px 24px" : "24px",
          backgroundColor: "var(--eui-grey-50)",
          borderRadius: 16,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 20,
        }}
      >
        <SearchBar
          variant={variant}
          value={criteria}
          onChange={setCriteria}
          onSearch={(c) => setSubmissions((prev) => [...prev, c])}
          petsPolicyHref="https://zielonewzgorza.eu/warunki-pobytu-ze-zwierzeciem"
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            padding: 12,
            borderRadius: 8,
            backgroundColor: "var(--eui-grey-0)",
            fontSize: 12,
            color: "var(--eui-text-secondary)",
            fontFamily: "ui-monospace, Menlo, monospace",
            maxWidth: 560,
            width: "100%",
            wordBreak: "break-all",
            boxSizing: "border-box",
          }}
        >
          <div>
            <strong>criteria:</strong> {JSON.stringify(criteria)}
          </div>
          <div style={{ marginTop: 6 }}>
            <strong>onSearch wywołań:</strong> {submissions.length}
          </div>
          {submissions.length > 0 && (
            <div style={{ marginTop: 4 }}>
              <strong>ostatni submit:</strong> {JSON.stringify(submissions[submissions.length - 1])}
            </div>
          )}
        </div>
      </div>
    </ComponentShowcase>
  );
}

export function SearchBarSection() {
  return (
    <LabSection
      id="searchbar"
      title="Pasek wyszukiwania"
      description="Jeden komponent z dwoma wariantami (hero | compact). Segmenty Kiedy i Kto, każdy z własnym popoverem. Kiedy zawiera tryb Dokładne (kalendarz) i Elastyczne (czas pobytu + miesiąc). Jeden kontrakt danych: BookingSearchCriteria."
    >
      <SearchBarDemo
        variant="hero"
        caption="Pill-shape, 60 px min. wysokości, duże cele dotyku. Landing page — centralny element hero."
      />
      <SearchBarDemo
        variant="compact"
        caption="48 px wysokości. Używany w sticky navbarze na stronie wyników. Identyczna logika, mniejsze proporcje."
      />
    </LabSection>
  );
}
