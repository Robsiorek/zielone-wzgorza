/**
 * cx — lightweight className joiner for Engine UI.
 *
 * GOVERNANCE (Stage 2): jedno wspólne źródło zamiast 5× lokalnego
 * `mergeClass` (DateRangePicker / Stepper / SearchBar / PopoverItem /
 * GuestPicker). Engine UI używa stabilnych `.eui-*` klas — NIE Tailwind
 * utilities — więc świadomie NIE `cn()`/twMerge (twMerge dedupuje tylko
 * rozpoznane klasy Tailwind, tu zbędny narzut). Czysty filter+join.
 */
export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}
