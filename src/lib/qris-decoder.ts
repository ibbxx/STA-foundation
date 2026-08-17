import jsQR from 'jsqr';
import { validateQrisRawString } from './qris';

/**
 * Decodes a QR code raw string from an uploaded image File using HTML Canvas and jsQR.
 * Returns the decoded string if found and valid as QRIS, or null otherwise.
 */
export async function decodeQrisFromImageFile(file: File): Promise<string | null> {
  if (!file.type.startsWith('image/')) return null;

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(null);
            return;
          }

          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;
          ctx.drawImage(img, 0, 0);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });

          if (code?.data) {
            const raw = code.data.trim();
            const validation = validateQrisRawString(raw);
            if (validation.valid) {
              resolve(raw);
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
    reader.readAsDataURL(file);
  });
}
