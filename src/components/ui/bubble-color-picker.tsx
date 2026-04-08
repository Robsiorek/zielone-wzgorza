"use client";

/**
 * BubbleColorPicker — DS color picker component.
 *
 * Same portal/positioning pattern as BubbleDatePicker.
 * Features: curated color grid + native full picker + hex input.
 * Click swatch → opens bubble dropdown, click outside → closes.
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Pipette } from "lucide-react";

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
  const [open, setOpen] = useState(false);
  const [hexInput, setHexInput] = useState(value || "#000000");
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const nativeRef = useRef<HTMLInputElement>(null);

  // Sync hex input with value prop
  useEffect(() => { setHexInput(value || "#000000"); }, [value]);

  // Position dropdown
  useEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const dropH = 320;
    const dropW = 280;

    let top = rect.bottom + 6;
    let left = rect.left;

    if (top + dropH > window.innerHeight) {
      top = rect.top - dropH - 6;
    }
    if (left + dropW > window.innerWidth) {
      left = window.innerWidth - dropW - 12;
    }
    if (left < 8) left = 8;

    setDropdownPos({ top, left });
  }, [open]);

  // Click outside
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

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

  const dropdown = open && typeof window !== "undefined" ? createPortal(
    <div
      ref={dropdownRef}
      style={{
        position: "fixed",
        top: dropdownPos.top,
        left: dropdownPos.left,
        width: 280,
        zIndex: 99999,
        border: "1px solid hsl(var(--border))",
        boxShadow: "0 8px 32px hsl(220 15% 12% / 0.12), 0 4px 8px hsl(220 15% 12% / 0.06)",
        animation: "scaleIn 0.15s cubic-bezier(0.16, 1, 0.3, 1) both",
      }}
      className="rounded-2xl bg-card p-3"
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
            title={hex}
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
    </div>,
    document.body
  ) : null;

  return (
    <div className="flex flex-col items-center">
      {/* Trigger — bigger swatch */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(!open)}
        className="h-14 w-14 rounded-2xl border-2 border-border cursor-pointer overflow-hidden flex-shrink-0 hover:border-primary transition-all hover:shadow-md"
        title={label || "Zmień kolor"}
      >
        <div className="w-full h-full" style={{ backgroundColor: value || "#000000" }} />
      </button>

      {dropdown}
    </div>
  );
}
