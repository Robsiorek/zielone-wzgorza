"use client";

import * as React from "react";
import { LayoutList } from "lucide-react";
import { LabSection } from "../LabSection";
import { ComponentShowcase } from "../ComponentShowcase";
import { SpecimenInfo } from "../Specimen";
import { DebugPanel } from "../DebugPanel";
import { ResultCard } from "@/components/engine-ui/ResultCard";
import { ResultsHeader } from "@/components/engine-ui/ResultsHeader";
import { ResultsEmptyState } from "@/components/engine-ui/ResultsEmptyState";
import { ResultsSkeleton } from "@/components/engine-ui/ResultsSkeleton";
import type { ResultCardData } from "@/components/engine-ui/results-types";

const MOCK_RESULTS: ResultCardData[] = [
  {
    id: "1", name: "Domek Hobbit — Shire", slug: "domek-hobbit-shire",
    subtitle: "Nad jeziorem · klimatyzacja · taras",
    images: [
      { url: "https://placehold.co/800x600/1a1a2e/e0e0e0?text=Shire+1", alt: "Shire widok" },
      { url: "https://placehold.co/800x600/16213e/e0e0e0?text=Shire+2", alt: "Shire wnętrze" },
    ],
    capacity: 7,
    features: [{ label: "Do 7 osób", icon: "users" }, { label: "3 sypialnie", icon: "bed" }, { label: "WiFi", icon: "wifi" }],
    amenities: [
      { name: "Sypialnie", items: [{ name: "3 sypialnie" }, { name: "2 łazienki" }] },
      { name: "Udogodnienia", items: [{ name: "WiFi" }, { name: "Klimatyzacja" }, { name: "Sauna" }] },
    ],
    availability: { status: "available" },
    price: { perNightMinor: 35000, totalMinor: 175000, nights: 5, currency: "PLN" },
    rating: { score: 4.92, count: 38 },
    imageBadge: "Wybór gości",
  },
  {
    id: "2", name: "Domek Hobbit — Rivendell", slug: "domek-hobbit-rivendell",
    subtitle: "Widok na las · jacuzzi",
    images: [{ url: "https://placehold.co/800x600/2d4a22/e0e0e0?text=Rivendell", alt: "Rivendell" }],
    capacity: 7,
    features: [{ label: "Do 7 osób", icon: "users" }, { label: "Jacuzzi", icon: "bath" }],
    amenities: [{ name: "Relaks", items: [{ name: "Jacuzzi" }, { name: "Grill" }] }],
    availability: { status: "available" },
    price: { perNightMinor: 38000, totalMinor: 190000, nights: 5, badge: "Najlepsza cena", currency: "PLN" },
    rating: { score: 4.87, count: 24 },
    isFavorite: true,
  },
  {
    id: "3", name: "Domek Hobbit — Lothlórien", slug: "domek-hobbit-lothlorien",
    subtitle: "Premium · widok na góry",
    images: [{ url: "https://placehold.co/800x600/4a3728/e0e0e0?text=Lothlorien", alt: "Lothlórien" }],
    capacity: 7,
    features: [{ label: "Do 7 osób", icon: "users" }, { label: "Góry", icon: "mountain" }],
    availability: { status: "limited", label: "Ostatnie 2 terminy" },
    price: { perNightMinor: 42000, totalMinor: 210000, nights: 5, currency: "PLN" },
    rating: { score: 4.95, count: 12 },
    imageBadge: "Najlepiej oceniane",
  },
  {
    id: "4", name: "Pokój Dwuosobowy — Komfort", slug: "pokoj-dwuosobowy-komfort",
    subtitle: "Budynek główny · parter",
    capacity: 2,
    features: [{ label: "Do 2 osób", icon: "users" }, { label: "WiFi", icon: "wifi" }],
    availability: { status: "unavailable" },
    price: { perNightMinor: 18000, currency: "PLN" },
  },
];

export function ResultsSection() {
  const [selected, setSelected] = React.useState<string | null>(null);
  const [favorites, setFavorites] = React.useState<Set<string>>(new Set(["2"]));

  const handleFavorite = (id: string, isFav: boolean) => {
    setFavorites((prev) => { const next = new Set(prev); if (isFav) next.add(id); else next.delete(id); return next; });
  };

  const results = MOCK_RESULTS.map((r) => ({ ...r, isFavorite: favorites.has(r.id) }));

  return (
    <LabSection id="results" title="Warstwa wyników" icon={<LayoutList />}
      description="Airbnb-style karty wyników: karuzela, serduszko, badge, ocena, cena z dymkiem, udogodnienia w modalu."
    >
      <ComponentShowcase title="ResultsHeader" caption="Nagłówek wyników z liczbą i kontekstem."
        info={<SpecimenInfo id="ResultsHeader" hint="Liczba wyników + subtitle + slot actions." />}
      >
        <div style={{ width: "100%", alignSelf: "flex-start" }}>
          <ResultsHeader count={12} subtitle="10-14 lip 2026 · 2 gości" />
        </div>
      </ComponentShowcase>

      <ComponentShowcase title="ResultCard" caption="Kliknij kartę, cenę, udogodnienia, serduszko."
        info={
          <>
            <SpecimenInfo id="ResultCard" hint="Karuzela + badge + ocena + cena + modal udogodnień." />
            {selected && <DebugPanel fields={[
              { label: "onSelect", value: selected },
              { label: "favorites", value: `${favorites.size} zaznaczonych` },
            ]} />}
          </>
        }
      >
        <div className="eui-results-grid" style={{ width: "100%" }}>
          {results.map((r) => (
            <ResultCard key={r.id} data={r} onSelect={(d) => setSelected(d.slug)} onFavoriteChange={handleFavorite} />
          ))}
        </div>
      </ComponentShowcase>

      <ComponentShowcase title="ResultsEmptyState" caption="Brak wyników wyszukiwania."
        info={<SpecimenInfo id="ResultsEmptyState" hint="Ikona + wiadomość + CTA." />}
      >
        <ResultsEmptyState onAction={() => alert("Zmień kryteria")} />
      </ComponentShowcase>

      <ComponentShowcase title="ResultsSkeleton" caption="Loading state dopasowany do layoutu karty."
        info={<SpecimenInfo id="ResultsSkeleton" hint="Shimmer. count + showHeader." />}
      >
        <div style={{ width: "100%", maxWidth: 360 }}>
          <ResultsSkeleton count={1} />
        </div>
      </ComponentShowcase>
    </LabSection>
  );
}
