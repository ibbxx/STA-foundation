/**
 * Utility untuk kompresi gambar di sisi klien (browser).
 * Meniru logika Python: resize max-width 1920px, konversi ke WebP (fallback JPEG), kualitas 80%.
 * Mendukung format HEIC/HEIF (dari iPhone) menggunakan heic2any secara dinamis.
 * Mendukung opsi pembatasan ukuran file maksimal (misal 300 KB).
 */

export interface CompressImageOptions {
  maxWidth?: number;
  quality?: number;
  maxSizeBytes?: number;
}

/** Deteksi apakah browser mendukung encoding WebP via canvas */
const supportsWebP = (() => {
  if (typeof document === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').startsWith('data:image/webp');
  } catch {
    return false;
  }
})();

/** Helper untuk membuat objek File dengan aman (menghindari error di browser/WebView lawas yang tidak mendukung konstruktor File) */
function createSafeFile(blob: Blob, name: string, type: string): File {
  try {
    return new File([blob], name, { type, lastModified: Date.now() });
  } catch (err) {
    const fallback = blob as any;
    fallback.name = name;
    fallback.lastModified = Date.now();
    return fallback as File;
  }
}

export async function compressImage(file: File, options: CompressImageOptions = {}): Promise<File> {
  // Jika bukan gambar, kembalikan file asli
  if (!file.type.startsWith('image/')) {
    return file;
  }

  const {
    maxWidth = 1920,
    quality = 0.8,
    maxSizeBytes = 300 * 1024, // Default target 300 KB
  } = options;

  let fileToProcess = file;

  // Deteksi format HEIC/HEIF bawaan iOS/Apple
  const isHeic =
    file.name.toLowerCase().endsWith('.heic') ||
    file.name.toLowerCase().endsWith('.heif') ||
    file.type === 'image/heic' ||
    file.type === 'image/heif';

  if (isHeic) {
    try {
      if (import.meta.env.DEV) console.log('[STA] Mengonversi gambar HEIC ke format standar...');
      const heic2any = (await import('heic2any')).default;

      const convertedBlob = await heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: 0.8,
      });

      const blobArray = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
      const originalName = file.name || 'image.heic';

      fileToProcess = createSafeFile(
        blobArray,
        originalName.replace(/\.[^.]+$/, '') + '.jpg',
        'image/jpeg'
      );
    } catch (err) {
      console.warn('[STA] Gagal mengonversi HEIC, mencoba fallback menggunakan file asli.', err);
      return file;
    }
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(fileToProcess);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          const ratio = maxWidth / width;
          width = maxWidth;
          height = Math.round(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(fileToProcess);
        }

        ctx.drawImage(img, 0, 0, width, height);

        const outputType = supportsWebP ? 'image/webp' : 'image/jpeg';
        const ext = supportsWebP ? '.webp' : '.jpg';

        const attemptCompress = (currentQuality: number) => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                return resolve(fileToProcess);
              }

              // Jika ukuran file masih melampaui maxSizeBytes dan kualitas masih bisa diturunkan
              if (maxSizeBytes && blob.size > maxSizeBytes && currentQuality > 0.4) {
                attemptCompress(Math.max(0.4, currentQuality - 0.15));
                return;
              }

              const originalName = fileToProcess.name || 'image';
              const fileName = originalName.replace(/\.[^.]+$/, '') + ext;
              const compressedFile = createSafeFile(blob, fileName, outputType);
              resolve(compressedFile);
            },
            outputType,
            currentQuality,
          );
        };

        attemptCompress(quality);
      };

      img.onerror = (err) => {
        console.warn('[STA] Gagal mengompresi gambar (via Canvas), menggunakan file asli.', err);
        resolve(fileToProcess);
      };
    };

    reader.onerror = (err) => {
      console.warn('[STA] FileReader gagal, menggunakan file asli.', err);
      resolve(fileToProcess);
    };
  });
}
