import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, apiNotFound, apiServerError } from "@/lib/api-response";

// Helper: update lastActivityAt
async function updateLastActivity(clientId: string) {
  await prisma.client.update({ where: { id: clientId }, data: { lastActivityAt: new Date() } });
}

// Helper: log activity
async function logActivity(clientId: string, action: string, description: string, extra?: { userId?: string; metadata?: any }) {
  await prisma.clientActivity.create({
    data: {
      clientId,
      action: action as any,
      description,
      userId: extra?.userId || null,
      metadata: extra?.metadata || null,
      activitySource: "ADMIN",
    },
  });
  await updateLastActivity(clientId);
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const client = await prisma.client.findUnique({
      where: { id: params.id },
      include: {
        stats: { select: { id: true, totalSpent: true, totalBookings: true, totalNights: true, averageSpend: true, firstBookingAt: true, lastBookingAt: true, loyaltyTier: true } },
        billingProfiles: true,
        guestProfile: true,
        consent: true,
        tags: { include: { tag: true } },
        notes: {
          include: { user: { select: { id: true, firstName: true, lastName: true } } },
          orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
          take: 20,
        },
        assignedUser: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { reservations: true, notes: true, activities: true } },
      },
    });
    if (!client) return apiNotFound("Klient nie znaleziony");
    return apiSuccess({ client });
  } catch (error) {
    return apiServerError(error);
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { billingProfile, guestProfile, consent, tagIds, accountData, ...clientData } = body;

    if (clientData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientData.email)) {
      return apiError("Nieprawidłowy adres e-mail");
    }

    // Get old data for change detection
    const old = await prisma.client.findUnique({
      where: { id: params.id },
      select: { status: true, leadStatus: true },
    });
    if (!old) return apiNotFound("Klient nie znaleziony");

    const statusChanged = clientData.status && old.status !== clientData.status;
    const leadStatusChanged = clientData.leadStatus && old.leadStatus !== clientData.leadStatus;

    // Update client
    const client = await prisma.client.update({
      where: { id: params.id },
      data: { ...clientData, lastActivityAt: new Date() },
      include: {
        tags: { include: { tag: true } },
        billingProfiles: true,
        guestProfile: true,
        consent: true,
        assignedUser: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { reservations: true } },
      },
    });

    // Guest profile
    if (guestProfile !== undefined) {
      if (guestProfile.sameAsClient) {
        await prisma.clientGuestProfile.deleteMany({ where: { clientId: params.id } });
      } else {
        await prisma.clientGuestProfile.upsert({
          where: { clientId: params.id },
          create: { clientId: params.id, ...guestProfile },
          update: guestProfile,
        });
      }
    }

    // Consent
    if (consent !== undefined) {
      await prisma.clientConsent.upsert({
        where: { clientId: params.id },
        create: { clientId: params.id, ...consent },
        update: consent,
      });
    }

    // Tags — connect/disconnect instead of delete+recreate
    if (tagIds !== undefined) {
      const currentTags = await prisma.clientTag.findMany({ where: { clientId: params.id }, select: { tagId: true } });
      const currentIds = currentTags.map(t => t.tagId);
      const toAdd = tagIds.filter((id: string) => !currentIds.includes(id));
      const toRemove = currentIds.filter(id => !tagIds.includes(id));

      if (toRemove.length > 0) {
        await prisma.clientTag.deleteMany({ where: { clientId: params.id, tagId: { in: toRemove } } });
        for (const tagId of toRemove) {
          const tag = await prisma.tag.findUnique({ where: { id: tagId }, select: { name: true } });
          await logActivity(params.id, "TAG_REMOVED", "Usunięto tag: " + (tag?.name || tagId));
        }
      }
      if (toAdd.length > 0) {
        await prisma.clientTag.createMany({ data: toAdd.map((tagId: string) => ({ clientId: params.id, tagId })) });
        for (const tagId of toAdd) {
          const tag = await prisma.tag.findUnique({ where: { id: tagId }, select: { name: true } });
          await logActivity(params.id, "TAG_ADDED", "Dodano tag: " + (tag?.name || tagId));
        }
      }
    }

    // Activity logs
    await logActivity(params.id, "UPDATED", "Dane klienta zaktualizowane");
    if (statusChanged) {
      await logActivity(params.id, "STATUS_CHANGED", "Status: " + old.status + " → " + clientData.status, {
        metadata: { from: old.status, to: clientData.status },
      });
    }

    return apiSuccess({ client });
  } catch (error) {
    return apiServerError(error);
  }
}

// SOFT DELETE — archive instead of physical delete
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const client = await prisma.client.findUnique({ where: { id: params.id }, select: { status: true } });
    if (!client) return apiNotFound("Klient nie znaleziony");

    await prisma.client.update({
      where: { id: params.id },
      data: {
        status: "ARCHIVED",
        archivedAt: new Date(),
        lastActivityAt: new Date(),
      },
    });

    await logActivity(params.id, "ARCHIVED", "Klient zarchiwizowany (poprzedni status: " + client.status + ")", {
      metadata: { previousStatus: client.status },
    });

    return apiSuccess({ message: "Klient zarchiwizowany" });
  } catch (error) {
    return apiServerError(error);
  }
}
