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

import { CardSurface } from "@/components/engine-ui/surface/CardSurface";
import { MediaFrame } from "@/components/engine-ui/media/MediaFrame";
import { MediaOverlay } from "@/components/engine-ui/media/MediaOverlay";
import { MediaBadge } from "@/components/engine-ui/media/MediaBadge";
import { ImagePlaceholder } from "@/components/engine-ui/media/ImagePlaceholder";
import { Inline } from "@/components/engine-ui/layout/Inline";
import { Tag } from "@/components/engine-ui/chip/Tag";
import { Button } from "@/components/engine-ui/button/Button";

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

  return (
    <CardSurface
      elevation="flat"
      radius="lg"
      variant="bordered"
      padding={0}
      className="overflow-hidden h-full"
    >
      {/* ── Cover image ── */}
      <MediaFrame aspectRatio="16 / 10">
        {coverImage ? (
          <img
            src={coverImage.urls.medium}
            alt={coverImage.alt || resource.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <ImagePlaceholder size="lg" icon={<ImageOff />} />
        )}
        <MediaOverlay position="top-left">
          <MediaBadge variant="default">{resource.category.name}</MediaBadge>
        </MediaOverlay>
      </MediaFrame>

      {/* ── Content ── */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Name */}
        <h3 className="text-[15px] font-semibold text-foreground truncate">
          {resource.name}
        </h3>

        {/* Meta row: capacity + bedrooms */}
        {(resource.maxCapacity || resource.bedroomCount) ? (
          <Inline gap="md" align="center" className="mt-1.5">
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
          </Inline>
        ) : null}

        {/* Short description */}
        {resource.shortDescription && (
          <p className="text-[13px] text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
            {resource.shortDescription}
          </p>
        )}

        {/* Amenities (top 4) */}
        {topAmenities.length > 0 && (
          <Inline wrap gap="xs" className="mt-3">
            {topAmenities.map((amenity) => (
              <Tag
                key={amenity.id}
                variant="neutral"
                iconLeft={amenity.icon ? <DynamicIcon iconKey={amenity.icon} className="h-3 w-3" /> : undefined}
              >
                {amenity.name}
              </Tag>
            ))}
            {resource.amenities.length > 4 && (
              <span className="text-[11px] text-muted-foreground/60 px-1 py-0.5">
                +{resource.amenities.length - 4}
              </span>
            )}
          </Inline>
        )}

        {/* Spacer to push CTA to bottom */}
        <div className="flex-1 min-h-3" />

        {/* CTA */}
        <Button
          variant="primary"
          size="md"
          fullWidth
          iconLeft={<Search />}
          onClick={() => onCheckAvailability(resource.slug)}
          className="mt-3"
        >
          Sprawdź dostępność
        </Button>
      </div>
    </CardSurface>
  );
}
