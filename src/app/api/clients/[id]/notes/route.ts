import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, apiServerError } from "@/lib/api-response";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const notes = await prisma.clientNote.findMany({
      where: { clientId: params.id },
      include: { user: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    });
    return apiSuccess({ notes });
  } catch (error) {
    return apiServerError(error);
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    if (!body.content) return apiError("Treść notatki jest wymagana");

    // For now, use first admin user
    const admin = await prisma.user.findFirst({ where: { role: "OWNER" } });
    if (!admin) return apiError("Brak użytkownika", 500);

    const note = await prisma.clientNote.create({
      data: {
        clientId: params.id,
        userId: admin.id,
        content: body.content,
        isPinned: body.isPinned || false,
      },
      include: { user: { select: { id: true, firstName: true, lastName: true } } },
    });

    // Activity log
    await prisma.clientActivity.create({
      data: {
        clientId: params.id,
        action: "NOTE_ADDED",
        description: "Dodano notatkę",
        userId: admin.id,
      },
    });

    // Update lastActivityAt
    await prisma.client.update({
      where: { id: params.id },
      data: { lastActivityAt: new Date() },
    });

    return apiSuccess({ note }, 201);
  } catch (error) {
    return apiServerError(error);
  }
}
