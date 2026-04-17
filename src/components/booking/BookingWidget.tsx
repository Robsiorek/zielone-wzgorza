"use client";

import React, { useState, useCallback } from "react";
import { ArrowLeft } from "lucide-react";
import { EngineShell } from "./EngineShell";
import { StepDates } from "./StepDates";
import { StepResults } from "./StepResults";
import { StepQuote } from "./StepQuote";
import { StepClient } from "./StepClient";
import { StepConfirmation } from "./StepConfirmation";

// ═══════════════════════════════════════════
// Types
// ═══════════════════════════════════════════

export interface BookingDates { checkIn: string; checkOut: string; adults: number; children: number; }
export interface SelectedResource { variantId: string; resourceId: string; resourceName: string; variantName: string; capacity: number; imageUrl?: string; }
export interface SelectedAddon { addonId: string; name: string; quantity: number; unitPriceMinor: number; }
export interface QuoteData { quoteId: string; quoteSecret: string; expiresAt: string; result: any; }
export interface ClientData { firstName: string; lastName: string; email: string; phone: string; companyName?: string; nip?: string; address?: string; city?: string; postalCode?: string; guestNotes?: string; }
export interface BookingResult { reservationNumber: string; token: string | null; totalMinor: number; depositMinor: number; status: string; }

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

interface BookingWidgetProps {
  /** Pre-filled dates from URL params (B5a Fast Booking) */
  initialDates?: BookingDates;
  /** Resource slug intent from URL params (B5a resource mode).
   *  Part of the entry contract — stored in state, passed to StepResults.
   *  Phase 5 will use this for auto-select/pre-selection. */
  resourceIntent?: string | null;
  /** Callback when user wants to go back to ExploreView */
  onBack?: () => void;
  /** Signal to parent that widget content is ready for display (overlay dismissal) */
  onReady?: () => void;
}

export function BookingWidget({ initialDates, resourceIntent, onBack, onReady }: BookingWidgetProps = {}) {
  const [step, setStep] = useState(1);
  const [dates, setDates] = useState<BookingDates>(
    initialDates || { checkIn: "", checkOut: "", adults: 2, children: 0 }
  );
  const [selectedResources, setSelectedResources] = useState<SelectedResource[]>([]);
  const [selectedAddons, setSelectedAddons] = useState<SelectedAddon[]>([]);
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [clientData, setClientData] = useState<ClientData>({ firstName: "", lastName: "", email: "", phone: "" });
  const [bookingResult, setBookingResult] = useState<BookingResult | null>(null);
  /** Resource slug intent from URL — persisted for StepResults (Phase 5: auto-select) */
  const [resourceSlugIntent] = useState<string | null>(resourceIntent ?? null);

  // onReady is passed to EngineShell — shell signals when theme is loaded

  // ── Step transitions with smooth scroll ──
  const goTo = useCallback((s: number) => {
    setStep(s);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleBack = useCallback(() => { if (step > 1) goTo(step - 1); }, [step, goTo]);
  const handleDatesSubmit = useCallback((d: BookingDates) => { setDates(d); setSelectedResources([]); setSelectedAddons([]); setQuote(null); goTo(2); }, [goTo]);
  const handleResourcesSelected = useCallback((resources: SelectedResource[], addons: SelectedAddon[]) => { setSelectedResources(resources); setSelectedAddons(addons); setQuote(null); goTo(3); }, [goTo]);
  const handleQuoteReady = useCallback((q: QuoteData) => { setQuote(q); goTo(4); }, [goTo]);
  const handleBookingComplete = useCallback((result: BookingResult, client: ClientData) => { setBookingResult(result); setClientData(client); goTo(5); }, [goTo]);

  const showBack = step > 1 && step < 5;

  return (
    <EngineShell maxWidth="narrow" onReady={onReady}>
      {/* Stepper */}
      <div className="mb-8">
        <Stepper current={step} />
      </div>

      {/* Back button */}
      <div style={{ minHeight: showBack ? 44 : 0 }} className={showBack ? "mb-5" : ""}>
        {showBack && (
          <button onClick={handleBack} className="btn-bubble btn-secondary-bubble px-4 py-2 text-[13px] flex items-center gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Wróć
          </button>
        )}
      </div>

      {/* Steps */}
      {step === 1 && <StepDates initial={dates} onSubmit={handleDatesSubmit} />}
      {step === 2 && <StepResults dates={dates} selectedResources={selectedResources} selectedAddons={selectedAddons} resourceSlugIntent={resourceSlugIntent} onNext={handleResourcesSelected} />}
      {step === 3 && <StepQuote dates={dates} resources={selectedResources} addons={selectedAddons} onQuoteReady={handleQuoteReady} onBack={() => goTo(2)} />}
      {step === 4 && quote && <StepClient quote={quote} dates={dates} resources={selectedResources} initial={clientData} onBook={handleBookingComplete} onBack={() => goTo(3)} />}
      {step === 5 && bookingResult && <StepConfirmation result={bookingResult} dates={dates} resources={selectedResources} clientData={clientData} />}
    </EngineShell>
  );
}
