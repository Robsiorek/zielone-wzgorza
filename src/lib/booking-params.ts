/**
 * booking-params.ts — Domain contract for booking engine URL parameters.
 *
 * B5a: Single source of truth for parsing, validating and normalizing
 * URL params across the entire booking engine.
 *
 * Used in:
 *   - BookingEngine (init — determines entry mode)
 *   - ExploreView quick date form (shared validation)
 *   - StepDates form (shared validation)
 *
 * Design decisions:
 *   - Pure functions — no React deps, no Next request objects
 *   - Input: URLSearchParams | Record<string, string | string[] | undefined>
 *     (handles App Router searchParams natively)
 *   - Output: typed domain result with mode, normalized data, and fallback reason
 *   - Single source of validation messages (Polish, user-facing)
 *   - Zero duplication: one parser, one validator, used everywhere
 *
 * Validation rules (from B5a brief):
 *   - ISO YYYY-MM-DD format
 *   - checkOut > checkIn
 *   - Dates not in the past
 *   - Incomplete params (e.g. only checkIn) → fallback explore
 *   - guests: 1–20, default 2
 *   - Max 60 nights
 *   - resource slug without valid dates does NOT activate resource mode
 */

// ═══════════════════════════════════════════
// Types
// ═══════════════════════════════════════════

/**
 * Engine entry mode — determines which view to render.
 *
 * explore  = no valid date params → show resource catalog
 * results  = valid checkIn + checkOut (no resource) → show availability results
 * resource = valid checkIn + checkOut + valid resource slug → show resource detail/quote
 */
export type BookingMode = "explore" | "results" | "resource";

/** Reason why params fell back to explore mode */
export type FallbackReason =
  | "no_params"
  | "incomplete_dates"
  | "invalid_date_format"
  | "dates_in_past"
  | "checkout_before_checkin"
  | "exceeds_max_nights"
  | null; // null = no fallback (dates valid)

/** Normalized result of URL param parsing */
export interface ParsedBookingParams {
  /** Validated check-in date (YYYY-MM-DD) or null if invalid/missing */
  checkIn: string | null;
  /** Validated check-out date (YYYY-MM-DD) or null if invalid/missing */
  checkOut: string | null;
  /** Normalized guest count (always 1–20, default 2) */
  guests: number;
  /** Resource slug from URL or null */
  resourceSlug: string | null;
  /** Resolved entry mode */
  mode: BookingMode;
  /** Why dates were rejected (null if dates are valid) */
  fallbackReason: FallbackReason;
}

/** Form validation result with user-facing message */
export interface DateValidationResult {
  valid: boolean;
  error?: string;
}

// ═══════════════════════════════════════════
// Date range (engine-ui canonical shape)
// ═══════════════════════════════════════════

/**
 * A check-in / check-out date pair. Both fields are nullable because the
 * UI commonly carries a partially-picked range (start selected, end not).
 * Dates are always ISO `YYYY-MM-DD` local strings — no time component.
 *
 * Consumed by `<DateRangePicker>` and `<SearchBar>`. The pair
 * `{checkIn: string, checkOut: string}` slice inside `BookingSearchCriteria`
 * matches this shape in its fully-selected form.
 */
export interface DateRange {
  checkIn: string | null;
  checkOut: string | null;
}

// ═══════════════════════════════════════════
// Booking Party (guest composition)
// ═══════════════════════════════════════════

/**
 * Guest composition for a booking search.
 *
 * Four independent counts — kept fine-grained because the UI distinguishes
 * them (Airbnb-style) and the operator (Robert) needs them for:
 *   - capacity math (adults + children)
 *   - operational planning (infants → cot availability)
 *   - pet policy (pets → which resources allow them)
 *
 * Important distinction — "entry contract" vs "effective booking contract":
 *   - The ENTRY contract (what the UI captures and the URL carries) is all
 *     four fields. This is what a GuestPicker / SearchBar owns.
 *   - The EFFECTIVE booking contract (what the availability/quote APIs see
 *     TODAY) is `adults + children` via `effectiveGuests()`. `infants` and
 *     `pets` are captured but NOT sent to the backend in this iteration.
 *     They will flow through the engine once the backend accepts them.
 *
 * Rationale: deciding early on the final shape of the entry contract lets
 * new components (GuestPicker, SearchBar) be built against the real model
 * without later rewiring, while leaving the production flow (BookingWidget,
 * StepDates, `/api/public/*`) untouched.
 */
export interface BookingParty {
  /** Guests 13+. Always at least 1 in a valid booking. */
  adults: number;
  /** Guests 2–12. Counts toward capacity. */
  children: number;
  /** Guests under 2. Does NOT count toward capacity. */
  infants: number;
  /** Traveling pets. Does NOT count toward capacity. */
  pets: number;
}

