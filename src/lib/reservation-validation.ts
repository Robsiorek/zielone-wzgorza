/**
 * Reservation Validation Service
 *
 * v5.0 — Multi-Type Resources
 *
 * Accepts items[] (ReservationItem) instead of resources[].
 * Supports body.resources as alias for backward compat (frontend transition).
 */

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface ReservationInput {
  type?: string;
  clientId?: string;
  checkIn?: string;
  checkOut?: string;
  items?: { resourceId: string; categoryType?: string; startAt?: string; endAt?: string; quantity?: number }[];
  resources?: { resourceId: string }[]; // backward compat alias
  adults?: number;
  children?: number;
  pin?: string;
  expiresAt?: string;
  expiryAction?: string;
  [key: string]: any;
}

/** Normalize: accept both items[] and resources[] (compat) */
function getItems(body: ReservationInput) {
  return body.items || body.resources || [];
}

// ── Base validation ──

export function validateBaseReservation(body: ReservationInput): string[] {
  const errors: string[] = [];
  if (!body.checkIn) errors.push("Data przyjazdu jest wymagana");
  if (!body.checkOut) errors.push("Data wyjazdu jest wymagana");

  const items = getItems(body);
  if (items.length === 0) {
    errors.push("Wybierz przynajmniej jeden zasób");
  } else {
    for (let i = 0; i < items.length; i++) {
      if (!items[i].resourceId) errors.push(`Element #${i + 1}: brak ID zasobu`);
    }
  }
  return errors;
}

// ── Type-specific ──

export function validateBookingFields(body: ReservationInput): string[] {
  const errors: string[] = [];
  if (!body.clientId) errors.push("Klient jest wymagany dla rezerwacji");
  if (body.adults !== undefined && Number(body.adults) < 1) errors.push("Rezerwacja musi mieć przynajmniej 1 osobę dorosłą");
  return errors;
}

export function validateOfferFields(body: ReservationInput): string[] {
  const errors: string[] = [];
  if (!body.clientId) errors.push("Klient jest wymagany dla oferty");
  if (body.expiryAction && !["CANCEL", "NOTHING"].includes(body.expiryAction)) errors.push(`Nieprawidłowa akcja wygaśnięcia: ${body.expiryAction}`);
  return errors;
}

export function validateBlockFields(_body: ReservationInput): string[] {
  return [];
}

// ── Unified create ──

export function validateReservationCreate(body: ReservationInput): ValidationResult {
  const errors: string[] = [];
  if (!body.type) { errors.push("Typ rezerwacji jest wymagany (BOOKING, OFFER, BLOCK)"); return { valid: false, errors }; }
  if (!["BOOKING", "OFFER", "BLOCK"].includes(body.type)) { errors.push(`Nieprawidłowy typ: ${body.type}`); return { valid: false, errors }; }
  errors.push(...validateBaseReservation(body));
  if (body.type === "BOOKING") errors.push(...validateBookingFields(body));
  if (body.type === "OFFER") errors.push(...validateOfferFields(body));
  if (body.type === "BLOCK") errors.push(...validateBlockFields(body));
  return { valid: errors.length === 0, errors };
}

// ── Edit validation ──

export function validateReservationEdit(body: ReservationInput): ValidationResult {
  const errors: string[] = [];
  const items = getItems(body);
  if ((body.items !== undefined || body.resources !== undefined) && items.length === 0) {
    errors.push("Rezerwacja musi mieć przynajmniej jeden zasób");
  }
  for (let i = 0; i < items.length; i++) {
    if (!items[i].resourceId) errors.push(`Element #${i + 1}: brak ID zasobu`);
  }
  return { valid: errors.length === 0, errors };
}

// ── Helpers ──

export function getAllowedTransitions(type: string, currentStatus: string): string[] {
  if (type === "BOOKING") {
    const map: Record<string, string[]> = {
      PENDING: ["CONFIRMED", "CANCELLED"],
      CONFIRMED: ["PENDING", "CANCELLED", "NO_SHOW", "FINISHED"],
      CANCELLED: ["CONFIRMED", "PENDING"],
      NO_SHOW: ["CONFIRMED"],
      FINISHED: [],
    };
    return map[currentStatus] || [];
  }
  if (type === "OFFER") {
    const map: Record<string, string[]> = {
      PENDING: ["CANCELLED", "EXPIRED"],
      CONFIRMED: ["CANCELLED"],
      CANCELLED: [],
      EXPIRED: ["PENDING"],
    };
    return map[currentStatus] || [];
  }
  if (type === "BLOCK") {
    const map: Record<string, string[]> = {
      CONFIRMED: ["CANCELLED"],
      CANCELLED: [],
    };
    return map[currentStatus] || [];
  }
  return [];
}

export function getBlockTypesForType(_type: string): ("BOOKING" | "BLOCK" | "OFFER")[] {
  return ["BOOKING", "BLOCK"];
}

export function getTimelineLabel(type: string, number: string): string {
  if (type === "BOOKING") return `Rezerwacja ${number}`;
  if (type === "OFFER") return `Oferta ${number}`;
  if (type === "BLOCK") return number;
  return number;
}

export function getNumberPrefix(type: string): string {
  if (type === "BOOKING") return "ZW";
  if (type === "OFFER") return "OF";
  if (type === "BLOCK") return "BL";
  return "RES";
}

// ── canTransition — single function check ──

export function canTransition(type: string, fromStatus: string, toStatus: string): boolean {
  return getAllowedTransitions(type, fromStatus).includes(toStatus);
}
