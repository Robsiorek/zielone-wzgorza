"use client";

/**
 * SearchBar — pill-shaped booking search bar (engine-ui)
 * ────────────────────────────────────────────────────────────────────────
 * A single component with two variants (handoff §5.1 — deliberately NOT
 * split into HeroSearchBar / CompactSearchBar to prevent visual drift):
 *
 *   - variant="hero"    — 68px tall, large hit targets, used on the
 *                         landing search page.
 *   - variant="compact" — 48px tall, used inside sticky navbars on
 *                         results / detail pages.
 *
 * Segments:
 *   Configurable via the `segments` prop. Default is `["when", "guests"]`,
 *   which matches Zielone Wzgórza's single-property setup. `SearchBarSegment`
 *   is intentionally a 2-member union for now — a future multi-property
 *   deployment will add `"where"` as a deliberate API expansion in its
 *   own phase.
 *
 *   Order is preserved as passed.
 *
 * State model:
 *   - `value` is BookingSearchCriteria — the full entry contract.
 *   - Only `adults/children` flow to the effective booking backend today;
 *     `infants/pets` are captured here but not forwarded (see §16 and
 *     `effectiveGuests()` in booking-params).
 *   - Each segment is a Radix Popover. At most one is open at a time,
 *     tracked by local `activeSegment` state. Clicking a segment toggles
 *     its popover open; clicking again (or outside) closes it.
 *   - Selecting a complete date range auto-advances from the dates popover
 *     to the guests popover (guest-first picker pattern). This matches
 *     the product decision that a first-time visitor's flow is always
 *     "dates → guests → search".
 *
 * Submission:
 *   Clicking the search button fires `onSearch(value)`. The parent owns
 *   URL building (via `buildBookingUrl` in a later iteration). Wiring to
 *   the real URL flow happens in Phase 3A/3B, not in Runda 1.
 */

import * as React from "react";
import { Search, Baby, Dog } from "lucide-react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "./primitives/Popover";
import { DateRangePicker } from "./DateRangePicker";
import { GuestPicker } from "./GuestPicker";
import {
  type BookingSearchCriteria,
  type BookingParty,
  effectiveGuests,
} from "@/lib/booking-params";

// ═══════════════════════════════════════════
// Types
// ═══════════════════════════════════════════

export type SearchBarVariant = "hero" | "compact";

/**
 * Which segments to render, in order.
 *
 * Currently `"when" | "guests"` — there is no `"where"` because Zielone
 * Wzgórza is a single property. When multi-property lands (separate phase),
 * `"where"` will be added as a deliberate API expansion with its own
 * content slot. Until then: YAGNI.
 */
export type SearchBarSegment = "when" | "guests";

export interface SearchBarProps {
  /** Variant controls scale, paddings, height. Logic is identical. */
  variant?: SearchBarVariant;
  /** Segments to show, in order. Default: ["when", "guests"]. */
  segments?: SearchBarSegment[];

  /** Controlled criteria. */
  value: BookingSearchCriteria;
  /** Called on every criteria change (dates, party). */
  onChange: (next: BookingSearchCriteria) => void;
  /**
   * Called when the user clicks the search button with the current
   * criteria. The parent is responsible for any validation & routing.
   */
  onSearch: (criteria: BookingSearchCriteria) => void;

  /** Whether the pets row is shown in the guest picker. Default true. */
  allowPets?: boolean;

  /**
   * If true, the submit button shows an icon only; otherwise it shows
   * an icon + the word "Szukaj". Default: hero → text+icon,
   * compact → icon only.
   */
  submitIconOnly?: boolean;

  /** Extra className merged onto the root. */
  className?: string;
}

// ═══════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════