// ═══════════════════════════════════════════
// Flexible search types
// ═══════════════════════════════════════════

/**
 * Duration presets for flexible date search.
 * Domain type — lives here (not in UI) because it's part of the search
 * contract, URL schema, and future backend API.
 */
export type FlexibleDuration = "weekend" | "5days" | "week";

/** All valid duration values, for runtime validation. */
const FLEXIBLE_DURATIONS: FlexibleDuration[] = ["weekend", "5days", "week"];

/** Runtime check: is the value a valid FlexibleDuration? */
export function isFlexibleDuration(val: unknown): val is FlexibleDuration {
  return typeof val === "string" && FLEXIBLE_DURATIONS.includes(val as FlexibleDuration);
}

/** Parse a raw string into a FlexibleDuration, or return fallback. */
export function parseFlexibleDuration(raw: string | null | undefined): FlexibleDuration {
  if (raw && isFlexibleDuration(raw)) return raw;
  return "weekend";
}

/** YYYY-MM regex for month validation. */
const YEAR_MONTH_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

/**
 * Validate a YYYY-MM string. Checks format AND that the month is real
 * (no 2026-13). Does NOT check if the month is in the past — that's
 * a business rule, not a format rule.
 */
export function isValidYearMonth(val: string): boolean {
  return YEAR_MONTH_REGEX.test(val);
}

// ═══════════════════════════════════════════
// BookingSearchCriteria — discriminated union
// ═══════════════════════════════════════════

/**
 * Full search criteria for the booking engine — the ONE contract that
 * SearchBar, URL, and future backend API all share.
 *
 * Discriminated on `mode`:
 *   - "exact"    → user picked concrete check-in / check-out dates
 *   - "flexible" → user picked a duration preset + a target month
 *
 * Guest composition (BookingParty) is shared across both modes.
 */
export type ExactSearchCriteria = BookingParty & {
  mode: "exact";
  checkIn: string;   // "YYYY-MM-DD" or "" if not yet selected
  checkOut: string;   // "YYYY-MM-DD" or "" if not yet selected
};

export type FlexibleSearchCriteria = BookingParty & {
  mode: "flexible";
  duration: FlexibleDuration;
  month: string;      // "YYYY-MM" or "" if not yet selected
};

export type BookingSearchCriteria = ExactSearchCriteria | FlexibleSearchCriteria;

/**
 * Default search criteria. Exact mode, empty dates, 2 adults.
 * Used as initial state in SearchBar and demo components.
 */
export const DEFAULT_SEARCH_CRITERIA: ExactSearchCriteria = {
  mode: "exact",
  checkIn: "",
  checkOut: "",
  adults: 2,
  children: 0,
  infants: 0,
  pets: 0,
};

/**
 * Post-submit default party. When a guest opens the engine for the first
 * time and submits without touching the guest picker, this is what we use.
 */
export const DEFAULT_BOOKING_PARTY: BookingParty = {
  adults: 2,
  children: 0,
  infants: 0,
  pets: 0,
};

/**
 * Capacity-relevant guest count. The backend's availability/quote APIs
 * expect a single number; this is the projection from BookingParty to
 * that number.
 *
 * Rule: adults + children. Infants and pets are excluded by design.
 */
export function effectiveGuests(party: BookingParty): number {
  return party.adults + party.children;
}


// ═══════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const MIN_GUESTS = 1;
const MAX_GUESTS = 20;
const DEFAULT_GUESTS = 2;
/**
 * Currently active flow entry rule, extracted from StepDates to shared layer.
 * Candidate for future migration to CompanySettings (system-configurable),
 * but without changing behavior now.
 */
const MAX_NIGHTS = 60;

/** User-facing validation messages (Polish) — single source of truth */
export const VALIDATION_MESSAGES = {
  no_dates: "Wybierz daty przyjazdu i wyjazdu",
  invalid_format: "Nieprawidłowy format daty",
  past_date: "Data przyjazdu nie może być w przeszłości",
  checkout_before_checkin: "Data wyjazdu musi być po dacie przyjazdu",
  max_nights: `Maksymalnie ${MAX_NIGHTS} nocy`,
} as const;

// ═══════════════════════════════════════════
// Helpers (pure, no deps)
// ═══════════════════════════════════════════

/** Check if string is a valid ISO date (YYYY-MM-DD) that actually exists */
function isValidISODate(str: string): boolean {
  if (!ISO_DATE_REGEX.test(str)) return false;
  const d = new Date(str + "T00:00:00");
  if (isNaN(d.getTime())) return false;
  // Round-trip verification (catches things like 2026-02-30)
  const [y, m, day] = str.split("-").map(Number);
  return d.getFullYear() === y && d.getMonth() + 1 === m && d.getDate() === day;
}

