/**
 * POST /api/payments/[id]/reject
 * PENDING → REJECTED via payment-transition service.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, apiUnauthorized, apiServerError } from "@/lib/api-response";
import { getAuthContext } from "@/lib/require-auth";
import { hasPermission, PaymentValidationError } from "@/lib/payment-service";
import { transitionPaymentStatus, PaymentTransitionError } from "@/lib/payment-transition";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await getAuthContext();
    if (!auth) return apiUnauthorized();

    if (!hasPermission(auth.permissions, "reject")) {
      return apiError("Brak uprawnień do odrzucania płatności", 403, "FORBIDDEN");
    }

    const body = await request.json().catch(() => ({}));

    const result = await prisma.$transaction(async (tx) => {
      return transitionPaymentStatus(tx, params.id, {
        targetStatus: "REJECTED",
        actorUserId: auth.user.id,
        reason: body.reason || null,
      });
    });

    return apiSuccess(result);
  } catch (error) {
    if (error instanceof PaymentTransitionError) return apiError(error.message, 409, "INVALID_TRANSITION");
    if (error instanceof PaymentValidationError) return apiError(error.message, 400, "VALIDATION");
    return apiServerError(error);
  }
}
