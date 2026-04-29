import { cn } from '../../lib/utils';

interface LogoProps {
  className?: string;
  size?: number; // Base height of the logo image
  showText?: boolean;
  variant?: 'light' | 'dark';
  withCircle?: boolean;
  /**
   * Professional Nudge: Allows fine-tuning the optical center per-usage.
   * Negative values move the logo up, positive values move it down.
   */
  opticalShift?: number; 
}

const LOGO_SRC = '/cropped-PRIMARY_1@300x-scaled-1.webp';
const LOGO_ALT = 'Logo Sekolah Tanah Air';
const LOGO_ASPECT_RATIO = 1600 / 1080;

/**
 * Premium Logo Component
 * Implements mathematical and optical centering for professional brand consistency.
 */
export default function Logo({ 
  className, 
  size = 40, 
  showText = false, 
  variant = 'dark', 
  withCircle = false,
  opticalShift = -2 // Default nudge up for better visual balance
}: LogoProps) {
  
  // 1. Calculate dimensions based on professional proportions
  const logoWidth = Math.round(size * LOGO_ASPECT_RATIO);
  const maxDimension = Math.max(logoWidth, size);
  
  /**
   * The Golden Padding: Circle diameter is calculated as 1.35x the largest logo dimension.
   * This ensures a consistent "Safe Zone" (breathing room) around the brand mark.
   */
  const circleDiameter = Math.round(maxDimension * 1.35);

  return (
    <div className={cn('inline-flex items-center gap-4 select-none', className)}>
      {withCircle ? (
        <div
          className={cn(
            'shrink-0 relative flex items-center justify-center bg-white rounded-full transition-all duration-500',
            // Premium multi-layered shadow for realistic depth and "Apple-style" elevation
            variant === 'light' 
              ? 'shadow-[0_8px_30px_rgb(255,255,255,0.12),0_4px_10px_rgb(255,255,255,0.05)]' 
              : 'shadow-[0_10px_40px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.04)]'
          )}
          style={{ width: circleDiameter, height: circleDiameter }}
        >
          {/* Inner Content Wrapper - Maintains a strict 70% Bounding Box for safety */}
          <div 
            className="relative flex items-center justify-center w-[70%] h-[70%]"
            style={{ transform: `translateY(${opticalShift}px)` }}
          >
            <img
              src={LOGO_SRC}
              alt={LOGO_ALT}
              className="h-full w-full object-contain filter brightness-100 contrast-[1.02]"
              draggable={false}
            />
          </div>
        </div>
      ) : (
        <div
          className="shrink-0 flex items-center justify-center"
          style={{ width: logoWidth, height: size }}
        >
          <img
            src={LOGO_SRC}
            alt={LOGO_ALT}
            className={cn(
              "h-full w-full object-contain transition-all duration-300",
              variant === 'light' ? 'drop-shadow-[0_4px_12px_rgba(255,255,255,0.2)]' : ''
            )}
            draggable={false}
          />
        </div>
      )}

      {showText && (
        <div className="flex flex-col">
          <span className={cn(
            'text-lg font-black tracking-tight leading-none',
            variant === 'dark' ? 'text-gray-900' : 'text-white'
          )}>
            Sekolah
          </span>
          <span className={cn(
            'mt-1.5 text-[10px] font-bold uppercase tracking-[0.3em] leading-none',
            variant === 'dark' ? 'text-emerald-600' : 'text-emerald-400'
          )}>
            Tanah Air
          </span>
        </div>
      )}
    </div>
  );
}
