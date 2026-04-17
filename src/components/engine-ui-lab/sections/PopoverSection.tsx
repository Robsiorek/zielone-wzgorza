"use client";

/**
 * PopoverSection — Popover primitive + PopoverItem showcase
 * ────────────────────────────────────────────────────────────────────────
 * Demonstrates:
 *   - Four size variants (small / medium / large / contextual)
 *   - Animation on open (scale + translate + fade)
 *   - PopoverItem as a system row with colored icon + title + subtitle
 */

import * as React from "react";
import { MapPin, Search, Calendar, Clock, History } from "lucide-react";
import { LabSection } from "../LabSection";
import { ComponentShowcase } from "../ComponentShowcase";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/engine-ui/primitives/Popover";
import { PopoverItem } from "@/components/engine-ui/PopoverItem";

/**
 * Trigger button helper. Must use forwardRef + pass-through props because
 * Radix's <PopoverTrigger asChild> injects `ref`, `onClick`, `aria-*` and
 * `data-state` into the child element. Without forwardRef the ref is lost,
 * Radix can't wire up the open/close behavior, and clicks do nothing.
 */
const TriggerButton = React.forwardRef<
  HTMLButtonElement,
  { label: string } & React.ButtonHTMLAttributes<HTMLButtonElement>
>(function TriggerButton({ label, style, ...rest }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      style={{
        background: "var(--eui-grey-0)",
        border: "1px solid var(--eui-border-strong)",
        padding: "10px 20px",
        borderRadius: 9999,
        fontFamily: "inherit",
        fontSize: 14,
        fontWeight: 500,
        color: "var(--eui-text-primary)",
        cursor: "pointer",
        ...style,
      }}
      {...rest}
    >
      {label}
    </button>
  );
});

export function PopoverSection() {
  return (
    <LabSection
      id="popovers"
      title="Popovery"
      description="Radix Popover z naszą powłoką stylistyczną. Cztery warianty rozmiaru, animacja wejścia i wyjścia zgodna z krzywymi ease-enter / ease-exit."
    >
      {/* ── Size variants ── */}
      <ComponentShowcase
        title="Warianty rozmiaru"
        caption="Small (280), Medium (360), Large (520), Contextual (auto)."
      >
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
          <Popover>
            <PopoverTrigger asChild>
              <TriggerButton label="Small" />
            </PopoverTrigger>
            <PopoverContent size="small" align="start" side="bottom">
              <div>
                <h4 className="eui-title-3" style={{ marginBottom: 8 }}>Krótka lista</h4>
                <p className="eui-body-small" style={{ margin: 0 }}>
                  280 px szerokości. Do krótkich menu i pojedynczych akcji.
                </p>
              </div>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <TriggerButton label="Medium" />
            </PopoverTrigger>
            <PopoverContent size="medium" align="start" side="bottom">
              <div>
                <h4 className="eui-title-3" style={{ marginBottom: 8 }}>Średni rozmiar</h4>
                <p className="eui-body-small" style={{ margin: 0 }}>
                  360 px. Domyślny — picker gości, proste formularze. W tym labie
                  używany wszędzie, gdzie nie trzeba więcej miejsca.
                </p>
              </div>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <TriggerButton label="Large" />
            </PopoverTrigger>
            <PopoverContent size="large" align="start" side="bottom">
              <div>
                <h4 className="eui-title-3" style={{ marginBottom: 8 }}>Duży rozmiar</h4>
                <p className="eui-body-small" style={{ margin: 0 }}>
                  520 px. Do picker'a dat z dwoma miesiącami obok siebie, gęstszej
                  zawartości. Mieści co najmniej dwa kolumnowe widoki bok przy boku.
                </p>
              </div>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <TriggerButton label="Contextual" />
            </PopoverTrigger>
            <PopoverContent size="contextual" align="start" side="bottom">
              <div>
                <p className="eui-body-small" style={{ margin: 0 }}>
                  Auto-size. Max 320. Dla inline podpowiedzi.
                </p>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </ComponentShowcase>

      {/* ── PopoverItem showcase ── */}
      <ComponentShowcase
        title="PopoverItem — komponent systemowy"
        caption="Ikona w kolorowej kopercie + tytuł + opcjonalny opis. Używany w menu, sugestiach wyszukiwania, ostatnich zapytaniach."
      >
        <Popover>
          <PopoverTrigger asChild>
            <TriggerButton label="Otwórz menu z itemami" />
          </PopoverTrigger>
          <PopoverContent size="medium" align="start" side="bottom">
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <PopoverItem
                icon={<Search size={20} />}
                title="Popularne zapytanie"
                subtitle="Domki nad jeziorem"
              />
              <PopoverItem
                icon={<History size={20} />}
                title="Ostatnio szukane"
                subtitle="15-17 maja, 2 osoby"
              />
              <PopoverItem
                icon={<MapPin size={20} />}
                title="Zielone Wzgórza"
                subtitle="Jedyna lokalizacja"
                selected
              />
              <PopoverItem
                icon={<Calendar size={20} />}
                title="Następny weekend"
                subtitle="22-24 maja"
              />
              <PopoverItem
                icon={<Clock size={20} />}
                title="Niedostępne"
                subtitle="Wersja demonstracyjna"
                disabled
              />
            </div>
          </PopoverContent>
        </Popover>
      </ComponentShowcase>
    </LabSection>
  );
}
