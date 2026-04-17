"use client";

/**
 * EngineShell.tsx — Shared shell for the entire booking engine.
 *
 * B5a Phase 3: Extracted from BookingWidget to eliminate duplication.
 * Single source of truth for:
 *   - Widget theme loading (fetch /api/public/widget-config)
 *   - CSS variable application on .engine-root
 *   - Dynamic Google Font loading
 *   - Navbar (logo + login button)
 *   - Footer
 *   - Skeleton during theme load
 *
 * Used by: ExploreView, BookingWidget (via BookingEngine orchestrator).
 * Neither ExploreView nor BookingWidget fetch widget-config — only EngineShell does.
 */

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { User } from "lucide-react";

// ═══════════════════════════════════════════
// Types
// ═══════════════════════════════════════════

export interface WidgetTheme {
  logoUrl: string | null;
  logoHeight: number;
  fontFamily: string;
  theme: {
    primaryColor: string; primaryForeground: string; backgroundColor: string;
    foregroundColor: string; cardColor: string; mutedColor: string;
    borderColor: string; successColor: string; warningColor: string; dangerColor: string;
  };
  termsUrl: string | null;
  privacyUrl: string | null;
}

interface EngineShellProps {
  children: React.ReactNode;
  /** Content width: "narrow" (max-w-4xl, booking flow) or "wide" (max-w-6xl, catalog) */
  maxWidth?: "narrow" | "wide";
  /** Signal to parent that shell is ready (theme loaded, CSS vars applied).
   *  Used by BookingEngine to dismiss loading overlay. */
  onReady?: () => void;
}

// ═══════════════════════════════════════════
// Hex → HSL
// ═══════════════════════════════════════════

