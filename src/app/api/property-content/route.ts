/**
 * GET   /api/property-content — Read property content (singleton)
 * PATCH /api/property-content — Upsert (create-or-update, partial patch)
 *
 * B4: Guest-facing content for the property.
 * Singleton per property. PATCH creates if not exists, updates if exists.
 * Frozen shape: always returns full object (nulls for empty fields).
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, apiServerError } from "@/lib/api-response";
import { getAuthContext, hasMinRole } from "@/lib/require-auth";

/** Get the single property ID (single-property system) */
async function getPropertyId(): Promise<string> {
  const prop = await prisma.property.findFirst({ select: { id: true } });
  if (!prop) throw new Error("Brak property w bazie");
  return prop.id;
}

/** Frozen shape — all content fields with null defaults */
const EMPTY_CONTENT = {
  heroTitle: null,
  heroSubtitle: null,
  shortDescription: null,
  fullDescription: null,
  locationDescription: null,
  checkInDescription: null,
  checkOutDescription: null,
  parkingDescription: null,
  petsDescription: null,
  childrenDescription: null,
  quietHoursDescription: null,
  houseRules: null,
  cancellationPolicy: null,
  paymentPolicy: null,
  guestContactPhone: null,
  guestContactEmail: null,
  guestContactWhatsapp: null,
  guestAddressLine: null,
  guestPostalCode: null,
  guestCity: null,
  guestCountry: "PL",
  googleMapsUrl: null,
  directionsDescription: null,
};

/** Allowed fields with max length validation */
const FIELD_LIMITS: Record<string, number> = {
  heroTitle: 100,
  heroSubtitle: 200,
  shortDescription: 300,
  fullDescription: 10000,
  locationDescription: 3000,
  checkInDescription: 2000,
  checkOutDescription: 2000,
  parkingDescription: 2000,
  petsDescription: 2000,
  childrenDescription: 2000,
  quietHoursDescription: 2000,
  houseRules: 5000,
  cancellationPolicy: 5000,
  paymentPolicy: 5000,
  guestContactPhone: 50,
  guestContactEmail: 100,
  guestContactWhatsapp: 50,
  guestAddressLine: 200,
  guestPostalCode: 20,
  guestCity: 100,
  guestCountry: 10,
  googleMapsUrl: 500,
  directionsDescription: 3000,
};

/** Strip internal fields from response */
function toResponse(record: Record<string, unknown>) {
  const { id, propertyId, createdAt, updatedAt, ...content } = record;
  return content;
}

export async function GET() {
  try {
    const auth = await getAuthContext();
    if (!auth) return apiError("Brak autoryzacji", 401, "UNAUTHORIZED");

    const propertyId = await getPropertyId();
    const record = await prisma.propertyContent.findUnique({
      where: { propertyId },
    });

    if (!record) {
      return apiSuccess({ propertyContent: { ...EMPTY_CONTENT } });
    }

    return apiSuccess({ propertyContent: toResponse(record as Record<string, unknown>) });
  } catch (error) {
    return apiServerError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth) return apiError("Brak autoryzacji", 401, "UNAUTHORIZED");
    if (!hasMinRole(auth, "MANAGER")) return apiError("Brak uprawnień", 403, "FORBIDDEN");

    const body = await request.json();

    // Validate: only allowed fields, max lengths
    const data: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(body)) {
      if (!(key in FIELD_LIMITS)) {
        continue; // silently ignore unknown fields
      }
      if (value === null || value === "") {
        data[key] = null;
        continue;
      }
      if (typeof value !== "string") {
        return apiError(`Pole "${key}" musi być tekstem`, 400, "VALIDATION");
      }
      const trimmed = value.trim();
      const maxLen = FIELD_LIMITS[key];
      if (trimmed.length > maxLen) {
        return apiError(
          `Pole "${key}": maksymalnie ${maxLen} znaków (podano ${trimmed.length})`,
          400,
          "VALIDATION"
        );
      }
      data[key] = trimmed;
    }

    if (Object.keys(data).length === 0) {
      return apiError("Brak pól do zapisania", 400, "VALIDATION");
    }

    const propertyId = await getPropertyId();

    const record = await prisma.propertyContent.upsert({
      where: { propertyId },
      create: { propertyId, ...data },
      update: data,
    });

    return apiSuccess({ propertyContent: toResponse(record as Record<string, unknown>) });
  } catch (error) {
    return apiServerError(error);
  }
}
