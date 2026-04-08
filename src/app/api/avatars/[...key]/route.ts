/**
 * GET /api/avatars/[...key] — Serve avatar image (streaming)
 *
 * Key format: {userId}/{fileId}.{ext}
 * Uses avatarStorage.getStream() — streams from disk, not loads into RAM.
 * Immutable cache: key changes on every upload (unique fileId).
 * 404 on missing file, never 500.
 */

import { NextRequest } from "next/server";
import { avatarStorage, isValidAvatarKey } from "@/lib/avatar-storage";

export async function GET(_request: NextRequest, { params }: { params: { key: string[] } }) {
  const key = params.key.join("/");

  if (!isValidAvatarKey(key)) {
    return new Response("Not found", { status: 404 });
  }

  const result = await avatarStorage.getStream(key);
  if (!result) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(result.stream, {
    headers: {
      "Content-Type": result.contentType,
      "Content-Length": String(result.size),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
