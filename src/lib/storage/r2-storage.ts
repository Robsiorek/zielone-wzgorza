/**
 * B1 R2 Storage Provider — Cloudflare R2 (production).
 *
 * Uses @aws-sdk/client-s3 (R2 is S3-compatible).
 * Direct public URL via R2_PUBLIC_DOMAIN (ADR-12).
 *
 * Required env:
 *   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY,
 *   R2_BUCKET_NAME, R2_PUBLIC_DOMAIN
 */

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import type { MediaStorageProvider } from "./media-storage";

export class R2StorageProvider implements MediaStorageProvider {
  private client: S3Client;
  private bucket: string;
  private publicDomain: string;

  constructor() {
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const bucket = process.env.R2_BUCKET_NAME;
    const publicDomain = process.env.R2_PUBLIC_DOMAIN;

    if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicDomain) {
      throw new Error(
        "[R2StorageProvider] Brakujące zmienne env: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, " +
        "R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_DOMAIN"
      );
    }

    this.bucket = bucket;
    this.publicDomain = publicDomain.replace(/\/$/, "");

    this.client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  async save(buffer: Buffer, key: string, mimeType: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
        CacheControl: "public, max-age=31536000, immutable",
      })
    );
  }

  async delete(key: string): Promise<void> {
    try {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        })
      );
    } catch (error) {
      // Best-effort — log warning, don't throw
      console.warn(`[R2] Delete failed for key "${key}":`, error);
    }
  }

  getPublicUrl(key: string): string {
    return `${this.publicDomain}/${key}`;
  }

  async exists(key: string): Promise<boolean> {
    try {
      await this.client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: key,
        })
      );
      return true;
    } catch {
      return false;
    }
  }
}
