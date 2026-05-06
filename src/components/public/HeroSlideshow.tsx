import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { fetchHeroContent, DEFAULT_HERO_SLIDES, type HeroSlide } from '../../lib/admin-hero';
import { fetchHeroVolunteerPrograms } from '../../lib/admin/repository';
import type { VolunteerProgramRow } from '../../lib/supabase/types';
import { logError } from '../../lib/error-logger';

/** Extended slide type — adds optional CTA fields for auto-injected EduXplore slides */
interface DisplaySlide extends HeroSlide {
  buttonText?: string;
  buttonLink?: string;
}

export default function HeroSlideshow() {
  const [heroSlides, setHeroSlides] = React.useState<DisplaySlide[]>(DEFAULT_HERO_SLIDES);
  const [currentSlideIndex, setCurrentSlideIndex] = React.useState(0);

  // Fetch hero slides from Supabase + auto-inject EduXplore programs
  React.useEffect(() => {
    async function loadSlides() {
      try {
        const [heroContent, volunteerRes] = await Promise.all([
          fetchHeroContent(),
          fetchHeroVolunteerPrograms(),
        ]);

        // Convert active volunteer programs to slide format with CTA
        const volunteerSlides: DisplaySlide[] = ((volunteerRes.data || []) as VolunteerProgramRow[]).map((p) => ({
          id: `eduxplore-${p.id}`,
          title: p.title.toUpperCase(),
          subtitle: p.description || '',
          imageUrl: p.image_url || '',
          buttonText: 'Daftar EduXplore',
          buttonLink: `/eduxplore/${p.slug}`,
        }));

        // EduXplore slides go first (priority), then admin-managed slides
        const combined: DisplaySlide[] = [...volunteerSlides, ...heroContent.slides];
        if (combined.length > 0) {
          setHeroSlides(combined);
        }
      } catch (err) {
        logError('HeroSlideshow.loadSlides', err);
      }
    }

    loadSlides();
  }, []);

  // Auto-advance slideshow (every 6 seconds)
  React.useEffect(() => {
    if (heroSlides.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % heroSlides.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [heroSlides.length]);

  const currentSlide = heroSlides[currentSlideIndex] ?? heroSlides[0];

  return (
    <section className="relative min-h-screen">
      {/* Background image with crossfade transition */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={currentSlide.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
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
            />
          ) : (
            <div className="size-full bg-emerald-950" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/60 to-gray-950/20" />
        </motion.div>
      </AnimatePresence>

      {/* Content overlay — bottom-left, flush left on all screens */}
      <div className="relative z-10 flex min-h-screen items-end pb-16 sm:pb-32 pt-28">
        <div className="flex flex-col px-5 sm:px-8 lg:px-12">
          <div className="max-w-2xl text-left">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide.id + '-text'}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.8, delay: 0.2 }}
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
                  <p className="mt-4 max-w-xl text-balance text-sm font-light leading-relaxed text-[#F5F1E8]/85 sm:mt-6 sm:text-base">
                    {currentSlide.subtitle}
                  </p>
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
                    <Link
                      to="/campaigns"
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#2C5F4F] pl-6 pr-4 text-sm font-bold text-[#F5F1E8] transition-all duration-300 hover:bg-[#234A3D] md:h-12 md:text-base"
                    >
                      <span className="whitespace-nowrap">Donasi Sekarang</span>
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  )}
                  <Link
                    to="/laporkan"
                    className="inline-flex h-11 items-center justify-center rounded-full bg-white px-6 text-sm font-bold text-[#2C5F4F] transition-all duration-300 hover:bg-white/90 md:h-12 md:text-base"
                  >
                    <span className="whitespace-nowrap">Laporkan Sekolah</span>
                  </Link>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Slide Indicators */}
          {heroSlides.length > 1 && (
            <div className="mt-8 flex items-center gap-2">
              {heroSlides.map((slide, i) => (
                <button
                  key={slide.id}
                  onClick={() => setCurrentSlideIndex(i)}
                  className={cn(
                    'h-1.5 rounded-full transition-all duration-500',
                    i === currentSlideIndex
                      ? 'w-8 bg-white'
                      : 'w-3 bg-white/40 hover:bg-white/60'
                  )}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
