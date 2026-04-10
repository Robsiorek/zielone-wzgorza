import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, apiNotFound, apiServerError } from "@/lib/api-response";
import { enrichImagesWithUrls } from "@/lib/storage/image-urls";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const resource = await prisma.resource.findUnique({
      where: { id: params.id },
      include: {
        category: true,
        variants: { orderBy: { sortOrder: "asc" } },
        images: { orderBy: { position: "asc" } },
        amenities: true,
        beds: { orderBy: { bedType: "asc" } },
      },
    });
    if (!resource) return apiNotFound("Zasób nie znaleziony");

    const enrichedResource = {
      ...resource,
      images: enrichImagesWithUrls(resource.images),
    };

    return apiSuccess({ resource: enrichedResource });
  } catch (error) {
    return apiServerError(error);
  }
}

/** PATCH — partial update (was PUT, aligned to MP contract in B2) */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const data: Record<string, unknown> = {};

    // Name + slug
    if (body.name) {
      data.name = body.name;
      data.slug = body.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    }
    if (body.categoryId) data.categoryId = body.categoryId;
    if (body.unitNumber !== undefined) data.unitNumber = body.unitNumber || null;
    if (body.status) data.status = body.status;
    if (body.visibleInWidget !== undefined) data.visibleInWidget = Boolean(body.visibleInWidget);

    // Numeric fields
    if (body.maxCapacity !== undefined) data.maxCapacity = body.maxCapacity ? parseInt(body.maxCapacity) : null;
    if (body.totalUnits !== undefined) data.totalUnits = parseInt(body.totalUnits) || 1;
    if (body.location !== undefined) data.location = body.location || null;

    // B2: Content fields (renamed, ADR-14)
    if (body.shortDescription !== undefined) {
      const val = typeof body.shortDescription === "string" ? body.shortDescription.trim() : null;
      if (val && val.length > 200) return apiError("shortDescription: maksymalnie 200 znaków", 400, "VALIDATION");
      data.shortDescription = val || null;
    }
    if (body.longDescription !== undefined) {
      const val = typeof body.longDescription === "string" ? body.longDescription.trim() : null;
      if (val && val.length > 10000) return apiError("longDescription: maksymalnie 10000 znaków", 400, "VALIDATION");
      data.longDescription = val || null;
    }
    if (body.areaSqm !== undefined) {
      const val = body.areaSqm === null || body.areaSqm === "" ? null : parseInt(body.areaSqm);
      if (val !== null && (!Number.isInteger(val) || val < 1 || val > 9999)) {
        return apiError("areaSqm: liczba całkowita 1–9999", 400, "VALIDATION");
      }
      data.areaSqm = val;
    }
    if (body.bedroomCount !== undefined) {
      const val = body.bedroomCount === null || body.bedroomCount === "" ? null : parseInt(body.bedroomCount);
      if (val !== null && (!Number.isInteger(val) || val < 0 || val > 50)) {
        return apiError("bedroomCount: liczba całkowita 0–50", 400, "VALIDATION");
      }
      data.bedroomCount = val;
    }
    if (body.bathroomCount !== undefined) {
      const val = body.bathroomCount === null || body.bathroomCount === "" ? null : parseInt(body.bathroomCount);
      if (val !== null && (!Number.isInteger(val) || val < 0 || val > 50)) {
        return apiError("bathroomCount: liczba całkowita 0–50", 400, "VALIDATION");
      }
      data.bathroomCount = val;
    }

    const resource = await prisma.resource.update({
      where: { id: params.id },
      data,
      include: {
        category: true,
        variants: true,
        images: { orderBy: { position: "asc" } },
        amenities: true,
        beds: { orderBy: { bedType: "asc" } },
      },
    });

    const enrichedResource = {
      ...resource,
      images: enrichImagesWithUrls(resource.images),
    };

    return apiSuccess({ resource: enrichedResource });
  } catch (error) {
    return apiServerError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.resource.delete({ where: { id: params.id } });
    return apiSuccess({ deleted: true });
  } catch (error) {
    return apiServerError(error);
  }
}
