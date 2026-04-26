import imageCompression from 'browser-image-compression';
import { logError } from './error-logger';
import { supabase } from './supabase';

const defaultBucket = (import.meta as any).env?.VITE_SUPABASE_STORAGE_BUCKET || 'site-media';
const campaignAssetsBucket = (import.meta as any).env?.VITE_SUPABASE_CAMPAIGN_ASSETS_BUCKET || 'campaign-assets';

// --- Konstanta Validasi ---
const ALLOWED_TYPES = ['image/jpeg', 'image/webp'];
const MAX_RAW_SIZE_MB = 5;
const COMPRESS_TARGET_MB = 0.4;
const MAX_DIMENSION = 1920;

type UploadOptions = {
  bucket?: string;
  folder?: string;
  skipCompression?: boolean;
};

/**
 * Kompres gambar sebelum upload.
 * Konversi otomatis ke webp, target ~400KB, resolusi maks 1920px.
 */
async function compressImage(file: File): Promise<File> {
  // Validasi tipe file
  if (!ALLOWED_TYPES.includes(file.type) && !file.type.startsWith('image/')) {
    throw new Error(`Format file "${file.type}" tidak didukung. Gunakan JPEG atau WebP.`);
  }

  // Validasi ukuran mentah
  const rawSizeMB = file.size / (1024 * 1024);
  if (rawSizeMB > MAX_RAW_SIZE_MB) {
    throw new Error(`Ukuran file ${rawSizeMB.toFixed(1)}MB melebihi batas ${MAX_RAW_SIZE_MB}MB. Perkecil gambar terlebih dahulu.`);
  }

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

  // Kompres kecuali di-skip
  const finalFile = options.skipCompression ? file : await compressImage(file);

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

export async function uploadAdminImage(file: File, folder: 'campaigns' | 'hero' | 'programs' = 'campaigns') {
  return uploadFileToStorage(file, { bucket: defaultBucket, folder });
}

export function getStorageBucketName() {
  return defaultBucket;
}

export function getCampaignAssetsBucketName() {
  return campaignAssetsBucket;
}

// --- Utilitas Hapus File dari Storage ---

/**
 * Parse public URL Supabase Storage menjadi bucket name dan file path.
 * Contoh URL: https://xxx.supabase.co/storage/v1/object/public/campaign-assets/campaigns/123.webp
 * → { bucket: "campaign-assets", path: "campaigns/123.webp" }
 */
export function parseStorageUrl(publicUrl: string): { bucket: string; path: string } | null {
  try {
    const marker = '/storage/v1/object/public/';
    const markerIndex = publicUrl.indexOf(marker);
    if (markerIndex === -1) return null;

    const afterMarker = publicUrl.substring(markerIndex + marker.length);
    const slashIndex = afterMarker.indexOf('/');
    if (slashIndex === -1) return null;

    const bucket = afterMarker.substring(0, slashIndex);
    const path = afterMarker.substring(slashIndex + 1);

    if (!bucket || !path) return null;
    return { bucket, path };
  } catch (parseError) {
    logError('supabase-storage.parseStorageUrl', parseError, { publicUrl });
    return null;
  }
}

/**
 * Hapus satu atau lebih file dari Supabase Storage berdasarkan public URL.
 * File yang gagal dihapus akan di-skip (tidak throw error),
 * karena penghapusan file bersifat "best effort" — data di DB sudah aman.
 */
export async function deleteFilesFromStorage(urls: string[]): Promise<{ deleted: number; failed: number }> {
  let deleted = 0;
  let failed = 0;

  // Group files by bucket
  const bucketMap = new Map<string, string[]>();
  for (const url of urls) {
    if (!url) continue;
    const parsed = parseStorageUrl(url);
    if (!parsed) {
      failed++;
      continue;
    }
    const existing = bucketMap.get(parsed.bucket) || [];
    existing.push(parsed.path);
    bucketMap.set(parsed.bucket, existing);
  }

  // Delete per bucket (Supabase supports batch delete per bucket)
  for (const [bucket, paths] of bucketMap) {
    const { error } = await supabase.storage.from(bucket).remove(paths);
    if (error) {
      logError('supabase-storage.deleteFilesFromStorage', error, {
        bucket,
        paths,
      });
      failed += paths.length;
    } else {
      deleted += paths.length;
    }
  }

  return { deleted, failed };
}
