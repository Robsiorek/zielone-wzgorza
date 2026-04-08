import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, apiServerError } from "@/lib/api-response";

// PATCH /api/resources/reorder
// Body: { order: [{ id: "...", sortOrder: 0 }, { id: "...", sortOrder: 1 }, ...] }
export async function PATCH(request: NextRequest) {
  try {
    const { order } = await request.json();

    if (!order || !Array.isArray(order) || order.length === 0) {
      return apiError("Tablica kolejności jest wymagana");
    }

    await prisma.$transaction(
      order.map((item: { id: string; sortOrder: number }) =>
        prisma.resource.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        })
      )
    );

    return apiSuccess({ updated: order.length });
  } catch (error) {
    return apiServerError(error);
  }
}
