/**
 * Utility untuk kompresi gambar di sisi klien (browser).
 * Meniru logika Python: resize max-width 1920px, konversi ke WebP (fallback JPEG), kualitas 80%.
 * Mendukung format HEIC/HEIF (dari iPhone) menggunakan heic2any secara dinamis.
 */

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

export async function compressImage(file: File): Promise<File> {
  // Jika bukan gambar, kembalikan file asli
  if (!file.type.startsWith('image/')) {
    return file;
  }

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
      // Import dinamis agar tidak memberatkan loading awal website
      const heic2any = (await import('heic2any')).default;
      
      const convertedBlob = await heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: 0.8 // Kualitas konversi awal yang baik
      });
      
      const blobArray = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
      
      // Buat file baru berformat JPG dari hasil konversi HEIC
      fileToProcess = new File([blobArray], file.name.replace(/\.[^.]+$/, '') + '.jpg', {
        type: 'image/jpeg',
        lastModified: Date.now()
      });
    } catch (err) {
      console.warn('[STA] Gagal mengonversi HEIC, mencoba fallback menggunakan file asli.', err);
      // Jika konversi heic2any gagal, kembalikan file asli agar flow tidak terhenti.
      // Supabase Storage mendukung upload HEIC murni jika gagal kompresi.
      return file;
    }
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(fileToProcess);
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
          return resolve(fileToProcess);
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
                    if (!jpegBlob) return resolve(fileToProcess);
                    const fileName = fileToProcess.name.replace(/\.[^.]+$/, '') + '.jpg';
                    resolve(new File([jpegBlob], fileName, { type: 'image/jpeg', lastModified: Date.now() }));
                  },
                  'image/jpeg',
                  0.8,
                );
                return;
              }
              return resolve(fileToProcess);
            }
            // Buat file terkompresi baru dari blob
            const fileName = fileToProcess.name.replace(/\.[^.]+$/, '') + ext;
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
