/**
 * GET /api/settings/email/templates — List all email templates.
 *
 * E3b: Returns 4 template types with status (custom or default).
 * Auth: OWNER+.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiUnauthorized, apiForbidden, apiServerError } from "@/lib/api-response";
import { getAuthContext, hasMinRole } from "@/lib/require-auth";
import { DEFAULT_TEMPLATES } from "@/lib/email-templates-default";

const TEMPLATE_META: Record<string, { label: string; description: string }> = {
  BOOKING_CONFIRMATION: {
    label: "Potwierdzenie rezerwacji",
    description: "Wysyłany automatycznie po złożeniu rezerwacji przez klienta",
  },
  PAYMENT_REMINDER: {
    label: "Przypomnienie o wpłacie",
    description: "Wysyłany automatycznie do rezerwacji oczekujących na wpłatę",
  },
  STATUS_CONFIRMED: {
    label: "Rezerwacja potwierdzona",
    description: "Wysyłany po potwierdzeniu rezerwacji przez administratora",
  },
  STATUS_CANCELLED: {
    label: "Rezerwacja anulowana",
    description: "Wysyłany po anulowaniu rezerwacji",
  },
};

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth) return apiUnauthorized();
    if (!hasMinRole(auth, "OWNER")) return apiForbidden();

    const customTemplates = await prisma.emailTemplate.findMany();
    const customMap = new Map(customTemplates.map(t => [t.type, t]));

    const templates = Object.keys(TEMPLATE_META).map(type => {
      const custom = customMap.get(type as any);
      const defaultTpl = DEFAULT_TEMPLATES[type];
      const meta = TEMPLATE_META[type];

      return {
        type,
        label: meta.label,
        description: meta.description,
        isCustom: !!custom,
        subject: custom?.subject || defaultTpl?.subject || "",
        updatedAt: custom?.updatedAt || null,
        updatedByUserId: custom?.updatedByUserId || null,
      };
    });

    return apiSuccess({ templates });
  } catch (error) {
    return apiServerError(error);
  }
}
