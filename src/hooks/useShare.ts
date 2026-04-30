import { useState, useCallback } from 'react';
import { performShare, type ShareData } from '../lib/share-actions';

export function useShare() {
  const [shareStatus, setShareStatus] = useState<'idle' | 'shared' | 'copied' | 'failed'>('idle');

  const share = useCallback(async (data: ShareData) => {
    const result = await performShare(data);
    setShareStatus(result);
    
    if (result === 'copied' || result === 'shared') {
      setTimeout(() => setShareStatus('idle'), 3000);
    }
  }, []);

  return { share, shareStatus };
}
