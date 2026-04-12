/**
 * PATCH  /api/property-content/faq/[id] — Update FAQ item
 * DELETE /api/property-content/faq/[id] — Delete FAQ item
 *
 * B4: FAQ management. Pattern from B3 amenities/[id].
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, apiNotFound, apiServerError } from "@/lib/api-response";
import { getAuthContext, hasMinRole } from "@/lib/require-auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getAuthContext();
    if (!auth) return apiError("Brak autoryzacji", 401, "UNAUTHORIZED");
    if (!hasMinRole(auth, "MANAGER")) return apiError("Brak uprawnień", 403, "FORBIDDEN");

    const existing = await prisma.faqItem.findUnique({
      where: { id: params.id },
      select: { id: true, propertyId: true },
    });
    if (!existing) return apiNotFound("Pytanie FAQ nie znalezione");

    const body = await request.json();
    const data: Record<string, unknown> = {};

    if (body.question !== undefined) {
      const question = typeof body.question === "string" ? body.question.trim() : "";
      if (!question) return apiError("Pytanie jest wymagane", 400, "VALIDATION");
      if (question.length > 300) return apiError("Pytanie: maksymalnie 300 znaków", 400, "VALIDATION");
      data.question = question;
    }

    if (body.answer !== undefined) {
      const answer = typeof body.answer === "string" ? body.answer.trim() : "";
      if (!answer) return apiError("Odpowiedź jest wymagana", 400, "VALIDATION");
      if (answer.length > 5000) return apiError("Odpowiedź: maksymalnie 5000 znaków", 400, "VALIDATION");
      data.answer = answer;
    }

    if (body.isActive !== undefined) {
      data.isActive = Boolean(body.isActive);
    }

    if (Object.keys(data).length === 0) {
      return apiError("Brak pól do aktualizacji", 400, "VALIDATION");
    }

    const faqItem = await prisma.faqItem.update({
      where: { id: params.id },
      data,
    });

    return apiSuccess({ faqItem });
  } catch (error) {
    return apiServerError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getAuthContext();
    if (!auth) return apiError("Brak autoryzacji", 401, "UNAUTHORIZED");
    if (!hasMinRole(auth, "MANAGER")) return apiError("Brak uprawnień", 403, "FORBIDDEN");

    const existing = await prisma.faqItem.findUnique({
      where: { id: params.id },
      select: { id: true },
    });
    if (!existing) return apiNotFound("Pytanie FAQ nie znalezione");

    await prisma.faqItem.delete({ where: { id: params.id } });
    return apiSuccess({ deleted: true });
  } catch (error) {
    return apiServerError(error);
  }
}
