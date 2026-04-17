/**
 * engine-ui — public barrel
 * ────────────────────────────────────────────────────────────────────────
 * Single import point for engine-ui consumers. Created AFTER primitives
 * and domain components closed (ChatGPT correction #8) — so the barrel
 * cannot accidentally paper over inconsistent APIs or hidden coupling.
 *
 * Import discipline (enforced by this barrel):
 *   - Named exports only. No default exports anywhere.
 *   - Each component is also reachable via its direct path
 *     (`@/components/engine-ui/Stepper`) — the barrel doesn't replace
 *     deep imports, it adds a convenience.
 *   - Types are re-exported alongside components so callers don't have
 *     to know internal file layout.
 *
 * Example:
 *   import {
 *     SearchBar,
 *     GuestPicker,
 *     DateRangePicker,
 *     Popover,
 *     PopoverContent,
 *     PopoverTrigger,
 *     Stepper,
 *     PopoverItem,
 *     useWidgetTheme,
 *     type BookingParty,  // re-exported from @/lib/booking-params
 *   } from "@/components/engine-ui";
 */

// ── Primitives ────────────────────────────────────────────────
export {
  Popover,
  PopoverTrigger,
  PopoverAnchor,
  PopoverClose,
  PopoverPortal,
  PopoverContent,
  type PopoverProps,
  type PopoverTriggerProps,
  type PopoverAnchorProps,
  type PopoverCloseProps,
  type PopoverPortalProps,
  type PopoverContentProps,
  type PopoverSize,
} from "./primitives/Popover";

// ── System components ─────────────────────────────────────────
export { PopoverItem, type PopoverItemProps } from "./PopoverItem";
export { Stepper, type StepperProps, type StepperSize } from "./Stepper";

// ── Domain components ─────────────────────────────────────────
export {
  GuestPicker,
  type GuestPickerProps,
} from "./GuestPicker";

export {
  DateRangePicker,
  type DateRangePickerProps,
} from "./DateRangePicker";

export {
  SearchBar,
  type SearchBarProps,
  type SearchBarVariant,
  type SearchBarSegment,
} from "./SearchBar";

// ── Hooks ──────────────────────────────────────────────────────
export {
  useWidgetTheme,
  hexToHSL,
  applyThemeToElement,
  type WidgetTheme,
  type WidgetThemeColors,
  type UseWidgetThemeResult,
  type UseWidgetThemeOptions,
} from "./hooks/useWidgetTheme";

// ── Re-exports from @/lib/booking-params ──────────────────────
// These types/helpers are the domain contract engine-ui components
// operate on; making them reachable from the same barrel keeps imports
// tidy at call sites (SearchBar, GuestPicker, future EngineShell).
//
// Naming discipline (ChatGPT correction #4):
//   - BookingParty            — guest composition only
//   - BookingSearchCriteria   — dates + party
//   - DateRange               — dates only
// Each domain component consumes exactly one of these; never mixed.
export {
  type BookingParty,
  type BookingSearchCriteria,
  type DateRange,
  DEFAULT_BOOKING_PARTY,
  effectiveGuests,
} from "@/lib/booking-params";
