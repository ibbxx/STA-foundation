import { Share2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type CampaignShareButtonsProps = {
  campaignTitle: string;
  copied: boolean;
  onCopyLink: () => void;
  /** Unique prefix for framer-motion keys to avoid conflicts */
  keyPrefix?: string;
};

export default function CampaignShareButtons({
  campaignTitle,
  copied,
  onCopyLink,
  keyPrefix = '',
}: CampaignShareButtonsProps) {
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const waText = encodeURIComponent(
    `Halo! Mari bersama bantu: ${campaignTitle}. Donasi sekarang di: ${shareUrl}`,
  );

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onCopyLink}
        className={`flex flex-1 items-center justify-center gap-2 rounded-sm border py-3 text-[10px] font-bold uppercase tracking-tight transition-all duration-300 ${
          copied
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
            : 'border-gray-100 bg-white text-gray-700 hover:bg-gray-50'
        }`}
      >
        <AnimatePresence mode="wait" initial={false}>
          {copied ? (
            <motion.div
              key={`${keyPrefix}check`}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="flex items-center gap-2"
            >
              <Check size={14} className="text-emerald-600" />
              <span>Tersalin!</span>
            </motion.div>
          ) : (
            <motion.div
              key={`${keyPrefix}share`}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="flex items-center gap-2"
            >
              <Share2 size={14} />
              <span>Salin Link</span>
            </motion.div>
          )}
        </AnimatePresence>
      </button>
      <a
        href={`https://wa.me/?text=${waText}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-1 items-center justify-center gap-2 rounded-sm bg-[#25D366] py-3 text-[10px] font-bold uppercase tracking-tight text-white hover:opacity-90 transition-opacity"
      >
        <Share2 size={14} />
        <span>Share WA</span>
      </a>
    </div>
  );
}
