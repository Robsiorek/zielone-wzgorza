/**
 * B2: Bed types — typed vocabulary.
 *
 * Source of truth in code (B0.6 pattern).
 * Adding a new bed type = code change, not DB migration.
 * Runtime validation in API: isValidBedType().
 */

export const BED_TYPES = {
  SINGLE:   { label: "Łóżko pojedyncze",    icon: "bed-single" },
  DOUBLE:   { label: "Łóżko podwójne",      icon: "bed-double" },
  QUEEN:    { label: "Łóżko queen",         icon: "bed-double" },
  KING:     { label: "Łóżko king",          icon: "bed-double" },
  BUNK:     { label: "Łóżko piętrowe",      icon: "bunk-bed" },
  SOFA_BED: { label: "Sofa rozkładana",     icon: "sofa" },
  BABY_COT: { label: "Łóżeczko dziecięce", icon: "baby" },
} as const;

export type BedType = keyof typeof BED_TYPES;

/** All valid bed type keys */
export const BED_TYPE_KEYS = Object.keys(BED_TYPES) as BedType[];

/** Runtime validation — checks if a string is a valid BedType */
export function isValidBedType(value: string): value is BedType {
  return value in BED_TYPES;
}

/** Get label for a bed type (safe — returns key if unknown) */
export function getBedTypeLabel(bedType: string): string {
  if (isValidBedType(bedType)) {
    return BED_TYPES[bedType].label;
  }
  return bedType;
}
