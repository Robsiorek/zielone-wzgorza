/**
 * Pricing Engine — per-day price resolution with RatePlan inheritance.
 *
 * E1: Source of truth = PriceEntry(variantId, ratePlanId, date).
 * Season = label + generator, NOT price selector.
 * All amounts in minor units (grosze). Zero floats. Percentages in bps (basis points).
 *
 * Fallback chain per night:
 *   1. PriceEntry(variantId, ratePlanId, date=specific)
 *   2. PriceEntry(variantId, ratePlanId, date=null) — default price entry
 *   3. ResourceVariant.basePriceMinor
 *   4. 0 (free — with warning)
 *
 * RatePlan inheritance: child applies modifier to parent price.
 *   Max depth: 3. Cycle detection via Set.
 *   PERCENTAGE: parentPrice * modifierValue / 10000 (bps, can be negative)
 *   FIXED: parentPrice + modifierValueMinor (can be negative, floor = 0)
 */

import { createHash } from "crypto";

// ══════════════════════════════════════════════════════════════════════
// Types
// ══════════════════════════════════════════════════════════════════════

export interface QuoteInput {
  checkIn: string;    // YYYY-MM-DD
  checkOut: string;   // YYYY-MM-DD
  items: QuoteItemInput[];
  addons?: QuoteAddonInput[];
  promoCode?: string;
}

export interface QuoteItemInput {
  variantId: string;
  adults?: number;
  children?: number;
}

export interface QuoteAddonInput {
  addonId: string;
  quantity: number;
}

export interface QuoteResult {
  items: QuoteItemResult[];
  addons: QuoteAddonResult[];
  subtotalMinor: number;
  discount: QuoteDiscount | null;
  totalMinor: number;
  depositMinor: number;
  depositPercent: number;
  cancellationPolicy: string;
  nights: number;
  checkIn: string;
  checkOut: string;
  errors: string[];
  warnings: string[];
}

export interface QuoteItemResult {
  variantId: string;
  variantName: string;
  resourceName: string;
  resourceId: string;
  capacity: number;
  nights: number;
  priceBreakdown: NightPrice[];
  totalMinor: number;
  ratePlanId: string;
  ratePlanName: string;
}

export interface NightPrice {
  date: string;           // YYYY-MM-DD
  priceMinor: number;
  seasonName: string | null;
  source: "price_entry" | "default_entry" | "base_price" | "free";
}

export interface QuoteAddonResult {
  addonId: string;
  name: string;
  pricingType: string;
  unitPriceMinor: number;
  quantity: number;
  totalMinor: number;
}

export interface QuoteDiscount {
  code: string;
  type: "PERCENTAGE" | "FIXED";
  value: number;        // percent or minor amount
  amountMinor: number;  // calculated discount in grosze
}

// ══════════════════════════════════════════════════════════════════════
// Canonical JSON + Hash
// ══════════════════════════════════════════════════════════════════════

function sortKeys(obj: any): any {
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(sortKeys);
  return Object.keys(obj).sort().reduce((acc: any, key) => {
    acc[key] = sortKeys(obj[key]);
    return acc;
  }, {});
}

export function canonicalJson(obj: any): string {
  return JSON.stringify(sortKeys(obj));
}

export function hashPayload(payload: any): string {
  return createHash("sha256").update(canonicalJson(payload)).digest("hex");
}

// ══════════════════════════════════════════════════════════════════════
// Date helpers
// ══════════════════════════════════════════════════════════════════════

