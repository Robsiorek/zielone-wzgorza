"use client";

import React, { useState, useCallback, useEffect } from "react";
import { ArrowLeft, User } from "lucide-react";
import { StepDates } from "./StepDates";
import { StepResults } from "./StepResults";
import { StepQuote } from "./StepQuote";
import { StepClient } from "./StepClient";
import { StepConfirmation } from "./StepConfirmation";
import { BookingPageSkeleton } from "./BookingSkeleton";

// ═══════════════════════════════════════════
// Types
// ═══════════════════════════════════════════

export interface BookingDates { checkIn: string; checkOut: string; adults: number; children: number; }
export interface SelectedResource { variantId: string; resourceId: string; resourceName: string; variantName: string; capacity: number; imageUrl?: string; }
export interface SelectedAddon { addonId: string; name: string; quantity: number; unitPriceMinor: number; }
export interface QuoteData { quoteId: string; quoteSecret: string; expiresAt: string; result: any; }
export interface ClientData { firstName: string; lastName: string; email: string; phone: string; companyName?: string; nip?: string; address?: string; city?: string; postalCode?: string; guestNotes?: string; }
export interface BookingResult { reservationNumber: string; token: string | null; totalMinor: number; depositMinor: number; status: string; }

interface WidgetTheme {
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
// Stepper (part of content, not sticky)
// ═══════════════════════════════════════════

const STEPS = [
  { num: 1, label: "Termin" },
  { num: 2, label: "Wyniki" },
  { num: 3, label: "Wycena" },
  { num: 4, label: "Dane" },
  { num: 5, label: "Gotowe" },
];

function Stepper({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2">
      {STEPS.map((step, i) => {
        const isActive = step.num === current;
        const isDone = step.num < current;
        return (
          <React.Fragment key={step.num}>
            {i > 0 && <div className={`h-[2px] w-6 sm:w-10 transition-colors duration-300 ${isDone ? "bg-primary" : "bg-border"}`} />}
            <div className="flex items-center gap-1.5">
              <div className={`flex items-center justify-center h-8 w-8 rounded-full text-[12px] font-bold transition-all duration-300
                ${isActive ? "bg-primary text-white" : ""}
                ${isDone ? "bg-primary/15 text-primary" : ""}
                ${!isActive && !isDone ? "bg-muted text-muted-foreground" : ""}
              `}>
                {isDone ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                ) : step.num}
              </div>
              <span className={`hidden sm:inline text-[12px] font-medium transition-colors ${isActive ? "text-foreground" : "text-muted-foreground"}`}>{step.label}</span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════
// Main Widget
// ═══════════════════════════════════════════

export function BookingWidget() {
  const [step, setStep] = useState(1);
  const [dates, setDates] = useState<BookingDates>({ checkIn: "", checkOut: "", adults: 2, children: 0 });
  const [selectedResources, setSelectedResources] = useState<SelectedResource[]>([]);
  const [selectedAddons, setSelectedAddons] = useState<SelectedAddon[]>([]);
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [clientData, setClientData] = useState<ClientData>({ firstName: "", lastName: "", email: "", phone: "" });
  const [bookingResult, setBookingResult] = useState<BookingResult | null>(null);
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

  // ── Step transitions with smooth scroll ──
  const goTo = useCallback((s: number) => {
    setStep(s);
    // Smooth scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleBack = useCallback(() => { if (step > 1) goTo(step - 1); }, [step, goTo]);
  const handleDatesSubmit = useCallback((d: BookingDates) => { setDates(d); setSelectedResources([]); setSelectedAddons([]); setQuote(null); goTo(2); }, [goTo]);
  const handleResourcesSelected = useCallback((resources: SelectedResource[], addons: SelectedAddon[]) => { setSelectedResources(resources); setSelectedAddons(addons); setQuote(null); goTo(3); }, [goTo]);
  const handleQuoteReady = useCallback((q: QuoteData) => { setQuote(q); goTo(4); }, [goTo]);
  const handleBookingComplete = useCallback((result: BookingResult, client: ClientData) => { setBookingResult(result); setClientData(client); goTo(5); }, [goTo]);

  if (themeLoading) return <BookingPageSkeleton />;

  const showBack = step > 1 && step < 5;
  const logoH = widgetTheme?.logoHeight || 40;
  const navHeight = Math.max(56, logoH + 24);

  return (
    <div className="min-h-screen flex flex-col">
      {/* ═══ NAVBAR: logo + login, more padding, no shadow ═══ */}
      <header className="sticky top-0 z-50 backdrop-blur-xl border-b border-border/50" style={{ backgroundColor: "hsla(var(--card), 0.8)" }}>
        <div className="max-w-4xl mx-auto px-5 sm:px-8 flex items-center justify-between" style={{ height: navHeight }}>
          <a href="/booking" className="flex items-center flex-shrink-0" style={{ maxWidth: "70%", height: logoH }}>
            {widgetTheme?.logoUrl ? (
              <img src={widgetTheme.logoUrl} alt="Logo" style={{ height: "100%", maxWidth: "100%", objectFit: "contain" }} />
            ) : (
              <span className="text-[15px] font-bold tracking-tight" style={{ color: "hsl(var(--foreground))" }}>Zielone Wzgórza</span>
            )}
          </a>
          <button className="h-9 px-3 rounded-xl border-2 text-[12px] font-medium transition-colors flex items-center gap-1.5"
            style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}>
            <User className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Zaloguj się</span>
          </button>
        </div>
      </header>

      {/* ═══ CONTENT ═══ */}
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-5 sm:px-8 py-8 sm:py-10">

          {/* Stepper — part of content, above title, with breathing room */}
          <div className="mb-8">
            <Stepper current={step} />
          </div>

          {/* Back button — stable height, below stepper */}
          <div style={{ minHeight: showBack ? 44 : 0 }} className={showBack ? "mb-5" : ""}>
            {showBack && (
              <button onClick={handleBack} className="btn-bubble btn-secondary-bubble px-4 py-2 text-[13px] flex items-center gap-1.5">
                <ArrowLeft className="h-4 w-4" /> Wróć
              </button>
            )}
          </div>

          {/* Steps */}
          {step === 1 && <StepDates initial={dates} onSubmit={handleDatesSubmit} />}
          {step === 2 && <StepResults dates={dates} selectedResources={selectedResources} selectedAddons={selectedAddons} onNext={handleResourcesSelected} />}
          {step === 3 && <StepQuote dates={dates} resources={selectedResources} addons={selectedAddons} onQuoteReady={handleQuoteReady} onBack={() => goTo(2)} />}
          {step === 4 && quote && <StepClient quote={quote} dates={dates} resources={selectedResources} initial={clientData} onBook={handleBookingComplete} onBack={() => goTo(3)} />}
          {step === 5 && bookingResult && <StepConfirmation result={bookingResult} dates={dates} resources={selectedResources} clientData={clientData} />}
        </div>
      </main>

      <footer className="border-t py-4" style={{ borderColor: "hsl(var(--border) / 0.5)" }}>
        <p className="text-center text-[11px]" style={{ color: "hsl(var(--muted-foreground))" }}>
          Zielone Wzgórza &copy; {new Date().getFullYear()} &middot; Rezerwacja online
        </p>
      </footer>
    </div>
  );
}
