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
export {
  SegmentedControl,
  type SegmentedControlProps,
  type SegmentedControlOption,
} from "./SegmentedControl";

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
  FlexibleDatePicker,
  type FlexibleDatePickerProps,
  type FlexibleDateSelection,
} from "./FlexibleDatePicker";

export {
  DatePickerTabs,
  type DatePickerTabsProps,
} from "./DatePickerTabs";

export {
  SearchBar,
  type SearchBarProps,
  type SearchBarVariant,
  type SearchBarSegment,
} from "./SearchBar";

// ── Results layer ──────────────────────────────────────────────
export {
  type AvailabilityStatus,
  type AvailabilityInfo,
  type PriceInfo,
  type FeatureIconName,
  type FeatureChip,
  type ResultImage,
  type ResultCardData,
  type ResultsListData,
  type ResultRating,
  type AmenityItem,
  type AmenityCategory,
} from "./results-types";

export {
  AvailabilityBadge,
  type AvailabilityBadgeProps,
} from "./AvailabilityBadge";

export {
  PriceBlock,
  type PriceBlockProps,
} from "./PriceBlock";

export {
  FeatureChips,
  type FeatureChipsProps,
} from "./FeatureChips";

export {
  ImageCarousel,
  type ImageCarouselProps,
} from "./ImageCarousel";

// FavoriteButton moved to ./button

export {
  Modal,
  type ModalProps,
} from "./Modal";

export {
  ResultCard,
  type ResultCardProps,
} from "./ResultCard";

export {
  ResultsHeader,
  type ResultsHeaderProps,
} from "./ResultsHeader";

export {
  ResultsEmptyState,
  type ResultsEmptyStateProps,
} from "./ResultsEmptyState";

export {
  ResultsSkeleton,
  type ResultsSkeletonProps,
} from "./ResultsSkeleton";

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
  type ExactSearchCriteria,
  type FlexibleSearchCriteria,
  type DateRange,
  DEFAULT_BOOKING_PARTY,
  DEFAULT_SEARCH_CRITERIA,
  effectiveGuests,
  isFlexibleDuration,
  isValidYearMonth,
  parseFlexibleDuration,
} from "@/lib/booking-params";

// ── Foundation: tokens ────────────────────────────────────────────
export * from "./tokens";

// ── Foundation: hooks ─────────────────────────────────────────────
export {
  useFocusVisible,
  usePress,
  useHover,
  useReducedMotion,
  useKeyboardShortcut,
  useFocusTrap,
} from "./hooks";

// ── Foundation: a11y ──────────────────────────────────────────────
export { VisuallyHidden } from "./a11y/VisuallyHidden";
export { mergeRefs } from "./a11y/mergeRefs";

// ── Foundation: interaction ───────────────────────────────────────
export { Pressable } from "./interaction/Pressable";
export type { PressableProps, PressableState } from "./interaction/Pressable";

// ── Button Foundation ─────────────────────────────────────────────
export {
  Button,
  type ButtonProps,
  type ButtonVariant,
  type ButtonSize,
  type ButtonShape,
  BUTTON_DIMENSIONS,
  IconButton,
  type IconButtonProps,
  type IconButtonVariant,
  type IconButtonSize,
  type IconButtonShape,
  ICON_BUTTON_DIMENSIONS,
  ButtonGroup,
  ToggleButton,
  type ButtonGroupProps,
  type ButtonGroupVariant,
  type ToggleButtonProps,
  CloseButton,
  type CloseButtonProps,
  BackButton,
  type BackButtonProps,
  FavoriteButton,
  type FavoriteButtonProps,
  ShareButton,
  type ShareButtonProps,
} from "./button";

// ── Part 3 — Surface ──────────────────────────────────────────
export {
  CardSurface, type CardSurfaceProps,
  PanelSurface, type PanelSurfaceProps,
  ScrollFade, type ScrollFadeProps,
} from "./surface";

// ── Part 3 — Overlay ──────────────────────────────────────────
export {
  Backdrop, type BackdropProps,
  DragHandle, type DragHandleProps,
  SheetHeader, type SheetHeaderProps,
  SheetFooter, type SheetFooterProps,
  BottomSheet, type BottomSheetProps,
} from "./overlay";

// ── Part 4 — Nav Micro ────────────────────────────────────────
export {
  Chevron, type ChevronProps,
  NavigationArrow, type NavigationArrowProps,
  PaginationDot, type PaginationDotProps,
  TabTrigger, type TabTriggerProps,
  SortTrigger, type SortTriggerProps, type SortDirection,
} from "./nav";

// ── Part 5 — Chip / Tag / Badge / Status ───────────────────────
export {
  Chip, type ChipProps, type ChipVariant, type ChipSize,
  FilterChip, type FilterChipProps,
  Tag, type TagProps, type TagVariant,
  Badge, type BadgeProps, type BadgeVariant, type BadgeSize, type BadgeShape,
  TinyBadge, type TinyBadgeProps, type TinyBadgeVariant,
  StatusDot, type StatusDotProps, type StatusDotVariant,
  RatingPill, type RatingPillProps,
  InlineBadge, type InlineBadgeProps, type InlineBadgeVariant,
} from "./chip";

// ── Part 6 — Typography + Text Meta ────────────────────────────
export {
  Text, type TextProps, type TextVariant, type TextColor, type TextElement,
  SecondaryLink, type SecondaryLinkProps,
  HelperText, type HelperTextProps, type HelperTextVariant,
  MetaText, type MetaTextProps,
  InlineMeta, type InlineMetaProps,
  Eyebrow, type EyebrowProps,
  SectionHeading, type SectionHeadingProps,
  PriceText, type PriceTextProps,
  EmptyStateText, type EmptyStateTextProps,
} from "./text";

// ── Part 7 — Layout + Action ────────────────────────────────────
export {
  // Helper
  gapToVar, type GapSize,
  // Layout primitives
  Stack, type StackProps,
  Inline, type InlineProps,
  Spacer, type SpacerProps,
  Divider, type DividerProps,
  // Action wrappers
  ActionRow, type ActionRowProps,
  Toolbar, type ToolbarProps,
  InlineActions, type InlineActionsProps,
  SectionBlock, type SectionBlockProps,
  StickyBar, type StickyBarProps,
} from "./layout";
