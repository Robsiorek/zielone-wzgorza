import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, apiServerError } from "@/lib/api-response";

// Atomic client number via PostgreSQL sequence
async function generateClientNumber(): Promise<string> {
  const result: any[] = await prisma.$queryRaw`SELECT nextval('client_number_seq') as num`;
  const num = Number(result[0].num);
  return "KL-" + String(num).padStart(4, "0");
}

// Duplicate detection
async function findDuplicates(data: any, excludeId?: string) {
  const conditions: any[] = [];
  if (data.email) conditions.push({ email: { equals: data.email, mode: "insensitive" } });
  if (data.phone) conditions.push({ phone: data.phone });
  if (data.companyName && data.nip) conditions.push({ AND: [{ companyName: { equals: data.companyName, mode: "insensitive" } }, { nip: data.nip }] });
  if (data.firstName && data.lastName) {
    const nameCond: any = { AND: [{ firstName: { equals: data.firstName, mode: "insensitive" } }, { lastName: { equals: data.lastName, mode: "insensitive" } }] };
    if (data.email) nameCond.AND.push({ email: { equals: data.email, mode: "insensitive" } });
    else if (data.phone) nameCond.AND.push({ phone: data.phone });
    conditions.push(nameCond);
  }
  if (conditions.length === 0) return [];
  const where: any = { OR: conditions };
  if (excludeId) where.NOT = { id: excludeId };
  return prisma.client.findMany({ where, select: { id: true, clientNumber: true, firstName: true, lastName: true, companyName: true, email: true, phone: true }, take: 5 });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const segment = searchParams.get("segment");
    const source = searchParams.get("source");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortDir = searchParams.get("sortDir") || "desc";

    const where: any = { status: { not: "ARCHIVED" } };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { companyName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { clientNumber: { contains: search, mode: "insensitive" } },
        { contactFirstName: { contains: search, mode: "insensitive" } },
        { contactLastName: { contains: search, mode: "insensitive" } },
      ];
    }
    if (status) where.status = status;
    if (type) where.type = type;
    if (segment) where.segment = segment;
    if (source) where.source = source;

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        include: {
          tags: { include: { tag: true } },
          assignedUser: { select: { id: true, firstName: true, lastName: true } },
          _count: { select: { reservations: true } },
        },
        orderBy: { [sortBy]: sortDir },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.client.count({ where }),
    ]);

    return apiSuccess({
      clients,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return apiServerError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.firstName && !body.companyName) {
      return apiError("Imię lub nazwa firmy jest wymagana");
    }
    if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      return apiError("Nieprawidłowy adres e-mail");
    }

    // Duplicate check
    const duplicates = await findDuplicates(body);
    if (duplicates.length > 0 && !body.skipDuplicateCheck) {
      return apiSuccess({
        warning: "Znaleziono potencjalnych duplikatów",
        duplicates,
        requireConfirmation: true,
      }, 409);
    }

    const clientNumber = await generateClientNumber();
    const { billingProfile, guestProfile, consent, tagIds, accountData, skipDuplicateCheck, ...clientData } = body;

    const client = await prisma.client.create({
      data: {
        ...clientData,
        clientNumber,
        ...(billingProfile && !billingProfile.sameAsClient ? {
          billingProfiles: { create: { ...billingProfile, isDefault: true } },
        } : {}),
        ...(guestProfile && !guestProfile.sameAsClient ? {
          guestProfile: { create: guestProfile },
        } : {}),
        ...(consent ? {
          consent: { create: consent },
        } : {}),
        ...(tagIds && tagIds.length > 0 ? {
          tags: { create: tagIds.map((tagId: string) => ({ tagId })) },
        } : {}),
        activities: {
          create: { action: "CREATED", description: "Klient utworzony" },
        },
      },
      include: {
        tags: { include: { tag: true } },
        billingProfiles: true,
        guestProfile: true,
        consent: true,
        assignedUser: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { reservations: true } },
      },
    });

    return apiSuccess({ client }, 201);
  } catch (error) {
    return apiServerError(error);
  }
}
