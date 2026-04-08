import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, apiServerError } from "@/lib/api-response";

export async function GET() {
  try {
    const tags = await prisma.tag.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { clients: true } } },
    });
    return apiSuccess({ tags });
  } catch (error) {
    return apiServerError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.name) return apiError("Nazwa tagu jest wymagana");

    const existing = await prisma.tag.findUnique({ where: { name: body.name } });
    if (existing) return apiSuccess({ tag: existing });

    const tag = await prisma.tag.create({
      data: { name: body.name, color: body.color || null },
    });
    return apiSuccess({ tag }, 201);
  } catch (error) {
    return apiServerError(error);
  }
}
