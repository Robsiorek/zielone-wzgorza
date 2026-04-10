"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Home, Users, Check, Loader2, AlertCircle, ImageOff } from "lucide-react";
import { apiFetch } from "@/lib/api-fetch";
import { ResultsSkeleton, PriceSkeleton } from "./BookingSkeleton";
import type { BookingDates, SelectedResource, SelectedAddon } from "./BookingWidget";

interface AvailableResource {
  resourceId: string;
  resourceName: string;
  categoryType: string;
  categoryName: string;
  available: boolean;
  maxCapacity: number | null;
  variants: { variantId: string; variantName: string; capacity: number; isDefault: boolean }[];
}

interface CatalogResource {
  id: string;
  name: string;
  shortDescription: string | null;
  maxCapacity: number | null;
  images: { id: string; alt: string | null; position: number; isCover: boolean; urls: { original: string; medium: string; thumbnail: string } }[];
  amenities: { name: string; icon: string | null }[];
  variants: { id: string; name: string; capacity: number; isDefault: boolean }[];
}

interface MinPrice {
  variantId: string;
  fromPriceMinor: number;
}

interface Props {
  dates: BookingDates;
  selectedResources: SelectedResource[];
  selectedAddons: SelectedAddon[];
  onNext: (resources: SelectedResource[], addons: SelectedAddon[]) => void;
}

function formatMoney(minor: number): string {
  const val = minor / 100;
  return val % 1 === 0 ? `${val} zł` : `${val.toFixed(2).replace(".", ",")} zł`;
}

