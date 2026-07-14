import imageCompression from 'browser-image-compression';
import { logError } from '../error-logger';
import { supabase } from './types';

const defaultBucket = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || 'site-media';
const campaignAssetsBucket = import.meta.env.VITE_SUPABASE_CAMPAIGN_ASSETS_BUCKET || 'campaign-assets';
const configuredSupabaseHost = (() => {
  try {
    return new URL(import.meta.env.VITE_SUPABASE_URL || '').host;
  } catch {
    return '';
  }
})();

// --- Konstanta Validasi ---
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime'];
const MAX_RAW_SIZE_MB = 5;
const COMPRESS_TARGET_MB = 0.4;
const MAX_DIMENSION = 1920;

type UploadOptions = {
  bucket?: string;
  folder?: string;
  skipCompression?: boolean;
};

export type StorageFileReference = string | {
  bucket?: string;
  path?: string | null;
  url?: string | null;
};

export type StorageCleanupResult = {
  deleted: number;
  failed: number;
  skipped: number;
  failures: Array<{ bucket: string; paths: string[]; message: string }>;
};

function validateFile(file: File, skipCompression: boolean): void {
  const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
  const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);

  if (!isImage && !isVideo) {
    throw new Error(`Format file "${file.type}" tidak didukung. Gunakan JPG, PNG, atau MP4.`);
  }

  if (isVideo && !skipCompression) {
    // Video tidak dikompres oleh library ini, jadi harus skipCompression
    throw new Error('Video harus diunggah dengan opsi skipCompression.');
  }

  const sizeMB = file.size / (1024 * 1024);
  if (sizeMB > MAX_RAW_SIZE_MB) {
    throw new Error(`Ukuran file ${sizeMB.toFixed(1)}MB melebihi batas ${MAX_RAW_SIZE_MB}MB.`);
  }
}

async function compressImage(file: File): Promise<File> {
  // Kompres
  const compressed = await imageCompression(file, {
    maxSizeMB: COMPRESS_TARGET_MB,
    maxWidthOrHeight: MAX_DIMENSION,
    useWebWorker: true,
    fileType: 'image/webp',
  });

  return compressed;
}

export async function uploadFileToStorage(file: File, options: UploadOptions = {}) {
  const bucket = options.bucket || defaultBucket;
  const folder = options.folder || 'campaigns';
  const skipCompression = options.skipCompression || false;

  // Validasi tipe dan ukuran
  validateFile(file, skipCompression);

  // Kompres kecuali di-skip
  const finalFile = skipCompression ? file : await compressImage(file);

  const fileExtension = options.skipCompression
    ? (file.name.split('.').pop() || 'jpg')
    : 'webp';
  const filePath = `${folder}/${Date.now()}-${crypto.randomUUID()}.${fileExtension}`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, finalFile, {
      cacheControl: '3600',
      upsert: true,
    });

  if (uploadError) {
    logError('supabase-storage.uploadFileToStorage', uploadError, {
      bucket,
      filePath,
      fileType: finalFile.type,
      fileSize: finalFile.size,
    });
    throw uploadError;
  }

  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return data.publicUrl;
}

export async function uploadAdminImage(file: File, folder: 'campaigns' | 'hero' | 'programs' | 'general' = 'campaigns') {
  // Khusus hero, kita jangan kompres untuk menjaga branding/kualitas asli
  const skipCompression = folder === 'hero';
  return uploadFileToStorage(file, { bucket: defaultBucket, folder, skipCompression });
}

export function getStorageBucketName() {
  return defaultBucket;
}

export function getCampaignAssetsBucketName() {
  return campaignAssetsBucket;
}

// --- Utilitas Hapus File dari Storage ---

function isLikelyUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

function decodeStoragePath(path: string) {
  return decodeURIComponent(path.split('?')[0].replace(/^\/+/, ''));
}

/**
 * Parse public/signed URL Supabase Storage menjadi bucket name dan file path.
 * Contoh URL: https://xxx.supabase.co/storage/v1/object/public/campaign-assets/campaigns/123.webp
 * → { bucket: "campaign-assets", path: "campaigns/123.webp" }
 */
