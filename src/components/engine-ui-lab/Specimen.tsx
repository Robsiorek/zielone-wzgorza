"use client";

/**
 * Specimen — component documentation wrapper (UI Lab).
 * SpecimenInfo — metadata-only badge for info zone.
 * ────────────────────────────────────────────────────────────────────────
 * With the two-zone ComponentShowcase (white preview + grey info),
 * use SpecimenInfo in the info zone to show ID badges + hints.
 *
 * Specimen (full: preview + meta) is still available for edge cases
 * but most sections should use: raw component in preview zone,
 * SpecimenInfo in info zone.
 */

import * as React from "react";

// ── SpecimenInfo: just the badge + hint ──

export interface SpecimenInfoProps {
  id: string;
  hint?: string;
}

export function SpecimenInfo({ id, hint }: SpecimenInfoProps) {
  return (
    <div className="eui-specimen-meta">
      <span className="eui-specimen-id">{id}</span>
      {hint && <span className="eui-specimen-hint">{hint}</span>}
    </div>
  );
}

// ── Specimen: full wrapper (preview + meta) for standalone cases ──

export interface SpecimenProps {
  children: React.ReactNode;
  id: string;
  hint?: string;
  framed?: boolean;
}

export function Specimen({ children, id, hint, framed = false }: SpecimenProps) {
  const rootClass = [
    "eui-specimen",
    framed && "eui-specimen-framed",
  ].filter(Boolean).join(" ");

  return (
    <div className={rootClass}>
      <div className="eui-specimen-preview">{children}</div>
      <div className="eui-specimen-meta">
        <span className="eui-specimen-id">{id}</span>
        {hint && <span className="eui-specimen-hint">{hint}</span>}
      </div>
    </div>
  );
}
