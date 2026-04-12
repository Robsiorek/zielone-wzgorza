/**
 * GET  /api/property-content/faq — List FAQ items (property-scoped, sorted by position)
 * POST /api/property-content/faq — Create a new FAQ item
 *
 * B4: FAQ section for property page.
 * Position: max(position) + 1 in transaction.
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

export async function GET() {
  try {
    const auth = await getAuthContext();
    if (!auth) return apiError("Brak autoryzacji", 401, "UNAUTHORIZED");

    const propertyId = await getPropertyId();
    const faqItems = await prisma.faqItem.findMany({
      where: { propertyId },
      orderBy: { position: "asc" },
    });

    return apiSuccess({ faqItems });
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
    const { question, answer } = body;

    // Validate question
    if (!question || typeof question !== "string" || question.trim().length === 0) {
      return apiError("Pytanie jest wymagane", 400, "VALIDATION");
    }
    if (question.trim().length > 300) {
      return apiError("Pytanie: maksymalnie 300 znaków", 400, "VALIDATION");
    }

    // Validate answer
    if (!answer || typeof answer !== "string" || answer.trim().length === 0) {
      return apiError("Odpowiedź jest wymagana", 400, "VALIDATION");
    }
    if (answer.trim().length > 5000) {
      return apiError("Odpowiedź: maksymalnie 5000 znaków", 400, "VALIDATION");
    }

    const propertyId = await getPropertyId();

    // Create in transaction: max(position) + 1
    const faqItem = await prisma.$transaction(async (tx) => {
      const maxPos = await tx.faqItem.aggregate({
        where: { propertyId },
        _max: { position: true },
      });
      const nextPosition = (maxPos._max.position ?? -1) + 1;

      return tx.faqItem.create({
        data: {
          propertyId,
          question: question.trim(),
          answer: answer.trim(),
          position: nextPosition,
          isActive: true,
        },
      });
    });

    return apiSuccess({ faqItem }, 201);
  } catch (error) {
    return apiServerError(error);
  }
}