export function parseStorageUrl(publicUrl: string): { bucket: string; path: string } | null {
  try {
    const parsedUrl = new URL(publicUrl);
    if (configuredSupabaseHost && parsedUrl.host !== configuredSupabaseHost) return null;

    const match = publicUrl.match(/\/storage\/v1\/object\/(?:public|sign|authenticated)\/([^/?#]+)\/([^?#]+)/);
    if (!match) return null;

    const bucket = decodeURIComponent(match[1]);
    const path = decodeStoragePath(match[2]);
    if (!bucket || !path) return null;
    return { bucket, path };
  } catch (parseError) {
    logError('supabase-storage.parseStorageUrl', parseError, { publicUrl });
    return null;
  }
}

export function parseStorageFileReference(reference: StorageFileReference, explicitBucket?: string): { bucket: string; path: string } | null {
  const rawValue = typeof reference === 'string'
    ? reference
    : (reference.path ?? reference.url ?? '');
  const value = rawValue.trim();

  if (!value) return null;

  if (typeof reference !== 'string' && reference.bucket && reference.path) {
    return { bucket: reference.bucket, path: decodeStoragePath(reference.path) };
  }

  if (isLikelyUrl(value)) {
    return parseStorageUrl(value);
  }

  if (explicitBucket) {
    return { bucket: explicitBucket, path: decodeStoragePath(value) };
  }

  try {
    const afterMarker = value.replace(/^\/+/, '');
    const slashIndex = afterMarker.indexOf('/');
    if (slashIndex === -1) return null;

    const bucket = afterMarker.substring(0, slashIndex);
    const path = decodeStoragePath(afterMarker.substring(slashIndex + 1));

    if (!bucket || !path) return null;
    return { bucket, path };
  } catch (parseError) {
    logError('supabase-storage.parseStorageFileReference', parseError, { reference });
    return null;
  }
}

/**
 * Hapus file dari Supabase Storage berdasarkan public URL, signed URL,
 * atau raw path dengan explicit bucket. External URL akan dilewati.
 */
export async function deleteFilesFromStorage(
  references: StorageFileReference[],
  options: { bucket?: string } = {},
): Promise<StorageCleanupResult> {
  let deleted = 0;
  let failed = 0;
  let skipped = 0;
  const failures: StorageCleanupResult['failures'] = [];

  // Group files by bucket
  const bucketMap = new Map<string, Set<string>>();
  for (const reference of references) {
    const parsed = parseStorageFileReference(reference, options.bucket);
    if (!parsed) {
      skipped++;
      continue;
    }
    const existing = bucketMap.get(parsed.bucket) || new Set<string>();
    existing.add(parsed.path);
    bucketMap.set(parsed.bucket, existing);
  }

  // Delete per bucket (Supabase supports batch delete per bucket)
  for (const [bucket, pathSet] of bucketMap) {
    const paths = Array.from(pathSet);
    const { error } = await supabase.storage.from(bucket).remove(paths);
    if (error) {
      logError('supabase-storage.deleteFilesFromStorage', error, {
        bucket,
        paths,
      });
      failed += paths.length;
      failures.push({ bucket, paths, message: error.message });
    } else {
      deleted += paths.length;
    }
  }

  return { deleted, failed, skipped, failures };
}

export function getRemovedStorageReferences(
  previous: Array<string | null | undefined>,
  next: Array<string | null | undefined>,
) {
  const nextSet = new Set(next.filter((value): value is string => Boolean(value)));
  return previous.filter((value): value is string => Boolean(value) && !nextSet.has(value));
}

export async function cleanupUploadedFiles(references: StorageFileReference[], bucket?: string) {
  if (references.length === 0) return { deleted: 0, failed: 0, skipped: 0, failures: [] };
  return deleteFilesFromStorage(references, bucket ? { bucket } : {});
}

export function storageCleanupNotice(baseMessage: string, result: StorageCleanupResult | null) {
  if (!result || (result.deleted === 0 && result.failed === 0 && result.skipped === 0)) {
    return baseMessage;
  }

  if (result.failed > 0) {
    return `${baseMessage} Sebagian file lama gagal dihapus.`;
  }

  if (result.deleted > 0) {
    return `${baseMessage} File lama dibersihkan.`;
  }

  return baseMessage;
}
