"use client";

/**
 * ResultCard — Airbnb-style search result card (engine-ui)
 * ────────────────────────────────────────────────────────────────────────
 * Premium card with:
 *   - ImageCarousel with swipe + arrows
 *   - FavoriteOverlay (canonical heart, MediaOverlay + FavoriteButton) top-right
 *   - Badge on image top-left (e.g. "Wybór gości")
 *   - Name + rating row
 *   - Subtitle (1 line)
 *   - Price (clickable → popover with breakdown)
 *   - "Udogodnienia" link (→ modal with categorized amenities)
 *   - Whole card clickable (cursor: pointer)
 *
 * No "Sprawdź >" button — the card itself is the action.
 *
 * Część 8.5a Stage 5A: structural shell on Engine UI primitives.
 *   - <article> → <CardSurface> (transparent — preserves legacy .eui-card look)
 *   - image area → <MediaFrame> + <MediaOverlay> + <MediaBadge>
 *   - title row → <ActionRow align=between>
 *   - content area → <Stack gap=xs>
 *
 * ZACHOWANE w 5A (refactor w 5B):
 *   - Hand-rolled rating (Star + score + count)
 *   - Hand-rolled price popover (trigger + content panel)
 *   - Hand-rolled amenities link button
 *   - isUnavailable styling (interactive guard preserved przez onClick check)
 *   - Modal for amenities
 */

import * as React from "react";
import { Tag, X as XIcon } from "lucide-react";
import type { ResultCardData } from "./results-types";
import { ImageCarousel } from "./ImageCarousel";
import { Modal } from "./Modal";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "./primitives/Popover";

import { CardSurface } from "./surface/CardSurface";
import { MediaFrame } from "./media/MediaFrame";
import { MediaOverlay } from "./media/MediaOverlay";
import { MediaBadge } from "./media/MediaBadge";
import { FavoriteOverlay } from "./media/FavoriteOverlay";
import { Stack } from "./layout/Stack";
import { ActionRow } from "./layout/ActionRow";
import { RatingPill } from "./chip/RatingPill";
import { Button } from "./button/Button";
import { IconButton } from "./button/IconButton";

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
    isUnavailable && "eui-result-card-unavailable",
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
      <CardSurface
        elevation="flat"
        radius="xl"
        variant="bare"
        padding={0}
        interactive={!isUnavailable && !!onSelect}
        className={rootClass}
        onClick={!isUnavailable ? handleCardClick : undefined}
        role={onSelect ? "button" : undefined}
        tabIndex={onSelect && !isUnavailable ? 0 : undefined}
        aria-disabled={isUnavailable || undefined}
        onKeyDown={(e) => {
          if (e.key === "Enter" && onSelect && !isUnavailable) {
            onSelect(data);
          }
        }}
      >
        {/* ── Image area ── */}
        <MediaFrame aspectRatio="16 / 10" radius="xl">
          <ImageCarousel images={data.images ?? []} />

          {data.imageBadge && (
            <MediaOverlay position="top-left">
              <MediaBadge variant="default">{data.imageBadge}</MediaBadge>
            </MediaOverlay>
          )}

          <FavoriteOverlay
            position="top-right"
            favorited={data.isFavorite}
            onChange={(next) => onFavoriteChange?.(data.id, next)}
            aria-label={
              data.isFavorite ? "Usuń z ulubionych" : "Dodaj do ulubionych"
            }
          />
        </MediaFrame>

        {/* ── Content ── */}
        <Stack gap="xs" className="eui-card-content">
          {/* Name + rating */}
          <ActionRow align="between" gap="none" className="eui-card-title-row">
            <h3 className="eui-card-name">{data.name}</h3>
            {data.rating && (
              <RatingPill
                score={data.rating.score}
                count={data.rating.count}
                variant="inline"
                size="md"
              />
            )}
          </ActionRow>

          {/* Subtitle */}
          {data.subtitle && (
            <p className="eui-card-subtitle">{data.subtitle}</p>
          )}

          {/* Price + amenities link — hand-rolled w 5A, refactor w 5B */}
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
                  <Stack gap="sm" className="eui-card-price-detail">
                    <ActionRow align="between" gap="none" className="eui-card-price-detail-header">
                      <span className="eui-card-price-detail-title">Szczegóły ceny</span>
                      <IconButton
                        size="sm"
                        variant="ghost"
                        aria-label="Zamknij"
                        onClick={() => setPriceOpen(false)}
                        icon={<XIcon />}
                      />
                    </ActionRow>
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
                  </Stack>
                </PopoverContent>
              </Popover>

              {data.price.totalMinor != null && data.price.nights != null && (
                <span className="eui-card-price-total-hint">
                  {formatPrice(data.price.totalMinor, data.price.currency)} łącznie
                </span>
              )}
            </div>

            {data.amenities && data.amenities.length > 0 && (
              <Button
                variant="link"
                size="sm"
                onClick={handleAmenitiesClick}
                className="eui-card-amenities-link"
              >
                Udogodnienia
              </Button>
            )}
          </div>
        </Stack>
      </CardSurface>

      {/* ── Amenities Modal — legacy peer ── */}
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
