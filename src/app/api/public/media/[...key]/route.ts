/**
 * GET /api/public/media/[...key] — Dev/local media streaming.
 *
 * Serves images from LocalMediaStorage filesystem.
 * Only active when STORAGE_PROVIDER=local (dev/fallback).
 * In production, images are served directly from R2 CDN (ADR-12).
 *
 * No auth — public endpoint (consistent with /api/public/*).
 * Cache: 1 year immutable (files are content-addressed by UUID).
 */

import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function GET(
  _request: NextRequest,
  { params }: { params: { key: string[] } }
) {
  // Only serve when STORAGE_PROVIDER is local
  const provider = process.env.STORAGE_PROVIDER || "local";
  if (provider !== "local") {
    return NextResponse.json(
      { error: "Media endpoint dostępny tylko w trybie local" },
      { status: 404 }
    );
  }

  const key = params.key.join("/");

  // Validate key — prevent directory traversal
  if (key.includes("..") || key.startsWith("/")) {
    return NextResponse.json({ error: "Nieprawidłowa ścieżka" }, { status: 400 });
  }

  const baseDir = process.env.LOCAL_MEDIA_DIR || "data/media";
  const resolvedBase = path.isAbsolute(baseDir) ? baseDir : path.resolve(process.cwd(), baseDir);
  const filePath = path.join(resolvedBase, key);

  // Security: ensure resolved path is within base dir
  if (!filePath.startsWith(resolvedBase)) {
    return NextResponse.json({ error: "Nieprawidłowa ścieżka" }, { status: 400 });
  }

  try {
    const buffer = await fs.readFile(filePath);

    // Determine content type from extension
    const ext = path.extname(filePath).toLowerCase();
    const contentTypes: Record<string, string> = {
      ".webp": "image/webp",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
    };

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentTypes[ext] || "application/octet-stream",
        "Content-Length": String(buffer.length),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return NextResponse.json({ error: "Plik nie znaleziony" }, { status: 404 });
    }
    return NextResponse.json({ error: "Błąd odczytu pliku" }, { status: 500 });
  }
}
