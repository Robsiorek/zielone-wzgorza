/**
 * GET /api/public/property-content — Public property content for widget/website.
 *
 * B4: Returns property content + active trust badges + active FAQ items.
 * No auth required. Rate limited: 60 req/min per IP.
 *
 * Frozen shape — clients can rely on this structure:
 * {
 *   propertyContent: { heroTitle, heroSubtitle, ..., directionsDescription },
 *   trustBadges: [{ id, label, iconKey, description, position }],
 *   faqItems: [{ id, question, answer, position }]
 * }
 *
 * Internal fields (isActive, propertyId, createdAt, updatedAt) are NOT exposed.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiServerError } from "@/lib/api-response";
import { propertyContentLimiter } from "@/lib/rate-limiter";

/** Frozen empty shape — same as admin GET */
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

export async function GET(request: NextRequest) {
  try {
    const limited = propertyContentLimiter.check(request);
    if (limited) return limited;

    const property = await prisma.property.findFirst({ select: { id: true } });
    if (!property) {
      return apiSuccess({
        propertyContent: { ...EMPTY_CONTENT },
        trustBadges: [],
        faqItems: [],
      });
    }

    const propertyId = property.id;

    // Parallel fetch: content + active badges + active FAQ
    const [contentRecord, badges, faq] = await Promise.all([
      prisma.propertyContent.findUnique({
        where: { propertyId },
      }),
      prisma.trustBadge.findMany({
        where: { propertyId, isActive: true },
        orderBy: { position: "asc" },
        select: {
          id: true,
          label: true,
          iconKey: true,
          description: true,
          position: true,
        },
      }),
      prisma.faqItem.findMany({
        where: { propertyId, isActive: true },
        orderBy: { position: "asc" },
        select: {
          id: true,
          question: true,
          answer: true,
          position: true,
        },
      }),
    ]);

    // Build frozen content shape
    let propertyContent: Record<string, unknown>;
    if (!contentRecord) {
      propertyContent = { ...EMPTY_CONTENT };
    } else {
      // Strip internal fields
      const { id, propertyId: _pid, createdAt, updatedAt, ...content } = contentRecord as Record<string, unknown>;
      propertyContent = content;
    }

    return apiSuccess({
      propertyContent,
      trustBadges: badges,
      faqItems: faq,
    });
  } catch (error) {
    return apiServerError(error);
  }
}
