"use client";

/**
 * SearchBar — pill-shaped booking search bar (engine-ui)
 * ────────────────────────────────────────────────────────────────────────
 * A single component with two variants:
 *
 *   - variant="hero"    — 60px min-height, large hit targets, used on the
 *                         landing search page.
 *   - variant="compact" — 48px tall, used inside sticky navbars on
 *                         results / detail pages.
 *
 * Data contract:
 *   `value` is a `BookingSearchCriteria` discriminated union:
 *     - mode: "exact"    → checkIn, checkOut, party
 *     - mode: "flexible" → duration, month, party
 *
 *   ONE controlled value. ONE onChange. ONE onSearch.
 *   No local date state — mode is driven by value.mode.
 *
 * Segments:
 *   ["when", "guests"] — configurable via props. "when" opens DatePickerTabs
 *   which shows Dokładne/Elastyczne tabs. "guests" opens GuestPicker.
 *
 * Część 8.5a Stage 6 — minimal refactor (pill-shell preservation):
 *   The .eui-searchbar pill shell is tightly coupled with custom CSS that
 *   primitives cannot match without visual regression:
 *     - Submit button has CSS-driven width-expand animation on hover
 *       (selectors `.eui-searchbar-submit > svg` + `> span`), which depends
 *       on having icon and label as direct children — Button primitive wraps
 *       icon in an extra <span class="eui-button-icon-left"> that would break
 *       the selector.
 *     - Segments use align-self: stretch to fill the pill height; Pressable's
 *       press-scale and focus-ring would compete with the pill design.
 *     - Divider has a specific 32px height aligned to the pill; Divider
 *       primitive's stretch + grey-200 background would diverge.
 *
 *   Transitive benefits already achieved in 8.5a:
 *     - GuestPicker (Stage 4): primitives Inline/ActionRow/Button/SecondaryLink
 *     - Stepper (Stage 3): IconButton primitive
 *     - DatePickerTabs: unchanged (Q1 split scope — legacy peer)
 *
 *   Full pill-shell rebuild deferred to 8.5b along with PriceBlock / Modal /
 *   LegacyFavoriteButton legacy peers.
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
import { DatePickerTabs } from "./DatePickerTabs";
import { GuestPicker } from "./GuestPicker";
import {
  type BookingSearchCriteria,
  type BookingParty,
  type FlexibleDuration,
  effectiveGuests,
} from "@/lib/booking-params";

// ═══════════════════════════════════════════
// Types
// ═══════════════════════════════════════════

export type SearchBarVariant = "hero" | "compact";
export type SearchBarSegment = "when" | "guests";

export interface SearchBarProps {
  variant?: SearchBarVariant;
  segments?: SearchBarSegment[];
  value: BookingSearchCriteria;
  onChange: (next: BookingSearchCriteria) => void;
  onSearch: (criteria: BookingSearchCriteria) => void;
  allowPets?: boolean;
  /** URL to pet policy page. Passed to GuestPicker subtitle link. */
  petsPolicyHref?: string;
  submitIconOnly?: boolean;
  className?: string;
}

// ═══════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════

