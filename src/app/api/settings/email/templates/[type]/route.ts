/**
 * GET/PUT/DELETE /api/settings/email/templates/[type]
 *
 * E3b: Single template operations.
 * GET — returns template (custom from DB or default from code)
 * PUT — upsert custom template (subject + bodyHtml)
 * DELETE — reset to default (removes custom from DB)
 * Auth: OWNER+.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, apiUnauthorized, apiForbidden, apiServerError } from "@/lib/api-response";
import { getAuthContext, hasMinRole } from "@/lib/require-auth";
import { DEFAULT_TEMPLATES } from "@/lib/email-templates-default";

const VALID_TYPES = ["BOOKING_CONFIRMATION", "PAYMENT_REMINDER", "STATUS_CONFIRMED", "STATUS_CANCELLED"];

export async function GET(request: NextRequest, { params }: { params: { type: string } }) {
  try {
    const auth = await getAuthContext();
    if (!auth) return apiUnauthorized();
    if (!hasMinRole(auth, "OWNER")) return apiForbidden();

    const type = params.type.toUpperCase();
    if (!VALID_TYPES.includes(type)) {
      return apiError("Nieprawidłowy typ szablonu", 400, "INVALID_TYPE");
    }

    const custom = await prisma.emailTemplate.findUnique({
      where: { type: type as any },
      include: { updatedByUser: { select: { firstName: true, lastName: true } } },
    });

    const defaultTpl = DEFAULT_TEMPLATES[type];

    return apiSuccess({
      type,
      isCustom: !!custom,
      subject: custom?.subject || defaultTpl?.subject || "",
      bodyHtml: custom?.bodyHtml || defaultTpl?.bodyHtml || "",
      defaultSubject: defaultTpl?.subject || "",
      defaultBodyHtml: defaultTpl?.bodyHtml || "",
      updatedAt: custom?.updatedAt || null,
      updatedBy: custom?.updatedByUser
        ? `${custom.updatedByUser.firstName} ${custom.updatedByUser.lastName}`
        : null,
    });
  } catch (error) {
    return apiServerError(error);
  }
}

export async function PUT(request: NextRequest, { params }: { params: { type: string } }) {
  try {
    const auth = await getAuthContext();
    if (!auth) return apiUnauthorized();
    if (!hasMinRole(auth, "OWNER")) return apiForbidden();

    const type = params.type.toUpperCase();
    if (!VALID_TYPES.includes(type)) {
      return apiError("Nieprawidłowy typ szablonu", 400, "INVALID_TYPE");
    }

    const body = await request.json();
    const subject = body.subject?.trim();
    const bodyHtml = body.bodyHtml?.trim();

    if (!subject) return apiError("Temat wiadomości jest wymagany");
    if (!bodyHtml) return apiError("Treść HTML jest wymagana");
    if (bodyHtml.length > 100000) return apiError("Treść HTML jest za długa (max 100KB)");

    const template = await prisma.emailTemplate.upsert({
      where: { type: type as any },
      create: {
        type: type as any,
        subject,
        bodyHtml,
        updatedByUserId: auth.user.id,
      },
      update: {
        subject,
        bodyHtml,
        updatedByUserId: auth.user.id,
      },
    });

    return apiSuccess({ template: { type: template.type, subject: template.subject, isCustom: true } });
  } catch (error) {
    return apiServerError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { type: string } }) {
  try {
    const auth = await getAuthContext();
    if (!auth) return apiUnauthorized();
    if (!hasMinRole(auth, "OWNER")) return apiForbidden();

    const type = params.type.toUpperCase();
    if (!VALID_TYPES.includes(type)) {
      return apiError("Nieprawidłowy typ szablonu", 400, "INVALID_TYPE");
    }

    await prisma.emailTemplate.deleteMany({ where: { type: type as any } });

    return apiSuccess({ message: "Przywrócono domyślny szablon" });
  } catch (error) {
    return apiServerError(error);
  }
}
