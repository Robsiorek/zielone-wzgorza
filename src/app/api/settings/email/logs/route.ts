/**
 * GET /api/settings/email/logs — Paginated email log with filters.
 *
 * E3b: Audit trail of all sent/failed emails.
 * Query: ?type=BOOKING_CONFIRMATION&status=SENT&triggerSource=SYSTEM&page=1&limit=50
 * Auth: OWNER+. Read-only.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiUnauthorized, apiForbidden, apiServerError } from "@/lib/api-response";
import { getAuthContext, hasMinRole } from "@/lib/require-auth";

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth) return apiUnauthorized();
    if (!hasMinRole(auth, "OWNER")) return apiForbidden();

    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "50")));
    const type = url.searchParams.get("type") || undefined;
    const status = url.searchParams.get("status") || undefined;
    const triggerSource = url.searchParams.get("triggerSource") || undefined;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (type) where.type = type;
    if (status) where.status = status;
    if (triggerSource) where.triggerSource = triggerSource;

    const [logs, total] = await Promise.all([
      prisma.emailLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          type: true,
          status: true,
          recipientEmail: true,
          recipientName: true,
          subject: true,
          triggerSource: true,
          attempts: true,
          sentAt: true,
          lastAttemptAt: true,
          errorMessage: true,
          createdAt: true,
          reservationId: true,
        },
      }),
      prisma.emailLog.count({ where }),
    ]);

    return apiSuccess({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return apiServerError(error);
  }
}
