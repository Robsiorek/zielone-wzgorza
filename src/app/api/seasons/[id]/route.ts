import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiNotFound, apiServerError } from "@/lib/api-response";
import { dateForDB } from "@/lib/dates";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const season = await prisma.season.findUnique({ where: { id: params.id } });
    if (!season) return apiNotFound("Sezon nie znaleziony");
    return apiSuccess({ season });
  } catch (error) {
    return apiServerError(error);
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const data: any = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.type !== undefined) data.type = body.type;
    if (body.startDate !== undefined) data.startDate = dateForDB(body.startDate);
    if (body.endDate !== undefined) data.endDate = dateForDB(body.endDate);
    if (body.color !== undefined) data.color = body.color || null;
    if (body.isActive !== undefined) data.isActive = body.isActive;
    if (body.priority !== undefined) data.priority = parseInt(body.priority) || 0;

    const season = await prisma.season.update({ where: { id: params.id }, data });
    return apiSuccess({ season });
  } catch (error) {
    return apiServerError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.season.delete({ where: { id: params.id } });
    return apiSuccess({ deleted: true });
  } catch (error) {
    return apiServerError(error);
  }
}
