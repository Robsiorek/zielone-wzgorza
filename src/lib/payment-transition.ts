/**
 * Payment State Transition Service
 *
 * SINGLE POINT OF TRUTH for ALL payment status changes.
 * Every transition (confirm, reject) MUST go through transitionPaymentStatus().
 *
 * Guarantees:
 *   1. FOR UPDATE lock on payment row (serializes concurrent transitions)
 *   2. State machine validation AFTER lock (compare-and-set)
 *   3. Typed, closed state machine — no string-based transitions
 *   4. Deterministic result: idempotent success or 409 conflict
 *   5. Audit log ONLY for winner
 *   6. Reservation lock acquired AFTER payment lock (consistent order)
 *   7. Financial projection recalculated atomically
 *
 * Lock order (prevents deadlocks):
 *   payment row → reservation row (never reversed)
 */

import type { PrismaClient } from "@prisma/client";
import {
  recalculateFinancialProjection,
  checkAutoConfirmReservation,
  PaymentValidationError,
} from "@/lib/payment-service";

// ── Prisma 5.x interactive transaction client type ──

type TxClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

// ── Error classes ──

/** 409 — invalid state transition (concurrent conflict or wrong state) */
export class PaymentTransitionError extends Error {
  readonly status = 409;
  readonly code = "INVALID_TRANSITION";
  constructor(message: string) {
    super(message);
    this.name = "PaymentTransitionError";
  }
}

// ── Domain types ──

export type PaymentStatus = "PENDING" | "CONFIRMED" | "REJECTED" | "FAILED" | "CANCELLED";

/** Row-level locked payment state — read AFTER FOR UPDATE */
interface LockedPaymentState {
  id: string;
  reservationId: string;
  paymentStatus: PaymentStatus;
  kind: string;
  direction: string;
  amountMinor: number;
}

// ── State machine — closed, typed, exhaustive ──

const ALLOWED_TRANSITIONS: Record<PaymentStatus, readonly PaymentStatus[]> = {
  PENDING:   ["CONFIRMED", "REJECTED", "CANCELLED"] as const,
  CONFIRMED: [] as const,                 // terminal — confirmed payments are immutable
  REJECTED:  [] as const,                 // terminal
  FAILED:    [] as const,                 // terminal
  CANCELLED: [] as const,                 // terminal
} as const;

function isTransitionAllowed(from: PaymentStatus, to: PaymentStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

// ── Public interface ──

export interface PaymentTransitionOptions {
  targetStatus: PaymentStatus;
  actorUserId: string;
  reason?: string | null;
  /** After confirm: recalculate projections and check auto-confirm reservation */
  recalculateProjection?: boolean;
}

export interface PaymentTransitionResult {
  success: boolean;
  idempotent: boolean;
  payment: LockedPaymentState;
  fromStatus: PaymentStatus;
  toStatus: PaymentStatus;
  projection?: ReturnType<typeof JSON.parse> | null;
  autoConfirmedReservation?: boolean;
}

// ── Main transition function ──

export async function transitionPaymentStatus(
  tx: TxClient,
  paymentId: string,
  options: PaymentTransitionOptions,
): Promise<PaymentTransitionResult> {
  const { targetStatus, actorUserId, reason, recalculateProjection = true } = options;

  // ── Step 1: Lock payment row ──
  const locked: LockedPaymentState[] = await tx.$queryRaw`
    SELECT id, "reservationId", "paymentStatus", kind, direction, "amountMinor"
    FROM payments
    WHERE id = ${paymentId}
    FOR UPDATE
  `;

  if (locked.length === 0) {
    throw new PaymentValidationError("Płatność nie znaleziona");
  }

  const payment = locked[0];
  const currentStatus = payment.paymentStatus;

  // ── Step 2: Idempotent check ──
  if (currentStatus === targetStatus) {
    return {
      success: true,
      idempotent: true,
      payment,
      fromStatus: currentStatus,
      toStatus: targetStatus,
    };
  }

  // ── Step 3: State machine validation → 409 ──
  if (!isTransitionAllowed(currentStatus, targetStatus)) {
    throw new PaymentTransitionError(
      `Nie można zmienić statusu płatności z "${currentStatus}" na "${targetStatus}"`,
    );
  }

  // ── Step 4: Lock reservation row (consistent lock order) ──
  await tx.$queryRaw`
    SELECT id FROM reservations WHERE id = ${payment.reservationId} FOR UPDATE
  `;

  // ── Step 5: Update payment — explicit typed branches ──
  if (targetStatus === "CONFIRMED") {
    await tx.payment.update({
      where: { id: paymentId },
      data: {
        paymentStatus: "CONFIRMED",
        confirmedAt: new Date(),
        confirmedByUserId: actorUserId,
      },
    });
  } else if (targetStatus === "REJECTED") {
    await tx.payment.update({
      where: { id: paymentId },
      data: {
        paymentStatus: "REJECTED",
        rejectedAt: new Date(),
        rejectedByUserId: actorUserId,
        rejectionReason: reason ?? null,
      },
    });
  } else {
    // CANCELLED or other simple transitions
    await tx.payment.update({
      where: { id: paymentId },
      data: { paymentStatus: targetStatus },
    });
  }

  // ── Step 6: Financial projection (confirm only) ──
  let projection: ReturnType<typeof JSON.parse> | null = null;
  let autoConfirmedReservation = false;

  if (targetStatus === "CONFIRMED" && recalculateProjection) {
    const proj = await recalculateFinancialProjection(tx, payment.reservationId);
    projection = proj ? JSON.parse(JSON.stringify(proj)) : null;

    autoConfirmedReservation = await checkAutoConfirmReservation(tx, payment.reservationId);
  }

  // ── Step 7: Audit log ──
  await tx.auditLog.create({
    data: {
      action: targetStatus === "CONFIRMED" ? "PAYMENT_CONFIRMED" : "PAYMENT_REJECTED",
      entity: "Payment",
      entityId: paymentId,
      userId: actorUserId,
      changes: {
        reservationId: payment.reservationId,
        amountMinor: payment.amountMinor,
        kind: payment.kind,
        direction: payment.direction,
        fromStatus: currentStatus,
        toStatus: targetStatus,
        projection,
        autoConfirmedReservation,
        reason: reason ?? null,
      },
    },
  });

  // ── Step 8: Return ──
  return {
    success: true,
    idempotent: false,
    payment: { ...payment, paymentStatus: targetStatus },
    fromStatus: currentStatus,
    toStatus: targetStatus,
    projection,
    autoConfirmedReservation,
  };
}
