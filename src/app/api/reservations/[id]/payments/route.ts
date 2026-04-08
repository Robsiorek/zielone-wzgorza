/**
 * POST /api/reservations/[id]/payments — Register payment/refund/adjustment
 * GET  /api/reservations/[id]/payments — List payments + financial summary
 *
 * C1b: Master Plan 9.14
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, apiNotFound, apiUnauthorized, apiForbidden, apiServerError } from "@/lib/api-response";
import { getAuthContext, hasPermission as hasPermCtx } from "@/lib/require-auth";
import {
  resolveDirection,
  validatePaymentCreate,
  recalculateFinancialProjection,
  checkAutoConfirmReservation,
  getNetPaidMinor,
  hasPermission,
  PaymentValidationError,
  PaymentConflictError,
  type PaymentCreateInput,
  type PaymentKindType,
  type PaymentDirectionType,
  type PaymentMethodConfig,
} from "@/lib/payment-service";

// ══════════════════════════════════════════════════════════════════════
// POST — Register payment (CHARGE, REFUND, ADJUSTMENT)
// ══════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // D0: Auth context
    const auth = await getAuthContext();
    if (!auth) return apiUnauthorized();

    const body = await request.json();
    const reservationId = params.id;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Lock reservation row (race condition protection for refund limit)
      const locked: any[] = await tx.$queryRaw`
        SELECT id, type, status, "totalMinor", "requiredDepositMinor"
        FROM reservations WHERE id = ${reservationId} FOR UPDATE
      `;
      if (locked.length === 0) throw new PaymentValidationError("Rezerwacja nie znaleziona");
      const reservation = locked[0];

      // 2. Policy: get permissions from authenticated user (D0)
      const permissions = auth.permissions;

      // 3. Load payment methods config
      const settings = await tx.companySettings.findFirst({
        select: { paymentMethodsConfig: true },
      });
      const methodsConfig: PaymentMethodConfig[] = (settings?.paymentMethodsConfig as any[]) || [];

      // 4. Build and validate input
      const input: PaymentCreateInput = {
        kind: body.kind,
        direction: body.direction,
        method: body.method,
        amountMinor: Number(body.amountMinor || 0),
        occurredAt: body.occurredAt,
        referenceNumber: body.referenceNumber,
        note: body.note,
        status: body.status,
        linkedPaymentId: body.linkedPaymentId,
      };

      const errors = validatePaymentCreate(input, methodsConfig, { force: body.force });
      if (errors.length > 0) return { error: errors.join("; ") };

      // 5. Resolve direction
      const direction = resolveDirection(input.kind, input.direction as PaymentDirectionType);

      // 6. Determine initial status (policy layer)
      let initialStatus: "PENDING" | "CONFIRMED" = "PENDING";
      if (input.status === "CONFIRMED") {
        if (!hasPermission(permissions, "create_confirmed")) {
          throw new PaymentValidationError("Brak uprawnień do tworzenia potwierdzonych płatności");
        }
        initialStatus = "CONFIRMED";
      }

      // 7. Method requiresConfirmation override
      const methodCfg = methodsConfig.find(m => m.method === input.method);
      if (methodCfg?.requiresConfirmation && initialStatus === "CONFIRMED" && !body.force) {
        // Force PENDING for methods that require confirmation
        initialStatus = "PENDING";
      }

      // 8. CHARGE on CANCELLED reservation → block (unless force)
      if (input.kind === "CHARGE" && reservation.status === "CANCELLED" && !body.force) {
        throw new PaymentValidationError("Nie można rejestrować wpłaty na anulowaną rezerwację. Użyj force: true");
      }

      // 8b. D0: ADJUSTMENT requires permission
      if (input.kind === "ADJUSTMENT" && !hasPermission(permissions, "adjustment")) {
        throw new PaymentValidationError("Brak uprawnień do tworzenia korekt");
      }

      // 8c. D0: Force requires permission + reason
      if (body.force) {
        if (!hasPermission(permissions, "force")) {
          throw new PaymentValidationError("Brak uprawnień do wymuszania operacji (force)");
        }
        if (!body.forceReason?.trim()) {
          throw new PaymentValidationError("Wymuszenie operacji wymaga podania powodu (forceReason)");
        }
      }

      // 9. REFUND/OUT limit check (must be in transaction after lock)
      if (direction === "OUT") {
        if (!hasPermission(permissions, "refund")) {
          throw new PaymentValidationError("Brak uprawnień do zwrotów");
        }
        const netPaid = await getNetPaidMinor(tx, reservationId);
        if (input.amountMinor > netPaid && !body.force) {
          throw new PaymentConflictError(
            `Kwota zwrotu (${input.amountMinor}) przekracza saldo wpłat (${netPaid}). Użyj force: true`
          );
        }
      }

      // 10. Create Payment record
      const payment = await tx.payment.create({
        data: {
          reservationId,
          kind: input.kind,
          direction,
          paymentStatus: initialStatus,
          method: input.method as any,
          amountMinor: input.amountMinor,
          amount: input.amountMinor / 100,
          currency: "PLN",
          occurredAt: input.occurredAt ? new Date(input.occurredAt) : new Date(),
          referenceNumber: input.referenceNumber || null,
          note: input.note || null,
          linkedPaymentId: input.linkedPaymentId || null,
          createdSource: "ADMIN_MANUAL",
          createdByUserId: auth.user.id,
        },
      });

      // 11. If CONFIRMED → recalculate projections + check auto-confirm
      let projection = null;
      let autoConfirmed = false;
      if (initialStatus === "CONFIRMED") {
        projection = await recalculateFinancialProjection(tx, reservationId);
        autoConfirmed = await checkAutoConfirmReservation(tx, reservationId);
      }

      // 12. Audit log
      await tx.auditLog.create({
        data: {
          action: "PAYMENT_CREATED",
          entity: "Payment",
          entityId: payment.id,
          changes: {
            reservationId,
            kind: input.kind,
            direction,
            amountMinor: input.amountMinor,
            method: input.method,
            status: initialStatus,
            autoConfirmed,
          },
        },
      });

      return { payment, projection, autoConfirmed };
    });

    // Check if transaction returned validation error
    if ("error" in result && typeof result.error === "string") {
      return apiError(result.error);
    }

    return apiSuccess(result, 201);
  } catch (error) {
    if (error instanceof PaymentValidationError) {
      return apiError(error.message, 400, "VALIDATION");
    }
    if (error instanceof PaymentConflictError) {
      return apiError(error.message, 409, "CONFLICT");
    }
    return apiServerError(error);
  }
}

// ══════════════════════════════════════════════════════════════════════
// GET — List payments + financial summary
// ══════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const reservationId = params.id;

    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      select: {
        id: true, totalMinor: true, requiredDepositMinor: true,
        paymentStatus: true, type: true,
        bookingDetails: {
          select: {
            paidAmountMinor: true, balanceDueMinor: true, overpaidAmountMinor: true,
          },
        },
      },
    });
    if (!reservation) return apiNotFound("Rezerwacja nie znaleziona");

    const payments = await prisma.payment.findMany({
      where: { reservationId },
      select: {
        id: true, kind: true, direction: true, paymentStatus: true,
        method: true, amountMinor: true, currency: true,
        occurredAt: true, referenceNumber: true, note: true,
        createdAt: true, createdSource: true,
        confirmedAt: true, rejectedAt: true, rejectionReason: true,
        linkedPaymentId: true,
        createdByUser: { select: { id: true, firstName: true, lastName: true } },
        confirmedByUser: { select: { id: true, firstName: true, lastName: true } },
        rejectedByUser: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const pendingCount = payments.filter(p => p.paymentStatus === "PENDING").length;
    const confirmedCount = payments.filter(p => p.paymentStatus === "CONFIRMED").length;

    const paidAmountMinor = reservation.bookingDetails?.paidAmountMinor || 0;
    const depositMet = reservation.requiredDepositMinor > 0
      ? paidAmountMinor >= reservation.requiredDepositMinor
      : true;

    const summary = {
      totalMinor: reservation.totalMinor,
      paidAmountMinor,
      balanceDueMinor: reservation.bookingDetails?.balanceDueMinor || 0,
      overpaidAmountMinor: reservation.bookingDetails?.overpaidAmountMinor || 0,
      paymentStatus: reservation.paymentStatus,
      pendingCount,
      confirmedCount,
      requiredDepositMinor: reservation.requiredDepositMinor,
      depositMet,
    };

    return apiSuccess({ payments, summary });
  } catch (error) {
    return apiServerError(error);
  }
}
