// Shared addon types and computation helper
// Used by use-unified-form.ts and addon UI components
//
// C1a: All monetary values are in minor units (grosze, Int).
// Use formatMoneyMinor() from @/lib/format for display.

export type AddonPricingType = "PER_BOOKING" | "PER_NIGHT" | "PER_PERSON" | "PER_PERSON_NIGHT" | "PER_UNIT";
export type AddonSelectType = "CHECKBOX" | "QUANTITY" | "SELECT";
export type AddonScope = "GLOBAL" | "PER_ITEM";

export interface AddonOption {
  id: string;
  name: string;
  description: string | null;
  scope: AddonScope;
  pricingType: AddonPricingType;
  /** Cena katalogowa w groszach */
  priceMinor: number;
  selectType: AddonSelectType;
  isRequired: boolean;
}

export interface SelectedAddon {
  addonId: string;
  name: string;
  pricingType: AddonPricingType;
  selectType: AddonSelectType;
  isRequired: boolean;
  // Editable calculation fields (prefilled on add, then manual override)
  /** Cena jednostkowa w groszach */
  unitPriceMinor: number;
  calcPersons: number;
  calcNights: number;
  calcQuantity: number;
}

/** Pure computation — returns total in minor units (grosze) */
export function computeAddonTotal(addon: SelectedAddon): number {
  switch (addon.pricingType) {
    case "PER_BOOKING":
      return addon.unitPriceMinor * addon.calcQuantity;
    case "PER_NIGHT":
      return addon.unitPriceMinor * addon.calcNights * addon.calcQuantity;
    case "PER_PERSON":
      return addon.unitPriceMinor * addon.calcPersons * addon.calcQuantity;
    case "PER_PERSON_NIGHT":
      return addon.unitPriceMinor * addon.calcPersons * addon.calcNights * addon.calcQuantity;
    case "PER_UNIT":
      return addon.unitPriceMinor * addon.calcQuantity;
    default:
      return addon.unitPriceMinor * addon.calcQuantity;
  }
}

/** Create a SelectedAddon with prefilled values (one-time, at add moment) */
export function createSelectedAddon(
  addon: AddonOption,
  persons: number,
  nights: number,
): SelectedAddon {
  // calcQuantity = "ile sztuk" — for PER_NIGHT and PER_PERSON it's always 1,
  // because calcNights and calcPersons already carry the multipliers
  const calcQuantity = 1;

  return {
    addonId: addon.id,
    name: addon.name,
    pricingType: addon.pricingType,
    selectType: addon.selectType,
    isRequired: addon.isRequired,
    unitPriceMinor: addon.priceMinor,
    calcPersons: persons,
    calcNights: nights,
    calcQuantity,
  };
}

/** Labels for pricing types */
export const PRICING_TYPE_LABELS: Record<AddonPricingType, string> = {
  PER_BOOKING: "jednorazowy",
  PER_NIGHT: "za noc",
  PER_PERSON: "za osobę",
  PER_PERSON_NIGHT: "za osobę/noc",
  PER_UNIT: "za sztukę",
};

export const PRICING_TYPE_LABELS_PER_ITEM: Record<AddonPricingType, string> = {
  PER_BOOKING: "jednorazowo na zasób",
  PER_NIGHT: "za noc",
  PER_PERSON: "za osobę",
  PER_PERSON_NIGHT: "za osobę/noc",
  PER_UNIT: "za sztukę",
};

/** Which fields are visible/editable per pricing type */
export function getEditableFields(pricingType: AddonPricingType): {
  showPersons: boolean;
  showNights: boolean;
  showQuantity: boolean;
} {
  switch (pricingType) {
    case "PER_BOOKING": return { showPersons: false, showNights: false, showQuantity: false };
    case "PER_NIGHT": return { showPersons: false, showNights: true, showQuantity: false };
    case "PER_PERSON": return { showPersons: true, showNights: false, showQuantity: false };
    case "PER_PERSON_NIGHT": return { showPersons: true, showNights: true, showQuantity: false };
    case "PER_UNIT": return { showPersons: false, showNights: false, showQuantity: true };
    default: return { showPersons: false, showNights: false, showQuantity: false };
  }
}
