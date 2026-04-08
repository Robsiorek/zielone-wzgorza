import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, apiServerError } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const active = searchParams.get("active");
    const required = searchParams.get("required");
    const scope = searchParams.get("scope");

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }
    if (active === "true") where.isActive = true;
    if (active === "false") where.isActive = false;
    if (required === "true") where.isRequired = true;
    if (required === "false") where.isRequired = false;
    if (scope === "GLOBAL" || scope === "PER_ITEM") where.scope = scope;

    const addons = await prisma.addon.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: {
        _count: { select: { reservationAddons: true } },
      },
    });

    return apiSuccess({ addons, total: addons.length });
  } catch (error) {
    return apiServerError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, pricingType, price, selectType, isRequired, sortOrder, scope } = body;

    if (!name || !name.trim()) {
      return apiError("Nazwa dodatku jest wymagana");
    }
    if (!pricingType) {
      return apiError("Typ rozliczenia jest wymagany");
    }
    if (price === undefined || price === null || Number(price) < 0) {
      return apiError("Cena musi być >= 0");
    }

    const priceMinor = Number(price);

    const validPricingTypes = ["PER_BOOKING", "PER_NIGHT", "PER_PERSON", "PER_PERSON_NIGHT", "PER_UNIT"];
    if (!validPricingTypes.includes(pricingType)) {
      return apiError("Nieprawidłowy typ rozliczenia: " + pricingType);
    }

    const validSelectTypes = ["CHECKBOX", "QUANTITY", "SELECT"];
    if (selectType && !validSelectTypes.includes(selectType)) {
      return apiError("Nieprawidłowy sposób wyboru: " + selectType);
    }

    const validScopes = ["GLOBAL", "PER_ITEM"];
    if (scope && !validScopes.includes(scope)) {
      return apiError("Nieprawidłowy zakres: " + scope);
    }

    const addon = await prisma.addon.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        scope: scope || "GLOBAL",
        pricingType,
        priceMinor,
        price: priceMinor / 100,
        selectType: selectType || "CHECKBOX",
        isRequired: isRequired === true,
        sortOrder: sortOrder ?? 0,
      },
    });

    return apiSuccess({ addon }, 201);
  } catch (error) {
    return apiServerError(error);
  }
}
