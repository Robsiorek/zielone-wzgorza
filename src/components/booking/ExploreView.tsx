"use client";

/**
 * ExploreView.tsx — Resource catalog for the booking engine.
 *
 * B5a Phase 3: Main view when no URL params (explore mode).
 * Guest sees: header, trust badges, quick date form, resource cards grid.
 *
 * Responsibilities:
 *   - Fetch resources-catalog + property-content (parallel)
 *   - Coordinate navigation (QuickDateForm → router.push, ResourceCard → router.push)
 *   - Does NOT fetch widget-config (EngineShell handles that)
 *
 * Architecture:
 *   - ResourceCard is presentational (gets onCheckAvailability callback)
 *   - QuickDateForm is presentational (gets onSearch callback)
 *   - URL navigation via buildBookingUrl from booking-params.ts
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Home } from "lucide-react";
import { EngineShell } from "./EngineShell";
import { TrustBar } from "./TrustBar";
import { QuickDateForm } from "./QuickDateForm";
import { ResourceCard } from "./ResourceCard";
import { ExploreSkeleton } from "./ExploreSkeleton";
import { buildBookingUrl } from "@/lib/booking-params";
import { apiFetch } from "@/lib/api-fetch";

// ═══════════════════════════════════════════
// Types
// ═══════════════════════════════════════════

interface TrustBadge {
  id: string;
  label: string;
  iconKey: string | null;
  description: string | null;
}

interface PropertyContent {
  heroTitle: string | null;
  heroSubtitle: string | null;
  [key: string]: unknown;
}

// ═══════════════════════════════════════════
// Component
// ═══════════════════════════════════════════

export function ExploreView() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [resources, setResources] = useState<any[]>([]);
  const [trustBadges, setTrustBadges] = useState<TrustBadge[]>([]);
  const [heroTitle, setHeroTitle] = useState("Zielone Wzgórza");
  const [heroSubtitle, setHeroSubtitle] = useState("Wybierz termin i sprawdź dostępne domki i pokoje");
  const quickDateRef = useRef<HTMLDivElement>(null);

  // Track current dates from QuickDateForm (for ResourceCard CTA navigation)
  const currentDatesRef = useRef<{ checkIn: string; checkOut: string; guests: number } | null>(null);
  const handleDatesChange = useCallback((checkIn: string, checkOut: string, guests: number) => {
    currentDatesRef.current = { checkIn, checkOut, guests };
  }, []);

  // ── Fetch catalog + property-content in parallel ──
  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [catalogData, contentData] = await Promise.all([
        apiFetch("/api/public/resources-catalog"),
        apiFetch("/api/public/property-content"),
      ]);

      setResources(catalogData.resources || []);
      setTrustBadges(contentData.trustBadges || []);

      // Header: use property-content if semantically fits catalog context
      const content: PropertyContent = contentData.propertyContent || {};
      if (content.heroTitle) setHeroTitle(content.heroTitle);
      if (content.heroSubtitle) setHeroSubtitle(content.heroSubtitle);
    } catch (e: any) {
      setError(e.message || "Nie udało się załadować katalogu");
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Navigation: QuickDateForm → search results ──
  const handleSearch = useCallback((checkIn: string, checkOut: string, guests: number) => {
    const url = buildBookingUrl({ checkIn, checkOut, guests });
    router.push(url);
  }, [router]);

  // ── Navigation: ResourceCard CTA → resource mode or scroll to form ──
  const handleCheckAvailability = useCallback((resourceSlug: string) => {
    const dates = currentDatesRef.current;
    // If dates are filled and look valid → navigate with resource slug
    if (dates && dates.checkIn && dates.checkOut && dates.checkOut > dates.checkIn) {
      const url = buildBookingUrl({
        checkIn: dates.checkIn,
        checkOut: dates.checkOut,
        guests: dates.guests,
        resourceSlug,
      });
      router.push(url);
      return;
    }
    // No valid dates → scroll to quick date form with highlight
    if (quickDateRef.current) {
      quickDateRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      quickDateRef.current.classList.add("ring-2", "ring-primary", "ring-offset-2");
      setTimeout(() => {
        quickDateRef.current?.classList.remove("ring-2", "ring-primary", "ring-offset-2");
      }, 2000);
    }
  }, [router]);

  // ── Loading ──
  if (loading) {
    return (
      <EngineShell maxWidth="wide">
        <ExploreSkeleton />
      </EngineShell>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <EngineShell maxWidth="wide">
        <div className="text-center space-y-4 pt-12">
          <div className="h-12 w-12 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <h2 className="text-xl font-bold">Coś poszło nie tak</h2>
          <p className="text-[13px] text-muted-foreground">{error}</p>
          <button onClick={loadData} className="btn-bubble btn-primary-bubble px-5 py-2.5 text-[13px]">
            Spróbuj ponownie
          </button>
        </div>
      </EngineShell>
    );
  }

  // ── Empty ──
  if (resources.length === 0) {
    return (
      <EngineShell maxWidth="wide">
        <div className="text-center space-y-4 pt-12">
          <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center mx-auto">
            <Home className="h-6 w-6 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-bold">Brak dostępnych miejsc</h2>
          <p className="text-[13px] text-muted-foreground">
            Aktualnie nie ma zasobów w katalogu.
          </p>
        </div>
      </EngineShell>
    );
  }

  // ── Catalog ──
  return (
    <EngineShell maxWidth="wide">
      <div className="space-y-6">
        {/* ── Header ── */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {heroTitle}
          </h1>
          <p className="text-[14px] text-muted-foreground max-w-lg mx-auto">
            {heroSubtitle}
          </p>
        </div>

        {/* ── Trust badges ── */}
        <TrustBar badges={trustBadges} />

        {/* ── Quick date form ── */}
        <div ref={quickDateRef} className="transition-all duration-300 rounded-2xl">
          <QuickDateForm onSearch={handleSearch} onChange={handleDatesChange} />
        </div>

        {/* ── Resource count ── */}
        <p className="text-[13px] text-muted-foreground">
          {resources.length} {resources.length === 1 ? "miejsce" : resources.length < 5 ? "miejsca" : "miejsc"} do wyboru
        </p>

        {/* ── Cards grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {resources.map((resource: any) => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              onCheckAvailability={handleCheckAvailability}
            />
          ))}
        </div>
      </div>
    </EngineShell>
  );
}
