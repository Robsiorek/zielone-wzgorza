/**
 * B1 Local Media Storage — filesystem (dev/fallback).
 *
 * Files stored in LOCAL_MEDIA_DIR (default: data/media/).
 * Public URL: /api/public/media/{key} — streaming endpoint.
 *
 * Used when STORAGE_PROVIDER=local (default for development).
 */

import fs from "fs/promises";
import path from "path";
import type { MediaStorageProvider } from "./media-storage";

export class LocalMediaStorage implements MediaStorageProvider {
  private baseDir: string;

  constructor() {
    const dir = process.env.LOCAL_MEDIA_DIR || "data/media";
    // Resolve relative to CWD (project root on VPS: /var/www/admin/)
    this.baseDir = path.isAbsolute(dir) ? dir : path.resolve(process.cwd(), dir);
  }

  async save(buffer: Buffer, key: string, _mimeType: string): Promise<void> {
    const filePath = path.join(this.baseDir, key);
    const dirPath = path.dirname(filePath);

    await fs.mkdir(dirPath, { recursive: true });
    await fs.writeFile(filePath, buffer);
  }

  async delete(key: string): Promise<void> {
    const filePath = path.join(this.baseDir, key);
    try {
      await fs.unlink(filePath);
    } catch (error) {
      // Best-effort — file may not exist, log warning
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        console.warn(`[LocalStorage] Delete failed for key "${key}":`, error);
      }
    }
  }

  getPublicUrl(key: string): string {
    // Served by GET /api/public/media/[...key]
    return `/api/public/media/${key}`;
  }

  async exists(key: string): Promise<boolean> {
    const filePath = path.join(this.baseDir, key);
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get the full filesystem path for a key.
   * Used by the streaming endpoint /api/public/media/[...key].
   */
  getFilePath(key: string): string {
    return path.join(this.baseDir, key);
  }
}