function mergeClass(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function fromISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatDateShort(iso: string): string {
  return format(fromISO(iso), "d MMM", { locale: pl });
}

const DURATION_LABELS: Record<FlexibleDuration, string> = {
  weekend: "Weekend",
  "5days": "5 dni",
  week: "Tydzień",
};

function formatFlexible(duration: FlexibleDuration, month: string): string | null {
  const dur = DURATION_LABELS[duration];
  if (!month) return dur;
  const [y, m] = month.split("-").map(Number);
  const monthName = format(new Date(y, m - 1, 1), "LLL yyyy", { locale: pl });
  return `${dur} · ${monthName}`;
}

function getParty(c: BookingSearchCriteria): BookingParty {
  return { adults: c.adults, children: c.children, infants: c.infants, pets: c.pets };
}

function summarizeGuests(party: BookingParty): React.ReactNode {
  const eff = effectiveGuests(party);
  const mainLabel = `${eff} ${pluralize(eff, "gość", "gości", "gości")}`;
  const showInfants = party.infants > 0;
  const showPets = party.pets > 0;

  if (!showInfants && !showPets) return mainLabel;

  return (
    <span className="eui-searchbar-guest-summary">
      <span>{mainLabel}</span>
      {showInfants && (
        <span className="eui-searchbar-guest-chip" aria-label={`${party.infants} ${pluralize(party.infants, "małe dziecko", "małe dzieci", "małych dzieci")}`}>
          <Baby size={14} aria-hidden="true" />
          {party.infants}
        </span>
      )}
      {showPets && (
        <span className="eui-searchbar-guest-chip" aria-label={`${party.pets} ${pluralize(party.pets, "zwierzę", "zwierzęta", "zwierząt")}`}>
          <Dog size={14} aria-hidden="true" />
          {party.pets}
        </span>
      )}
    </span>
  );
}

function pluralize(n: number, singular: string, few: string, many: string): string {
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
  petsPolicyHref,
  submitIconOnly,
  className,
}: SearchBarProps) {
  const [activeSegment, setActiveSegment] = React.useState<SearchBarSegment | null>(null);
  const [autoAdvanced, setAutoAdvanced] = React.useState(false);

  const iconOnly = submitIconOnly ?? variant === "compact";
  const party = getParty(value);

  // ── Handlers ──
  const handleDatePickerChange = (next: BookingSearchCriteria) => {
    onChange(next);
  };

  const handleDateComplete = () => {
    if (segments.includes("guests")) {
      setAutoAdvanced(true);
      setActiveSegment("guests");
    } else {
      setActiveSegment(null);
    }
  };

  const handlePartyChange = (nextParty: BookingParty) => {
    if (value.mode === "exact") {
      onChange({ ...value, ...nextParty });
    } else {
      onChange({ ...value, ...nextParty });
    }
  };

  const handlePartyApply = () => {
    setActiveSegment(null);
    setAutoAdvanced(false);
  };

  const handleSubmit = () => {
    // Guard: don't submit incomplete criteria — nudge the user instead.
    if (value.mode === "exact" && (!value.checkIn || !value.checkOut)) {
      setActiveSegment("when");
      return;
    }
    if (value.mode === "flexible" && !value.month) {
      setActiveSegment("when");
      return;
    }
    onSearch(value);
  };

  const handleSegmentClick = (seg: SearchBarSegment) => {
    setAutoAdvanced(false);
    setActiveSegment((current) => (current === seg ? null : seg));
  };

  const popoverOpenFor = (seg: SearchBarSegment): [boolean, (open: boolean) => void] => [
    activeSegment === seg,
    (open) => setActiveSegment(open ? seg : activeSegment === seg ? null : activeSegment),
  ];

  const dividerVisible = (leftSeg: SearchBarSegment, rightSeg: SearchBarSegment) => {
    return activeSegment !== leftSeg && activeSegment !== rightSeg;
  };

  // ── Segment: When ──
  const renderWhen = () => {
    let displayValue: string | null = null;
    if (value.mode === "exact") {
      const hasDates = value.checkIn && value.checkOut;
      displayValue = hasDates
        ? `${formatDateShort(value.checkIn)} – ${formatDateShort(value.checkOut)}`
        : value.checkIn
        ? `${formatDateShort(value.checkIn)} – …`
        : null;
    } else {
      displayValue = formatFlexible(value.duration, value.month);
    }

    const [open, onOpenChange] = popoverOpenFor("when");

    return (
      <Popover open={open} onOpenChange={onOpenChange} key="when">
        <PopoverTrigger asChild>
          <button
            type="button"
            className={mergeClass("eui-searchbar-segment", activeSegment === "when" && "eui-segment-active")}
            onClick={() => handleSegmentClick("when")}
            aria-expanded={activeSegment === "when"}
            aria-label="Wybierz daty"
          >
            <span className="eui-searchbar-segment-label">Kiedy</span>
            <span className={mergeClass("eui-searchbar-segment-value", !displayValue && "eui-placeholder")}>
              {displayValue ?? "Wybierz termin"}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent size="large" align="start" side="bottom" sideOffset={12}>
          <DatePickerTabs
            value={value}
            onChange={handleDatePickerChange}
            onExactComplete={handleDateComplete}
          />
        </PopoverContent>
      </Popover>
    );
  };

  // ── Segment: Guests ──
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
            className={mergeClass("eui-searchbar-segment", activeSegment === "guests" && "eui-segment-active")}
            onClick={() => handleSegmentClick("guests")}
            aria-expanded={activeSegment === "guests"}
            aria-label="Wybierz gości"
          >
            <span className="eui-searchbar-segment-label">Kto</span>
            <span className={mergeClass("eui-searchbar-segment-value", !displayValue && "eui-placeholder")}>
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
            petsPolicyHref={petsPolicyHref}
          />
        </PopoverContent>
      </Popover>
    );
  };

  // ── Compose segments ──
  const rendered: React.ReactNode[] = [];
  segments.forEach((seg, i) => {
    switch (seg) {
      case "when": rendered.push(renderWhen()); break;
      case "guests": rendered.push(renderGuests()); break;
    }
    if (i < segments.length - 1) {
      const nextSeg = segments[i + 1];
      rendered.push(
        <span
          key={`divider-${seg}-${nextSeg}`}
          className={mergeClass("eui-searchbar-divider", !dividerVisible(seg, nextSeg) && "eui-divider-hidden")}
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
        className={mergeClass("eui-searchbar-submit", iconOnly && "eui-submit-compact")}
        onClick={handleSubmit}
        aria-label="Szukaj"
      >
        <Search size={variant === "compact" ? 16 : 18} aria-hidden="true" />
        {variant === "hero" && <span>Szukaj</span>}
      </button>
    </div>
  );
}
