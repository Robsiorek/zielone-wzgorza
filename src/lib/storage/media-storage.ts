/**
 * B1 Media Storage — provider interface + factory.
 *
 * ADR-11: Object storage (R2), nie filesystem jako docelowy.
 * ADR-12: Direct public media z providera, nie proxy przez backend.
 *
 * Interface: save / delete / getPublicUrl / exists
 * Factory: getStorageProvider() → R2 (prod) | Local (dev)
 * Config: STORAGE_PROVIDER=r2|local w .env
 */

/**
 * Abstract storage provider for media files.
 * Implementations: R2StorageProvider (production), LocalMediaStorage (dev/fallback).
 */
export interface MediaStorageProvider {
  /**
   * Save a file to storage.
   * @param buffer File content
   * @param key Full object key (e.g. properties/abc/resources/xyz/original/uuid.webp)
   * @param mimeType MIME type of the file
   */
  save(buffer: Buffer, key: string, mimeType: string): Promise<void>;

  /**
   * Delete a file from storage. Best-effort — logs warning on failure.
   * @param key Full object key
   */
  delete(key: string): Promise<void>;

  /**
   * Get public URL for a storage key.
   * R2: https://{R2_PUBLIC_DOMAIN}/{key}
   * Local: /api/public/media/{key}
   */
  getPublicUrl(key: string): string;

  /**
   * Check if a file exists in storage.
   * @param key Full object key
   */
  exists(key: string): Promise<boolean>;
}

/** Singleton instance — created once per process */
let _provider: MediaStorageProvider | undefined;

/**
 * Factory: returns the configured storage provider.
 * Reads STORAGE_PROVIDER env (default: "local").
 */
export function getStorageProvider(): MediaStorageProvider {
  if (_provider) {
    return _provider;
  }

  const providerType = process.env.STORAGE_PROVIDER ?? "local";

  let created: MediaStorageProvider;

  if (providerType === "r2") {
    const { R2StorageProvider } = require("./r2-storage");
    created = new R2StorageProvider();
  } else if (providerType === "local") {
    const { LocalMediaStorage } = require("./local-storage");
    created = new LocalMediaStorage();
  } else {
    throw new Error(`[storage] Nieznany STORAGE_PROVIDER: "${providerType}". Dozwolone: r2, local`);
  }

  _provider = created;
  console.log(`[storage] Provider initialized: ${providerType}`);
  return created;
}

/**
 * Build storage keys for all 3 image variants.
 * Key format: properties/{propertyId}/resources/{resourceId}/{variant}/{uuid}.webp
 */
export function buildImageKeys(
  propertyId: string,
  resourceId: string,
  uuid: string
): { storageKey: string; mediumKey: string; thumbnailKey: string } {
  const base = `properties/${propertyId}/resources/${resourceId}`;
  return {
    storageKey: `${base}/original/${uuid}.webp`,
    mediumKey: `${base}/medium/${uuid}.webp`,
    thumbnailKey: `${base}/thumbnail/${uuid}.webp`,
  };
}

/**
 * Upload all 3 image variants to storage.
 * Returns the list of keys that were successfully uploaded (for cleanup on partial failure).
 */
export async function uploadImageVariants(
  provider: MediaStorageProvider,
  keys: { storageKey: string; mediumKey: string; thumbnailKey: string },
  buffers: { original: Buffer; medium: Buffer; thumbnail: Buffer }
): Promise<string[]> {
  const uploaded: string[] = [];

  try {
    await provider.save(buffers.original, keys.storageKey, "image/webp");
    uploaded.push(keys.storageKey);

    await provider.save(buffers.medium, keys.mediumKey, "image/webp");
    uploaded.push(keys.mediumKey);

    await provider.save(buffers.thumbnail, keys.thumbnailKey, "image/webp");
    uploaded.push(keys.thumbnailKey);
  } catch (error) {
    // Partial upload — caller must handle cleanup of `uploaded` keys
    throw new StorageUploadError(
      `Upload do storage nie powiódł się: ${error instanceof Error ? error.message : "Nieznany błąd"}`,
      uploaded
    );
  }

  return uploaded;
}

/**
 * Best-effort cleanup of keys from storage.
 * Logs warnings on individual failures but does not throw.
 */
export async function cleanupStorageKeys(
  provider: MediaStorageProvider,
  keys: string[]
): Promise<void> {
  for (const key of keys) {
    try {
      await provider.delete(key);
    } catch (err) {
      console.warn(`[storage] Cleanup failed for key "${key}":`, err);
    }
  }
}

/**
 * Error with list of successfully uploaded keys (for compensatory cleanup).
 */
export class StorageUploadError extends Error {
  public uploadedKeys: string[];

  constructor(message: string, uploadedKeys: string[]) {
    super(message);
    this.name = "StorageUploadError";
    this.uploadedKeys = uploadedKeys;
  }
}
