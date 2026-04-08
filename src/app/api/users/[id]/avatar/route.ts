/**
 * POST /api/users/[id]/avatar — Upload user avatar
 * DELETE /api/users/[id]/avatar — Remove avatar
 *
 * D0: Uses avatarStorage abstraction (LocalDisk → future S3).
 * Server generates key — never trusts client filename.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, apiUnauthorized, apiForbidden, apiNotFound, apiServerError } from "@/lib/api-response";
import { getAuthContext, hasMinRole } from "@/lib/require-auth";
import { avatarStorage, extFromMime } from "@/lib/avatar-storage";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await getAuthContext();
    if (!auth) return apiUnauthorized();
    if (!hasMinRole(auth, "OWNER")) return apiForbidden();

    const userId = params.id;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return apiNotFound("Użytkownik nie znaleziony");

    const formData = await request.formData();
    const file = formData.get("avatar") as File | null;
    if (!file) return apiError("Brak pliku");

    if (!ALLOWED_TYPES.includes(file.type)) {
      return apiError("Dozwolone formaty: JPG, PNG, WebP");
    }
    if (file.size > MAX_SIZE) {
      return apiError("Maksymalny rozmiar pliku: 5 MB");
    }

    // Delete old avatar if exists
    if (user.avatar) {
      const oldKey = user.avatar.replace("/api/avatars/", "");
      await avatarStorage.delete(oldKey);
    }

    // Server generates key — never trusts client filename
    const ext = extFromMime(file.type);
    const buffer = Buffer.from(await file.arrayBuffer());
    const { key, url } = await avatarStorage.save(userId, buffer, ext);

    // Store URL in DB (key is embedded in URL)
    await prisma.user.update({
      where: { id: userId },
      data: { avatar: url },
    });

    return apiSuccess({ avatar: url, key });
  } catch (error) {
    return apiServerError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await getAuthContext();
    if (!auth) return apiUnauthorized();
    if (!hasMinRole(auth, "OWNER")) return apiForbidden();

    const userId = params.id;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return apiNotFound("Użytkownik nie znaleziony");

    if (user.avatar) {
      const key = user.avatar.replace("/api/avatars/", "");
      await avatarStorage.delete(key);
    }

    await prisma.user.update({
      where: { id: userId },
      data: { avatar: null },
    });

    return apiSuccess({ avatar: null });
  } catch (error) {
    return apiServerError(error);
  }
}
