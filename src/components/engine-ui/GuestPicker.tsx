"use client";

/**
 * GuestPicker — booking party picker (engine-ui)
 * ────────────────────────────────────────────────────────────────────────
 * Four-category picker: adults, children, infants, pets. Designed to live
 * inside a Popover opened from a SearchBar segment.
 *
 * API shape (handoff §5.5):
 *   Works on a VALUE OBJECT (`BookingParty`), not on individual setters.
 *   The parent owns one `value` and one `onChange` — no scattered
 *   `{ adults, setAdults, children, setChildren, … }` props.
 *
 * Commit model (corrected per ChatGPT review):
 *   Internally the picker holds a DRAFT copy of the party. Category
 *   steppers mutate the draft only — no propagation to the parent while
 *   the user is adjusting counts.
 *
 *   - "Zastosuj" is the SINGLE commit surface: it calls `onChange(draft)`
 *     and `onApply()` (parent typically closes the popover).
 *   - "Wyczyść" resets the DRAFT to a sensible minimum (adults=1, rest=0)
 *     but does NOT commit to the parent. The user can keep adjusting after
 *     a reset — only Apply propagates.
 *
 *   Symmetric, unambiguous: parent state only ever changes via Apply.
 *
 *   When `value` changes from the outside (parent committed something
 *   elsewhere), the draft resyncs.
 *
 * Semantics:
 *   - adults  — 13+, min 1
 *   - children — 2–12
 *   - infants  — under 2, not counted toward capacity
 *   - pets     — traveling pets; the row is HIDDEN when `allowPets === false`
 *     (resource-level policy), rather than shown-but-disabled, because a
 *     disabled-but-visible row would suggest future availability.
 *
 * Accessibility:
 *   - Each category is a `<Stepper>` with its own aria-label.
 *   - "Wyczyść" is a real <button>, not a link, so it's keyboard-reachable.
 *   - The footer uses a real <button type="button"> for Apply.
 *   - Focus order: adults → children → infants → pets → Wyczyść → Zastosuj.
 */

import * as React from "react";
import { User, Users, Baby, Dog } from "lucide-react";
import { Stepper } from "./Stepper";
import {
  type BookingParty,
} from "@/lib/booking-params";

// ═══════════════════════════════════════════
// Constants (product rules)
// ═══════════════════════════════════════════

/** Lower bound for adults — a booking always needs at least one adult. */
const MIN_ADULTS = 1;

/** Default upper bounds — can be overridden per-call via props. */
const DEFAULT_MAX_ADULTS = 16;
const DEFAULT_MAX_CHILDREN = 10;
const DEFAULT_MAX_INFANTS = 5;
const DEFAULT_MAX_PETS = 3;

/** The "empty" state of the picker — matches DEFAULT_BOOKING_PARTY
 * except for adults=1 (the minimum a real booking allows). "Clear" is
 * not the same as "never touched", hence a local constant.
 */
const CLEARED_PARTY: BookingParty = {
  adults: MIN_ADULTS,
  children: 0,
  infants: 0,
  pets: 0,
};

// ═══════════════════════════════════════════
// Props
// ═══════════════════════════════════════════

export interface GuestPickerProps {
  /** Current committed party (controlled from the parent). */
  value: BookingParty;
  /** Called with the new party when the user commits (Apply / Clear). */
  onChange: (next: BookingParty) => void;
  /** Called after a successful Apply — parent typically closes the popover. */
  onApply?: () => void;

  /** Per-category ceilings. Defaults: 16 / 10 / 5 / 3. */
  maxAdults?: number;
  maxChildren?: number;
  maxInfants?: number;
  maxPets?: number;

  /**
   * Whether the "pets" row is shown at all.
   * Defaults to `true`. Set to `false` at the resource level when the
   * property doesn't accept pets — the row is removed from the DOM so
   * the user doesn't get misled about availability.
   */
  allowPets?: boolean;

  /**
   * URL to the property's pet-policy page. When present, the "pets" row's
   * subtitle links there instead of being static text. In the ZW context
   * this points to the "Warunki pobytu ze zwierzęciem" article.
   */
  petsPolicyHref?: string;

  /** Extra className merged onto the root. */
  className?: string;
}

// ═══════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════

function areEqual(a: BookingParty, b: BookingParty): boolean {
  return (
    a.adults === b.adults &&
    a.children === b.children &&
    a.infants === b.infants &&
    a.pets === b.pets
  );
}

