"use client";

/**
 * BubbleColorPicker — DS color picker component.
 *
 * Floating UI portal (ADR-20).
 * Features: curated color grid + native full picker + hex input.
 * Click swatch → opens bubble dropdown, click outside → closes.
 */

import React, { useState, useRef, useEffect } from "react";
import { Pipette } from "lucide-react";
import { FloatingPortal } from "@floating-ui/react";
import { useFloatingDropdown } from "@/hooks/use-floating-dropdown";

interface BubbleColorPickerProps {
  value: string;          // "#RRGGBB"
  onChange: (hex: string) => void;
  label?: string;
}

const PALETTE = [
  // Blues
  "#2563EB", "#3B82F6", "#60A5FA", "#1D4ED8", "#1E40AF",
  // Greens
  "#16A34A", "#22C55E", "#4ADE80", "#15803D", "#166534",
  // Reds
  "#DC2626", "#EF4444", "#F87171", "#B91C1C", "#991B1B",
  // Yellows / Oranges
  "#D97706", "#F59E0B", "#FBBF24", "#EA580C", "#C2410C",
  // Purples
  "#7C3AED", "#8B5CF6", "#A78BFA", "#6D28D9", "#5B21B6",
  // Teals / Cyans
  "#0D9488", "#14B8A6", "#2DD4BF", "#0F766E", "#115E59",
  // Pinks
  "#DB2777", "#EC4899", "#F472B6", "#BE185D", "#9D174D",
  // Neutrals
  "#FFFFFF", "#F8FAFC", "#E2E8F0", "#94A3B8", "#64748B",
  "#334155", "#1E293B", "#0F172A", "#000000", "#475569",
];

export function BubbleColorPicker({ value, onChange, label }: BubbleColorPickerProps) {
  const [hexInput, setHexInput] = useState(value || "#000000");
  const nativeRef = useRef<HTMLInputElement>(null);

  // ── Floating UI (ADR-20) ──
  const { refs, floatingStyles, getReferenceProps, getFloatingProps, open, setOpen, portalRoot } =
    useFloatingDropdown({ placement: "bottom-start", fixedWidth: 280 });

  // Sync hex input with value prop
  useEffect(() => { setHexInput(value || "#000000"); }, [value]);

  function selectColor(hex: string) {
    setHexInput(hex);
    onChange(hex);
    setOpen(false);
  }

  function handleHexBlur() {
    if (/^#[0-9A-Fa-f]{6}$/.test(hexInput)) {
      onChange(hexInput);
    } else {
      setHexInput(value);
    }
  }

  function openNativePicker() {
    nativeRef.current?.click();
  }

  return (
    <div className="flex flex-col items-center">
      {/* Trigger — bigger swatch */}
      <button
        ref={refs.setReference}
        type="button"
        {...getReferenceProps()}
        className="h-14 w-14 rounded-2xl border-2 border-border cursor-pointer overflow-hidden flex-shrink-0 hover:border-primary transition-all hover:shadow-md"
      >
        <div className="w-full h-full" style={{ backgroundColor: value || "#000000" }} />
      </button>

      {/* Color picker dropdown — Floating UI portal (ADR-20) */}
      {open && (
        <FloatingPortal root={portalRoot}>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
          >
            <div
              className="rounded-2xl bg-card p-3"
              style={{
                border: "1px solid hsl(var(--border))",
                boxShadow: "0 8px 32px hsl(220 15% 12% / 0.12), 0 4px 8px hsl(220 15% 12% / 0.06)",
                animation: "scaleIn 0.15s cubic-bezier(0.16, 1, 0.3, 1) both",
              }}
            >
              {/* Color grid */}
              <div className="grid grid-cols-10 gap-1 mb-3">
                {PALETTE.map(hex => (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => selectColor(hex)}
                    className="h-6 w-6 rounded-lg border transition-transform hover:scale-125"
                    style={{
                      backgroundColor: hex,
                      borderColor: hex === value ? "hsl(var(--foreground))" : (hex === "#FFFFFF" || hex === "#F8FAFC") ? "hsl(var(--border))" : "transparent",
                      boxShadow: hex === value ? "0 0 0 2px hsl(var(--background)), 0 0 0 4px hsl(var(--foreground))" : "none",
                    }}
                  />
                ))}
              </div>

              {/* Custom color + hex input row */}
              <div className="flex items-center gap-2 border-t border-border/50 pt-3">
                {/* Native picker trigger (styled as bubble button) */}
                <button
                  type="button"
                  onClick={openNativePicker}
                  className="h-9 px-3 rounded-xl border-2 border-border text-[11px] font-medium hover:border-primary/40 transition-colors flex items-center gap-1.5 flex-shrink-0"
                >
                  <Pipette className="h-3.5 w-3.5" />
                  Własny
                </button>
                <input
                  ref={nativeRef}
                  type="color"
                  value={hexInput}
                  onChange={(e) => {
                    setHexInput(e.target.value);
                    onChange(e.target.value);
                  }}
                  className="absolute opacity-0 w-0 h-0 pointer-events-none"
                  style={{ position: "absolute" }}
                />

                {/* Current color preview */}
                <div
                  className="h-9 w-9 rounded-xl border-2 border-border flex-shrink-0"
                  style={{ backgroundColor: hexInput }}
                />

                {/* Hex input */}
                <input
                  type="text"
                  value={hexInput}
                  onChange={(e) => setHexInput(e.target.value.toUpperCase())}
                  onBlur={handleHexBlur}
                  onKeyDown={(e) => { if (e.key === "Enter") handleHexBlur(); }}
                  className="input-bubble h-9 flex-1 text-[11px] font-mono text-center"
                  maxLength={7}
                  placeholder="#RRGGBB"
                />
              </div>
            </div>
          </div>
        </FloatingPortal>
      )}
    </div>
  );
}
