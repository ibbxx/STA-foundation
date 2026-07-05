import React from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  HandHeart,
  Heart,
  Users,
  BarChart3,
  CheckCircle2,
  Globe,
} from 'lucide-react';
import { CircularTestimonials } from '../../components/ui/circular-testimonials';
import { Link } from 'react-router-dom';
import { Skeleton } from '../../components/ui/skeleton';
import { Campaign } from '../../lib/supabase/types';
import { logError } from '../../lib/error-logger';
import { fetchPublicCampaigns } from '../../lib/public/campaigns';
import { PROGRAMS, parseProgramContent } from '../../lib/programs';
import { formatCurrency, calculateProgress, cn } from '../../lib/utils';
import { supabase, parseSiteContentValue } from '../../lib/supabase/types';
import { DEFAULT_PROGRAMS_HEADER, DEFAULT_CTA_DATA } from '../../lib/constants';
import type { ProgramsHeaderData, CtaData } from '../../lib/constants';

/* ── Extracted Section Components ── */
import HeroSlideshow from '../../components/public/HeroSlideshow';
import TrustBar from '../../components/public/TrustBar';
import ImpactMapSection from '../../components/public/ImpactMapSection';
import CtaSection from '../../components/public/CtaSection';

/* ─────────── Animation Variants ─────────── */

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
};

/* ─────────── Main Component ─────────── */

