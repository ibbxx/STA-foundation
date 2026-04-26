import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useCallback } from 'react';

interface ImageLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  /** Array of image URLs for gallery mode */
  images: string[];
  /** Currently active image index */
  activeIndex: number;
  /** Callback to change active image */
  onIndexChange: (index: number) => void;
  /** Alt text for the image */
  alt: string;
}

/**
 * Lightbox/Popup full-screen premium untuk melihat foto campaign.
 * Responsif di semua device:
 * - Mobile: full-screen, swipe-friendly, tombol besar
 * - Tablet: padding disesuaikan
 * - Desktop: max-width dibatasi, navigasi keyboard
 */
export default function ImageLightbox({
  isOpen,
  onClose,
  images,
  activeIndex,
  onIndexChange,
  alt,
}: ImageLightboxProps) {
  const hasMultiple = images.length > 1;

  const goNext = useCallback(() => {
    onIndexChange(activeIndex >= images.length - 1 ? 0 : activeIndex + 1);
  }, [activeIndex, images.length, onIndexChange]);

  const goPrev = useCallback(() => {
    onIndexChange(activeIndex <= 0 ? images.length - 1 : activeIndex - 1);
  }, [activeIndex, images.length, onIndexChange]);

  // Lock body scroll + keyboard nav
  useEffect(() => {
    if (!isOpen) return;

    document.body.style.overflow = 'hidden';

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, goNext, goPrev]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 backdrop-blur-md"
          onClick={onClose}
        >
          {/* Top bar — close button */}
          <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
            <p className="text-xs font-medium text-white/50 sm:text-sm">
              {hasMultiple ? `${activeIndex + 1} / ${images.length}` : ''}
            </p>
            <button
              onClick={(e) => { e.stopPropagation(); onClose(); }}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:h-11 sm:w-11"
              aria-label="Tutup"
            >
              <X size={20} />
            </button>
          </div>

          {/* Image container */}
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="relative flex max-h-[80vh] w-full max-w-5xl items-center justify-center px-4 sm:px-8 md:px-12"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={images[activeIndex]}
              alt={alt}
              className="max-h-[80vh] max-w-full rounded-lg object-contain shadow-2xl sm:rounded-xl"
              draggable={false}
            />
          </motion.div>

          {/* Navigation arrows */}
          {hasMultiple && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); goPrev(); }}
                className="absolute left-2 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:left-4 sm:h-12 sm:w-12 md:left-6"
                aria-label="Foto sebelumnya"
              >
                <ChevronLeft size={22} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); goNext(); }}
                className="absolute right-2 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:right-4 sm:h-12 sm:w-12 md:right-6"
                aria-label="Foto berikutnya"
              >
                <ChevronRight size={22} />
              </button>
            </>
          )}

          {/* Bottom dot indicators (mobile-friendly) */}
          {hasMultiple && (
            <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 sm:bottom-8">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => { e.stopPropagation(); onIndexChange(idx); }}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    idx === activeIndex
                      ? 'w-6 bg-white'
                      : 'w-2 bg-white/40 hover:bg-white/70'
                  }`}
                  aria-label={`Foto ${idx + 1}`}
                />
              ))}
            </div>
          )}

          {/* Mobile hint */}
          <p className="absolute bottom-2 left-1/2 z-10 -translate-x-1/2 text-[9px] uppercase tracking-widest text-white/25 sm:hidden">
            Ketuk untuk menutup
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