function hexToHSL(hex: string): string {
  if (!hex || hex.length !== 7 || hex[0] !== "#") return "0 0% 50%";
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

// ═══════════════════════════════════════════
// Shell Skeleton (immediate, shimmer only)
// ═══════════════════════════════════════════

function ShellSkeleton({ maxWidth = "narrow" }: { maxWidth?: "narrow" | "wide" }) {
  const mw = maxWidth === "wide" ? "max-w-6xl" : "max-w-4xl";
  return (
    <div className="min-h-screen flex flex-col">
      <div className="sticky top-0 z-50 border-b border-border/50" style={{ backgroundColor: "hsla(var(--card), 0.8)" }}>
        <div className={`${mw} mx-auto px-5 sm:px-8 flex items-center justify-between`} style={{ height: 64 }}>
          <div className="h-8 w-32 bg-muted shimmer rounded-lg" />
          <div className="h-9 w-24 bg-muted shimmer rounded-xl" />
        </div>
      </div>
      <main className="flex-1">
        <div className={`${mw} mx-auto px-5 sm:px-8 py-8 sm:py-10 space-y-6`}>
          <div className="h-8 w-64 bg-muted shimmer rounded-lg mx-auto" />
          <div className="h-4 w-48 bg-muted shimmer rounded-lg mx-auto" />
          <div className="h-48 bg-muted shimmer rounded-2xl" />
          <div className="h-48 bg-muted shimmer rounded-2xl" />
        </div>
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════
// Main Shell
// ═══════════════════════════════════════════

export function EngineShell({ children, maxWidth = "narrow", onReady }: EngineShellProps) {
  const [widgetTheme, setWidgetTheme] = useState<WidgetTheme | null>(null);
  const [themeLoading, setThemeLoading] = useState(true);

  // ── Load widget config ──
  useEffect(() => {
    async function loadTheme() {
      try {
        const res = await fetch("/api/public/widget-config", { cache: "no-store" });
        const json = await res.json();
        if (json.success && json.data) setWidgetTheme(json.data);
      } catch { /* defaults */ }
      setThemeLoading(false);
    }
    loadTheme();
  }, []);

  // ── Signal readiness after theme loaded ──
  useEffect(() => {
    if (!themeLoading) onReady?.();
  }, [themeLoading, onReady]);

  // ── Apply CSS variables to .engine-root ──
  useEffect(() => {
    if (!widgetTheme?.theme) return;
    const root = document.querySelector(".engine-root") as HTMLElement;
    if (!root) return;
    const t = widgetTheme.theme;
    root.style.setProperty("--primary", hexToHSL(t.primaryColor));
    root.style.setProperty("--primary-foreground", hexToHSL(t.primaryForeground));
    root.style.setProperty("--background", hexToHSL(t.backgroundColor));
    root.style.setProperty("--foreground", hexToHSL(t.foregroundColor));
    root.style.setProperty("--card", hexToHSL(t.cardColor));
    root.style.setProperty("--card-foreground", hexToHSL(t.foregroundColor));
    root.style.setProperty("--muted-foreground", hexToHSL(t.mutedColor));
    root.style.setProperty("--border", hexToHSL(t.borderColor));
    root.style.setProperty("--input", hexToHSL(t.borderColor));
    root.style.setProperty("--ring", hexToHSL(t.primaryColor));
  }, [widgetTheme]);

  // ── Dynamic Google Font on .engine-root ──
  useEffect(() => {
    if (!widgetTheme?.fontFamily || widgetTheme.fontFamily === "Plus Jakarta Sans") return;
    const font = widgetTheme.fontFamily;
    const encoded = font.replace(/\s+/g, "+");
    const link = document.createElement("link");
    link.href = `https://fonts.googleapis.com/css2?family=${encoded}:wght@300;400;500;600;700&display=swap`;
    link.rel = "stylesheet";
    document.head.appendChild(link);
    const root = document.querySelector(".engine-root") as HTMLElement;
    if (root) root.style.fontFamily = `'${font}', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
    return () => { try { document.head.removeChild(link); } catch {} };
  }, [widgetTheme?.fontFamily]);

  // ── Loading skeleton ──
  if (themeLoading) return <ShellSkeleton maxWidth={maxWidth} />;

  const logoH = widgetTheme?.logoHeight || 40;
  const navHeight = Math.max(56, logoH + 24);
  const contentMaxW = maxWidth === "wide" ? "max-w-6xl" : "max-w-4xl";

  return (
    <div className="min-h-screen flex flex-col">
      {/* ═══ NAVBAR ═══ */}
      <header className="sticky top-0 z-50 backdrop-blur-xl border-b border-border/50" style={{ backgroundColor: "hsla(var(--card), 0.8)" }}>
        <div className={`${contentMaxW} mx-auto px-5 sm:px-8 flex items-center justify-between`} style={{ height: navHeight }}>
          <Link href="/" className="flex items-center flex-shrink-0" style={{ maxWidth: "70%", height: logoH }}>
            {widgetTheme?.logoUrl ? (
              <img src={widgetTheme.logoUrl} alt="Logo" style={{ height: "100%", maxWidth: "100%", objectFit: "contain" }} />
            ) : (
              <span className="text-[15px] font-bold tracking-tight" style={{ color: "hsl(var(--foreground))" }}>Zielone Wzgórza</span>
            )}
          </Link>
          <button className="h-9 px-3 rounded-xl border-2 text-[12px] font-medium transition-colors flex items-center gap-1.5"
            style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}>
            <User className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Zaloguj się</span>
          </button>
        </div>
      </header>

      {/* ═══ CONTENT ═══ */}
      <main className="flex-1">
        <div className={`${contentMaxW} mx-auto px-5 sm:px-8 py-8 sm:py-10`}>
          {children}
        </div>
      </main>

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t py-4" style={{ borderColor: "hsl(var(--border) / 0.5)" }}>
        <p className="text-center text-[11px]" style={{ color: "hsl(var(--muted-foreground))" }}>
          Zielone Wzgórza &copy; {new Date().getFullYear()} &middot; Rezerwacja online
        </p>
      </footer>
    </div>
  );
}
