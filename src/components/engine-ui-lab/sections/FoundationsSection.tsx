"use client";

/**
 * FoundationsSection — design tokens showcase
 * ────────────────────────────────────────────────────────────────────────
 * Displays the raw primitives of the engine-ui system:
 *   - Colors       (brand from widget-config + grey scale)
 *   - Typography   (display / title / body / caption)
 *   - Spacing      (2 → 80 px scale)
 *   - Radius       (4 → 32 + pill)
 *   - Elevation    (5 levels)
 *   - Materials    (thin / regular / thick backdrop-filter)
 *
 * The brand color pulled from widget-config is shown explicitly so Robert
 * can verify the theme variable plumbing is working end-to-end.
 */

import * as React from "react";
import { Palette } from "lucide-react";
import { LabSection } from "../LabSection";
import { ComponentShowcase } from "../ComponentShowcase";
import type { WidgetTheme } from "@/components/engine-ui/hooks/useWidgetTheme";

interface FoundationsSectionProps {
  theme: WidgetTheme | null;
}

const GREYS = [
  { name: "grey-0",    value: "#ffffff" },
  { name: "grey-50",   value: "#f7f7f7" },
  { name: "grey-100",  value: "#ebebeb" },
  { name: "grey-200",  value: "#dddddd" },
  { name: "grey-300",  value: "#c0c0c0" },
  { name: "grey-400",  value: "#a4a4a4" },
  { name: "grey-500",  value: "#717171" },
  { name: "grey-600",  value: "#595959" },
  { name: "grey-700",  value: "#404040" },
  { name: "grey-800",  value: "#222222" },
  { name: "grey-900",  value: "#111111" },
];

const SPACING = [
  { name: "space-1",  value: 2 },
  { name: "space-2",  value: 4 },
  { name: "space-3",  value: 8 },
  { name: "space-4",  value: 12 },
  { name: "space-5",  value: 16 },
  { name: "space-6",  value: 24 },
  { name: "space-7",  value: 32 },
  { name: "space-8",  value: 40 },
  { name: "space-9",  value: 48 },
  { name: "space-10", value: 64 },
  { name: "space-11", value: 80 },
];

const RADII = [
  { name: "xs",   value: 4 },
  { name: "sm",   value: 8 },
  { name: "md",   value: 12 },
  { name: "lg",   value: 16 },
  { name: "xl",   value: 20 },
  { name: "2xl",  value: 24 },
  { name: "3xl",  value: 28 },
  { name: "4xl",  value: 32 },
  { name: "pill", value: 9999 },
];

const ELEVATIONS = [
  { name: "elev-1", var: "var(--eui-elev-1)" },
  { name: "elev-2", var: "var(--eui-elev-2)" },
  { name: "elev-3", var: "var(--eui-elev-3)" },
  { name: "elev-4", var: "var(--eui-elev-4)" },
  { name: "elev-5", var: "var(--eui-elev-5)" },
];

