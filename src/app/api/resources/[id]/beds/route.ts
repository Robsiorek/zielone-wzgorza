/**
 * PUT /api/resources/[id]/beds — Replace bed configuration.
 *
 * Full replace pattern (deleteMany + createMany), same as ReservationItem (§2.6).
 * ResourceBed has no FK from other models — safe to replace.
 *
 * Body: { beds: [{ bedType: "DOUBLE", quantity: 1 }, ...] }
 *
 * Invariants:
 *   - bedType must be in BED_TYPES whitelist (runtime validation)
 *   - quantity: Int, >= 1, <= 20
 *   - no duplicate bedType in payload
 *   - max 10 entries per request
 *   - DB: @@unique([resourceId, bedType])
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, apiNotFound, apiServerError } from "@/lib/api-response";
import { getAuthContext, hasMinRole } from "@/lib/require-auth";
import { isValidBedType, getBedTypeLabel } from "@/lib/bed-types";

interface BedInput {
  bedType: string;
  quantity: number;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Auth — MANAGER+
    const auth = await getAuthContext();
    if (!auth) return apiError("Brak autoryzacji", 401, "UNAUTHORIZED");
    if (!hasMinRole(auth, "MANAGER")) return apiError("Brak uprawnień", 403, "FORBIDDEN");

    const resourceId = params.id;
    const body = await request.json();
    const { beds } = body;

    // Validate resource exists
    const resource = await prisma.resource.findUnique({
      where: { id: resourceId },
      select: { id: true },
    });
    if (!resource) return apiNotFound("Zasób nie znaleziony");

    // Validate beds array
    if (!Array.isArray(beds)) {
      return apiError("Pole beds musi być tablicą", 400, "VALIDATION");
    }

    if (beds.length > 10) {
      return apiError("Maksymalnie 10 typów łóżek na zasób", 400, "VALIDATION");
    }

    // Empty array = clear all beds (valid operation)
    if (beds.length === 0) {
      await prisma.resourceBed.deleteMany({ where: { resourceId } });
      return apiSuccess({ beds: [] });
    }

    // Validate each entry
    const seenTypes = new Set<string>();

    for (const bed of beds as BedInput[]) {
      if (!bed.bedType || typeof bed.bedType !== "string") {
        return apiError("Każde łóżko musi mieć pole bedType (string)", 400, "VALIDATION");
      }

      if (!isValidBedType(bed.bedType)) {
        return apiError(
          `Nieznany typ łóżka: "${bed.bedType}". Dozwolone: SINGLE, DOUBLE, QUEEN, KING, BUNK, SOFA_BED, BABY_COT`,
          400,
          "VALIDATION"
        );
      }

      if (seenTypes.has(bed.bedType)) {
        return apiError(
          `Duplikat typu łóżka: "${bed.bedType}". Każdy typ może wystąpić tylko raz`,
          400,
          "VALIDATION"
        );
      }
      seenTypes.add(bed.bedType);

      if (!Number.isInteger(bed.quantity) || bed.quantity < 1 || bed.quantity > 20) {
        return apiError(
          `Ilość dla "${bed.bedType}": liczba całkowita 1–20`,
          400,
          "VALIDATION"
        );
      }
    }

    // Full replace in transaction (§2.6 pattern)
    const updatedBeds = await prisma.$transaction(async (tx) => {
      await tx.resourceBed.deleteMany({ where: { resourceId } });

      await tx.resourceBed.createMany({
        data: (beds as BedInput[]).map((bed) => ({
          resourceId,
          bedType: bed.bedType,
          quantity: bed.quantity,
        })),
      });

      return tx.resourceBed.findMany({
        where: { resourceId },
        orderBy: { bedType: "asc" },
      });
    });

    return apiSuccess({ beds: updatedBeds });
  } catch (error) {
    return apiServerError(error);
  }
}
