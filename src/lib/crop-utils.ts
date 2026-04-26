/**
 * Crop utility — menghasilkan File hasil crop menggunakan OffscreenCanvas / Canvas.
 * Digunakan bersama react-easy-crop untuk mendapatkan area piksel yang dipilih user.
 */

export type CropArea = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/**
 * Membuat HTMLImageElement dari URL dan menunggu sampai loaded.
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

/**
 * Crop gambar berdasarkan area piksel dan kembalikan sebagai File (webp).
 * @param imageSrc — URL atau object URL gambar asli
 * @param cropArea — area piksel {x, y, width, height} dari react-easy-crop
 * @param fileName — nama file output (tanpa ekstensi)
 */
export async function getCroppedImageFile(
  imageSrc: string,
  cropArea: CropArea,
  fileName = 'cropped',
): Promise<File> {
  const image = await loadImage(imageSrc);

  const canvas = document.createElement('canvas');
  canvas.width = cropArea.width;
  canvas.height = cropArea.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context not available.');

  ctx.drawImage(
    image,
    cropArea.x,
    cropArea.y,
    cropArea.width,
    cropArea.height,
    0,
    0,
    cropArea.width,
    cropArea.height,
  );

  return new Promise<File>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Canvas toBlob returned null.'));
          return;
        }
        const file = new File([blob], `${fileName}.webp`, { type: 'image/webp' });
        resolve(file);
      },
      'image/webp',
      0.9,
    );
  });
}
