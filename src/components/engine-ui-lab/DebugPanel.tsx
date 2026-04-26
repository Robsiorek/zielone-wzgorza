"use client";

/**
 * DebugPanel — reusable component state viewer for UI Lab.
 * ────────────────────────────────────────────────────────────────────────
 * Unified styling for all debug/state info across Lab sections.
 * Replaces ad-hoc inline debug boxes.
 *
 * CSS classes: .eui-debug-panel, .eui-debug-row, etc.
 * (defined in globals.css lab section)
 */

import * as React from "react";

export interface DebugField {
  label: string;
  value: string | number | boolean;
}

export interface DebugPanelProps {
  title?: string;
  fields: DebugField[];
  onReset?: () => void;
  className?: string;
}

export function DebugPanel({
  title = "Stan komponentu",
  fields,
  onReset,
  className,
}: DebugPanelProps) {
  const rootClass = ["eui-debug-panel", className].filter(Boolean).join(" ");

  return (
    <div className={rootClass}>
      <div className="eui-debug-header">
        <span className="eui-debug-title">{title}</span>
        {onReset && (
          <button type="button" className="eui-debug-reset" onClick={onReset}>
            Wyczyść
          </button>
        )}
      </div>
      <div className="eui-debug-fields">
        {fields.map((f, i) => (
          <div key={i} className="eui-debug-row">
            <span className="eui-debug-label">{f.label}</span>
            <span className="eui-debug-value">{String(f.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