/** Get array of night dates: checkIn inclusive, checkOut exclusive */
export function getNightDates(checkIn: string, checkOut: string): string[] {
  const dates: string[] = [];
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const cursor = new Date(start);
  while (cursor < end) {
    dates.push(cursor.toISOString().split("T")[0]);
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

// ══════════════════════════════════════════════════════════════════════
// Price resolution (per night per variant)
// ══════════════════════════════════════════════════════════════════════

interface PriceEntryRow {
  variantId: string;
  ratePlanId: string;
  seasonId: string | null;
  date: Date | null;
  priceMinor: number;
}

interface SeasonRow {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  priority: number;
}

interface RatePlanRow {
  id: string;
  name: string;
  isDefault: boolean;
  parentId: string | null;
  modifierType: string | null;
  modifierValue: number | null;      // Decimal → number (percent in bps)
  modifierValueMinor: number | null;  // grosze for FIXED
  cancellationPolicy: string;
}

interface VariantRow {
  id: string;
  name: string;
  resourceId: string;
  resource: { id: string; name: string; categoryId: string; category?: { type: string } };
  capacity: number;
  basePriceMinor: number | null;
}

const MAX_INHERITANCE_DEPTH = 3;

/**
 * Resolve price for one variant for one night.
 *
 * Uses pre-loaded data (no DB calls inside).
 */
function resolveNightPrice(
  variantId: string,
  ratePlanId: string,
  date: string,
  priceEntries: PriceEntryRow[],
  seasons: SeasonRow[],
  ratePlans: Map<string, RatePlanRow>,
  variants: Map<string, VariantRow>,
  warnings: string[],
): NightPrice {
  const dateObj = new Date(date);

  // Find season for this date (highest priority)
  const matchingSeason = seasons
    .filter(s => dateObj >= s.startDate && dateObj <= s.endDate)
    .sort((a, b) => b.priority - a.priority)[0] || null;

  // 1. Try PriceEntry(variantId, ratePlanId, date=specific)
  const specificEntry = priceEntries.find(pe =>
    pe.variantId === variantId &&
    pe.ratePlanId === ratePlanId &&
    pe.date && pe.date.toISOString().split("T")[0] === date
  );
  if (specificEntry) {
    return { date, priceMinor: specificEntry.priceMinor, seasonName: matchingSeason?.name || null, source: "price_entry" };
  }

  // 2. Try PriceEntry(variantId, ratePlanId, date=null) — default entry
  const defaultEntry = priceEntries.find(pe =>
    pe.variantId === variantId &&
    pe.ratePlanId === ratePlanId &&
    pe.date === null
  );
  if (defaultEntry) {
    return { date, priceMinor: defaultEntry.priceMinor, seasonName: matchingSeason?.name || null, source: "default_entry" };
  }

  // 3. Try RatePlan inheritance (resolve from parent)
  const ratePlan = ratePlans.get(ratePlanId);
  if (ratePlan?.parentId) {
    const parentPrice = resolveInheritedPrice(
      variantId, ratePlan.parentId, date, priceEntries, ratePlans, variants, new Set([ratePlanId]), 1
    );
    if (parentPrice !== null && ratePlan.modifierType) {
      const modified = applyModifier(parentPrice, ratePlan.modifierType, ratePlan.modifierValue, ratePlan.modifierValueMinor);
      return { date, priceMinor: modified, seasonName: matchingSeason?.name || null, source: "price_entry" };
    }
  }

  // 4. Fallback: variant.basePriceMinor
  const variant = variants.get(variantId);
  if (variant?.basePriceMinor && variant.basePriceMinor > 0) {
    return { date, priceMinor: variant.basePriceMinor, seasonName: matchingSeason?.name || null, source: "base_price" };
  }

  // 5. Free (with warning)
  warnings.push(`Brak ceny dla wariantu ${variant?.name || variantId} na ${date}`);
  return { date, priceMinor: 0, seasonName: matchingSeason?.name || null, source: "free" };
}

function resolveInheritedPrice(
  variantId: string,
  ratePlanId: string,
  date: string,
  priceEntries: PriceEntryRow[],
  ratePlans: Map<string, RatePlanRow>,
  variants: Map<string, VariantRow>,
  visited: Set<string>,
  depth: number,
): number | null {
  if (depth > MAX_INHERITANCE_DEPTH) return null;
  if (visited.has(ratePlanId)) return null; // cycle detection
  visited.add(ratePlanId);

  // Try specific entry
  const specific = priceEntries.find(pe =>
    pe.variantId === variantId && pe.ratePlanId === ratePlanId &&
    pe.date && pe.date.toISOString().split("T")[0] === date
  );
  if (specific) return specific.priceMinor;

  // Try default entry
  const def = priceEntries.find(pe =>
    pe.variantId === variantId && pe.ratePlanId === ratePlanId && pe.date === null
  );
  if (def) return def.priceMinor;

  // Try parent
  const plan = ratePlans.get(ratePlanId);
  if (plan?.parentId) {
    const parentPrice = resolveInheritedPrice(
      variantId, plan.parentId, date, priceEntries, ratePlans, variants, visited, depth + 1
    );
    if (parentPrice !== null && plan.modifierType) {
      return applyModifier(parentPrice, plan.modifierType, plan.modifierValue, plan.modifierValueMinor);
    }
    return parentPrice;
  }

  // Fallback to base price
  const variant = variants.get(variantId);
  return variant?.basePriceMinor || null;
}

function applyModifier(
  basePriceMinor: number,
  modifierType: string,
  modifierValue: number | null,   // bps for PERCENTAGE (e.g. -1000 = -10%)
  modifierValueMinor: number | null, // grosze for FIXED
): number {
  if (modifierType === "PERCENTAGE" && modifierValue !== null) {
    // bps: 10000 = 100%. modifierValue can be negative.
    // e.g. -1000 bps = -10% → price * (10000 + (-1000)) / 10000
    const result = Math.round(basePriceMinor * (10000 + modifierValue) / 10000);
    return Math.max(0, result);
  }
  if (modifierType === "FIXED" && modifierValueMinor !== null) {
    return Math.max(0, basePriceMinor + modifierValueMinor);
  }
  return basePriceMinor;
}

// ══════════════════════════════════════════════════════════════════════
// PromoCode validation
// ══════════════════════════════════════════════════════════════════════

interface PromoCodeRow {
  id: string;
  code: string;
  discountType: string;
  discountValueMinor: number;
  minBookingValueMinor: number | null;
  maxUses: number | null;
  usedCount: number;
  validFrom: Date;
  validUntil: Date;
  isActive: boolean;
}

/**
 * Validate promo code — READ ONLY, does NOT increment usedCount.
 * Consumption (usedCount++) happens only in E2 book endpoint,
 * inside a transaction with the reservation creation.
 * NEVER consume in quote — quotes can be abandoned.
 */
function validatePromoCode(
  promo: PromoCodeRow | null,
  subtotalMinor: number,
  errors: string[],
): QuoteDiscount | null {
  if (!promo) return null;

  if (!promo.isActive) { errors.push("Kod rabatowy jest nieaktywny"); return null; }
  const now = new Date();
  if (now < promo.validFrom) { errors.push("Kod rabatowy jeszcze nie obowiązuje"); return null; }
  if (now > promo.validUntil) { errors.push("Kod rabatowy wygasł"); return null; }
  if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) { errors.push("Kod rabatowy wyczerpany"); return null; }
  if (promo.minBookingValueMinor && subtotalMinor < promo.minBookingValueMinor) {
    errors.push(`Minimalna wartość rezerwacji dla tego kodu: ${promo.minBookingValueMinor / 100} zł`);
    return null;
  }

  let amountMinor: number;
  if (promo.discountType === "PERCENTAGE") {
    // discountValueMinor stores percentage as integer (e.g. 10 = 10%)
    amountMinor = Math.round(subtotalMinor * promo.discountValueMinor / 100);
  } else {
    // FIXED: discountValueMinor is in grosze
    amountMinor = promo.discountValueMinor;
  }
  amountMinor = Math.min(amountMinor, subtotalMinor); // can't exceed subtotal

  return {
    code: promo.code,
    type: promo.discountType as "PERCENTAGE" | "FIXED",
    value: promo.discountValueMinor,
    amountMinor,
  };
}

// ══════════════════════════════════════════════════════════════════════
// Main: calculateQuote
// ══════════════════════════════════════════════════════════════════════

/**
 * Calculate full quote from DB data.
 *
 * @param tx - Prisma transaction or client
 * @param input - QuoteInput (dates, items, addons, promoCode)
 * @returns QuoteResult with breakdown, errors, warnings
 */
export async function calculateQuote(tx: any, input: QuoteInput): Promise<QuoteResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  const nightDates = getNightDates(input.checkIn, input.checkOut);
  if (nightDates.length === 0) {
    errors.push("Data wyjazdu musi być po dacie przyjazdu");
    return emptyResult(input, errors, warnings);
  }

  // ── Load all needed data in parallel ──
  const variantIds = input.items.map(i => i.variantId);
  const [variantsRaw, ratePlansRaw, seasonsRaw, priceEntriesRaw, settingsRaw, promoRaw, addonsRaw] = await Promise.all([
    tx.resourceVariant.findMany({
      where: { id: { in: variantIds }, isActive: true },
      include: { resource: { select: { id: true, name: true, categoryId: true, category: { select: { type: true } } } } },
    }),
    tx.ratePlan.findMany({ where: { isActive: true } }),
    tx.season.findMany({ where: { isActive: true } }),
    tx.priceEntry.findMany({
      where: {
        variantId: { in: variantIds },
        OR: [
          { date: { gte: new Date(input.checkIn), lt: new Date(input.checkOut) } },
          { date: null }, // default price entries (fallback)
        ],
      },
    }),
    tx.companySettings.findFirst({
      select: { requiredDepositPercent: true },
    }),
    input.promoCode
      ? tx.promoCode.findUnique({ where: { code: input.promoCode.toUpperCase() } })
      : null,
    input.addons?.length
      ? tx.addon.findMany({ where: { id: { in: input.addons.map(a => a.addonId) }, isActive: true } })
      : [],
  ]);

  // Build lookup maps
  const variants = new Map<string, VariantRow>(
    variantsRaw.map((v: any) => [v.id, {
      id: v.id, name: v.name, resourceId: v.resourceId,
      resource: v.resource, capacity: v.capacity,
      basePriceMinor: v.basePriceMinor,
    }])
  );
  const ratePlans = new Map<string, RatePlanRow>(
    ratePlansRaw.map((rp: any) => [rp.id, {
      id: rp.id, name: rp.name, isDefault: rp.isDefault,
      parentId: rp.parentId,
      modifierType: rp.modifierType,
      modifierValue: rp.modifierValue ? Number(rp.modifierValue) : null,
      modifierValueMinor: rp.modifierValueMinor,
      cancellationPolicy: rp.cancellationPolicy,
    }])
  );
  const seasons: SeasonRow[] = seasonsRaw.map((s: any) => ({
    id: s.id, name: s.name, startDate: s.startDate, endDate: s.endDate, priority: s.priority,
  }));
  const priceEntries: PriceEntryRow[] = priceEntriesRaw.map((pe: any) => ({
    variantId: pe.variantId, ratePlanId: pe.ratePlanId,
    seasonId: pe.seasonId, date: pe.date, priceMinor: pe.priceMinor,
  }));

  // Find default rate plan
  const defaultRatePlan = ratePlansRaw.find((rp: any) => rp.isDefault);
  if (!defaultRatePlan) {
    errors.push("Brak domyślnego planu cenowego");
    return emptyResult(input, errors, warnings);
  }

  // ── Calculate price per item ──
  const itemResults: QuoteItemResult[] = [];
  for (const item of input.items) {
    const variant = variants.get(item.variantId);
    if (!variant) {
      errors.push(`Wariant ${item.variantId} nie znaleziony lub nieaktywny`);
      continue;
    }

    // Capacity check
    const requestedGuests = (item.adults || 1) + (item.children || 0);
    if (requestedGuests > variant.capacity) {
      warnings.push(`${variant.name}: ${requestedGuests} osób przekracza pojemność ${variant.capacity}`);
    }

    const breakdown: NightPrice[] = nightDates.map(date =>
      resolveNightPrice(variant.id, defaultRatePlan.id, date, priceEntries, seasons, ratePlans, variants, warnings)
    );

    // E1 rule: for ACCOMMODATION/TIME_SLOT, missing price = error, not 0 zł
    const catType = variant.resource.category?.type;
    const freeNights = breakdown.filter(np => np.source === "free");
    if (freeNights.length > 0 && (catType === "ACCOMMODATION" || catType === "TIME_SLOT")) {
      errors.push(`Brak ceny dla ${variant.name} na ${freeNights.length} z ${nightDates.length} nocy. Uzupełnij cennik.`);
      continue;
    }

    const totalMinor = breakdown.reduce((sum, np) => sum + np.priceMinor, 0);

    itemResults.push({
      variantId: variant.id,
      variantName: variant.name,
      resourceName: variant.resource.name,
      resourceId: variant.resource.id,
      capacity: variant.capacity,
      nights: nightDates.length,
      priceBreakdown: breakdown,
      totalMinor,
      ratePlanId: defaultRatePlan.id,
      ratePlanName: defaultRatePlan.name,
    });
  }

  // ── Addons ──
  const addonResults: QuoteAddonResult[] = [];
  if (input.addons?.length) {
    const addonMap = new Map((addonsRaw as any[]).map((a: any) => [a.id, a]));
    for (const ai of input.addons) {
      const addon = addonMap.get(ai.addonId);
      if (!addon) { warnings.push(`Dodatek ${ai.addonId} nie znaleziony`); continue; }
      addonResults.push({
        addonId: addon.id,
        name: addon.name,
        pricingType: addon.pricingType,
        unitPriceMinor: addon.priceMinor,
        quantity: ai.quantity,
        totalMinor: addon.priceMinor * ai.quantity,
      });
    }
  }

  // ── Totals ──
  const itemsTotalMinor = itemResults.reduce((sum, i) => sum + i.totalMinor, 0);
  const addonsTotalMinor = addonResults.reduce((sum, a) => sum + a.totalMinor, 0);
  const subtotalMinor = itemsTotalMinor + addonsTotalMinor;

  // ── PromoCode ──
  const discount = validatePromoCode(promoRaw, subtotalMinor, errors);
  const discountMinor = discount?.amountMinor || 0;
  const totalMinor = Math.max(0, subtotalMinor - discountMinor);

  // ── Deposit ──
  const depositPercent = settingsRaw?.requiredDepositPercent ?? 30;
  const depositMinor = Math.round(totalMinor * depositPercent / 100);

  // ── Cancellation policy (from default rate plan) ──
  const cancellationPolicy = defaultRatePlan.cancellationPolicy || "FLEXIBLE";

  return {
    items: itemResults,
    addons: addonResults,
    subtotalMinor,
    discount,
    totalMinor,
    depositMinor,
    depositPercent,
    cancellationPolicy,
    nights: nightDates.length,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    errors,
    warnings,
  };
}

