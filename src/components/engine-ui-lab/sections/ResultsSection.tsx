"use client";

/**
 * ResultsSection — Results Layer showcase for UI Lab
 * ────────────────────────────────────────────────────────────────────────
 * Demonstrates: Airbnb-style ResultCard with carousel, heart, badge,
 * rating, price popover, amenities modal. Plus ResultsHeader,
 * ResultsEmptyState, ResultsSkeleton.
 */

import * as React from "react";
import { LabSection } from "../LabSection";
import { ComponentShowcase } from "../ComponentShowcase";
import { ResultCard } from "@/components/engine-ui/ResultCard";
import { ResultsHeader } from "@/components/engine-ui/ResultsHeader";
import { ResultsEmptyState } from "@/components/engine-ui/ResultsEmptyState";
import { ResultsSkeleton } from "@/components/engine-ui/ResultsSkeleton";
import type { ResultCardData } from "@/components/engine-ui/results-types";

// ═══════════════════════════════════════════
// Mock data — Zielone Wzgórza resources
// ═══════════════════════════════════════════

const MOCK_RESULTS: ResultCardData[] = [
  {
    id: "1",
    name: "Domek Hobbit — Shire",
    slug: "domek-hobbit-shire",
    subtitle: "Nad jeziorem · klimatyzacja · taras",
    images: [
      { url: "https://placehold.co/800x600/1a1a2e/e0e0e0?text=Shire+1", alt: "Domek Shire — widok z zewnątrz" },
      { url: "https://placehold.co/800x600/16213e/e0e0e0?text=Shire+2", alt: "Domek Shire — wnętrze" },
      { url: "https://placehold.co/800x600/0f3460/e0e0e0?text=Shire+3", alt: "Domek Shire — taras" },
    ],
    capacity: 7,
    features: [
      { label: "Do 7 osób", icon: "users" },
      { label: "3 sypialnie", icon: "bed" },
      { label: "WiFi", icon: "wifi" },
      { label: "Sauna", icon: "sauna" },
    ],
    amenities: [
      {
        name: "Sypialnie i łazienki",
        items: [
          { name: "3 sypialnie z łóżkami podwójnymi" },
          { name: "2 łazienki z prysznicem" },
          { name: "Ręczniki i pościel" },
          { name: "Suszarka do włosów" },
        ],
      },
      {
        name: "Kuchnia",
        items: [
          { name: "W pełni wyposażona kuchnia" },
          { name: "Lodówka z zamrażalnikiem" },
          { name: "Zmywarka" },
          { name: "Ekspres do kawy" },
          { name: "Tostery i czajnik" },
        ],
      },
      {
        name: "Na zewnątrz",
        items: [
          { name: "Taras z widokiem na jezioro" },
          { name: "Grill gazowy" },
          { name: "Meble ogrodowe" },
          { name: "Parking" },
        ],
      },
      {
        name: "Udogodnienia",
        items: [
          { name: "WiFi" },
          { name: "Klimatyzacja" },
          { name: "Sauna fińska" },
          { name: "Smart TV" },
          { name: "Ogrzewanie podłogowe" },
        ],
      },
    ],
    availability: { status: "available" },
    price: { perNightMinor: 35000, totalMinor: 175000, nights: 5, currency: "PLN" },
    rating: { score: 4.92, count: 38 },
    imageBadge: "Wybór gości",
    isFavorite: false,
  },
  {
    id: "2",
    name: "Domek Hobbit — Rivendell",
    slug: "domek-hobbit-rivendell",
    subtitle: "Widok na las · jacuzzi · grill",
    images: [
      { url: "https://placehold.co/800x600/2d4a22/e0e0e0?text=Rivendell+1", alt: "Domek Rivendell" },
      { url: "https://placehold.co/800x600/3a5a2c/e0e0e0?text=Rivendell+2", alt: "Domek Rivendell — jacuzzi" },
    ],
    capacity: 7,
    features: [
      { label: "Do 7 osób", icon: "users" },
      { label: "3 sypialnie", icon: "bed" },
      { label: "Jacuzzi", icon: "bath" },
    ],
    amenities: [
      {
        name: "Sypialnie",
        items: [
          { name: "3 sypialnie" },
          { name: "2 łazienki" },
          { name: "Pościel premium" },
        ],
      },
      {
        name: "Relaks",
        items: [
          { name: "Jacuzzi na tarasie" },
          { name: "Grill" },
          { name: "Hamak" },
        ],
      },
    ],
    availability: { status: "available" },
    price: { perNightMinor: 38000, totalMinor: 190000, nights: 5, badge: "Najlepsza cena", currency: "PLN" },
    rating: { score: 4.87, count: 24 },
    isFavorite: true,
  },
  {
    id: "3",
    name: "Domek Hobbit — Lothlórien",
    slug: "domek-hobbit-lothlorien",
    subtitle: "Premium · widok na góry",
    images: [
      { url: "https://placehold.co/800x600/4a3728/e0e0e0?text=Lothlorien", alt: "Domek Lothlórien" },
    ],
    capacity: 7,
    features: [
      { label: "Do 7 osób", icon: "users" },
      { label: "3 sypialnie", icon: "bed" },
    ],
    amenities: [
      {
        name: "Premium",
        items: [
          { name: "Widok na góry" },
          { name: "Kominek" },
          { name: "Taras panoramiczny" },
        ],
      },
    ],
    availability: { status: "limited", label: "Ostatnie 2 terminy" },
    price: { perNightMinor: 42000, totalMinor: 210000, nights: 5, currency: "PLN" },
    rating: { score: 4.95, count: 12 },
    imageBadge: "Najlepiej oceniane",
  },
  {
    id: "4",
    name: "Pokój Dwuosobowy — Komfort",
    slug: "pokoj-dwuosobowy-komfort",
    subtitle: "Budynek główny · parter",
    capacity: 2,
    features: [
      { label: "Do 2 osób", icon: "users" },
      { label: "1 sypialnia", icon: "bed" },
    ],
    availability: { status: "unavailable" },
    price: { perNightMinor: 18000, currency: "PLN" },
  },
];

