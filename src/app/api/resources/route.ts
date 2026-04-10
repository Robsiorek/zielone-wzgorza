import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, apiServerError } from "@/lib/api-response";
import { enrichImagesWithUrls } from "@/lib/storage/image-urls";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const where: any = {};
    if (categoryId) where.categoryId = categoryId;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { longDescription: { contains: search, mode: "insensitive" } },
      ];
    }

    const resources = await prisma.resource.findMany({
      where,
      include: {
        category: true,
        variants: { orderBy: { sortOrder: "asc" } },
        images: { orderBy: { position: "asc" }, take: 1 },
        amenities: true,
        _count: { select: { variants: true, images: true, beds: true, reservationItems: true } },
      },
      orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }, { name: "asc" }],
    });

    // Enrich cover images with runtime URLs
    const enrichedResources = resources.map((r) => ({
      ...r,
      images: enrichImagesWithUrls(r.images),
    }));

    return apiSuccess({ resources: enrichedResources });
  } catch (error) {
    return apiServerError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, categoryId, longDescription, shortDescription, maxCapacity, status, totalUnits, location, unitNumber } = body;

    if (!name || !categoryId) {
      return apiError("Nazwa i kategoria są wymagane");
    }

    // Generate unique slug
    let baseSlug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.resource.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter++}`;
    }

    const resource = await prisma.resource.create({
      data: {
        name,
        slug,
        categoryId,
        longDescription: longDescription || null,
        shortDescription: shortDescription || null,
        maxCapacity: maxCapacity ? parseInt(maxCapacity) : null,
        totalUnits: totalUnits ? parseInt(totalUnits) : 1,
        location: location || null,
        unitNumber: unitNumber || null,
        status: status || "ACTIVE",
      },
      include: { category: true, variants: true },
    });

    return apiSuccess({ resource }, 201);
  } catch (error) {
    return apiServerError(error);
  }
}
