import { useState, useEffect } from 'react';
import { logError } from '../../lib/error-logger';
import { cn } from '../../lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  /** Gunakan lazy loading (untuk thumbnail di listing) */
  isThumbnail?: boolean;
  /** Aktifkan efek blur-up saat loading */
  useBlur?: boolean;
  /** Handler klik — jika disediakan, kursor menjadi zoom-in */
  onClick?: () => void;
}

/**
 * Komponen gambar pintar dengan progressive loading (blur-up).
 * Menampilkan placeholder animasi saat gambar dimuat, lalu transisi halus ke gambar asli.
 * Responsif di semua breakpoint.
 */
export default function OptimizedImage({
  src,
  alt,
  className,
  containerClassName,
  isThumbnail = false,
  useBlur = true,
  onClick,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);

    if (!src) {
      setHasError(true);
      return;
    }

    const img = new Image();
    img.src = src;
    img.onload = () => setIsLoaded(true);
    img.onerror = (event) => {
      logError('OptimizedImage.load', event, { src, alt });
      setHasError(true);
    };

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  return (
    <div
      className={cn(
        'relative w-full h-full overflow-hidden bg-gray-100',
        onClick && 'cursor-zoom-in',
        containerClassName,
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter') onClick(); } : undefined}
    >
      {/* Pulse placeholder saat loading */}
      {useBlur && !isLoaded && !hasError && (
        <div className="absolute inset-0 z-0 animate-pulse bg-gray-200" />
      )}

      {/* Gambar utama */}
      {!hasError && (
        <img
          src={src}
          alt={alt}
          className={cn(
            'w-full h-full object-cover transition-all duration-700 ease-out',
            useBlur && !isLoaded
              ? 'scale-[1.02] blur-md opacity-40'
              : 'scale-100 blur-0 opacity-100',
            className,
          )}
          loading={isThumbnail ? 'lazy' : 'eager'}
          decoding="async"
        />
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-8 sm:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 001.5-1.5V4.5a1.5 1.5 0 00-1.5-1.5H3.75a1.5 1.5 0 00-1.5 1.5v15a1.5 1.5 0 001.5 1.5z" />
          </svg>
        </div>
      )}
    </div>
  );
}
