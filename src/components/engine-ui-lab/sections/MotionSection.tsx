"use client";

/**
 * MotionSection — live motion samples
 * ────────────────────────────────────────────────────────────────────────
 * Visualizes each easing curve + duration by animating a square across
 * a track on button press. Spring curves show visible overshoot; linear
 * looks mechanical — the contrast is the whole point.
 */

import * as React from "react";
import { Waves } from "lucide-react";
import { LabSection } from "../LabSection";
import { ComponentShowcase } from "../ComponentShowcase";

interface MotionPreset {
  name: string;
  easingVar: string;
  durationVar: string;
  description: string;
}

const PRESETS: MotionPreset[] = [
  {
    name: "ease-standard",
    easingVar: "var(--eui-ease-standard)",
    durationVar: "var(--eui-duration-base)",
    description: "Domyślne wejście/wyjście. Gładkie, bez overshoot.",
  },
  {
    name: "ease-enter",
    easingVar: "var(--eui-ease-enter)",
    durationVar: "var(--eui-duration-base)",
    description: "Wejście elementu. Szybki start, powolne zwalnianie.",
  },
  {
    name: "ease-exit",
    easingVar: "var(--eui-ease-exit)",
    durationVar: "var(--eui-duration-fast)",
    description: "Wyjście elementu. Powolny start, szybkie zniknięcie.",
  },
  {
    name: "spring-fast",
    easingVar: "var(--eui-spring-fast)",
    durationVar: "var(--eui-duration-slow)",
    description: "Subtelny overshoot. Dla micro-interakcji.",
  },
  {
    name: "spring-standard",
    easingVar: "var(--eui-spring-standard)",
    durationVar: "var(--eui-duration-slower)",
    description: "Standardowa sprężyna. Do większych tranzycji.",
  },
  {
    name: "spring-bounce",
    easingVar: "var(--eui-spring-bounce)",
    durationVar: "var(--eui-duration-slower)",
    description: "Wyraźny overshoot ~1.04. Dla \"żywych\" przycisków.",
  },
  {
    name: "linear (referencja)",
    easingVar: "linear",
    durationVar: "var(--eui-duration-slow)",
    description: "Mechaniczny. Służy jako punkt odniesienia.",
  },
];

function MotionDemo({ preset }: { preset: MotionPreset }) {
  const [running, setRunning] = React.useState(false);

  const handleClick = () => {
    // Toggle: first click → run forward, next click → return
    setRunning((r) => !r);
  };

  return (
    <div style={{ width: "100%" }}>
      <div className="eui-lab-motion-track">
        <div
          className={["eui-lab-motion-box", running && "eui-motion-running"]
            .filter(Boolean)
            .join(" ")}
          style={{
            transitionTimingFunction: preset.easingVar,
            transitionDuration: preset.durationVar,
          }}
          aria-hidden="true"
        />
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 16,
          gap: 16,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              fontSize: 13,
              fontWeight: 600,
              color: "var(--eui-text-primary)",
            }}
          >
            {preset.name}
          </div>
          <div
            style={{
              fontSize: 12,
              color: "var(--eui-text-secondary)",
              marginTop: 2,
            }}
          >
            {preset.description}
          </div>
        </div>
        <button
          type="button"
          onClick={handleClick}
          style={{
            background: "var(--eui-grey-900)",
            color: "var(--eui-grey-0)",
            border: "none",
            padding: "8px 16px",
            borderRadius: 8,
            fontFamily: "inherit",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          {running ? "Powrót" : "Odtwórz"}
        </button>
      </div>
    </div>
  );
}

export function MotionSection() {
  return (
    <LabSection
      id="motion"
      title="Ruch"
      icon={<Waves />}
      description="Krzywe ease i czasy tranzycji. Spring easings dają subtelny overshoot — to jest sygnał premium. Kliknij Odtwórz, by zobaczyć różnice."
    >
      <ComponentShowcase
        title="Krzywe i czasy"
        caption="Pierwszy klik puszcza do przodu, kolejny wraca. Bloczek czarny = element animowany."
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 32, width: "100%" }}>
          {PRESETS.map((p) => (
            <MotionDemo key={p.name} preset={p} />
          ))}
        </div>
      </ComponentShowcase>
    </LabSection>
  );
}
