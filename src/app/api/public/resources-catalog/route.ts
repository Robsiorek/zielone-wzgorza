/**
 * GET /api/public/resources-catalog — Public resource catalog for booking widget.
 *
 * E2: Returns resources visible in widget for public booking.
 * Triple filter: status=ACTIVE + visibleInWidget=true + category.type=ACCOMMODATION
 * Only resources with at least 1 active variant are returned.
 *
 * No auth required. Rate limited: 60 req/min per IP.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiServerError } from "@/lib/api-response";
import { catalogLimiter } from "@/lib/rate-limiter";

export async function GET(request: NextRequest) {
  try {
    const limited = catalogLimiter.check(request);
    if (limited) return limited;

    const resources = await prisma.resource.findMany({
      where: {
        status: "ACTIVE",
        visibleInWidget: true,
        category: {
          isActive: true,
          type: "ACCOMMODATION",
        },
        variants: {
          some: { isActive: true },
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        unitNumber: true,
        description: true,
        shortDesc: true,
        maxCapacity: true,
        categoryId: true,
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
          },
        },
        variants: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            name: true,
            capacity: true,
            isDefault: true,
            unitNumber: true,
          },
        },
        images: {
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            url: true,
            alt: true,
            sortOrder: true,
          },
        },
        amenities: {
          select: {
            id: true,
            name: true,
            icon: true,
          },
        },
      },
      orderBy: [
        { category: { sortOrder: "asc" } },
        { sortOrder: "asc" },
      ],
    });

    return apiSuccess({
      resources,
      count: resources.length,
    });
  } catch (error) {
    return apiServerError(error);
  }
}
