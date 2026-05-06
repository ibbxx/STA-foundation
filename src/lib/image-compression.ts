/**
 * Utility untuk kompresi gambar di sisi klien (browser).
 * Meniru logika Python: resize max-width 1920px, konversi ke WebP (fallback JPEG), kualitas 80%.
 */

/** Deteksi apakah browser mendukung encoding WebP via canvas */
const supportsWebP = (() => {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').startsWith('data:image/webp');
  } catch {
    return false;
  }
})();

export async function compressImage(file: File): Promise<File> {
  // Jika bukan gambar, kembalikan file asli
  if (!file.type.startsWith('image/')) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Logika Resize: Max width 1920px
        const MAX_WIDTH = 1920;
        if (width > MAX_WIDTH) {
          const ratio = MAX_WIDTH / width;
          width = MAX_WIDTH;
          height = Math.round(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(file);
        }

        // Gambar ke canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Pilih format output: WebP jika didukung, JPEG sebagai fallback
        const outputType = supportsWebP ? 'image/webp' : 'image/jpeg';
        const ext = supportsWebP ? '.webp' : '.jpg';

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              // Fallback: jika encoding gagal total, coba JPEG sebagai last resort
              if (outputType === 'image/webp') {
                canvas.toBlob(
                  (jpegBlob) => {
                    if (!jpegBlob) return resolve(file);
                    const fileName = file.name.replace(/\.[^.]+$/, '') + '.jpg';
                    resolve(new File([jpegBlob], fileName, { type: 'image/jpeg', lastModified: Date.now() }));
                  },
                  'image/jpeg',
                  0.8,
                );
                return;
              }
              return resolve(file);
            }
            // Buat file baru dari blob
            const fileName = file.name.replace(/\.[^.]+$/, '') + ext;
            const compressedFile = new File([blob], fileName, {
              type: outputType,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          outputType,
          0.8,
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}
