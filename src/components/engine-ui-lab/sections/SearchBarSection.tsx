"use client";

/**
 * SearchBarSection — SearchBar showcase
 * ────────────────────────────────────────────────────────────────────────
 * Both variants, each with its own independent state. The hero variant
 * is the big pill for the landing page; the compact variant is what will
 * sit in the sticky navbar on the results view.
 *
 * Both demos log onSearch to confirm the submit wiring works.
 */

import * as React from "react";
import { LabSection } from "../LabSection";
import { ComponentShowcase } from "../ComponentShowcase";
import { SearchBar } from "@/components/engine-ui/SearchBar";
import type { BookingSearchCriteria } from "@/lib/booking-params";

const INITIAL_CRITERIA: BookingSearchCriteria = {
  checkIn: "",
  checkOut: "",
  adults: 2,
  children: 0,
  infants: 0,
  pets: 0,
};

function SearchBarDemo({
  variant,
  caption,
}: {
  variant: "hero" | "compact";
  caption: string;
}) {
  const [criteria, setCriteria] = React.useState<BookingSearchCriteria>(INITIAL_CRITERIA);
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
      description="Jeden komponent z dwoma wariantami (hero | compact). Segmenty Kiedy i Kto, każdy z własnym popoverem. Po wybraniu pełnego zakresu dat popover automatycznie przechodzi do wyboru gości (guest-first flow)."
    >
      <SearchBarDemo
        variant="hero"
        caption="Pill-shape, 68 px wysokości, duże cele dotyku. Landing page — centralny element hero."
      />
      <SearchBarDemo
        variant="compact"
        caption="48 px wysokości. Używany w sticky navbarze na stronie wyników. Identyczna logika, mniejsze proporcje."
      />
    </LabSection>
  );
}
