"use client";

/**
 * NightsMeta + kanoniczny formatter nocy — Engine UI Part 13 (Commerce + Utility).
 *
 * Cienki preset na MetaText: liczba nocy z poprawną polską pluralizacją
 * jako meta-text (opcjonalna ikona, reuse `.eui-meta-text` — zero nowego CSS).
 * `formatNights` / `nightsLabel` = jedno kanoniczne źródło "noc / noce / nocy".
 *
 * UWAGA (PO D3): util DODANY addytywnie. Istniejące call-sites
 * (PriceBlock, ResultCard `pluralNights`, StepResults, StepQuote, admin
 * tabele, calendar) NIE są jeszcze refaktorowane — dedup = osobny cleanup
 * later. Reguła pluralizacji = DOKŁADNIE istniejąca uproszczona (1 → noc,
 * 2-4 → noce, 5+ → nocy), żeby util był drop-in bez zmiany zachowania
 * (świadomie NIE poprawiamy edge 12-14 — to byłaby ukryta zmiana zachowania).
 */

import * as React from "react";
import { MetaText, type MetaTextProps } from "./MetaText";

/** Rzeczownik "noc" w odmianie przez liczbę — uproszczona reguła = parytet z istniejącym kodem. */
export function nightsLabel(nights: number): "noc" | "noce" | "nocy" {
  const n = Math.abs(nights);
  if (n === 1) return "noc";
  if (n < 5) return "noce";
  return "nocy";
}

/** "1 noc" · "3 noce" · "7 nocy" — kanoniczny format liczby nocy. */
export function formatNights(nights: number): string {
  return `${nights} ${nightsLabel(nights)}`;
}

export interface NightsMetaProps extends Omit<MetaTextProps, "children"> {
  /** Liczba nocy. */
  nights: number;
}

export const NightsMeta = React.forwardRef<HTMLElement, NightsMetaProps>(
  function NightsMeta({ nights, ...rest }, ref) {
    return (
      <MetaText ref={ref} {...rest}>
        {formatNights(nights)}
      </MetaText>
    );
  }
);

NightsMeta.displayName = "NightsMeta";
