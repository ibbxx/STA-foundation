import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { Skeleton } from '../ui/skeleton';
import { fetchHeroContent, DEFAULT_HERO_SLIDES, type HeroSlide } from '../../lib/admin-hero';
import { fetchHeroVolunteerPrograms } from '../../lib/admin/repository';
import type { VolunteerProgramRow } from '../../lib/supabase/types';
import { getVolunteerProgramStatus } from '../../lib/eduxplore';
import { logError } from '../../lib/error-logger';
import { sanitizeHTML } from '../../lib/sanitize';

/** Extended slide type — adds optional CTA fields for auto-injected volunteer program slides */
interface DisplaySlide extends HeroSlide {
  buttonText?: string;
  buttonLink?: string;
}

export default function HeroSlideshow() {
  const [heroSlides, setHeroSlides] = React.useState<DisplaySlide[]>(DEFAULT_HERO_SLIDES);
  const [currentSlideIndex, setCurrentSlideIndex] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);

  // Fetch hero slides from Supabase + auto-inject volunteer programs
  React.useEffect(() => {
    async function loadSlides() {
      try {
        const [heroContent, volunteerRes] = await Promise.all([
          fetchHeroContent(),
          fetchHeroVolunteerPrograms(),
        ]);

        // Convert active volunteer programs to slide format with CTA
        // Filter out programs that have fully ended (past program_end date)
        const now = new Date();
        const activePrograms = ((volunteerRes.data || []) as VolunteerProgramRow[]).filter((p) => {
          if (p.program_end && now > new Date(p.program_end)) return false;
          return true;
        });

        const volunteerSlides: DisplaySlide[] = activePrograms.map((p) => {
          const computedStatus = getVolunteerProgramStatus(p);
          return {
            id: `eduxplore-${p.id}`,
            title: p.title.toUpperCase(),
            subtitle: p.short_description || p.description || '',
            imageUrl: p.image_url || '',
            buttonText: computedStatus === 'open' ? `Daftar ${p.title}` : `Detail ${p.title}`,
            buttonLink: `/eduxplore/${p.slug}`,
          };
        });

        // Volunteer program slides go first (priority), then admin-managed slides
        const combined: DisplaySlide[] = [...volunteerSlides, ...heroContent.slides];
        if (combined.length > 0) {
          // Preload the first slide's image to prevent "blank screen" during image load
          const firstSlide = combined[0];
          if (firstSlide?.imageUrl) {
            await new Promise((resolve) => {
              const img = new Image();
              img.onload = resolve;
              img.onerror = resolve;
              img.src = firstSlide.imageUrl;
            });
          }
          setHeroSlides(combined);
        }
      } catch (err) {
        logError('HeroSlideshow.loadSlides', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadSlides();
  }, []);

  // Auto-advance slideshow (every 6 seconds)
  React.useEffect(() => {
    if (heroSlides.length <= 1 || isLoading) return;

    const interval = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % heroSlides.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [heroSlides.length, isLoading]);

  const currentSlide = heroSlides[currentSlideIndex] ?? heroSlides[0];

  return (
    <section className="relative min-h-screen bg-emerald-950">
      {/* Loading overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 z-50 bg-neutral-900 flex items-end pb-16 sm:pb-32 pt-28"
          >
            <div className="flex flex-col px-5 sm:px-8 lg:px-12 w-full animate-pulse">
              <div className="max-w-3xl text-left space-y-6">
                {/* Tag/Badge Skeleton */}
                <Skeleton className="h-4 w-32 bg-neutral-800/60 rounded-full" />
                
                {/* Title Skeleton */}
                <div className="space-y-3">
                  <Skeleton className="h-10 w-5/6 sm:h-12 lg:h-16 bg-neutral-800/60" />
                  <Skeleton className="h-10 w-2/3 sm:h-12 lg:h-16 bg-neutral-800/60" />
                </div>
                
                {/* Description Skeleton */}
                <div className="space-y-2 max-w-xl">
                  <Skeleton className="h-4 w-full bg-neutral-800/60" />
                  <Skeleton className="h-4 w-4/5 bg-neutral-800/60" />
                </div>
                
                {/* Buttons Skeleton */}
                <div className="flex flex-col gap-3 sm:flex-row pt-4">
                  <Skeleton className="h-11 w-40 sm:h-12 bg-neutral-800/60 rounded-full" />
                  <Skeleton className="h-11 w-44 sm:h-12 bg-neutral-800/60 rounded-full" />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background image with smooth Ken Burns transition */}
      <AnimatePresence>
        {!isLoading && (
          <motion.div
            key={currentSlide.id}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            className="absolute inset-0 overflow-hidden"
          >
            {currentSlide.videoUrl ? (
              <video
                src={currentSlide.videoUrl}
                autoPlay
                muted
                loop
                playsInline
                className="size-full object-cover"
              />
            ) : currentSlide.imageUrl ? (
              <img
                src={currentSlide.imageUrl}
                alt={currentSlide.title}
                className="size-full object-cover"
                fetchPriority="high"
                decoding="sync"
              />
            ) : (
              <div className="size-full bg-emerald-950" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/60 to-gray-950/20" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content overlay — bottom-left, flush left on all screens */}
      <div className={cn("relative z-10 flex min-h-screen items-end pb-16 sm:pb-32 pt-28 transition-opacity duration-1000", isLoading ? "opacity-0" : "opacity-100")}>
        <div className="flex flex-col px-5 sm:px-8 lg:px-12">
          <div className="max-w-3xl text-left">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide.id + '-text'}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              >
                <h1 className="mt-4 max-w-2xl text-balance font-black uppercase leading-[1.1] tracking-tight text-[#F5F1E8] md:mt-8 lg:mt-16">
                  {(() => {
                    const match = currentSlide.title.match(/^(EDUXPLORE\s+#\d+)\s+(.*)$/i);
                    if (match) {
                      return (
                        <>
                          <span className="block text-3xl sm:text-4xl md:text-6xl xl:text-7xl mb-1 md:mb-2 text-[#F5F1E8]">
                            {match[1]}
                          </span>
                          <span className="block text-lg sm:text-xl md:text-3xl xl:text-4xl text-emerald-400 font-bold">
                            {match[2]}
                          </span>
                        </>
                      );
                    }
                    return (
                      <span className="block text-2xl sm:text-3xl md:text-5xl xl:text-6xl">
                        {currentSlide.title}
                      </span>
                    );
                  })()}
                </h1>
                {currentSlide.subtitle && (
                  <div
                    className="mt-4 max-w-xl text-balance text-sm font-light leading-relaxed text-[#F5F1E8]/85 sm:mt-6 sm:text-base"
                    dangerouslySetInnerHTML={{ __html: sanitizeHTML(currentSlide.subtitle) }}
                  />
                )}

                <div className="mt-8 flex flex-col items-start gap-3 sm:mt-12 sm:flex-row">
                  {currentSlide.buttonText && currentSlide.buttonLink ? (
                    <Link
                      to={currentSlide.buttonLink}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-emerald-600 pl-6 pr-4 text-sm font-bold text-white transition-all duration-300 hover:bg-emerald-500 md:h-12 md:text-base shadow-lg shadow-emerald-900/50"
                    >
                      <span className="whitespace-nowrap">{currentSlide.buttonText}</span>
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  ) : (
                    <>
                      <Link
                        to="/campaigns"
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#2C5F4F] pl-6 pr-4 text-sm font-bold text-[#F5F1E8] transition-all duration-300 hover:bg-[#234A3D] md:h-12 md:text-base"
                      >
                        <span className="whitespace-nowrap">Donasi Sekarang</span>
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </Link>
                      <Link
                        to="/laporkan"
                        className="inline-flex h-11 items-center justify-center rounded-full bg-white px-6 text-sm font-bold text-[#2C5F4F] transition-all duration-300 hover:bg-white/90 md:h-12 md:text-base"
                      >
                        <span className="whitespace-nowrap">Laporkan Sekolah</span>
                      </Link>
                    </>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Premium Slide Indicators - Story Style */}
          {heroSlides.length > 1 && (
            <div className="mt-12 sm:mt-16 flex items-center gap-2">
              {heroSlides.map((slide, i) => (
                <button
                  key={slide.id}
                  onClick={() => setCurrentSlideIndex(i)}
                  className="group relative h-1.5 w-12 sm:w-16 overflow-hidden rounded-full bg-white/30 transition-colors hover:bg-white/50"
                  aria-label={`Lihat slide ${i + 1}`}
                >
                  {i === currentSlideIndex && (
                    <motion.div
                      className="absolute inset-y-0 left-0 bg-white rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 6, ease: "linear" }}
                    />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
