import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, apiServerError } from "@/lib/api-response";

export async function GET() {
  try {
    const ratePlans = await prisma.ratePlan.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        parent: { select: { id: true, name: true } },
        children: { select: { id: true, name: true, modifierType: true, modifierValue: true } },
        _count: { select: { priceEntries: true } },
      },
    });
    return apiSuccess({ ratePlans });
  } catch (error) {
    return apiServerError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, parentId, modifierType, modifierValue, cancellationPolicy, cancellationDays, isDefault } = body;

    if (!name) return apiError("Nazwa jest wymagana");

    const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    if (isDefault) {
      await prisma.ratePlan.updateMany({ data: { isDefault: false } });
    }

    const ratePlan = await prisma.ratePlan.create({
      data: {
        name,
        slug,
        description: description || null,
        parentId: parentId || null,
        modifierType: parentId ? (modifierType || "PERCENTAGE") : null,
        modifierValue: parentId && modifierValue ? parseFloat(modifierValue) : null,
        modifierValueMinor: parentId && modifierValue && (modifierType === "FIXED")
          ? Number(modifierValue) : null,
        cancellationPolicy: cancellationPolicy || "FLEXIBLE",
        cancellationDays: cancellationDays ? parseInt(cancellationDays) : null,
        isDefault: isDefault || false,
        sortOrder: await prisma.ratePlan.count(),
      },
      include: { parent: { select: { id: true, name: true } } },
    });

    return apiSuccess({ ratePlan }, 201);
  } catch (error) {
    return apiServerError(error);
  }
}
