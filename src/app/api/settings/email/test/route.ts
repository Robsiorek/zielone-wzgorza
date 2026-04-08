/**
 * POST /api/settings/email/test — Send test email.
 *
 * E3: OWNER only. Verifies SMTP configuration by sending a test email.
 * Body: { toAddress?: string } — if not provided, sends to current user's email.
 * Logs as EmailLogType.TEST, triggerSource ADMIN_TEST.
 * Does NOT require a reservation to exist.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, apiUnauthorized, apiForbidden, apiServerError } from "@/lib/api-response";
import { getAuthContext, hasMinRole } from "@/lib/require-auth";
import { emailService } from "@/lib/email-service";

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth) return apiUnauthorized();
    if (!hasMinRole(auth, "OWNER")) return apiForbidden();

    const body = await request.json().catch(() => ({}));

    // Use provided address or current user's email
    let toAddress = body.toAddress?.trim();
    if (!toAddress) {
      const user = await prisma.user.findUnique({
        where: { id: auth.user.id },
        select: { email: true },
      });
      toAddress = user?.email;
    }

    if (!toAddress) {
      return apiError("Podaj adres email do testu");
    }

    const result = await emailService.sendTestEmail(toAddress);

    if (result.success) {
      const dryRun = process.env.EMAIL_DRY_RUN === "true";
      return apiSuccess({
        message: dryRun
          ? `Email testowy zalogowany (tryb dry-run). Adres: ${toAddress}`
          : `Email testowy wysłany na ${toAddress}`,
        dryRun,
      });
    } else {
      return apiError(result.error || "Nie udało się wysłać emaila testowego", 500, "EMAIL_SEND_FAILED");
    }
  } catch (error) {
    return apiServerError(error);
  }
}
