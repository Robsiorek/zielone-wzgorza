/**
 * Reservation State Transition Service
 *
 * SINGLE POINT OF TRUTH for ALL reservation status changes.
 * Every transition (confirm, cancel, restore, no-show, expire, finish)
 * MUST go through transitionReservationStatus().
 *
 * Guarantees:
 *   1. FOR UPDATE lock on reservation row (serializes concurrent transitions)
 *   2. State machine validation AFTER lock (compare-and-set)
 *   3. Typed, closed state machine — no string-based transitions
 *   4. Deterministic result: idempotent success or 409 conflict
 *   5. Audit log ONLY for winner
 *   6. Hooks for complex transitions (restore: availability + timeline)
 *   7. Email sent by caller AFTER commit — never inside transaction
 *
 * Lock model (per ChatGPT architecture review):
 *   - reservation row lock  → status transitions (this service)
 *   - payment row lock      → payment transitions (payment-transition.ts)
 *   - quote row lock        → booking creation (book/route.ts)
 *   - exclusion constraint  → availability protection (DB level)
 */

import type { PrismaClient } from "@prisma/client";
import { cancelTimelineEntries } from "@/lib/timeline-service";

// ── Prisma 5.x interactive transaction client type ──
// Omit pattern is the official Prisma 5 recommendation.
// $queryRaw/$executeRaw are retained (not omitted).

type TxClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

// ── Domain types ──

export type ReservationStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CANCELLED"
  | "EXPIRED"
  | "FINISHED"
  | "NO_SHOW";

type ReservationType = "BOOKING" | "OFFER" | "BLOCK";

/** Row-level locked reservation state — read AFTER FOR UPDATE */
interface LockedReservationState {
  id: string;
  status: ReservationStatus;
  type: ReservationType;
}

// ── State machine — closed, typed, exhaustive ──

const ALLOWED_TRANSITIONS: Record<ReservationStatus, readonly ReservationStatus[]> = {
  PENDING:   ["CONFIRMED", "CANCELLED", "EXPIRED"] as const,
  CONFIRMED: ["CANCELLED", "FINISHED", "NO_SHOW"] as const,
  CANCELLED: ["PENDING"] as const,                    // restore: always to PENDING
  EXPIRED:   [] as const,                              // terminal
  FINISHED:  [] as const,                              // terminal
  NO_SHOW:   ["CONFIRMED"] as const,                  // odwracalne: jawny confirm
} as const;

