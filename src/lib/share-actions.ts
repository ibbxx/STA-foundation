/**
 * Unified sharing utility for Sekolah Tanah Air
 */
export type ShareData = {
  title: string;
  text?: string;
  url: string;
};

export async function performShare(data: ShareData): Promise<'shared' | 'copied' | 'failed'> {
  const shareData = {
    title: data.title,
    text: data.text || data.title,
    url: data.url || window.location.href,
  };

  // 1. Try Native Share (Mobile / Modern Browsers)
  if (navigator.share && navigator.canShare?.(shareData)) {
    try {
      await navigator.share(shareData);
      return 'shared';
    } catch (err) {
      if ((err as Error).name === 'AbortError') return 'failed';
      // Fallback if share fails for other reasons
    }
  }

  // 2. Fallback to Clipboard
  try {
    await navigator.clipboard.writeText(shareData.url);
    return 'copied';
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    return 'failed';
  }
}