export function FoundationsSection({ theme }: FoundationsSectionProps) {
  const brand = theme?.theme.primaryColor ?? "#2d7df6";
  const brandFg = theme?.theme.primaryForeground ?? "#ffffff";
  // Engine UI Lab MUSI ignorować widget theme dla fontu — backend hardcoded.
  const font = "Manrope";

  return (
    <LabSection
      id="foundations"
      title="Fundamenty"
      icon={<Palette />}
      description="Tokeny wizualne — kolory, typografia, odstępy, zaokrąglenia, cienie, materiały. Kolor marki pochodzi z widget-config. Font systemowy Engine UI Lab: Manrope (hardcoded, niezmienialny przez widget-config)."
    >
      {/* ── Colors ── */}
      <ComponentShowcase
        title="Kolory"
        caption="Neutralna skala szarości plus kolor marki pobrany z widget-config."
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 24, width: "100%" }}>
          {/* Brand chip */}
          <div className="eui-lab-swatch-grid">
            <div className="eui-lab-swatch">
              <div
                className="eui-lab-swatch-chip"
                style={{ backgroundColor: brand }}
                aria-hidden="true"
              />
              <span className="eui-lab-swatch-name">brand (--primary)</span>
              <span className="eui-lab-swatch-value">{brand}</span>
            </div>
            <div className="eui-lab-swatch">
              <div
                className="eui-lab-swatch-chip"
                style={{ backgroundColor: brandFg, border: "1px solid var(--eui-border-strong)" }}
                aria-hidden="true"
              />
              <span className="eui-lab-swatch-name">brand-foreground</span>
              <span className="eui-lab-swatch-value">{brandFg}</span>
            </div>
          </div>

          {/* Grey ramp */}
          <div className="eui-lab-swatch-grid">
            {GREYS.map((g) => (
              <div key={g.name} className="eui-lab-swatch">
                <div
                  className="eui-lab-swatch-chip"
                  style={{
                    backgroundColor: g.value,
                    border: g.name === "grey-0" ? "1px solid var(--eui-border-strong)" : undefined,
                  }}
                  aria-hidden="true"
                />
                <span className="eui-lab-swatch-name">{g.name}</span>
                <span className="eui-lab-swatch-value">{g.value}</span>
              </div>
            ))}
          </div>
        </div>
      </ComponentShowcase>

      {/* ── Typography ── */}
      <ComponentShowcase
        title="Typografia"
        caption={`Font systemowy: ${font}. Display ma ujemne letter-spacing (premium signal).`}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 20, width: "100%" }}>
          <div>
            <span className="eui-display-1">Display 1 — 48/600/-0.12</span>
          </div>
          <div>
            <span className="eui-display-2">Display 2 — 40/600/-0.06</span>
          </div>
          <div>
            <span className="eui-title-1">Title 1 — 26/600</span>
          </div>
          <div>
            <span className="eui-title-2">Title 2 — 22/600</span>
          </div>
          <div>
            <span className="eui-title-3">Title 3 — 18/500</span>
          </div>
          <div>
            <span className="eui-body-large">Body large — 16/400. Pozwól mi opowiedzieć o naszym ośrodku.</span>
          </div>
          <div>
            <span className="eui-body">Body — 14/400. Standardowy tekst dla zawartości ekranu.</span>
          </div>
          <div>
            <span className="eui-body-small">Body small — 13/400. Pomocniczy opis, pod tytułami.</span>
          </div>
          <div>
            <span className="eui-caption">Caption — 12/400. Metadane, jednostki, labelki.</span>
          </div>
          <div>
            <span className="eui-label">LABEL — 12/600</span>
          </div>
        </div>
      </ComponentShowcase>

      {/* ── Spacing ── */}
      <ComponentShowcase
        title="Odstępy"
        caption="Dyskretna skala od 2 px do 80 px. Każdy padding/margin odwołuje się do jednej z tych wartości."
      >
        <div style={{ width: "100%" }}>
          {SPACING.map((s) => (
            <div key={s.name} className="eui-lab-spec-row">
              <span className="eui-lab-spec-name">{s.name}</span>
              <div className="eui-lab-spec-visual">
                <div className="eui-lab-spec-bar" style={{ width: `${s.value}px` }} />
              </div>
              <span className="eui-lab-spec-value">{s.value}px</span>
            </div>
          ))}
        </div>
      </ComponentShowcase>

      {/* ── Radius ── */}
      <ComponentShowcase
        title="Zaokrąglenia"
        caption="Od ostrych (4 px) przez kartę (16 px) do pill (9999)."
      >
        <div style={{ width: "100%" }}>
          {RADII.map((r) => (
            <div key={r.name} className="eui-lab-spec-row">
              <span className="eui-lab-spec-name">radius-{r.name}</span>
              <div className="eui-lab-spec-visual">
                <div
                  className="eui-lab-spec-box"
                  style={{
                    width: 56,
                    height: 40,
                    borderRadius: r.value === 9999 ? 9999 : r.value,
                  }}
                />
              </div>
              <span className="eui-lab-spec-value">
                {r.value === 9999 ? "pill" : `${r.value}px`}
              </span>
            </div>
          ))}
        </div>
      </ComponentShowcase>

      {/* ── Elevation ── */}
      <ComponentShowcase
        title="Elevacje"
        caption="Pięć poziomów. Każdy łączy 1 px hairline + soft drop shadow. Kolejno rosnące znaczenie hierarchii."
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 20,
            width: "100%",
          }}
        >
          {ELEVATIONS.map((e) => (
            <div key={e.name} className="eui-lab-elev-card" style={{ boxShadow: e.var }}>
              {e.name}
            </div>
          ))}
        </div>
      </ComponentShowcase>

      {/* ── Materials ── */}
      <ComponentShowcase
        title="Materiały"
        caption="Trzy warianty backdrop-filter. Widoczne dzięki treści tła pod spodem."
      >
        <div
          style={{
            width: "100%",
            backgroundImage:
              "url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22600%22 height=%22240%22><defs><linearGradient id=%22g%22 x1=%220%22 x2=%221%22 y1=%220%22 y2=%221%22><stop offset=%220%22 stop-color=%22%23f97316%22/><stop offset=%2250%22 stop-color=%22%23eab308%22/><stop offset=%22100%22 stop-color=%22%2322c55e%22/></linearGradient></defs><rect width=%22600%22 height=%22240%22 fill=%22url(%23g)%22/></svg>')",
            backgroundSize: "cover",
            borderRadius: 16,
            padding: 20,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 16,
          }}
        >
          <div
            style={{
              height: 100,
              borderRadius: 12,
              background: "var(--eui-material-thin-bg)",
              backdropFilter: "var(--eui-material-thin-filter)",
              WebkitBackdropFilter: "var(--eui-material-thin-filter)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
              fontWeight: 600,
              color: "var(--eui-grey-900)",
            }}
          >
            thin
          </div>
          <div
            style={{
              height: 100,
              borderRadius: 12,
              background: "var(--eui-material-regular-bg)",
              backdropFilter: "var(--eui-material-regular-filter)",
              WebkitBackdropFilter: "var(--eui-material-regular-filter)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
              fontWeight: 600,
              color: "var(--eui-grey-900)",
            }}
          >
            regular
          </div>
          <div
            style={{
              height: 100,
              borderRadius: 12,
              background: "var(--eui-material-thick-bg)",
              backdropFilter: "var(--eui-material-thick-filter)",
              WebkitBackdropFilter: "var(--eui-material-thick-filter)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
              fontWeight: 600,
              color: "var(--eui-grey-900)",
            }}
          >
            thick
          </div>
        </div>
      </ComponentShowcase>
    </LabSection>
  );
}
