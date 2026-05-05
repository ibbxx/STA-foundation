/**
 * Utility untuk kompresi gambar di sisi klien (browser).
 * Meniru logika Python: resize max-width 1920px, konversi ke WebP, kualitas 80%.
 */
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

        // Export ke WebP dengan kualitas 0.8 (80%)
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return resolve(file);
            }
            // Buat file baru dari blob
            const fileName = file.name.replace(/\.[^.]+$/, '') + '.webp';
            const compressedFile = new File([blob], fileName, {
              type: 'image/webp',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          'image/webp',
          0.8
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}
