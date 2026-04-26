"use client";

/**
 * ComponentShowcase — two-zone preview card for UI Lab.
 * ────────────────────────────────────────────────────────────────────────
 * Zone 1 — Preview (white bg): ONLY the component. Nothing else.
 * Zone 2 — Info (grey bg): Specimen meta, DebugPanel, usage notes.
 *
 *   ┌─────────────────────────────────┐
 *   │ Title                            │
 *   │ Caption                          │
 *   ├─────────────────────────────────┤
 *   │ ░░░░░░░░ WHITE BG ░░░░░░░░░░░░ │
 *   │         [component]              │
 *   ├─────────────────────────────────┤
 *   │ ▒▒▒▒▒▒▒ GREY BG ▒▒▒▒▒▒▒▒▒▒▒▒ │
 *   │ ID · hint · debug panel          │
 *   └─────────────────────────────────┘
 */

import * as React from "react";

export interface ComponentShowcaseProps {
  title: string;
  caption?: React.ReactNode;
  /** The live component(s) — rendered on white background. */
  children: React.ReactNode;
  /** Metadata: Specimen badges, DebugPanel, usage info — rendered on grey background below preview. */
  info?: React.ReactNode;
  /** Extra className on root. */
  className?: string;
}

export function ComponentShowcase({
  title,
  caption,
  children,
  info,
  className,
}: ComponentShowcaseProps) {
  const rootClass = ["eui-lab-showcase", className].filter(Boolean).join(" ");

  return (
    <div className={rootClass}>
      <header className="eui-lab-showcase-header">
        <h3 className="eui-lab-showcase-title">{title}</h3>
        {caption && <p className="eui-lab-showcase-caption">{caption}</p>}
      </header>

      <div className="eui-lab-showcase-preview">
        {children}
      </div>

      {info && (
        <div className="eui-lab-showcase-info">
          {info}
        </div>
      )}
    </div>
  );
}