function emptyResult(input: QuoteInput, errors: string[], warnings: string[]): QuoteResult {
  return {
    items: [], addons: [], subtotalMinor: 0, discount: null, totalMinor: 0,
    depositMinor: 0, depositPercent: 0, cancellationPolicy: "FLEXIBLE",
    nights: 0, checkIn: input.checkIn, checkOut: input.checkOut, errors, warnings,
  };
}

// ══════════════════════════════════════════════════════════════════════
// MinPrice (for quote-preview batch)
// ══════════════════════════════════════════════════════════════════════

export interface MinPriceResult {
  variantId: string;
  fromPriceMinor: number;  // cheapest night in range
  ratePlanId: string;
  ratePlanName: string;
  source: string;
}

/**
 * Get minimum price per night for each variant (for availability listing).
 * Uses same resolution logic but returns only min.
 */
export async function getMinPrices(
  tx: any,
  variantIds: string[],
  checkIn: string,
  checkOut: string,
): Promise<MinPriceResult[]> {
  const nightDates = getNightDates(checkIn, checkOut);
  if (nightDates.length === 0) return [];

  const [variantsRaw, ratePlansRaw, seasonsRaw, priceEntriesRaw] = await Promise.all([
    tx.resourceVariant.findMany({
      where: { id: { in: variantIds }, isActive: true },
      include: { resource: { select: { id: true, name: true, categoryId: true, category: { select: { type: true } } } } },
    }),
    tx.ratePlan.findMany({ where: { isActive: true } }),
    tx.season.findMany({ where: { isActive: true } }),
    tx.priceEntry.findMany({
      where: {
        variantId: { in: variantIds },
        OR: [
          { date: { gte: new Date(checkIn), lt: new Date(checkOut) } },
          { date: null },
        ],
      },
    }),
  ]);

  const variants = new Map<string, VariantRow>(variantsRaw.map((v: any) => [v.id, {
    id: v.id, name: v.name, resourceId: v.resourceId, resource: v.resource,
    capacity: v.capacity, basePriceMinor: v.basePriceMinor,
  }]));
  const ratePlans = new Map<string, RatePlanRow>(ratePlansRaw.map((rp: any) => [rp.id, {
    id: rp.id, name: rp.name, isDefault: rp.isDefault, parentId: rp.parentId,
    modifierType: rp.modifierType, modifierValue: rp.modifierValue ? Number(rp.modifierValue) : null,
    modifierValueMinor: rp.modifierValueMinor, cancellationPolicy: rp.cancellationPolicy,
  }]));
  const seasons = seasonsRaw.map((s: any) => ({ id: s.id, name: s.name, startDate: s.startDate, endDate: s.endDate, priority: s.priority }));
  const priceEntries = priceEntriesRaw.map((pe: any) => ({
    variantId: pe.variantId, ratePlanId: pe.ratePlanId, seasonId: pe.seasonId, date: pe.date, priceMinor: pe.priceMinor,
  }));

  const defaultRP = ratePlansRaw.find((rp: any) => rp.isDefault);
  if (!defaultRP) return [];

  const results: MinPriceResult[] = [];
  const warnIgnored: string[] = [];

  for (const vid of variantIds) {
    if (!variants.has(vid)) continue;
    const prices = nightDates.map(date =>
      resolveNightPrice(vid, defaultRP.id, date, priceEntries, seasons, ratePlans, variants, warnIgnored)
    );
    const minPrice = prices.reduce((min, p) => p.priceMinor < min.priceMinor ? p : min, prices[0]);
    results.push({
      variantId: vid,
      fromPriceMinor: minPrice?.priceMinor || 0,
      ratePlanId: defaultRP.id,
      ratePlanName: defaultRP.name,
      source: minPrice?.source || "free",
    });
  }

  return results;
}
