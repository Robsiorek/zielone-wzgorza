/**
 * results-types.ts — View models for the Results Layer (engine-ui)
 * ────────────────────────────────────────────────────────────────────────
 * Pure data contracts. No React, no rendering logic. These types describe
 * what the frontend needs to render a search results page.
 *
 * Prices are always in minor units (grosze). Currency is always explicit.
 * Images are an array (gallery-ready even if we show one today).
 * Feature icons are string names, not ReactNodes (serializable from API).
 */

// ═══════════════════════════════════════════
// Availability
// ═══════════════════════════════════════════

export type AvailabilityStatus = "available" | "limited" | "unavailable";

export interface AvailabilityInfo {
  status: AvailabilityStatus;
  /** Override default label, e.g. "Ostatnie 2 terminy". */
  label?: string;
  /** Extended description, e.g. "Zostały 2 domki w tym terminie". */
  description?: string;
}

// ═══════════════════════════════════════════
// Price
// ═══════════════════════════════════════════

export interface PriceInfo {
  /** Per-night price in minor units (grosze). */
  perNightMinor: number;
  /** Total stay price in minor units. Omit if no dates selected. */
  totalMinor?: number;
  /** Number of nights. Omit if no dates. */
  nights?: number;
  /** Optional badge text, e.g. "Najlepsza cena". */
  badge?: string;
  /** Currency code. Always explicit — no defaults. */
  currency: string;
}

// ═══════════════════════════════════════════
// Features
// ═══════════════════════════════════════════

/**
 * Icon names mapped to Lucide icons in the FeatureChips component.
 * String enum keeps the view model serializable (no React imports).
 */
export type FeatureIconName =
  | "users"
  | "bed"
  | "wifi"
  | "bath"
  | "sauna"
  | "treePine"
  | "dog"
  | "baby"
  | "mountain"
  | "waves"
  | "flame"
  | "car";

export interface FeatureChip {
  label: string;
  icon?: FeatureIconName;
}

// ═══════════════════════════════════════════
// Images
// ═══════════════════════════════════════════

export interface ResultImage {
  url: string;
  alt: string;
}

// ═══════════════════════════════════════════
// Rating
// ═══════════════════════════════════════════

export interface ResultRating {
  /** Average score, e.g. 4.92 */
  score: number;
  /** Number of reviews. */
  count: number;
}

// ═══════════════════════════════════════════
// Amenities (for modal display)
// ═══════════════════════════════════════════

export interface AmenityItem {
  name: string;
  icon?: FeatureIconName;
}

export interface AmenityCategory {
  name: string;
  items: AmenityItem[];
}

// ═══════════════════════════════════════════
// Result Card
// ═══════════════════════════════════════════

export interface ResultCardData {
  id: string;
  name: string;
  slug: string;
  /** Short description or location hint. */
  subtitle?: string;
  /** Image gallery. First image is the hero/cover. */
  images?: ResultImage[];
  /** Max guest capacity. */
  capacity: number;
  features: FeatureChip[];
  /** Grouped amenities for the detail modal. */
  amenities?: AmenityCategory[];
  availability: AvailabilityInfo;
  price: PriceInfo;
  /** Guest rating. */
  rating?: ResultRating;
  /** Badge text shown on image, e.g. "Wybór gości". */
  imageBadge?: string;
  /** Whether this item is in the user's favorites. */
  isFavorite?: boolean;
}

// ═══════════════════════════════════════════
// Results collection (helper for pages/demos)
// ═══════════════════════════════════════════

export interface ResultsListData {
  items: ResultCardData[];
  totalCount: number;
  subtitle?: string;
}