export default function Home() {
  const [featuredCampaigns, setFeaturedCampaigns] = React.useState<Campaign[]>([]);
  const [loadingFeaturedCampaigns, setLoadingFeaturedCampaigns] = React.useState(true);
  const [featuredCampaignError, setFeaturedCampaignError] = React.useState<string | null>(null);

  // Programs State (Dynamic from Supabase)
  const [dynamicPrograms, setDynamicPrograms] = React.useState<any[]>([]);
  const [loadingPrograms, setLoadingPrograms] = React.useState(true);
  const [headerData, setHeaderData] = React.useState<ProgramsHeaderData>({ ...DEFAULT_PROGRAMS_HEADER });

  const [ctaData, setCtaData] = React.useState<CtaData>({ ...DEFAULT_CTA_DATA });

  React.useEffect(() => {
    async function loadPrograms() {
      try {
        // Hanya select kolom yang ada di schema programs — stage_value, home_slider_image, hero_image_url
        // berada di dalam kolom JSON `content` yang di-parse oleh parseProgramContent()
        const { data } = await supabase.from('programs').select('id, slug, title, description, icon_name, content').order('created_at', { ascending: true });
        if (data && data.length > 0) {
          const mapped = data.map((item) => {
            const detail = parseProgramContent(item.content);
            return { ...item, ...detail };
          });
          setDynamicPrograms(mapped);
        }

        // Fetch Header
        const { data: siteContent } = await supabase.from('site_content').select('value').eq('key', 'home_programs_header').maybeSingle();
        const headerParsed = parseSiteContentValue<ProgramsHeaderData>(siteContent?.value);
        if (headerParsed) {
          setHeaderData({
            label: headerParsed.label || DEFAULT_PROGRAMS_HEADER.label,
            title: headerParsed.title || DEFAULT_PROGRAMS_HEADER.title,
            description: headerParsed.description || DEFAULT_PROGRAMS_HEADER.description,
          });
        }

        // Fetch CTA
        const { data: ctaContent } = await supabase.from('site_content').select('value').eq('key', 'home_cta').maybeSingle();
        const ctaParsed = parseSiteContentValue<CtaData>(ctaContent?.value);
        if (ctaParsed) {
          setCtaData({
            title: ctaParsed.title || DEFAULT_CTA_DATA.title,
            description: ctaParsed.description || DEFAULT_CTA_DATA.description,
            primaryButtonText: ctaParsed.primaryButtonText || DEFAULT_CTA_DATA.primaryButtonText,
            primaryButtonLink: ctaParsed.primaryButtonLink || DEFAULT_CTA_DATA.primaryButtonLink,
            secondaryButtonText: ctaParsed.secondaryButtonText || DEFAULT_CTA_DATA.secondaryButtonText,
            secondaryButtonLink: ctaParsed.secondaryButtonLink || DEFAULT_CTA_DATA.secondaryButtonLink,
            imageUrl: ctaParsed.imageUrl || DEFAULT_CTA_DATA.imageUrl,
          });
        }
      } catch (err) {
        logError('Home.loadPrograms', err);
      } finally {
        setLoadingPrograms(false);
      }
    }
    loadPrograms();
  }, []);

  React.useEffect(() => {
    let ignore = false;

    async function loadFeaturedCampaigns() {
      setLoadingFeaturedCampaigns(true);
      setFeaturedCampaignError(null);

      try {
        const result = await fetchPublicCampaigns({ featuredOnly: true, limit: 4 });
        if (ignore) return;
        setFeaturedCampaigns(result.campaigns);
      } catch (loadError) {
        logError('Home.loadFeaturedCampaigns', loadError);
        if (ignore) return;
        setFeaturedCampaigns([]);
        setFeaturedCampaignError(loadError instanceof Error ? loadError.message : 'Gagal memuat campaign unggulan.');
      } finally {
        if (!ignore) {
          setLoadingFeaturedCampaigns(false);
        }
      }
    }

    loadFeaturedCampaigns();

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="overflow-hidden bg-white">

      {/* ═══════ 1 · HERO SLIDESHOW ═══════ */}
      <HeroSlideshow />

      {/* ═══════ 2 · TRUST BAR (INFINITE SLIDER) ═══════ */}
      <TrustBar />

      {/* ═══════ 3 · HAPPENING NOW — EDITORIAL BENTO ═══════ */}
      {/* Hidden for presentation mode — set to true to re-enable */}
      <section className="bg-gray-50/50 pt-8 pb-12 sm:pt-12 sm:pb-16">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-row items-end justify-between gap-4">
            <motion.div {...fadeUp}>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-800">Terkini</p>
              <h2 className="text-xl font-black tracking-tight text-gray-900 sm:text-2xl md:text-3xl">Sedang Berlangsung</h2>
            </motion.div>
            <Link to="/campaigns" className="group flex items-center text-xs font-bold uppercase tracking-widest text-emerald-800 transition-colors hover:text-emerald-950">
              Lihat Semua
              <ArrowRight size={14} className="ml-2 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {featuredCampaignError ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-sm text-red-600">
              {featuredCampaignError}
            </div>
          ) : loadingFeaturedCampaigns ? (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-stretch animate-pulse">
              {/* Main Featured Campaign Skeleton */}
              <div className="lg:col-span-7 xl:col-span-8">
                <div className="flex h-full flex-col lg:flex-row overflow-hidden rounded-2xl border border-gray-100 bg-white">
                  <Skeleton className="aspect-[16/9] w-full lg:aspect-auto lg:w-[55%] rounded-none" />
                  <div className="flex flex-col justify-center p-4 sm:p-7 lg:flex-1 space-y-4">
                    <div className="space-y-2">
                      <Skeleton className="h-6 w-5/6" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-4/5" />
                    </div>
                    <div className="mt-auto space-y-3 pt-4 border-t border-gray-50">
                      <div className="flex justify-between">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-12" />
                      </div>
                      <Skeleton className="h-1.5 w-full rounded-full" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Side Campaigns Grid Skeleton */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-5 lg:grid-cols-1 xl:col-span-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex h-full items-center gap-4 overflow-hidden rounded-xl border border-gray-50 bg-white p-3">
                    <Skeleton className="aspect-square w-20 shrink-0 rounded-lg sm:w-24 bg-gray-200" />
                    <div className="flex min-w-0 flex-1 flex-col justify-center space-y-3">
                      <Skeleton className="h-4 w-5/6" />
                      <div className="space-y-2 mt-auto">
                        <Skeleton className="h-1.5 w-full rounded-full" />
                        <div className="flex justify-between">
                          <Skeleton className="h-3 w-16" />
                          <Skeleton className="h-3 w-8" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : featuredCampaigns.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-20 text-center">
              <h3 className="text-base font-bold text-gray-900">Belum ada campaign</h3>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-stretch">
              {/* Main Featured Campaign */}
              {featuredCampaigns[0] && (() => {
                const hero = featuredCampaigns[0];
                const progress = calculateProgress(hero.current_amount, hero.target_amount);
                return (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="lg:col-span-7 xl:col-span-8"
                  >
                    <Link
                      to={`/campaigns/${hero.slug}`}
                      className="group flex h-full flex-row overflow-hidden rounded-2xl border border-gray-100 bg-white transition-all duration-300 hover:shadow-xl hover:shadow-gray-200/50"
                    >
                      <div className="relative w-28 shrink-0 overflow-hidden sm:w-[40%] lg:w-[50%]">
                        <img
                          src={hero.thumbnail_url}
                          alt={hero.title}
                          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                          referrerPolicy="no-referrer"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gray-900/5" />
                      </div>
                      <div className="flex flex-col justify-center p-3.5 sm:p-7 lg:flex-1 min-w-0">
                        <div className="mb-2 sm:mb-5 space-y-1 sm:space-y-2">
                          <h3 className="text-sm sm:text-xl font-bold leading-snug text-gray-900 transition-colors group-hover:text-emerald-800 truncate sm:whitespace-normal">
                            {hero.title}
                          </h3>
                          <p className="hidden sm:line-clamp-2 text-xs sm:text-sm leading-relaxed text-gray-500 font-light">
                            {hero.short_description}
                          </p>
                        </div>
                        <div className="mt-auto space-y-3 pt-3 border-t border-gray-50">
                          <div className="flex items-center justify-between text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                            <span className="text-emerald-800">{formatCurrency(hero.current_amount)}</span>
                            <span className="text-gray-400">{progress}%</span>
                          </div>
                          <div className="h-1 w-full overflow-hidden rounded-full bg-gray-100">
                            <div
                              className="h-full rounded-full bg-emerald-700 transition-all duration-1000"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })()}

              {/* Side Campaigns Grid - Scrollable Horizontally on Mobile */}
              <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar -mx-5 px-5 snap-x snap-mandatory lg:grid lg:grid-cols-1 lg:gap-4 lg:col-span-5 lg:mx-0 lg:px-0 xl:col-span-4">
                {featuredCampaigns.slice(1, 4).map((campaign, index) => {
                  const progress = calculateProgress(campaign.current_amount, campaign.target_amount);
                  return (
                    <motion.div
                      key={campaign.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.1 * index, duration: 0.5 }}
                      className="w-[85vw] shrink-0 snap-start sm:w-[320px] lg:w-auto"
                    >
                      <Link
                        to={`/campaigns/${campaign.slug}`}
                        className="group flex h-full items-center gap-4 overflow-hidden rounded-xl border border-gray-50 bg-white p-3 transition-all duration-300 hover:shadow-lg hover:shadow-gray-200/30"
                      >
                        <div className="relative aspect-square w-20 shrink-0 overflow-hidden rounded-lg bg-gray-100 sm:w-24">
                          <img
                            src={campaign.thumbnail_url}
                            alt={campaign.title}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                            referrerPolicy="no-referrer"
                            loading="lazy"
                          />
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col">
                          <h4 className="mb-2 line-clamp-2 text-xs font-bold leading-snug text-gray-900 transition-colors group-hover:text-emerald-800 sm:text-sm">
                            {campaign.title}
                          </h4>
                          <div className="mt-auto space-y-2">
                            <div className="h-1 w-full overflow-hidden rounded-full bg-gray-50">
                              <div
                                className="h-full rounded-full bg-emerald-700/60"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <div className="flex items-center justify-between text-[10px] font-bold">
                              <span className="text-emerald-800">{formatCurrency(campaign.current_amount)}</span>
                              <span className="text-gray-400">{progress}%</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ═══════ 4 · STATS CTA (STREAMLINED) ═══════ */}
      <section className="relative py-12 sm:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative bg-[#064e3b] rounded-[2rem] overflow-hidden p-6 sm:p-10 md:p-12 shadow-2xl shadow-emerald-900/20"
          >
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none" />

            <div className="relative z-10 grid lg:grid-cols-5 gap-8 lg:gap-12 items-center">
              {/* Text Content - Spans 3 cols */}
              <div className="lg:col-span-3 space-y-5">
                <div className="space-y-3">
                  <h2 className="text-xl sm:text-3xl font-black text-white leading-tight">
                    Berdonasi Bersama Kami — <span className="text-emerald-400">Simpel & Berdampak</span>
                  </h2>
                  <p className="max-w-lg text-xs sm:text-sm font-light text-emerald-100/70 leading-relaxed">
                    Donasi Anda telah disalurkan melalui kampanye kami dan memberikan dampak nyata kepada ribuan penerima manfaat di beberapa pelosok tanah air.
                  </p>
                </div>
                <Link
                  to="/campaigns"
                  className="group inline-flex items-center gap-2 bg-white px-5 py-2.5 rounded-full text-xs font-bold text-emerald-900 hover:bg-emerald-50 transition-all hover:scale-105"
                >
                  Mulai Berdonasi
                  <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                </Link>
              </div>

              {/* Stats Grid - Spans 2 cols */}
              <div className="lg:col-span-2 grid grid-cols-2 gap-2 sm:gap-4">
                {[
                  { label: "Dana Terkumpul", value: "Rp 250 Jt+", icon: BarChart3 },
                  { label: "Penerima Manfaat", value: "500", icon: Users },
                  { label: "Lokasi", value: "5", icon: Globe },
                  { label: "Kampanye Selesai", value: "5", icon: CheckCircle2 },
                  { label: "Mitra Kolaborasi", value: "9", icon: Heart }
                ].map((stat, i) => (
                  <div key={i} className={cn("bg-white/5 border border-white/10 rounded-xl p-4 transition-colors hover:bg-white/10", i === 0 ? "col-span-2" : "")}>
                    <stat.icon size={16} className="text-emerald-400 mb-2" />
                    <div className="space-y-0.5">
                      <p className="text-lg font-black text-white leading-none">{stat.value}</p>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-200/50 leading-none">{stat.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════ 5 · INITIATIVES (PREMIUM CIRCULAR SLIDER) ═══════ */}
      <section className="py-8 sm:py-20 md:py-24 lg:py-32 bg-[#FAF9F6] overflow-hidden">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="mb-6 md:mb-16 flex flex-col md:flex-row md:items-end justify-between gap-3 md:gap-6 border-b border-gray-200 pb-5 sm:pb-10">
            <div className="max-w-2xl">
              <p className="text-emerald-700 font-bold uppercase tracking-[0.2em] text-[10px] sm:text-xs mb-2 md:mb-4 flex items-center gap-3">
                <span className="w-6 md:w-10 h-[2px] bg-emerald-600"></span>
                {headerData.label}
              </p>
              <h2 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 leading-tight tracking-tight">
                {headerData.title}
              </h2>
            </div>
            <p className="max-w-md text-gray-600 text-sm md:text-lg leading-relaxed font-light">
              {headerData.description}
            </p>
          </motion.div>

          <div className="flex justify-center w-full">
            {loadingPrograms ? (
              <div className="w-full max-w-7xl px-4 py-4 sm:py-8 grid gap-4 sm:gap-6 md:gap-20 md:grid-cols-2 animate-pulse">
                {/* Image Skeleton */}
                <div className="relative w-full h-[180px] sm:h-[260px] md:h-[400px] lg:h-[500px]">
                  <Skeleton className="w-full h-full rounded-3xl bg-gray-200" />
                </div>
                {/* Content Skeleton */}
                <div className="flex flex-col justify-center space-y-4 md:space-y-8">
                  <div className="space-y-3">
                    <Skeleton className="h-8 w-2/3 sm:h-12 bg-gray-200" />
                    <Skeleton className="h-4 w-1/3 bg-gray-200" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full bg-gray-200" />
                    <Skeleton className="h-4 w-full bg-gray-200" />
                    <Skeleton className="h-4 w-4/5 bg-gray-200" />
                  </div>
                  <div className="flex gap-4 pt-4">
                    <Skeleton className="w-12 h-12 rounded-full bg-gray-200" />
                    <Skeleton className="w-12 h-12 rounded-full bg-gray-200" />
                  </div>
                </div>
              </div>
            ) : (
              <CircularTestimonials
                testimonials={(dynamicPrograms.length > 0 ? dynamicPrograms : PROGRAMS).map((program) => {
                  return {
                    id: program.id || program.slug,
                    name: program.title,
                    designation: program.stage_value || 'Program STA',
                    quote: program.short_description || program.description,
                    src: program.home_slider_image || program.hero_image_url || '',
                    href: `/programs/${program.slug}`
                  };
                })}
                autoplay={true}
                colors={{
                  name: "#111827",
                  designation: "#059669",
                  testimony: "#4b5563",
                  arrowBackground: "#065f46",
                  arrowForeground: "#ffffff",
                  arrowHoverBackground: "#047857",
                }}
                fontSizes={{
                  name: "clamp(1.25rem, 4vw, 2.5rem)",
                  designation: "0.75rem",
                  quote: "clamp(0.875rem, 2vw, 1.25rem)",
                }}
              />
            )}
          </div>
        </div>
      </section>

      {/* ═══════ 6 · INTERACTIVE IMPACT MAP ═══════ */}
      <ImpactMapSection />

      {/* ═══════ 7 · CTA ═══════ */}
      <CtaSection data={ctaData} />
    </div>
  );
}