export function StepResults({ dates, selectedResources, onNext }: Props) {
  const [loading, setLoading] = useState(true);
  const [resources, setResources] = useState<(AvailableResource & { catalog?: CatalogResource; minPrice?: number })[]>([]);
  const [pricesLoading, setPricesLoading] = useState(false);
  const [selected, setSelected] = useState<Map<string, SelectedResource>>(
    new Map(selectedResources.map(r => [r.variantId, r]))
  );
  const [error, setError] = useState("");

  // Load availability + catalog in parallel
  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [availData, catalogData] = await Promise.all([
        apiFetch(`/api/public/availability?checkIn=${dates.checkIn}&checkOut=${dates.checkOut}&adults=${dates.adults}&children=${dates.children}`),
        apiFetch("/api/public/resources-catalog"),
      ]);

      const availResources: AvailableResource[] = availData.available || [];
      const catalog: CatalogResource[] = catalogData.resources || [];
      const catalogMap = new Map(catalog.map(c => [c.id, c]));

      // Merge availability with catalog data
      const merged = availResources
        .filter(r => r.available && r.variants.length > 0)
        .map(r => ({
          ...r,
          catalog: catalogMap.get(r.resourceId),
        }));

      setResources(merged);

      // Phase 2: load prices
      if (merged.length > 0) {
        setPricesLoading(true);
        try {
          const variantIds = merged.flatMap(r => r.variants.map(v => v.variantId));
          const priceData = await apiFetch("/api/public/quote-preview", {
            method: "POST",
            body: {
              checkIn: dates.checkIn,
              checkOut: dates.checkOut,
              variantIds,
            },
          });
          const prices: MinPrice[] = priceData.prices || [];
          const priceMap = new Map(prices.map(p => [p.variantId, p.fromPriceMinor]));

          setResources(prev => prev.map(r => {
            const defaultVariant = r.variants.find(v => v.isDefault) || r.variants[0];
            const price = defaultVariant ? priceMap.get(defaultVariant.variantId) : undefined;
            return { ...r, minPrice: price };
          }));
        } catch (e) {
          // Prices failed — still show resources without prices
          console.error("Price loading failed:", e);
        }
        setPricesLoading(false);
      }
    } catch (e: any) {
      setError(e.message || "Nie udało się sprawdzić dostępności");
    }
    setLoading(false);
  }, [dates]);

  useEffect(() => { loadData(); }, [loadData]);

  function toggleResource(resource: typeof resources[0]) {
    const defaultVariant = resource.variants.find(v => v.isDefault) || resource.variants[0];
    if (!defaultVariant) return;

    setSelected(prev => {
      const next = new Map(prev);
      if (next.has(defaultVariant.variantId)) {
        next.delete(defaultVariant.variantId);
      } else {
        next.set(defaultVariant.variantId, {
          variantId: defaultVariant.variantId,
          resourceId: resource.resourceId,
          resourceName: resource.resourceName,
          variantName: defaultVariant.variantName,
          capacity: defaultVariant.capacity,
          imageUrl: resource.catalog?.images?.[0]?.urls?.thumbnail,
        });
      }
      return next;
    });
  }

  function handleNext() {
    if (selected.size === 0) {
      setError("Wybierz co najmniej jeden domek lub pokój");
      return;
    }
    onNext(Array.from(selected.values()), []);
  }

  // Loading skeleton
  if (loading) {
    return <ResultsSkeleton />;
  }

  if (error) {
    return (
      <div className="text-center space-y-4 pt-8">
        <div className="h-12 w-12 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto">
          <AlertCircle className="h-6 w-6 text-destructive" />
        </div>
        <h2 className="text-xl font-bold">Coś poszło nie tak</h2>
        <p className="text-[13px] text-muted-foreground">{error}</p>
        <button onClick={loadData} className="btn-bubble btn-primary-bubble px-5 py-2.5 text-[13px]">
          Spróbuj ponownie
        </button>
      </div>
    );
  }

  if (resources.length === 0) {
    return (
      <div className="text-center space-y-4 pt-8">
        <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center mx-auto">
          <Home className="h-6 w-6 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-bold">Brak dostępnych miejsc</h2>
        <p className="text-[13px] text-muted-foreground">
          Niestety, w wybranym terminie nie ma wolnych domków ani pokoi.
          Spróbuj zmienić daty.
        </p>
      </div>
    );
  }

  const totalGuests = dates.adults + dates.children;

  return (
    <div className="space-y-5">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold tracking-tight">Dostępne miejsca</h2>
        <p className="text-[13px] text-muted-foreground">
          {resources.length} {resources.length === 1 ? "wynik" : resources.length < 5 ? "wyniki" : "wyników"} dla {dates.adults + dates.children} {totalGuests === 1 ? "osoby" : "osób"}
        </p>
      </div>

      {/* Resource cards */}
      <div className="space-y-3">
        {resources.map(resource => {
          const defaultVariant = resource.variants.find(v => v.isDefault) || resource.variants[0];
          const isSelected = defaultVariant ? selected.has(defaultVariant.variantId) : false;
          const image = resource.catalog?.images?.[0];
          const desc = resource.catalog?.shortDescription;

          return (
            <button
              key={resource.resourceId}
              onClick={() => toggleResource(resource)}
              className={`w-full text-left bg-card rounded-2xl border-2 transition-all duration-200 overflow-hidden ${
                isSelected
                  ? "border-primary"
                  : "border-border hover:border-primary/40"
              }`}
            >
              <div className="p-4 flex gap-4">
                {/* Image */}
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-muted flex-shrink-0 overflow-hidden">
                  {image ? (
                    <img src={image.urls.thumbnail} alt={image.alt || resource.resourceName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageOff className="h-6 w-6 text-muted-foreground/40" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-[14px] font-semibold truncate">{resource.resourceName}</h3>
                      <p className="text-[11px] text-muted-foreground">{resource.categoryName}</p>
                    </div>
                    {/* Selection indicator */}
                    <div className={`h-6 w-6 rounded-lg flex-shrink-0 flex items-center justify-center transition-all ${
                      isSelected
                        ? "bg-primary text-white"
                        : "border-2 border-border"
                    }`}>
                      {isSelected && <Check className="h-3.5 w-3.5" />}
                    </div>
                  </div>

                  {desc && (
                    <p className="text-[12px] text-muted-foreground mt-1 line-clamp-2">{desc}</p>
                  )}

                  <div className="flex items-center gap-3 mt-2">
                    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Users className="h-3 w-3" />
                      max. {defaultVariant?.capacity || resource.maxCapacity || "?"} osób
                    </span>
                    {/* Price */}
                    {pricesLoading ? (
                      <PriceSkeleton />
                    ) : resource.minPrice !== undefined ? (
                      <span className="text-[13px] font-bold text-primary">
                        od {formatMoney(resource.minPrice)}/noc
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Bottom bar */}
      {selected.size > 0 && (
        <div className="sticky bottom-4 z-40">
          <button
            onClick={handleNext}
            className="w-full bg-primary hover:bg-primary/90 text-white rounded-2xl text-[15px] font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            style={{ height: 52 }}
          >
            Dalej — wycena ({selected.size} {selected.size === 1 ? "miejsce" : "miejsca"})
          </button>
        </div>
      )}
    </div>
  );
}
