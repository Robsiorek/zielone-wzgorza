/**
 * GET /api/timeline — Timeline entries for calendar view
 *
 * v5.0 — Multi-type resources, DateTime everywhere
 *
 * Params:
 *   startDate/endDate — date range filter (backward compat naming for frontend)
 *   type — BOOKING | OFFER | BLOCK
 *   resourceId — specific resource
 *   categoryType — ACCOMMODATION | TIME_SLOT | QUANTITY_TIME (filter by resource type)
 *   includeInactive — show cancelled entries too
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiServerError } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    // Accept both startDate/endDate (frontend compat) and startAt/endAt
    const startDate = searchParams.get("startDate") || searchParams.get("startAt");
    const endDate = searchParams.get("endDate") || searchParams.get("endAt");
    const resourceId = searchParams.get("resourceId");
    const type = searchParams.get("type");
    const categoryType = searchParams.get("categoryType");
    const includeInactive = searchParams.get("includeInactive") === "true";

    const where: any = {};

    if (startDate && endDate) {
      where.startAt = { lt: new Date(endDate + (endDate.includes("T") ? "" : "T23:59:59.999Z")) };
      where.endAt = { gt: new Date(startDate + (startDate.includes("T") ? "" : "T00:00:00.000Z")) };
    }

    if (resourceId) where.resourceId = resourceId;
    if (type) where.type = type;
    if (!includeInactive) where.status = "ACTIVE";

    // Filter by resource category type
    if (categoryType) {
      where.resource = { category: { type: categoryType } };
    }

    const entries = await prisma.timelineEntry.findMany({
      where,
      include: {
        resource: {
          select: {
            id: true, name: true, unitNumber: true, totalUnits: true,
            category: { select: { name: true, slug: true, type: true } },
          },
        },
        reservation: {
          select: {
            id: true, number: true, type: true, status: true,
            adults: true, children: true, total: true,
            paymentStatus: true, requiresAttention: true, overdue: true,
            client: {
              select: { id: true, firstName: true, lastName: true, companyName: true },
            },
            offerDetails: {
              select: { expiresAt: true, sentAt: true, viewedAt: true },
            },
            bookingDetails: {
              select: {
                confirmedAt: true, checkedInAt: true, checkedOutAt: true,
                paidAmount: true, balanceDue: true,
              },
            },
          },
        },
        reservationItem: {
          select: {
            id: true, categoryType: true, quantity: true,
            pricePerUnit: true, totalPrice: true,
            adults: true, children: true,
          },
        },
      },
      orderBy: { startAt: "asc" },
    });

    // Resources for calendar rows — filtered by categoryType if provided
    const resourceWhere: any = { status: "ACTIVE" };
    if (categoryType) {
      resourceWhere.category = { type: categoryType };
    } else {
      // Default: show ACCOMMODATION (backward compat for existing calendar)
      resourceWhere.category = { type: "ACCOMMODATION" };
    }

    const resources = await prisma.resource.findMany({
      where: resourceWhere,
      select: {
        id: true, name: true, unitNumber: true, maxCapacity: true, totalUnits: true,
        category: { select: { name: true, slug: true, type: true } },
      },
      orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }],
    });

    return apiSuccess({ entries, resources });
  } catch (error) {
    return apiServerError(error);
  }
}
