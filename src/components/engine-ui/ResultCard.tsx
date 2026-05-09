"use client";

/**
 * ResultCard — Airbnb-style search result card (engine-ui)
 * ────────────────────────────────────────────────────────────────────────
 * Premium card with:
 *   - ImageCarousel with swipe + arrows
 *   - LegacyFavoriteButton (heart) on image top-right
 *   - Badge on image top-left (e.g. "Wybór gości")
 *   - Name + rating row
 *   - Subtitle (1 line)
 *   - Price (clickable → popover with breakdown)
 *   - "Udogodnienia" link (→ modal with categorized amenities)
 *   - Whole card clickable (cursor: pointer)
 *
 * No "Sprawdź >" button — the card itself is the action.
 */

import * as React from "react";
import { Star, Tag, X as XIcon } from "lucide-react";
import type { ResultCardData } from "./results-types";
import { ImageCarousel } from "./ImageCarousel";
import { FavoriteButton as LegacyFavoriteButton } from "./LegacyFavoriteButton";
import { PriceBlock } from "./PriceBlock";
import { Modal } from "./Modal";
import { FeatureChips } from "./FeatureChips";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "./primitives/Popover";

// ═══════════════════════════════════════════
// Types
// ═══════════════════════════════════════════

export interface ResultCardProps {
  data: ResultCardData;
  /** Called with full card data on card click. */
  onSelect?: (data: ResultCardData) => void;
  /** Called when favorite is toggled. */
  onFavoriteChange?: (id: string, isFavorite: boolean) => void;
  className?: string;
}

// ═══════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════

function formatPrice(minor: number, currency: string): string {
  const major = Math.floor(minor / 100);
  const cents = minor % 100;
  const symbol = currency === "PLN" ? "zł" : currency;
  if (cents === 0) return `${major} ${symbol}`;
  return `${major},${String(cents).padStart(2, "0")} ${symbol}`;
}

function pluralNights(n: number): string {
  if (n === 1) return "1 noc";
  if (n < 5) return `${n} noce`;
  return `${n} nocy`;
}

// Icon map for amenities modal
const AMENITY_ICONS: Record<string, React.ComponentType<{ size?: number | string }>> = {};
// We'll use FeatureChips' icon map via the chips — amenities in modal are text-only with category headers

// ═══════════════════════════════════════════
// Component
// ═══════════════════════════════════════════

export function ResultCard({
  data,
  onSelect,
  onFavoriteChange,
  className,
}: ResultCardProps) {
  const [amenitiesOpen, setAmenitiesOpen] = React.useState(false);
  const [priceOpen, setPriceOpen] = React.useState(false);
  const isUnavailable = data.availability.status === "unavailable";

  const rootClass = [
    "eui-card",
    isUnavailable && "eui-card-unavailable",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const handleCardClick = () => {
    if (!isUnavailable && onSelect) {
      onSelect(data);
    }
  };

  const handleAmenitiesClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAmenitiesOpen(true);
  };

  return (
    <>
      <article
        className={rootClass}
        onClick={handleCardClick}
        role={onSelect ? "button" : undefined}
        tabIndex={onSelect && !isUnavailable ? 0 : undefined}
        onKeyDown={(e) => {
          if (e.key === "Enter" && onSelect && !isUnavailable) {
            onSelect(data);
          }
        }}
      >
        {/* ── Image area ── */}
        <div className="eui-card-image">
          <ImageCarousel images={data.images ?? []} />

          {/* Badge top-left */}
          {data.imageBadge && (
            <span className="eui-card-badge">{data.imageBadge}</span>
          )}

          {/* Heart top-right */}
          <LegacyFavoriteButton
            active={data.isFavorite}
            onChange={(next) => onFavoriteChange?.(data.id, next)}
            className="eui-card-favorite"
          />
        </div>

        {/* ── Content ── */}
        <div className="eui-card-content">
          {/* Name + rating */}
          <div className="eui-card-title-row">
            <h3 className="eui-card-name">{data.name}</h3>
            {data.rating && (
              <span className="eui-card-rating">
                <Star size={14} fill="currentColor" strokeWidth={0} aria-hidden="true" />
                <span>{data.rating.score.toFixed(2)}</span>
                <span className="eui-card-rating-count">({data.rating.count})</span>
              </span>
            )}
          </div>

          {/* Subtitle */}
          {data.subtitle && (
            <p className="eui-card-subtitle">{data.subtitle}</p>
          )}

          {/* Price + amenities link */}
          <div className="eui-card-bottom">
            <div className="eui-card-price-area" onClick={(e) => e.stopPropagation()}>
              <Popover open={priceOpen} onOpenChange={setPriceOpen}>
                <PopoverTrigger asChild>
                  <button type="button" className="eui-card-price-trigger">
                    <span className="eui-card-price-amount">
                      {formatPrice(data.price.perNightMinor, data.price.currency)}
                    </span>
                    <span className="eui-card-price-unit">/ noc</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent size="small" align="start" side="top" sideOffset={8}>
                  <div className="eui-card-price-detail">
                    <div className="eui-card-price-detail-header">
                      <span className="eui-card-price-detail-title">Szczegóły ceny</span>
                      <button
                        type="button"
                        className="eui-card-price-detail-close"
                        onClick={() => setPriceOpen(false)}
                        aria-label="Zamknij"
                      >
                        <XIcon size={18} />
                      </button>
                    </div>
                    <div className="eui-card-price-detail-row">
                      <span>Cena za noc</span>
                      <span>{formatPrice(data.price.perNightMinor, data.price.currency)}</span>
                    </div>
                    {data.price.nights != null && data.price.totalMinor != null && (
                      <>
                        <div className="eui-card-price-detail-row">
                          <span>Pobyt ({pluralNights(data.price.nights)})</span>
                          <span>{formatPrice(data.price.totalMinor, data.price.currency)}</span>
                        </div>
                        <div className="eui-card-price-detail-row eui-card-price-total">
                          <span>Łącznie</span>
                          <span>{formatPrice(data.price.totalMinor, data.price.currency)}</span>
                        </div>
                      </>
                    )}
                    {data.price.badge && (
                      <span className="eui-card-price-badge">
                        <Tag size={13} aria-hidden="true" />
                        {data.price.badge}
                      </span>
                    )}
                  </div>
                </PopoverContent>
              </Popover>

              {data.price.totalMinor != null && data.price.nights != null && (
                <span className="eui-card-price-total-hint">
                  {formatPrice(data.price.totalMinor, data.price.currency)} łącznie
                </span>
              )}
            </div>

            {data.amenities && data.amenities.length > 0 && (
              <button
                type="button"
                className="eui-card-amenities-link"
                onClick={handleAmenitiesClick}
              >
                Udogodnienia
              </button>
            )}
          </div>
        </div>
      </article>

      {/* ── Amenities Modal ── */}
      {data.amenities && (
        <Modal
          open={amenitiesOpen}
          onClose={() => setAmenitiesOpen(false)}
          title={`Udogodnienia — ${data.name}`}
          maxWidth={520}
        >
          <div className="eui-amenities-list">
            {data.amenities.map((cat, i) => (
              <div key={i} className="eui-amenities-category">
                <h4 className="eui-amenities-cat-name">{cat.name}</h4>
                <ul className="eui-amenities-items">
                  {cat.items.map((item, j) => (
                    <li key={j} className="eui-amenities-item">
                      {item.name}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </>
  );
}
