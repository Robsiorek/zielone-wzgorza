"use client";

/**
 * useWidgetTheme — canonical source for widget configuration
 * ────────────────────────────────────────────────────────────────────────
 * Fetches `/api/public/widget-config` and applies the result to the first
 * `.engine-root` element it finds in the DOM: CSS variables (HSL triplets
 * for `--primary`, `--background`, `--foreground`, …) and the dynamic
 * Google Font.
 *
 * USED BY:
 *   - <EngineUiLab> (internal preview surface)
 *   - future <EngineShell> (public booking engine wrapper, Phase 3A)
 *
 * NOT USED BY:
 *   - BookingWidget.tsx — legacy source that already does this inline.
 *     Will be migrated to this hook in a separate, dedicated refactor
 *     (decision confirmed with ChatGPT, Runda 1 keeps production flow
 *     untouched).
 *
 * Design:
 *   - One hook, one fetch, one source of truth. No duplication.
 *   - Defensive: waits for `.engine-root` to exist before applying
 *     variables (the Lab page mounts the hook inside a manually added
 *     `.engine-root` wrapper, so the DOM element is there from the start,
 *     but we never assume it).
 *   - Abortable: if the component unmounts during the fetch, we don't
 *     set state on an unmounted component and we don't append a Google
 *     Fonts <link> that we won't be able to clean up.
 *   - Reentrant-safe: re-running the effect (e.g. under React Strict Mode)
 *     cleans up the previous <link> before appending a new one.
 *
 * Return contract:
 *   { theme, loading, error }
 *   - `theme`   — WidgetTheme | null
 *   - `loading` — true until the first fetch resolves (success OR error)
 *   - `error`   — Error message string | null (fallback to nulls on error,
 *                 callers typically ignore it but can show a banner)
 */

import * as React from "react";

// ═══════════════════════════════════════════
// Types (mirror of /api/public/widget-config)
// ═══════════════════════════════════════════

export interface WidgetThemeColors {
  primaryColor: string;
  primaryForeground: string;
  backgroundColor: string;
  foregroundColor: string;
  cardColor: string;
  mutedColor: string;
  borderColor: string;
  successColor: string;
  warningColor: string;
  dangerColor: string;
}

export interface WidgetTheme {
  theme: WidgetThemeColors;
  logoUrl: string | null;
  logoHeight: number;
  fontFamily: string;
  termsUrl: string | null;
  privacyUrl: string | null;
}

export interface UseWidgetThemeResult {
  theme: WidgetTheme | null;
  loading: boolean;
  error: string | null;
}

// ═══════════════════════════════════════════
// Pure helpers (exported for tests / reuse)
// ═══════════════════════════════════════════

/**
 * Convert `#rrggbb` to the `"H S% L%"` triplet expected by CSS
 * `hsl(var(--primary))` consumers. Returns a neutral grey on malformed
 * input rather than throwing — a bad hex shouldn't brick the engine.
 */
export function hexToHSL(hex: string): string {
  if (!hex || hex.length !== 7 || hex[0] !== "#") return "0 0% 50%";
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/**
 * Apply a widget theme to a specific DOM element (the engine-root).
 * Extracted so tests and EngineShell can call it without the hook context.
 */
export function applyThemeToElement(
  element: HTMLElement,
  theme: WidgetTheme
): void {
  const t = theme.theme;
  element.style.setProperty("--primary", hexToHSL(t.primaryColor));
  element.style.setProperty("--primary-foreground", hexToHSL(t.primaryForeground));
  element.style.setProperty("--background", hexToHSL(t.backgroundColor));
  element.style.setProperty("--foreground", hexToHSL(t.foregroundColor));
  element.style.setProperty("--card", hexToHSL(t.cardColor));
  element.style.setProperty("--card-foreground", hexToHSL(t.foregroundColor));
  element.style.setProperty("--muted-foreground", hexToHSL(t.mutedColor));
  element.style.setProperty("--border", hexToHSL(t.borderColor));
  element.style.setProperty("--input", hexToHSL(t.borderColor));
  element.style.setProperty("--ring", hexToHSL(t.primaryColor));
}

// ═══════════════════════════════════════════
// Hook
// ═══════════════════════════════════════════

/**
 * Options for the hook. Kept narrow on purpose — if we ever need more
 * (prefetch, transport override, cache mode), add explicit fields.
 */
export interface UseWidgetThemeOptions {
  /**
   * Override the endpoint — used by tests or local overrides. Defaults to
   * the public endpoint served from the same origin.
   */
  endpoint?: string;
}

const DEFAULT_ENDPOINT = "/api/public/widget-config";
/**
 * "Plus Jakarta Sans" is already loaded globally in globals.css — we only
 * need to fetch another Google Font when the admin picks something else.
 */
const DEFAULT_FONT = "Plus Jakarta Sans";

export function useWidgetTheme(
  options: UseWidgetThemeOptions = {}
): UseWidgetThemeResult {
  const { endpoint = DEFAULT_ENDPOINT } = options;

  const [theme, setTheme] = React.useState<WidgetTheme | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // ── Fetch theme once on mount ──
  React.useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    (async () => {
      try {
        const res = await fetch(endpoint, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!res.ok) {
          throw new Error(`Widget config request failed: HTTP ${res.status}`);
        }
        const json = await res.json();
        if (cancelled) return;
        if (json?.success && json?.data) {
          setTheme(json.data as WidgetTheme);
          setError(null);
        } else {
          throw new Error("Widget config response was not successful");
        }
      } catch (e) {
        if (cancelled) return;
        // AbortError on unmount is expected; don't surface it.
        if (e instanceof Error && e.name === "AbortError") return;
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [endpoint]);

  // ── Apply CSS variables to .engine-root ──
  // Runs every time `theme` changes. Defensive: if .engine-root isn't
  // in the DOM yet (e.g. timing quirk), silently no-op.
  React.useEffect(() => {
    if (!theme) return;
    const root = document.querySelector(".engine-root");
    if (!(root instanceof HTMLElement)) return;
    applyThemeToElement(root, theme);
  }, [theme]);

  // ── Load dynamic Google Font when admin picked something non-default ──
  // We append a <link> to <head>; on cleanup we remove it so StrictMode
  // re-runs don't pile up multiple identical <link> tags.
  React.useEffect(() => {
    const family = theme?.fontFamily;
    if (!family || family === DEFAULT_FONT) return;

    const encoded = family.replace(/\s+/g, "+");
    const href = `https://fonts.googleapis.com/css2?family=${encoded}:wght@300;400;500;600;700&display=swap`;

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.setAttribute("data-eui-font", family);
    document.head.appendChild(link);

    const root = document.querySelector(".engine-root");
    if (root instanceof HTMLElement) {
      root.style.fontFamily = `'${family}', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
    }

    return () => {
      try {
        document.head.removeChild(link);
      } catch {
        /* link already gone — e.g. double cleanup under StrictMode */
      }
    };
  }, [theme?.fontFamily]);

  return { theme, loading, error };
}
