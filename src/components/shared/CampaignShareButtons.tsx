import { Share2, Check, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { performShare } from '../../lib/share-actions';
import { useState } from 'react';

type CampaignShareButtonsProps = {
  campaignTitle: string;
  keyPrefix?: string;
};

export default function CampaignShareButtons({
  campaignTitle,
  keyPrefix = '',
}: CampaignShareButtonsProps) {
  const [status, setStatus] = useState<'idle' | 'shared' | 'copied' | 'failed'>('idle');
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleShare = async () => {
    const result = await performShare({
      title: campaignTitle,
      text: `Halo! Mari bersama bantu: ${campaignTitle}. Donasi sekarang di Sekolah Tanah Air.`,
      url: shareUrl,
    });
    setStatus(result);
    if (result !== 'failed') {
      setTimeout(() => setStatus('idle'), 3000);
    }
  };
    return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={handleShare}
        className={`flex w-full items-center justify-center gap-3 rounded-xl border-2 py-4 text-[11px] font-bold uppercase tracking-[0.2em] transition-all duration-300 ${
          status === 'copied' || status === 'shared'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
            : 'border-gray-100 bg-white text-gray-700 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-900/5'
        }`}
      >
        <AnimatePresence mode="wait" initial={false}>
          {status === 'copied' || status === 'shared' ? (
            <motion.div
              key={`${keyPrefix}check`}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="flex items-center gap-2"
            >
              <Check size={16} className="text-emerald-600" />
              <span>{status === 'shared' ? 'Berbagi!' : 'Tersalin!'}</span>
            </motion.div>
          ) : (
            <motion.div
              key={`${keyPrefix}share`}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="flex items-center gap-2"
            >
              <Share2 size={16} />
              <span>Bagikan Link</span>
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      <a
        href={`https://wa.me/?text=${encodeURIComponent(
          `Halo! Mari bersama bantu: ${campaignTitle}. Donasi sekarang di: ${shareUrl}`,
        )}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#25D366] py-4 text-[11px] font-bold uppercase tracking-[0.2em] text-white hover:opacity-90 transition-opacity shadow-lg shadow-emerald-900/10"
      >
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="lucide lucide-whatsapp"
        >
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-11.7 1 1 0 0 1 .4 1.9 6.5 6.5 0 1 0 5.3 5.4 1 1 0 0 1 2.8.6z" />
          <path d="M17.4 11.5h-5.9a.5.5 0 0 0-.5.5v5.9a.5.5 0 0 0 .5.5h5.9a.5.5 0 0 0 .5-.5v-5.9a.5.5 0 0 0-.5-.5z" />
        </svg>
        <span>Share WhatsApp</span>
      </a>
    </div>
  );
}