function mergeClass(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

// ═══════════════════════════════════════════
// Component
// ═══════════════════════════════════════════

export function GuestPicker({
  value,
  onChange,
  onApply,
  maxAdults = DEFAULT_MAX_ADULTS,
  maxChildren = DEFAULT_MAX_CHILDREN,
  maxInfants = DEFAULT_MAX_INFANTS,
  maxPets = DEFAULT_MAX_PETS,
  allowPets = true,
  petsPolicyHref,
  className,
}: GuestPickerProps) {
  // ── Draft state: resyncs when the parent commits a new value ──
  const [draft, setDraft] = React.useState<BookingParty>(value);

  // If the parent changes `value` (e.g. committed elsewhere), mirror it
  // into the draft. Equality check prevents a re-render loop when our
  // own onChange triggers a parent update that loops back.
  React.useEffect(() => {
    setDraft((prev) => (areEqual(prev, value) ? prev : value));
  }, [value]);

  const setField = (field: keyof BookingParty) => (next: number) => {
    setDraft((prev) => ({ ...prev, [field]: next }));
  };

  /**
   * "Wyczyść" resets the DRAFT only — it does NOT commit to the parent.
   *
   * Rationale: "Zastosuj" must be the single commit surface in this
   * component. If Clear also committed, the model would be inconsistent
   * ("Zastosuj" closes the popover, "Wyczyść" doesn't — but both update
   * the parent). Keeping Clear local means users can reset → keep
   * adjusting → only Apply propagates. That matches how Airbnb's guest
   * picker behaves.
   */
  const handleClear = () => {
    const cleared = allowPets
      ? CLEARED_PARTY
      : { ...CLEARED_PARTY, pets: 0 };
    setDraft(cleared);
  };

  const handleApply = () => {
    onChange(draft);
    onApply?.();
  };

  const rootClass = mergeClass("eui-guestpicker", className);

  // Pre-compute rows so JSX stays tidy.
  const rows: Array<{
    key: keyof BookingParty;
    title: string;
    subtitle: string;
    subtitleHref?: string;
    min: number;
    max: number;
    label: string;
    icon: React.ReactNode;
  }> = [
    {
      key: "adults",
      title: "Dorośli",
      subtitle: "Od 13 lat",
      min: MIN_ADULTS,
      max: maxAdults,
      label: "Liczba dorosłych",
      icon: <User size={20} aria-hidden="true" />,
    },
    {
      key: "children",
      title: "Dzieci",
      subtitle: "Od 2 do 12 lat",
      min: 0,
      max: maxChildren,
      label: "Liczba dzieci",
      icon: <Users size={20} aria-hidden="true" />,
    },
    {
      key: "infants",
      title: "Małe dzieci",
      subtitle: "Poniżej 2 lat",
      min: 0,
      max: maxInfants,
      label: "Liczba małych dzieci",
      icon: <Baby size={20} aria-hidden="true" />,
    },
  ];

  if (allowPets) {
    rows.push({
      key: "pets",
      title: "Zwierzęta",
      subtitle: "Warunki pobytu ze zwierzęciem",
      subtitleHref: petsPolicyHref,
      min: 0,
      max: maxPets,
      label: "Liczba zwierząt",
      icon: <Dog size={20} aria-hidden="true" />,
    });
  }

  return (
    <div className={rootClass}>
      {rows.map((row) => (
        <div key={row.key} className="eui-guestpicker-row">
          <div className="eui-guestpicker-icon" aria-hidden="true">
            {row.icon}
          </div>
          <div className="eui-guestpicker-label">
            <span className="eui-guestpicker-title">{row.title}</span>
            {row.subtitleHref ? (
              <a
                className="eui-guestpicker-subtitle eui-guestpicker-subtitle-link"
                href={row.subtitleHref}
                target="_blank"
                rel="noopener noreferrer"
              >
                {row.subtitle}
              </a>
            ) : (
              <span className="eui-guestpicker-subtitle">{row.subtitle}</span>
            )}
          </div>
          <Stepper
            value={draft[row.key]}
            min={row.min}
            max={row.max}
            onChange={setField(row.key)}
            label={row.label}
          />
        </div>
      ))}

      <div className="eui-guestpicker-footer">
        <button
          type="button"
          className="eui-guestpicker-link"
          onClick={handleClear}
        >
          Wyczyść
        </button>
        <button
          type="button"
          className="eui-guestpicker-apply"
          onClick={handleApply}
        >
          Zastosuj
        </button>
      </div>
    </div>
  );
}
