import jsQR from 'jsqr';
import { validateQrisRawString } from './qris';

function isImageFile(file: File): boolean {
  if (file.type && file.type.startsWith('image/')) return true;
  const name = file.name.toLowerCase();
  return (
    name.endsWith('.jpg') ||
    name.endsWith('.jpeg') ||
    name.endsWith('.png') ||
    name.endsWith('.webp') ||
    name.endsWith('.heic') ||
    name.endsWith('.heif') ||
    name.endsWith('.bmp')
  );
}

function scanImageData(imageData: ImageData): string | null {
  const code = jsQR(imageData.data, imageData.width, imageData.height, {
    inversionAttempts: 'attemptBoth',
  });

  if (code?.data) {
    const raw = code.data.trim();
    const validation = validateQrisRawString(raw);
    if (validation.valid) {
      return raw;
    }
  }
  return null;
}

/**
 * Decodes a QR code raw string from an uploaded image File using HTML Canvas and jsQR.
 * Handles high-resolution camera photos via multi-pass scaling (1000px downscale + original).
 * Returns the decoded string if found and valid as QRIS, or null otherwise.
 */
export async function decodeQrisFromImageFile(file: File): Promise<string | null> {
  if (!isImageFile(file)) return null;

  let processFile: File | Blob = file;

  // If HEIC/HEIF image (e.g. from iPhone Safari), convert to JPEG
  const isHeic = file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif') || file.type.includes('heic');
  if (isHeic) {
    try {
      const heic2any = (await import('heic2any')).default;
      const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.8 });
      const singleBlob = Array.isArray(converted) ? converted[0] : converted;
      if (singleBlob) processFile = singleBlob;
    } catch {
      // Continue with original file if HEIC conversion fails
    }
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          const origW = img.naturalWidth || img.width;
          const origH = img.naturalHeight || img.height;

          // Pass 1: Downscaled version (max 1000px) for fast and reliable scanning on high-res camera photos
          const maxDim = 1000;
          const scale = Math.min(maxDim / origW, maxDim / origH, 1);
          const scaledW = Math.round(origW * scale);
          const scaledH = Math.round(origH * scale);

          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(null);
            return;
          }

          canvas.width = scaledW;
          canvas.height = scaledH;
          ctx.drawImage(img, 0, 0, scaledW, scaledH);

          let detected = scanImageData(ctx.getImageData(0, 0, scaledW, scaledH));
          if (detected) {
            resolve(detected);
            return;
          }

          // Pass 2: Original resolution if downscaled pass didn't find QR
          if (scale < 1) {
            canvas.width = origW;
            canvas.height = origH;
            ctx.drawImage(img, 0, 0);
            detected = scanImageData(ctx.getImageData(0, 0, origW, origH));
            if (detected) {
              resolve(detected);
              return;
            }
          }

          resolve(null);
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(processFile);
  });
}