function mergeClass(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/** Parse YYYY-MM-DD → local Date without UTC drift. */
function fromISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** "17 maj" — short display for a selected date in a pill segment. */
function formatDateShort(iso: string): string {
  return format(fromISO(iso), "d MMM", { locale: pl });
}

/**
 * Build a compact, visually-balanced guest summary.
 *
 * Layout: "N gości" as the primary text, optionally followed by small
 * icon+count chips for infants and pets. This stays legible even in a
 * narrow compact searchbar segment — unlike verbose phrasing like
 * "4 gości, 1 małe dziecko, 1 zwierzę" which overflows.
 *
 * Returns a ReactNode (not a string) so the caller can drop it straight
 * into JSX. `hasAnyGuests` should be checked externally before deciding
 * whether to show a placeholder.
 */
function summarizeGuests(party: BookingParty): React.ReactNode {
  const eff = effectiveGuests(party);
  const mainLabel = `${eff} ${pluralize(eff, "gość", "gości", "gości")}`;
  const showInfants = party.infants > 0;
  const showPets = party.pets > 0;

  if (!showInfants && !showPets) {
    return mainLabel;
  }

  return (
    <span className="eui-searchbar-guest-summary">
      <span>{mainLabel}</span>
      {showInfants && (
        <span
          className="eui-searchbar-guest-chip"
          aria-label={`${party.infants} ${pluralize(
            party.infants,
            "małe dziecko",
            "małe dzieci",
            "małych dzieci"
          )}`}
        >
          <Baby size={14} aria-hidden="true" />
          {party.infants}
        </span>
      )}
      {showPets && (
        <span
          className="eui-searchbar-guest-chip"
          aria-label={`${party.pets} ${pluralize(
            party.pets,
            "zwierzę",
            "zwierzęta",
            "zwierząt"
          )}`}
        >
          <Dog size={14} aria-hidden="true" />
          {party.pets}
        </span>
      )}
    </span>
  );
}

/**
 * Polish plural rules — three forms: singular (1), "few" (2–4 except 12–14),
 * "many" (0, 5+, 12–14). Minimal inline impl; if we need plurals elsewhere
 * we'll promote to src/lib/pl-plurals.ts.
 */
function pluralize(
  n: number,
  singular: string,
  few: string,
  many: string
): string {
  if (n === 1) return singular;
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

// ═══════════════════════════════════════════
// Component
// ═══════════════════════════════════════════

const DEFAULT_SEGMENTS: SearchBarSegment[] = ["when", "guests"];

export function SearchBar({
  variant = "hero",
  segments = DEFAULT_SEGMENTS,
  value,
  onChange,
  onSearch,
  allowPets = true,
  submitIconOnly,
  className,
}: SearchBarProps) {
  const [activeSegment, setActiveSegment] = React.useState<SearchBarSegment | null>(null);
  // `autoAdvanced` is true for exactly one render cycle after the user
  // completes a date range — it tells the guests popover to slide in from
  // the left instead of fading in. Cleared as soon as the popover closes.
  const [autoAdvanced, setAutoAdvanced] = React.useState(false);

  // Default submit mode by variant: hero shows text+icon, compact icon-only.
  const iconOnly = submitIconOnly ?? variant === "compact";

  // ── Derived BookingParty slice ──
  const party: BookingParty = {
    adults: value.adults,
    children: value.children,
    infants: value.infants,
    pets: value.pets,
  };

  // ── Handlers ──
  const handleDateChange = (next: { checkIn: string | null; checkOut: string | null }) => {
    onChange({
      ...value,
      checkIn: next.checkIn ?? "",
      checkOut: next.checkOut ?? "",
    });
  };

  const handleDateComplete = () => {
    // Auto-advance from dates to guests once a full range is picked.
    if (segments.includes("guests")) {
      setAutoAdvanced(true);
      setActiveSegment("guests");
    } else {
      setActiveSegment(null);
    }
  };

  const handlePartyChange = (nextParty: BookingParty) => {
    onChange({
      ...value,
      adults: nextParty.adults,
      children: nextParty.children,
      infants: nextParty.infants,
      pets: nextParty.pets,
    });
  };

  const handlePartyApply = () => {
    setActiveSegment(null);
    setAutoAdvanced(false);
  };

  const handleSubmit = () => {
    onSearch(value);
  };

  // ── Segment click (toggle) ──
  const handleSegmentClick = (seg: SearchBarSegment) => {
    setAutoAdvanced(false);
    setActiveSegment((current) => (current === seg ? null : seg));
  };

  // ── Popover open-change proxy ──
  // Each segment's popover is controlled. When Radix signals close
  // (e.g. ESC, outside click), we clear activeSegment.
  const popoverOpenFor = (seg: SearchBarSegment): [boolean, (open: boolean) => void] => [
    activeSegment === seg,
    (open) => setActiveSegment(open ? seg : activeSegment === seg ? null : activeSegment),
  ];

  // ── Dividers between segments (visible when neither neighbour is active/hovered) ──
  // We keep this simple: divider is visible when bar has no active segment AND
  // the two neighbouring segments aren't currently being interacted with.
  // CSS handles hover via :hover; here we toggle based on active state only.
  const dividerVisible = (leftSeg: SearchBarSegment, rightSeg: SearchBarSegment) => {
    return activeSegment !== leftSeg && activeSegment !== rightSeg;
  };

  // ── Segment renderers ──
  const renderWhen = () => {
    const hasDates = value.checkIn && value.checkOut;
    const displayValue = hasDates
      ? `${formatDateShort(value.checkIn)} – ${formatDateShort(value.checkOut)}`
      : value.checkIn
      ? `${formatDateShort(value.checkIn)} – …`
      : null;

    const [open, onOpenChange] = popoverOpenFor("when");

    return (
      <Popover open={open} onOpenChange={onOpenChange} key="when">
        <PopoverTrigger asChild>
          <button
            type="button"
            className={mergeClass(
              "eui-searchbar-segment",
              activeSegment === "when" && "eui-segment-active"
            )}
            onClick={() => handleSegmentClick("when")}
            aria-expanded={activeSegment === "when"}
            aria-label="Wybierz daty"
          >
            <span className="eui-searchbar-segment-label">Kiedy</span>
            <span
              className={mergeClass(
                "eui-searchbar-segment-value",
                !displayValue && "eui-placeholder"
              )}
            >
              {displayValue ?? "Wybierz termin"}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent size="large" align="start" side="bottom" sideOffset={12}>
          <DateRangePicker
            value={{
              checkIn: value.checkIn || null,
              checkOut: value.checkOut || null,
            }}
            onChange={handleDateChange}
            onComplete={handleDateComplete}
          />
        </PopoverContent>
      </Popover>
    );
  };

  const renderGuests = () => {
    const eff = effectiveGuests(party);
    const hasGuests = eff > 0;
    const displayValue = hasGuests ? summarizeGuests(party) : null;

    const [open, onOpenChange] = popoverOpenFor("guests");

    return (
      <Popover open={open} onOpenChange={onOpenChange} key="guests">
        <PopoverTrigger asChild>
          <button
            type="button"
            className={mergeClass(
              "eui-searchbar-segment",
              activeSegment === "guests" && "eui-segment-active"
            )}
            onClick={() => handleSegmentClick("guests")}
            aria-expanded={activeSegment === "guests"}
            aria-label="Wybierz gości"
          >
            <span className="eui-searchbar-segment-label">Kto</span>
            <span
              className={mergeClass(
                "eui-searchbar-segment-value",
                !displayValue && "eui-placeholder"
              )}
            >
              {displayValue ?? "Dodaj gości"}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent
          size="medium"
          align="end"
          side="bottom"
          sideOffset={12}
          className={autoAdvanced ? "eui-popover-slide-in" : undefined}
        >
          <GuestPicker
            value={party}
            onChange={handlePartyChange}
            onApply={handlePartyApply}
            allowPets={allowPets}
          />
        </PopoverContent>
      </Popover>
    );
  };

  // ── Compose segments ──
  const rendered: React.ReactNode[] = [];
  segments.forEach((seg, i) => {
    switch (seg) {
      case "when":
        rendered.push(renderWhen());
        break;
      case "guests":
        rendered.push(renderGuests());
        break;
    }
    // Insert divider between segments (not after the last one)
    if (i < segments.length - 1) {
      const nextSeg = segments[i + 1];
      rendered.push(
        <span
          key={`divider-${seg}-${nextSeg}`}
          className={mergeClass(
            "eui-searchbar-divider",
            !dividerVisible(seg, nextSeg) && "eui-divider-hidden"
          )}
          aria-hidden="true"
        />
      );
    }
  });

  const rootClass = mergeClass(
    "eui-searchbar",
    variant === "hero" ? "eui-variant-hero" : "eui-variant-compact",
    activeSegment !== null && "eui-searchbar-open",
    className
  );

  return (
    <div className={rootClass} role="search">
      {rendered}
      <button
        type="button"
        className={mergeClass(
          "eui-searchbar-submit",
          iconOnly && "eui-submit-compact"
        )}
        onClick={handleSubmit}
        aria-label="Szukaj"
      >
        <Search size={variant === "compact" ? 16 : 18} aria-hidden="true" />
        {/* Hero always renders the <span> (the CSS keeps it collapsed
            at max-width:0 and expands on hover — expand-on-hover affordance).
            Compact keeps the icon-only look, so the label is omitted. */}
        {variant === "hero" && <span>Szukaj</span>}
      </button>
    </div>
  );
}