/** Get today as YYYY-MM-DD in local time (not UTC — critical for PL timezone) */
function getToday(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Count nights between two ISO date strings */
export function nightsBetween(checkIn: string, checkOut: string): number {
  const diff = new Date(checkOut + "T00:00:00").getTime() - new Date(checkIn + "T00:00:00").getTime();
  return Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)));
}

/**
 * Extract first string value from App Router param.
 * Handles: string → string, string[] → first, undefined → ""
 */
function firstString(val: string | string[] | undefined): string {
  if (val === undefined) return "";
  if (Array.isArray(val)) return val[0] || "";
  return val;
}

// ═══════════════════════════════════════════
// Main parser
// ═══════════════════════════════════════════

/**
 * Parse and validate booking engine URL parameters.
 *
 * Pure function. Accepts both URLSearchParams and App Router's
 * Record<string, string | string[] | undefined>.
 *
 * Returns normalized domain result with:
 *   - validated dates (or null)
 *   - normalized guests (always 1–20)
 *   - resource slug (or null)
 *   - resolved mode (explore | results | resource)
 *   - fallback reason (why dates were rejected, or null)
 */
export function parseBookingParams(
  searchParams: URLSearchParams | Record<string, string | string[] | undefined>
): ParsedBookingParams {
  // ── Normalize input ──
  let rawCheckIn: string;
  let rawCheckOut: string;
  let rawGuests: string;
  let rawResource: string;

  if (searchParams instanceof URLSearchParams) {
    rawCheckIn = searchParams.get("checkIn") || "";
    rawCheckOut = searchParams.get("checkOut") || "";
    rawGuests = searchParams.get("guests") || "";
    rawResource = searchParams.get("resource") || "";
  } else {
    rawCheckIn = firstString(searchParams.checkIn);
    rawCheckOut = firstString(searchParams.checkOut);
    rawGuests = firstString(searchParams.guests);
    rawResource = firstString(searchParams.resource);
  }

  // ── Guests: independent of dates, always normalized ──
  let guests = DEFAULT_GUESTS;
  if (rawGuests) {
    const parsed = parseInt(rawGuests, 10);
    if (!isNaN(parsed) && parsed >= MIN_GUESTS && parsed <= MAX_GUESTS) {
      guests = parsed;
    }
  }

  // ── Resource slug ──
  const resourceSlug = rawResource.trim() || null;

  // ── Build explore fallback helper ──
  const exploreFallback = (reason: FallbackReason): ParsedBookingParams => ({
    checkIn: null,
    checkOut: null,
    guests,
    resourceSlug: null, // slug without valid dates = ignored (brief rule)
    mode: "explore",
    fallbackReason: reason,
  });

  // ── Dates: both must be present ──
  if (!rawCheckIn && !rawCheckOut) {
    return exploreFallback("no_params");
  }
  if (!rawCheckIn || !rawCheckOut) {
    return exploreFallback("incomplete_dates");
  }

  // ── Dates: format validation ──
  if (!isValidISODate(rawCheckIn) || !isValidISODate(rawCheckOut)) {
    return exploreFallback("invalid_date_format");
  }

  // ── Dates: not in the past ──
  const today = getToday();
  if (rawCheckIn < today) {
    return exploreFallback("dates_in_past");
  }

  // ── Dates: checkOut must be after checkIn ──
  if (rawCheckOut <= rawCheckIn) {
    return exploreFallback("checkout_before_checkin");
  }

  // ── Dates: max nights ──
  const nights = nightsBetween(rawCheckIn, rawCheckOut);
  if (nights > MAX_NIGHTS) {
    return exploreFallback("exceeds_max_nights");
  }

  // ── Valid dates → determine mode ──
  const mode: BookingMode = resourceSlug ? "resource" : "results";

  return {
    checkIn: rawCheckIn,
    checkOut: rawCheckOut,
    guests,
    resourceSlug,
    mode,
    fallbackReason: null,
  };
}

// ═══════════════════════════════════════════
// Date range validator (for forms)
// ═══════════════════════════════════════════

/**
 * Validate a date range for form submission.
 * Uses the same rules as parseBookingParams but returns user-facing messages.
 * Used in: StepDates, ExploreView quick date form.
 *
 * Single source of validation messages — uses VALIDATION_MESSAGES constant.
 */
export function validateDateRange(checkIn: string, checkOut: string): DateValidationResult {
  if (!checkIn || !checkOut) {
    return { valid: false, error: VALIDATION_MESSAGES.no_dates };
  }

  if (!isValidISODate(checkIn) || !isValidISODate(checkOut)) {
    return { valid: false, error: VALIDATION_MESSAGES.invalid_format };
  }

  const today = getToday();
  if (checkIn < today) {
    return { valid: false, error: VALIDATION_MESSAGES.past_date };
  }

  if (checkOut <= checkIn) {
    return { valid: false, error: VALIDATION_MESSAGES.checkout_before_checkin };
  }

  const nights = nightsBetween(checkIn, checkOut);
  if (nights > MAX_NIGHTS) {
    return { valid: false, error: VALIDATION_MESSAGES.max_nights };
  }

  return { valid: true };
}

