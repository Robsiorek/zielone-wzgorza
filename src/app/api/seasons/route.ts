import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, apiServerError } from "@/lib/api-response";
import { dateForDB } from "@/lib/dates";

export async function GET() {
  try {
    const seasons = await prisma.season.findMany({
      orderBy: { startDate: "asc" },
      include: { _count: { select: { priceEntries: true } } },
    });
    return apiSuccess({ seasons });
  } catch (error) {
    return apiServerError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, type, startDate, endDate, color, priority } = await request.json();
    if (!name || !type || !startDate || !endDate) {
      return apiError("Nazwa, typ i daty są wymagane");
    }
    const season = await prisma.season.create({
      data: { name, type, startDate: dateForDB(startDate), endDate: dateForDB(endDate), color: color || null, priority: typeof priority === "number" ? priority : 10 },
    });
    return apiSuccess({ season }, 201);
  } catch (error) {
    return apiServerError(error);
  }
}
