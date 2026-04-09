/**
 * B1 Image processor.
 *
 * Responsibilities:
 * 1. MIME validation by magic bytes (not file extension)
 * 2. EXIF orientation normalization (sharp.rotate())
 * 3. Resize to 3 variants: thumbnail (400px), medium (800px), original (max 1600px)
 * 4. Convert all to WebP
 * 5. SHA-256 checksum of original upload buffer
 *
 * Accepted: JPEG (FFD8FF), PNG (89504E47), WebP (RIFF...WEBP)
 * Max input: 5MB (validated before calling processImage)
 */

import sharp from "sharp";
import { createHash } from "crypto";
import type { ProcessedImage } from "@/types/media";

/** Maximum file size in bytes (5MB) */
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

/** Maximum images per resource */
export const MAX_IMAGES_PER_RESOURCE = 20;

/** Resize widths for each variant */
const SIZES = {
  original: 1600,
  medium: 800,
  thumbnail: 400,
} as const;

/** WebP quality (balances quality vs size) */
const WEBP_QUALITY = 82;

/**
 * Allowed MIME types and their magic byte signatures.
 * Validation is done on the first N bytes, not on file extension.
 */
const MAGIC_SIGNATURES: Array<{ mime: string; bytes: number[]; offset?: number }> = [
  { mime: "image/jpeg", bytes: [0xFF, 0xD8, 0xFF] },
  { mime: "image/png", bytes: [0x89, 0x50, 0x4E, 0x47] },
  // WebP: starts with RIFF, then 4 bytes of file size, then WEBP
  { mime: "image/webp", bytes: [0x52, 0x49, 0x46, 0x46] },
];

/** Additional check for WebP — bytes 8-11 must be "WEBP" */
const WEBP_MARKER = [0x57, 0x45, 0x42, 0x50];

/**
 * Validate MIME type by reading magic bytes from buffer.
 * Returns detected MIME or null if not recognized.
 */
export function detectMimeType(buffer: Buffer): string | null {
  if (buffer.length < 12) return null;

  for (const sig of MAGIC_SIGNATURES) {
    const offset = sig.offset ?? 0;
    const matches = sig.bytes.every((byte, i) => buffer[offset + i] === byte);
    if (matches) {
      // Extra check for WebP: bytes 8-11 must be "WEBP"
      if (sig.mime === "image/webp") {
        const webpMatch = WEBP_MARKER.every((byte, i) => buffer[8 + i] === byte);
        if (!webpMatch) return null;
      }
      return sig.mime;
    }
  }

  return null;
}

/**
 * Validate that the buffer is an accepted image format.
 * Throws descriptive error if invalid.
 */
export function validateImageBuffer(buffer: Buffer, fileName?: string): void {
  if (buffer.length > MAX_IMAGE_SIZE) {
    throw new ImageProcessingError(
      `Plik${fileName ? ` "${fileName}"` : ""} przekracza limit 5MB (${(buffer.length / 1024 / 1024).toFixed(1)}MB)`
    );
  }

  const mime = detectMimeType(buffer);
  if (!mime) {
    throw new ImageProcessingError(
      `Plik${fileName ? ` "${fileName}"` : ""} nie jest obsługiwanym formatem obrazu. Akceptowane: JPEG, PNG, WebP`
    );
  }
}

/**
 * Compute SHA-256 hex digest of a buffer.
 */
export function computeChecksum(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

/**
 * Process an uploaded image:
 * 1. Validate magic bytes
 * 2. Normalize EXIF orientation
 * 3. Resize to 3 variants (thumbnail, medium, original) as WebP
 * 4. Return buffers + metadata
 */
export async function processImage(inputBuffer: Buffer): Promise<ProcessedImage> {
  // Validate magic bytes
  validateImageBuffer(inputBuffer);

  // Checksum of the original upload (before any processing)
  const checksum = computeChecksum(inputBuffer);

  // Load with sharp, auto-rotate based on EXIF orientation
  const pipeline = sharp(inputBuffer).rotate();

  // Get metadata for width/height
  const metadata = await pipeline.clone().metadata();
  const sourceWidth = metadata.width || 0;
  const sourceHeight = metadata.height || 0;

  // Resize to original (max 1600px wide, preserve aspect ratio, don't upscale)
  const original = await pipeline
    .clone()
    .resize({
      width: SIZES.original,
      withoutEnlargement: true,
      fit: "inside",
    })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();

  // Get actual dimensions of processed original
  const originalMeta = await sharp(original).metadata();

  // Resize to medium (max 800px)
  const medium = await pipeline
    .clone()
    .resize({
      width: SIZES.medium,
      withoutEnlargement: true,
      fit: "inside",
    })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();

  // Resize to thumbnail (max 400px)
  const thumbnail = await pipeline
    .clone()
    .resize({
      width: SIZES.thumbnail,
      withoutEnlargement: true,
      fit: "inside",
    })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();

  return {
    original,
    medium,
    thumbnail,
    width: originalMeta.width || sourceWidth,
    height: originalMeta.height || sourceHeight,
    sizeBytes: original.length,
    checksum,
    mimeType: "image/webp",
  };
}

/**
 * Custom error for image processing failures.
 * Caught by apiServerError and mapped to 400 VALIDATION.
 */
export class ImageProcessingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}