// ═══════════════════════════════════════════
// Public helpers used by engine UI components
// ═══════════════════════════════════════════

/**
 * Today's date as a local `YYYY-MM-DD` string.
 *
 * Deliberately uses LOCAL components (not UTC) so the returned value
 * matches the Polish calendar day. `new Date().toISOString().slice(0,10)`
 * would be wrong around midnight (UTC drift).
 *
 * Public export of the internal `getToday()` helper, published because
 * form components (QuickDateForm, StepDates) need to set `min` on date
 * pickers using the same source of truth.
 */
export function getLocalToday(): string {
  return getToday();
}

/**
 * Normalize a guest count from an untrusted input (URL param, prop from
 * a parent that may have forwarded `undefined`, form field, etc.) to a
 * valid `number` within the domain range.
 *
 * Rules:
 *   - `undefined` / `null` / empty string / non-numeric → DEFAULT_GUESTS
 *   - Out of range → clamped to [MIN_GUESTS, MAX_GUESTS]
 *   - Non-integer → floored
 *
 * Used by QuickDateForm to seed its local state from an optional
 * `initialGuests` prop, and by any component hydrating from URL params.
 */
export function normalizeGuests(raw: unknown): number {
  let n: number;
  if (typeof raw === "number") {
    n = raw;
  } else if (typeof raw === "string" && raw.trim() !== "") {
    const parsed = parseInt(raw, 10);
    n = isNaN(parsed) ? DEFAULT_GUESTS : parsed;
  } else {
    return DEFAULT_GUESTS;
  }
  if (!isFinite(n)) return DEFAULT_GUESTS;
  n = Math.floor(n);
  if (n < MIN_GUESTS) return MIN_GUESTS;
  if (n > MAX_GUESTS) return MAX_GUESTS;
  return n;
}

// ═══════════════════════════════════════════
// URL builder (inverse of parseBookingParams)
// ═══════════════════════════════════════════

/**
 * Criteria accepted by `buildBookingUrl`.
 *
 * Now supports both exact and flexible modes. For exact mode, the URL
 * stays backward-compatible (no `mode=exact` param). For flexible mode,
 * `mode=flexible` is explicitly added.
 *
 * Kept as a separate type from `BookingSearchCriteria` because URL
 * building adds `resourceSlug` and `basePath` which aren't part of
 * the search criteria contract.
 */
export type BuildBookingUrlInput =
  | (ExactSearchCriteria & {
      resourceSlug?: string;
      basePath?: string;
    })
  | (FlexibleSearchCriteria & {
      basePath?: string;
    });

/**
 * Build a booking engine URL from a criteria object.
 *
 * Exact mode: backward-compatible URL, no `mode` param.
 *   → `/?checkIn=…&checkOut=…&adults=…`
 *
 * Flexible mode: explicit `mode=flexible` branch.
 *   → `/?mode=flexible&duration=weekend&month=2026-07&adults=…`
 *
 * Guest fields (adults, children, infants, pets) are always serialized.
 * Non-positive infants/pets are dropped to keep URLs clean.
 */
export function buildBookingUrl(input: BuildBookingUrlInput): string {
  const basePath = input.basePath ?? "/";
  const params = new URLSearchParams();

  // ── Mode-specific params ──
  if (input.mode === "flexible") {
    params.set("mode", "flexible");
    params.set("duration", input.duration);
    if (input.month) params.set("month", input.month);
    // Flexible: new format — individual guest fields.
    params.set("adults", String(normalizeGuests(input.adults)));
    if (input.children > 0) {
      params.set("children", String(Math.max(0, Math.floor(input.children))));
    }
    if (input.infants > 0) {
      params.set("infants", String(Math.max(0, Math.floor(input.infants))));
    }
    if (input.pets > 0) {
      params.set("pets", String(Math.max(0, Math.floor(input.pets))));
    }
  } else {
    // Exact: backward-compatible — emit "guests" (not "adults").
    if (input.checkIn) params.set("checkIn", input.checkIn);
    if (input.checkOut) params.set("checkOut", input.checkOut);
    params.set("guests", String(normalizeGuests(effectiveGuests(input))));
    if ("resourceSlug" in input && input.resourceSlug?.trim()) {
      params.set("resource", input.resourceSlug.trim());
    }
  }

  const qs = params.toString();
  if (!qs) return basePath;
  const sep = basePath.includes("?") ? "&" : "?";
  return `${basePath}${sep}${qs}`;
}