// ═══════════════════════════════════════════
// Section
// ═══════════════════════════════════════════

export function ResultsSection() {
  const [selected, setSelected] = React.useState<string | null>(null);
  const [favorites, setFavorites] = React.useState<Set<string>>(new Set(["2"]));

  const handleSelect = (data: ResultCardData) => {
    setSelected(data.slug);
  };

  const handleFavorite = (id: string, isFav: boolean) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (isFav) next.add(id); else next.delete(id);
      return next;
    });
  };

  // Inject favorite state into mock data
  const results = MOCK_RESULTS.map((r) => ({
    ...r,
    isFavorite: favorites.has(r.id),
  }));

  return (
    <LabSection
      id="results"
      title="Warstwa wyników"
      description="Airbnb-style karty wyników: karuzela zdjęć, serduszko, badge, ocena, cena z dymkiem szczegółów, udogodnienia w modalu. Całość klikalna."
    >
      {/* ── Results Header ── */}
      <ComponentShowcase
        title="ResultsHeader"
        caption="Liczba wyników + kontekst. Slot 'actions' na przyszłe sort/filter."
      >
        <div style={{ width: "100%" }}>
          <ResultsHeader
            count={12}
            subtitle="10-14 lip 2026 · 2 gości"
          />
        </div>
      </ComponentShowcase>

      {/* ── Result Cards ── */}
      <ComponentShowcase
        title="ResultCard — Airbnb style"
        caption="Kliknij kartę = onSelect. Kliknij cenę = dymek z detalami. Kliknij 'Udogodnienia' = modal. Serduszko = ulubione. Badge na zdjęciu."
        stage="transparent"
      >
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="eui-results-grid">
            {results.map((r) => (
              <ResultCard
                key={r.id}
                data={r}
                onSelect={handleSelect}
                onFavoriteChange={handleFavorite}
              />
            ))}
          </div>
          {selected && (
            <div
              style={{
                padding: 12,
                borderRadius: 8,
                backgroundColor: "var(--eui-grey-50)",
                fontSize: 13,
                fontFamily: "ui-monospace, Menlo, monospace",
                color: "var(--eui-text-secondary)",
                textAlign: "center",
              }}
            >
              onSelect → <strong>{selected}</strong>
            </div>
          )}
        </div>
      </ComponentShowcase>

      {/* ── Empty State ── */}
      <ComponentShowcase
        title="ResultsEmptyState"
        caption="Wyświetlany gdy wyszukiwanie zwraca 0 wyników."
      >
        <ResultsEmptyState
          onAction={() => alert("Zmień kryteria")}
        />
      </ComponentShowcase>

      {/* ── Skeleton ── */}
      <ComponentShowcase
        title="ResultsSkeleton"
        caption="Shimmer skeleton dopasowany do nowego layoutu kart."
        stage="transparent"
      >
        <div style={{ width: "100%" }}>
          <ResultsSkeleton count={3} showHeader />
        </div>
      </ComponentShowcase>
    </LabSection>
  );
}
