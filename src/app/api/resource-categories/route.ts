import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, apiServerError } from "@/lib/api-response";

export async function GET() {
  try {
    const categories = await prisma.resourceCategory.findMany({
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { resources: true } } },
    });
    return apiSuccess({ categories });
  } catch (error) {
    return apiServerError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, description, type, icon } = await request.json();
    if (!name) return apiError("Nazwa jest wymagana");
    const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const category = await prisma.resourceCategory.create({
      data: {
        name,
        slug,
        type: type || "ACCOMMODATION",
        icon: icon || null,
        description: description || null,
      },
    });
    return apiSuccess({ category }, 201);
  } catch (error) {
    return apiServerError(error);
  }
}
