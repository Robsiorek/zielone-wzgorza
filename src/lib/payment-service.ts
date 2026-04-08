/**
 * Payment Service — business logic for the payment ledger.
 *
 * C1b: Master Plan sections 9.1–9.12
 *
 * Key rules:
 *   - Ledger is immutable: no edits, no deletes. Corrections = new record.
 *   - Only CONFIRMED payments affect financial projections.
 *   - amountMinor > 0 always. direction (IN/OUT) determines sign.
 *   - Refund/OUT cannot exceed netPaid (unless force).
 *   - All writes in transaction with FOR UPDATE lock.
 */

import type { Prisma } from "@prisma/client";

// ── Types ──

export type PaymentKindType = "CHARGE" | "REFUND" | "ADJUSTMENT";
export type PaymentDirectionType = "IN" | "OUT";
export type PaymentStatusType = "PENDING" | "CONFIRMED" | "REJECTED" | "FAILED" | "CANCELLED";
export type PaymentMethodType = "CASH" | "TRANSFER" | "TERMINAL" | "CARD" | "ONLINE" | "BLIK" | "OTHER";
export type PaymentSourceType = "ADMIN_MANUAL" | "SYSTEM" | "WEBHOOK" | "IMPORT";

export interface PaymentCreateInput {
  kind: PaymentKindType;
  direction?: PaymentDirectionType;  // default: CHARGE→IN, REFUND→OUT, ADJUSTMENT→required
  method: PaymentMethodType;
  amountMinor: number;
  occurredAt?: string;               // ISO date, default: now
  referenceNumber?: string;
  note?: string;
  status?: "PENDING" | "CONFIRMED";  // default: PENDING (policy layer may override)
  linkedPaymentId?: string;
}

export interface FinancialProjection {
  paidAmountMinor: number;
  balanceDueMinor: number;
  overpaidAmountMinor: number;
  paymentStatus: "UNPAID" | "PARTIAL" | "PAID";
}

// ── Direction defaults ──

export function resolveDirection(kind: PaymentKindType, explicit?: PaymentDirectionType): PaymentDirectionType {
  if (explicit) return explicit;
  switch (kind) {
    case "CHARGE": return "IN";
    case "REFUND": return "OUT";
    case "ADJUSTMENT":
      throw new PaymentValidationError("ADJUSTMENT wymaga jawnego direction (IN lub OUT)");
    default: return "IN";
  }
}

// ── Status transitions ──

const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["CONFIRMED", "REJECTED", "FAILED", "CANCELLED"],
  // CONFIRMED, REJECTED, FAILED, CANCELLED = terminal (immutable)
};

export function canTransitionPayment(from: PaymentStatusType, to: PaymentStatusType): boolean {
  return (VALID_TRANSITIONS[from] || []).includes(to);
}

// ── Validation ──

export interface PaymentMethodConfig {
  method: string;
  isActive: boolean;
  availableForAdmin: boolean;
  requiresConfirmation: boolean;
}

export function validatePaymentCreate(
  input: PaymentCreateInput,
  methodsConfig: PaymentMethodConfig[],
  options?: { force?: boolean },
): string[] {
  const errors: string[] = [];

  if (!input.kind) errors.push("Rodzaj operacji (kind) jest wymagany");
  if (!input.method) errors.push("Metoda płatności jest wymagana");
  if (!input.amountMinor || input.amountMinor <= 0) errors.push("Kwota musi być większa niż 0");

  // Validate kind
  const validKinds = ["CHARGE", "REFUND", "ADJUSTMENT"];
  if (input.kind && !validKinds.includes(input.kind)) {
    errors.push("Nieprawidłowy rodzaj operacji: " + input.kind);
  }

  // Validate method is active (unless force)
  if (input.method && !options?.force) {
    const methodCfg = methodsConfig.find(m => m.method === input.method);
    if (methodCfg && !methodCfg.isActive) {
      errors.push("Metoda płatności " + input.method + " jest wyłączona");
    }
    if (methodCfg && !methodCfg.availableForAdmin) {
      errors.push("Metoda płatności " + input.method + " nie jest dostępna dla admina");
    }
  }

  // Validate direction for ADJUSTMENT
  if (input.kind === "ADJUSTMENT" && !input.direction) {
    errors.push("ADJUSTMENT wymaga jawnego direction (IN lub OUT)");
  }

  // D0: ADJUSTMENT requires note (reason) — backend enforcement
  if (input.kind === "ADJUSTMENT" && !input.note?.trim()) {
    errors.push("Korekta wymaga podania powodu (notatka)");
  }

  return errors;
}

// ── Recalculate Financial Projection ──

/**
 * Recalculate financial projection from CONFIRMED payments.
 * Updates BookingDetails + Reservation.paymentStatus.
 *
 * MUST be called inside a transaction with FOR UPDATE lock on reservation.
 *
 * Returns the computed projection.
 */
