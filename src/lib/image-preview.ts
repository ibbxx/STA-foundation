export type ImagePreviewItem = {
  id: string;
  url: string;
  name: string;
  kind: 'existing' | 'queued';
  file?: File;
  /** Alt text / deskripsi singkat gambar untuk SEO & aksesibilitas */
  altText?: string;
  /** Info ukuran file asli sebelum kompresi (bytes) */
  originalSize?: number;
};

export function revokeQueuedItems(items: ImagePreviewItem[]) {
  items.forEach((item) => {
    if (item.kind === 'queued') {
      URL.revokeObjectURL(item.url);
    }
  });
}
