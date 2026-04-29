import { useState, useCallback } from 'react';
import type { ImagePreviewItem } from '../lib/image-preview';
import { toQueuedImageItems } from '../lib/admin-campaign-utils';

/**
 * Revoke all object URLs for queued items to prevent memory leaks.
 */
export function revokeQueuedItems(items: ImagePreviewItem[]) {
  items.forEach((item) => {
    if (item.kind === 'queued') URL.revokeObjectURL(item.url);
  });
}

/**
 * Generic hook for managing a list of ImagePreviewItems
 * (used for both campaign images and timeline images).
 */
export function useImagePreviewList(initialItems: ImagePreviewItem[] = []) {
  const [items, setItems] = useState<ImagePreviewItem[]>(initialItems);

  const addFiles = useCallback((files: File[]) => {
    const nextQueuedItems = toQueuedImageItems(files);
    setItems((current) => [...current, ...nextQueuedItems]);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((current) => {
      const target = current.find((item) => item.id === id);
      if (target?.kind === 'queued') {
        URL.revokeObjectURL(target.url);
      }
      return current.filter((item) => item.id !== id);
    });
  }, []);

  const reorderItems = useCallback((reordered: ImagePreviewItem[]) => {
    setItems(reordered);
  }, []);

  const cropReplace = useCallback((id: string, croppedFile: File) => {
    setItems((current) =>
      current.map((item) => {
        if (item.id !== id) return item;
        if (item.kind === 'queued') {
          URL.revokeObjectURL(item.url);
        }
        return {
          ...item,
          url: URL.createObjectURL(croppedFile),
          file: croppedFile,
          name: croppedFile.name,
          kind: 'queued' as const,
        };
      }),
    );
  }, []);

  const resetItems = useCallback((nextItems: ImagePreviewItem[]) => {
    setItems((current) => {
      revokeQueuedItems(current);
      return nextItems;
    });
  }, []);

  return {
    items,
    setItems,
    addFiles,
    removeItem,
    reorderItems,
    cropReplace,
    resetItems,
  };
}
