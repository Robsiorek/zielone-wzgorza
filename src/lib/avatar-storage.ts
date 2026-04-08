/**
 * Avatar Storage — abstraction layer.
 *
 * D0: LocalDiskStorage provider. Key format: {userId}/{cuid}.{ext}
 * Future: swap to S3Storage without changing endpoints.
 *
 * Usage:
 *   await avatarStorage.save(userId, file) → { key, url }
 *   await avatarStorage.delete(key)
 *   avatarStorage.getStream(key) → { stream, contentType } | null
 */

import { writeFile, mkdir, unlink } from "fs/promises";
import { existsSync, createReadStream } from "fs";
import { stat } from "fs/promises";
import path from "path";
import { Readable } from "stream";

// ── Types ──

export interface AvatarSaveResult {
  key: string;    // e.g. "abc123/cm9xyz.webp"
  url: string;    // e.g. "/api/avatars/abc123/cm9xyz.webp"
}

export interface AvatarStreamResult {
  stream: ReadableStream;
  contentType: string;
  size: number;
}

export interface AvatarStorageProvider {
  save(userId: string, fileBuffer: Buffer, ext: string): Promise<AvatarSaveResult>;
  delete(key: string): Promise<void>;
  getStream(key: string): Promise<AvatarStreamResult | null>;
}

// ── Key validation ──

const SAFE_KEY_PATTERN = /^[a-zA-Z0-9_\-]+\/[a-zA-Z0-9_\-]+\.(jpg|jpeg|png|webp)$/;

export function isValidAvatarKey(key: string): boolean {
  if (!key || key.includes("..") || key.startsWith("/")) return false;
  return SAFE_KEY_PATTERN.test(key);
}

// ── MIME mapping ──

const MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export function extFromMime(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
}

// ── Unique ID generator (no external deps) ──

function generateId(): string {
  const chars = "abcdefghijkmnpqrstuvwxyz23456789";
  let id = "";
  for (let i = 0; i < 12; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

// ══════════════════════════════════════════════════════════════════════
// LocalDiskStorage — saves to data/avatars/{userId}/{id}.{ext}
// ══════════════════════════════════════════════════════════════════════

const BASE_DIR = path.join(process.cwd(), "data", "avatars");

class LocalDiskStorage implements AvatarStorageProvider {
  async save(userId: string, fileBuffer: Buffer, ext: string): Promise<AvatarSaveResult> {
    const userDir = path.join(BASE_DIR, userId);
    if (!existsSync(userDir)) {
      await mkdir(userDir, { recursive: true });
    }

    // Delete old avatars for this user (only one avatar at a time)
    try {
      const { readdir } = await import("fs/promises");
      const files = await readdir(userDir);
      for (const f of files) {
        await unlink(path.join(userDir, f)).catch(() => {});
      }
    } catch { /* dir may not exist yet */ }

    const fileId = generateId();
    const filename = `${fileId}.${ext}`;
    const key = `${userId}/${filename}`;
    const filepath = path.join(BASE_DIR, key);

    if (!existsSync(userDir)) {
      await mkdir(userDir, { recursive: true });
    }

    await writeFile(filepath, fileBuffer);

    return {
      key,
      url: `/api/avatars/${key}`,
    };
  }

  async delete(key: string): Promise<void> {
    if (!isValidAvatarKey(key)) return;
    const filepath = path.join(BASE_DIR, key);
    try { await unlink(filepath); } catch { /* file may not exist */ }
  }

  async getStream(key: string): Promise<AvatarStreamResult | null> {
    if (!isValidAvatarKey(key)) return null;
    const filepath = path.join(BASE_DIR, key);
    if (!existsSync(filepath)) return null;

    const ext = key.split(".").pop()?.toLowerCase() || "";
    const contentType = MIME[ext] || "application/octet-stream";
    const stats = await stat(filepath);

    // Convert Node readable stream to Web ReadableStream
    const nodeStream = createReadStream(filepath);
    const webStream = Readable.toWeb(nodeStream) as ReadableStream;

    return { stream: webStream, contentType, size: stats.size };
  }
}

// ── Export singleton ──

export const avatarStorage: AvatarStorageProvider = new LocalDiskStorage();
