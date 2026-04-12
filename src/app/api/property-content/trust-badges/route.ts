/**
 * GET  /api/property-content/trust-badges — List trust badges (property-scoped, sorted by position)
 * POST /api/property-content/trust-badges — Create a new trust badge
 *
 * B4: Trust badges displayed on property page.
 * iconKey validated against amenity-icons registry (reuse B3).
 * Position: max(position) + 1 in transaction.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, apiServerError } from "@/lib/api-response";
import { getAuthContext, hasMinRole } from "@/lib/require-auth";
import { isValidIconKey } from "@/lib/amenity-icons";

/** Get the single property ID (single-property system) */
async function getPropertyId(): Promise<string> {
  const prop = await prisma.property.findFirst({ select: { id: true } });
  if (!prop) throw new Error("Brak property w bazie");
  return prop.id;
}

export async function GET() {
  try {
    const auth = await getAuthContext();
    if (!auth) return apiError("Brak autoryzacji", 401, "UNAUTHORIZED");

    const propertyId = await getPropertyId();
    const badges = await prisma.trustBadge.findMany({
      where: { propertyId },
      orderBy: { position: "asc" },
    });

    return apiSuccess({ trustBadges: badges });
  } catch (error) {
    return apiServerError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth) return apiError("Brak autoryzacji", 401, "UNAUTHORIZED");
    if (!hasMinRole(auth, "MANAGER")) return apiError("Brak uprawnień", 403, "FORBIDDEN");

    const body = await request.json();
    const { label, iconKey, description } = body;

    // Validate label
    if (!label || typeof label !== "string" || label.trim().length === 0) {
      return apiError("Nazwa badge jest wymagana", 400, "VALIDATION");
    }
    if (label.trim().length > 100) {
      return apiError("Nazwa badge: maksymalnie 100 znaków", 400, "VALIDATION");
    }

    // Validate iconKey
    if (!iconKey || typeof iconKey !== "string") {
      return apiError("Ikona jest wymagana", 400, "VALIDATION");
    }
    if (!isValidIconKey(iconKey)) {
      return apiError(`Nieznana ikona: "${iconKey}"`, 400, "VALIDATION");
    }

    // Validate description (optional)
    if (description !== undefined && description !== null) {
      if (typeof description !== "string") {
        return apiError("Opis musi być tekstem", 400, "VALIDATION");
      }
      if (description.trim().length > 300) {
        return apiError("Opis badge: maksymalnie 300 znaków", 400, "VALIDATION");
      }
    }

    const propertyId = await getPropertyId();

    // Create in transaction: max(position) + 1
    const badge = await prisma.$transaction(async (tx) => {
      const maxPos = await tx.trustBadge.aggregate({
        where: { propertyId },
        _max: { position: true },
      });
      const nextPosition = (maxPos._max.position ?? -1) + 1;

      return tx.trustBadge.create({
        data: {
          propertyId,
          label: label.trim(),
          iconKey,
          description: description ? description.trim() : null,
          position: nextPosition,
          isActive: true,
        },
      });
    });

    return apiSuccess({ trustBadge: badge }, 201);
  } catch (error) {
    return apiServerError(error);
  }
}