export async function recalculateFinancialProjection(
  tx: Prisma.TransactionClient,
  reservationId: string,
): Promise<FinancialProjection> {
  // Get reservation totalMinor
  const reservation = await tx.reservation.findUnique({
    where: { id: reservationId },
    select: { totalMinor: true, type: true },
  });
  if (!reservation) throw new PaymentValidationError("Rezerwacja nie znaleziona");

  const totalMinor = reservation.totalMinor;

  // Sum CONFIRMED payments
  const payments = await tx.payment.findMany({
    where: {
      reservationId,
      paymentStatus: "CONFIRMED",
    },
    select: { amountMinor: true, direction: true },
  });

  let totalIn = 0;
  let totalOut = 0;
  for (const p of payments) {
    if (p.direction === "IN") totalIn += p.amountMinor;
    else if (p.direction === "OUT") totalOut += p.amountMinor;
  }

  const netPaid = totalIn - totalOut;
  const paidAmountMinor = Math.max(0, netPaid);
  const balanceDueMinor = Math.max(0, totalMinor - paidAmountMinor);
  const overpaidAmountMinor = Math.max(0, paidAmountMinor - totalMinor);

  // Determine paymentStatus
  let paymentStatus: "UNPAID" | "PARTIAL" | "PAID";
  if (paidAmountMinor <= 0) {
    paymentStatus = "UNPAID";
  } else if (paidAmountMinor >= totalMinor) {
    paymentStatus = "PAID";
  } else {
    paymentStatus = "PARTIAL";
  }

  // Update BookingDetails
  const bookingDetails = await tx.bookingDetails.findUnique({
    where: { reservationId },
  });

  if (bookingDetails) {
    await tx.bookingDetails.update({
      where: { reservationId },
      data: {
        paidAmountMinor,
        paidAmount: paidAmountMinor / 100,
        balanceDueMinor,
        balanceDue: balanceDueMinor / 100,
        overpaidAmountMinor,
      },
    });
  }

  // Update Reservation.paymentStatus
  await tx.reservation.update({
    where: { id: reservationId },
    data: { paymentStatus },
  });

  return { paidAmountMinor, balanceDueMinor, overpaidAmountMinor, paymentStatus };
}

// ── Auto-confirm reservation after deposit met (9.7) ──

/**
 * Check if reservation should auto-confirm after payment.
 * PENDING → CONFIRMED when netPaid >= requiredDepositMinor.
 *
 * Returns true if auto-confirmed.
 */
export async function checkAutoConfirmReservation(
  tx: Prisma.TransactionClient,
  reservationId: string,
): Promise<boolean> {
  const reservation = await tx.reservation.findUnique({
    where: { id: reservationId },
    select: {
      status: true, type: true,
      requiredDepositMinor: true,
      bookingDetails: { select: { paidAmountMinor: true } },
    },
  });

  if (!reservation) return false;
  if (reservation.type !== "BOOKING") return false;
  if (reservation.status !== "PENDING") return false;
  if (reservation.requiredDepositMinor <= 0) return false;

  const paidAmountMinor = reservation.bookingDetails?.paidAmountMinor || 0;
  if (paidAmountMinor < reservation.requiredDepositMinor) return false;

  // Auto-confirm!
  await tx.reservation.update({
    where: { id: reservationId },
    data: { status: "CONFIRMED" },
  });

  // Set confirmedAt on BookingDetails
  await tx.bookingDetails.update({
    where: { reservationId },
    data: { confirmedAt: new Date() },
  });

  // Status log
  await tx.reservationStatusLog.create({
    data: {
      reservationId,
      fromStatus: "PENDING",
      toStatus: "CONFIRMED",
      action: "AUTO_CONFIRMED",
      changedBy: "SYSTEM",
      note: "Automatyczne potwierdzenie po wpłacie zaliczki",
      metadata: {
        paidAmountMinor,
        requiredDepositMinor: reservation.requiredDepositMinor,
      },
    },
  });

  return true;
}

// ── Refund limit check (with lock) ──

/**
 * Get current netPaid for a reservation (CONFIRMED payments only).
 * MUST be called after FOR UPDATE lock on reservation.
 */
export async function getNetPaidMinor(
  tx: Prisma.TransactionClient,
  reservationId: string,
): Promise<number> {
  const payments = await tx.payment.findMany({
    where: { reservationId, paymentStatus: "CONFIRMED" },
    select: { amountMinor: true, direction: true },
  });

  let totalIn = 0;
  let totalOut = 0;
  for (const p of payments) {
    if (p.direction === "IN") totalIn += p.amountMinor;
    else if (p.direction === "OUT") totalOut += p.amountMinor;
  }

  return totalIn - totalOut;
}

// ── Deposit snapshot ──

/**
 * Calculate requiredDepositMinor from CompanySettings + reservation totalMinor.
 */
export function calculateRequiredDeposit(
  totalMinor: number,
  depositPercent: number,
): number {
  if (depositPercent <= 0 || totalMinor <= 0) return 0;
  return Math.round(totalMinor * depositPercent / 100);
}

// ── Policy layer ──

export type PaymentPermission =
  | "create_pending"
  | "create_confirmed"
  | "confirm"
  | "reject"
  | "refund"
  | "force"
  | "adjustment";

/**
 * Get payment permissions for a user role.
 *
 * D0: Real role-based permissions per Master Plan 9.9:
 *   RECEPTION: view + create_pending
 *   MANAGER: + create_confirmed, confirm, reject, refund, adjustment
 *   OWNER: + force (all permissions)
 */
const ROLE_PERMISSIONS: Record<string, PaymentPermission[]> = {
  RECEPTION: ["create_pending"],
  MANAGER: ["create_pending", "create_confirmed", "confirm", "reject", "refund", "adjustment"],
  OWNER: ["create_pending", "create_confirmed", "confirm", "reject", "refund", "force", "adjustment"],
};

export function getPaymentPermissions(userRole: string): PaymentPermission[] {
  return ROLE_PERMISSIONS[userRole] || ROLE_PERMISSIONS.RECEPTION;
}

export function hasPermission(permissions: PaymentPermission[], required: PaymentPermission): boolean {
  return permissions.includes(required);
}

// ── Errors ──

export class PaymentValidationError extends Error {
  code = "VALIDATION" as const;
  constructor(message: string) {
    super(message);
    this.name = "PaymentValidationError";
  }
}

export class PaymentConflictError extends Error {
  code = "CONFLICT" as const;
  constructor(message: string) {
    super(message);
    this.name = "PaymentConflictError";
  }
}
