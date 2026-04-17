"use client";

/**
 * FeatureChips — horizontal feature chip list (engine-ui)
 * ────────────────────────────────────────────────────────────────────────
 * Renders a row of small chips with optional icons. Truncates after
 * `maxVisible` with a "+N" overflow indicator.
 *
 * Icons are mapped from string names (FeatureIconName) to Lucide
 * components here — the view model stays serializable.
 */

import * as React from "react";
import {
  Users,
  Bed,
  Wifi,
  Bath,
  Flame,
  TreePine,
  Dog,
  Baby,
  Mountain,
  Waves,
  Car,
} from "lucide-react";
import type { FeatureChip as FeatureChipData, FeatureIconName } from "./results-types";

// ═══════════════════════════════════════════
// Icon map
// ═══════════════════════════════════════════

const ICON_MAP: Record<FeatureIconName, React.ComponentType<{ size?: number | string }>> = {
  users: Users,
  bed: Bed,
  wifi: Wifi,
  bath: Bath,
  sauna: Flame,
  treePine: TreePine,
  dog: Dog,
  baby: Baby,
  mountain: Mountain,
  waves: Waves,
  flame: Flame,
  car: Car,
};

// ═══════════════════════════════════════════
// Component
// ═══════════════════════════════════════════

export interface FeatureChipsProps {
  chips: FeatureChipData[];
  /** Max visible chips before "+N". Default 4. */
  maxVisible?: number;
  className?: string;
}

export function FeatureChips({
  chips,
  maxVisible = 4,
  className,
}: FeatureChipsProps) {
  const visible = chips.slice(0, maxVisible);
  const overflow = chips.length - maxVisible;

  const rootClass = ["eui-feature-chips", className].filter(Boolean).join(" ");

  return (
    <div className={rootClass}>
      {visible.map((chip, i) => {
        const IconComp = chip.icon ? ICON_MAP[chip.icon] : null;
        return (
          <span key={i} className="eui-feature-chip">
            {IconComp && (
              <IconComp size={14} aria-hidden="true" />
            )}
            {chip.label}
          </span>
        );
      })}
      {overflow > 0 && (
        <span className="eui-feature-chip eui-feature-overflow">
          +{overflow}
        </span>
      )}
    </div>
  );
}