function isTransitionAllowed(from: ReservationStatus, to: ReservationStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

// ── Error class ──

export class TransitionError extends Error {
  readonly status: number;
  readonly code: string;
  constructor(message: string, status: number = 409, code: string = "INVALID_TRANSITION") {
    super(message);
    this.name = "TransitionError";
    this.status = status;
    this.code = code;
  }
}

// ── Shared include for full reservation data ──

const RESERVATION_INCLUDE = {
  client: true,
  items: {
    include: {
      resource: {
        select: {
          id: true, name: true, unitNumber: true,
          category: { select: { name: true, slug: true } },
        },
      },
    },
  },
  offerDetails: true,
  bookingDetails: true,
} as const;

// ── Public interface ──

/** Full reservation with relations — Prisma return type */
type FullReservation = NonNullable<
  Awaited<ReturnType<TxClient["reservation"]["findUnique"]>>
>;

export interface TransitionOptions {
  targetStatus: ReservationStatus;
  changedBy: string;
  note?: string;
  /** Cancel-specific */
  cancelReason?: string | null;
  cancelledBy?: string | null;
  /**
   * Hooks for complex transitions (restore, no-show).
   * Run INSIDE the transaction, between validation and commit.
   * Can throw to abort the entire transaction.
   */
  beforeUpdate?: (tx: TxClient, state: LockedReservationState, reservation: FullReservation) => Promise<void>;
  afterUpdate?: (tx: TxClient, state: LockedReservationState, reservation: FullReservation) => Promise<void>;
}

export interface TransitionResult {
  success: boolean;
  idempotent: boolean;
  reservation: FullReservation;
  fromStatus: ReservationStatus;
  toStatus: ReservationStatus;
}

// ── Main transition function ──

export async function transitionReservationStatus(
  tx: TxClient,
  reservationId: string,
  options: TransitionOptions,
): Promise<TransitionResult> {
  const {
    targetStatus, changedBy, note,
    cancelReason, cancelledBy,
    beforeUpdate, afterUpdate,
  } = options;

  // ── Step 1: Lock reservation row ──
  const locked: LockedReservationState[] = await tx.$queryRaw`
    SELECT id, status, type FROM reservations
    WHERE id = ${reservationId}
    FOR UPDATE
  `;

  if (locked.length === 0) {
    throw new TransitionError("Rezerwacja nie znaleziona", 404, "NOT_FOUND");
  }

  const state = locked[0];
  const currentStatus = state.status;

  // ── Step 2: Idempotent check ──
  if (currentStatus === targetStatus) {
    const reservation = await tx.reservation.findUnique({
      where: { id: reservationId },
      include: RESERVATION_INCLUDE,
    });
    if (!reservation) throw new TransitionError("Rezerwacja nie znaleziona", 404, "NOT_FOUND");
    return {
      success: true,
      idempotent: true,
      reservation,
      fromStatus: currentStatus,
      toStatus: targetStatus,
    };
  }

  // ── Step 3: State machine validation ──
  if (!isTransitionAllowed(currentStatus, targetStatus)) {
    throw new TransitionError(
      `Nie można zmienić statusu z "${currentStatus}" na "${targetStatus}"`,
    );
  }

  // ── Step 4: Type-specific guards ──
  if (targetStatus === "CONFIRMED" && state.type === "BLOCK") {
    throw new TransitionError(
      "Blokady nie wymagają potwierdzenia — są tworzone ze statusem CONFIRMED",
      400,
      "INVALID_OPERATION",
    );
  }

  // ── Step 5: Load full reservation (after lock, consistent data) ──
  const fullReservation = await tx.reservation.findUnique({
    where: { id: reservationId },
    include: {
      ...RESERVATION_INCLUDE,
      items: {
        include: {
          resource: {
            select: { id: true, name: true, unitNumber: true, category: { select: { name: true, slug: true, type: true } } },
          },
        },
      },
    },
  });

  if (!fullReservation) {
    throw new TransitionError("Rezerwacja nie znaleziona", 404, "NOT_FOUND");
  }

  // ── Step 6: beforeUpdate hook ──
  if (beforeUpdate) {
    await beforeUpdate(tx, state, fullReservation);
  }

  // ── Step 7: Cancel-specific side effects ──
  if (targetStatus === "CANCELLED") {
    await cancelTimelineEntries(tx, { reservationId });
  }

  // ── Step 8: Update status — explicit typed branches, zero dynamic Record ──
  let updated: FullReservation;

  if (targetStatus === "CANCELLED") {
    updated = await tx.reservation.update({
      where: { id: reservationId },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancelReason: cancelReason ?? null,
        cancelledBy: cancelledBy ?? changedBy,
      },
      include: RESERVATION_INCLUDE,
    });
  } else if (currentStatus === "CANCELLED") {
    // Restore path: clear cancel fields
    updated = await tx.reservation.update({
      where: { id: reservationId },
      data: {
        status: targetStatus,
        cancelledAt: null,
        cancelReason: null,
        cancelledBy: null,
      },
      include: RESERVATION_INCLUDE,
    });
  } else {
    // Simple transition (confirm, no-show, finish, expire)
    updated = await tx.reservation.update({
      where: { id: reservationId },
      data: { status: targetStatus },
      include: RESERVATION_INCLUDE,
    });
  }

  // ── Step 9: Confirm side effects ──
  if (targetStatus === "CONFIRMED" && state.type === "BOOKING") {
    await tx.bookingDetails.upsert({
      where: { reservationId },
      create: {
        reservationId,
        confirmedAt: new Date(),
        balanceDueMinor: fullReservation.totalMinor,
        balanceDue: fullReservation.totalMinor / 100,
      },
      update: { confirmedAt: new Date() },
    });
  }

  // ── Step 10: afterUpdate hook ──
  if (afterUpdate) {
    await afterUpdate(tx, state, updated);
  }

  // ── Step 11: Audit log ──
  await tx.reservationStatusLog.create({
    data: {
      reservationId,
      fromStatus: currentStatus,
      toStatus: targetStatus,
      action: "STATUS_CHANGE",
      changedBy,
      note: note ?? `Status zmieniony z ${currentStatus} na ${targetStatus}`,
    },
  });

  // ── Step 12: Return ──
  return {
    success: true,
    idempotent: false,
    reservation: updated,
    fromStatus: currentStatus,
    toStatus: targetStatus,
  };
}
