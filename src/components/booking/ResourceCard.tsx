"use client";

/**
 * ResourceCard.tsx — Single resource card for Explore View catalog.
 *
 * B5a Phase 3: Presentational component. No global navigation/URL/scroll logic.
 * Gets onCheckAvailability callback from parent (ExploreView handles routing).
 *
 * Defensive rendering:
 *   - Cover: isCover → first image → placeholder
 *   - Description: shortDescription → empty (no crash)
 *   - Amenities: slice(0,4), skip if empty
 *   - BedroomCount: show only if > 0
 *   - MaxCapacity: show only if present
 */

import React from "react";
import { Users, BedDouble, Search, ImageOff } from "lucide-react";
import { DynamicIcon } from "@/components/ui/dynamic-icon";

// ═══════════════════════════════════════════
// Types
// ═══════════════════════════════════════════

interface ResourceImage {
  id: string;
  alt: string | null;
  position: number;
  isCover: boolean;
  urls: { original: string; medium: string; thumbnail: string };
}

interface ResourceAmenity {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
  categorySlug: string;
}

interface ResourceBed {
  bedType: string;
  quantity: number;
  label: string;
}

interface CatalogResource {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  maxCapacity: number | null;
  bedroomCount: number | null;
  bathroomCount: number | null;
  areaSqm: number | null;
  category: { name: string; slug: string };
  images: ResourceImage[];
  amenities: ResourceAmenity[];
  beds: ResourceBed[];
  variants: { id: string; name: string; capacity: number; isDefault: boolean }[];
}

interface Props {
  resource: CatalogResource;
  /** Called when user clicks CTA. Parent handles navigation. */
  onCheckAvailability: (resourceSlug: string) => void;
}

// ═══════════════════════════════════════════
// Component
// ═══════════════════════════════════════════

export function ResourceCard({ resource, onCheckAvailability }: Props) {
  // ── Defensive: cover image ──
  const coverImage = resource.images.find(img => img.isCover)
    || resource.images[0]
    || null;

  // ── Defensive: top 4 amenities ──
  const topAmenities = resource.amenities.slice(0, 4);

  // ── Defensive: total bed count ──
  const totalBeds = resource.beds.reduce((sum, b) => sum + b.quantity, 0);

  return (
    <div className="bg-card rounded-2xl border-2 border-border hover:border-primary/40 transition-all duration-200 overflow-hidden flex flex-col">
      {/* ── Cover image ── */}
      <div className="relative aspect-[16/10] bg-muted overflow-hidden">
        {coverImage ? (
          <img
            src={coverImage.urls.medium}
            alt={coverImage.alt || resource.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageOff className="h-8 w-8 text-muted-foreground/30" />
          </div>
        )}
        {/* Category badge */}
        <div className="absolute top-3 left-3">
          <span className="text-[11px] font-medium bg-white/90 backdrop-blur-sm text-foreground/80 px-2.5 py-1 rounded-full">
            {resource.category.name}
          </span>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Name */}
        <h3 className="text-[15px] font-semibold text-foreground truncate">
          {resource.name}
        </h3>

        {/* Meta row: capacity + bedrooms */}
        <div className="flex items-center gap-3 mt-1.5">
          {resource.maxCapacity && resource.maxCapacity > 0 && (
            <span className="inline-flex items-center gap-1 text-[12px] text-muted-foreground">
              <Users className="h-3 w-3" />
              do {resource.maxCapacity} osób
            </span>
          )}
          {resource.bedroomCount && resource.bedroomCount > 0 && (
            <span className="inline-flex items-center gap-1 text-[12px] text-muted-foreground">
              <BedDouble className="h-3 w-3" />
              {resource.bedroomCount} {resource.bedroomCount === 1 ? "sypialnia" : resource.bedroomCount < 5 ? "sypialnie" : "sypialni"}
            </span>
          )}
        </div>

        {/* Short description */}
        {resource.shortDescription && (
          <p className="text-[13px] text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
            {resource.shortDescription}
          </p>
        )}

        {/* Amenities (top 4) */}
        {topAmenities.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {topAmenities.map((amenity) => (
              <span
                key={amenity.id}
                className="inline-flex items-center gap-1 text-[11px] text-muted-foreground bg-muted/50 rounded-full px-2 py-0.5"
              >
                {amenity.icon && (
                  <DynamicIcon iconKey={amenity.icon} className="h-3 w-3" />
                )}
                {amenity.name}
              </span>
            ))}
            {resource.amenities.length > 4 && (
              <span className="text-[11px] text-muted-foreground/60 px-1 py-0.5">
                +{resource.amenities.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Spacer to push CTA to bottom */}
        <div className="flex-1 min-h-3" />

        {/* CTA */}
        <button
          onClick={() => onCheckAvailability(resource.slug)}
          className="w-full mt-3 bg-primary hover:bg-primary/90 text-white rounded-xl text-[13px] font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
          style={{ height: 42 }}
        >
          <Search className="h-3.5 w-3.5" />
          Sprawdź dostępność
        </button>
      </div>
    </div>
  );
}
