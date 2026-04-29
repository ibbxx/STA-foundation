import React from 'react';
import { motion } from 'framer-motion';
import { InfiniteSlider } from '../../components/ui/infinite-slider';
import { ProgressiveBlur } from '../../components/ui/progressive-blur';
import {
  ArrowRight,
  HandHeart,
  Quote,
  Heart,
  Users,
  BarChart3,
  CheckCircle2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Campaign } from '../../lib/supabase';
import { logError } from '../../lib/error-logger';
import { fetchPublicCampaigns } from '../../lib/public-campaigns';
import { getProgramIcon } from '../../lib/program-icons';
import { PROGRAMS } from '../../lib/programs';
import { formatCurrency, calculateProgress, cn } from '../../lib/utils';
import InteractiveMap from '../../components/shared/InteractiveMap';
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

      {/* ═══════ 1 · HERO ═══════ */}
      <section className="relative min-h-screen">
        {/* Background image — fills entire section */}
        <div className="absolute inset-0 overflow-hidden">
          <img
            src="https://jfzvlzxslmgnssxekcme.supabase.co/storage/v1/object/public/campaign-assets/updates-demo/school_construction_1777146387719.png"
            alt="Humanitarian background"
            className="size-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/60 to-gray-950/20" />
        </div>

        {/* Content overlay — bottom-left, flush left on all screens */}
        <div className="relative z-10 flex min-h-screen items-end pb-24 sm:pb-32 pt-32">
          <div className="flex flex-col px-5 sm:px-8 lg:px-12">
            <div className="max-w-2xl text-left">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <h1 className="mt-4 max-w-2xl text-balance text-3xl font-black uppercase leading-[1.1] tracking-tight text-[#F5F1E8] sm:mt-8 sm:text-4xl md:text-5xl lg:mt-16 xl:text-6xl">
                  GOTONG ROYONG BENERIN 1000 SEKOLAH
                </h1>
                <p className="mt-4 max-w-xl text-balance text-sm font-light leading-relaxed text-[#F5F1E8]/85 sm:mt-6 sm:text-base">
                  Membangun harapan dan masa depan anak Indonesia melalui ruang belajar yang aman dan layak.
                </p>

                <div className="mt-8 flex flex-col items-start gap-3 sm:mt-12 sm:flex-row">
                  {/* HIDDEN FOR PRESENTATION MODE 
                  <Link
                    to="/campaigns"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#2C5F4F] pl-6 pr-4 text-sm font-bold text-[#F5F1E8] transition-all duration-300 hover:bg-[#234A3D] md:h-12 md:text-base"
                  >
                    <span className="whitespace-nowrap">Donasi Sekarang</span>
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                  */}
                  {/* TEMPORARY CTA */}
                  <Link
                    to="/tentang-kami"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#2C5F4F] pl-6 pr-4 text-sm font-bold text-[#F5F1E8] transition-all duration-300 hover:bg-[#234A3D] md:h-12 md:text-base"
                  >
                    <span className="whitespace-nowrap">Pelajari Lebih Lanjut</span>
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                  <a
                    href="https://wa.me/6287882799026"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-11 items-center justify-center rounded-full border border-[#F5F1E8]/25 px-6 text-sm font-medium text-[#F5F1E8] transition-all duration-300 hover:bg-[#F5F1E8]/10 md:h-12 md:text-base"
                  >
                    <span className="whitespace-nowrap">Jadi Mitra Kolaborator</span>
                  </a>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ 2 · TRUST BAR (INFINITE SLIDER) ═══════ */}
      <section className="bg-white border-y border-gray-200/60 py-4">
        <div className="group relative m-auto max-w-7xl px-6">
          <div className="flex flex-col items-center md:flex-row">
            <div className="shrink-0 py-6 md:max-w-48 md:border-r md:border-gray-200 md:pr-8">
              <p className="text-center text-sm font-bold uppercase tracking-widest text-gray-400 md:text-end">
                Dipercaya Oleh
              </p>
            </div>
            <div className="relative py-8 md:w-[calc(100%-12rem)]">
              <InfiniteSlider
                duration={35}
                gap={80}
                stopOnHover={true}
                draggable={true}
              >
                {[
                  { name: 'Admedika', src: '/mitra/assets/admedika.png', href: 'https://www.instagram.com/admedika_ig?igsh=MW04d3hhMmYxa3pvMQ==', sizeClass: 'h-14 md:h-20 scale-110' },
                  { name: 'Bali Nggih', src: '/mitra/assets/balinggih.png', href: 'https://www.instagram.com/balinggih?igsh=MTg5MDBsZ3JvdzJqZw==', sizeClass: 'h-8 md:h-12' },
                  { name: 'Distrik Berisik', src: '/mitra/assets/blue-db.png', href: 'https://www.instagram.com/distrik_berisik?igsh=Mmk3bTN6eG5maHZ3', sizeClass: 'h-8 md:h-12' },
                  { name: 'PIS Movement', src: '/mitra/assets/peacemaker.png', href: 'https://www.instagram.com/pismovement?igsh=c25kNWZtNDJkcWI1', sizeClass: 'h-14 md:h-20' },
                  { name: 'Kawan Cendekia', src: '/mitra/assets/img-0338.png', href: 'https://www.instagram.com/kawancendekia?igsh=ZTlzNHhqem13MHlo', sizeClass: 'h-14 md:h-20' },
                  { name: 'Perempuan Lestari', src: '/mitra/assets/wa-image.jpg', href: 'https://www.instagram.com/perempuan.lestari?igsh=MW5uMW9tcHltYWZ5OA==', sizeClass: 'h-14 md:h-20' },
                ].map((partner) => (
                  <div key={partner.name} className="flex items-center justify-center px-4 min-h-[6rem]">
                    <a 
                      href={partner.href} 
                      target="_blank" 
                      rel="noreferrer"
                      className="transition-transform hover:scale-110"
                    >
                      <img
                        src={partner.src}
                        alt={`Logo ${partner.name}`}
                        className={cn(
                          "w-auto object-contain mix-blend-multiply origin-center",
                          partner.sizeClass
                        )}
                      />
                    </a>
                  </div>
                ))}
              </InfiniteSlider>

              {/* Edge fade masks */}
              <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-white to-transparent" />
              <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-white to-transparent" />
              <ProgressiveBlur
                className="pointer-events-none absolute left-0 top-0 h-full w-20"
                direction="left"
                blurIntensity={1}
              />
              <ProgressiveBlur
                className="pointer-events-none absolute right-0 top-0 h-full w-20"
                direction="right"
                blurIntensity={1}
              />
            </div>
          </div>
        </div>
      </section>



      {/* ═══════ 4 · HAPPENING NOW — EDITORIAL BENTO ═══════ */}
      {/* HIDDEN FOR PRESENTATION MODE */}
      {false && (
        <section className="bg-gray-50/50 py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
            <div className="mb-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
              <motion.div {...fadeUp}>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-800">Terkini</p>
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
              <div className="rounded-2xl border border-gray-100 bg-white p-20 text-center text-sm text-gray-400">
                Memuat campaign...
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
                        className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white transition-all duration-300 hover:shadow-xl hover:shadow-gray-200/50"
                      >
                        <div className="relative aspect-[16/9] overflow-hidden lg:aspect-auto lg:flex-1">
                          <img
                            src={hero.thumbnail_url}
                            alt={hero.title}
                            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-gray-900/5" />
                        </div>
                        <div className="flex flex-col p-6 sm:p-8">
                          <div className="mb-6 space-y-3">
                            <h3 className="text-xl font-bold leading-tight text-gray-900 transition-colors group-hover:text-emerald-800 sm:text-2xl">
                              {hero.title}
                            </h3>
                            <p className="line-clamp-2 text-sm leading-relaxed text-gray-500">
                              {hero.short_description}
                            </p>
                          </div>
                          <div className="mt-auto space-y-4 pt-4 border-t border-gray-50">
                            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                              <span className="text-emerald-800">{formatCurrency(hero.current_amount)}</span>
                              <span className="text-gray-400">{progress}%</span>
                            </div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
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

                {/* Side Campaigns Grid */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-5 lg:grid-cols-1 xl:col-span-4">
                  {featuredCampaigns.slice(1, 4).map((campaign, index) => {
                    const progress = calculateProgress(campaign.current_amount, campaign.target_amount);
                    return (
                      <motion.div
                        key={campaign.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 * index, duration: 0.5 }}
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
      )}

      {/* ═══════ 5 · STATS CTA ═══════ */}
      {/* HIDDEN FOR PRESENTATION MODE */}
      {false && (
        <section className="relative overflow-hidden bg-[#1A3C32] py-20 sm:py-24">
          <div className="relative z-10 mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
            <div className="grid items-center gap-16 lg:grid-cols-2">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="space-y-8"
              >
                <div className="space-y-4">
                  <h2 className="text-3xl font-black leading-tight text-white sm:text-4xl lg:text-5xl">
                    Berdonasi Bersama Kami — Simpel, Efektif, & Berdampak
                  </h2>
                  <p className="max-w-lg text-base font-light leading-relaxed text-emerald-100/70">
                    Lebih dari 1.000 kampanye telah berhasil disalurkan dan memberikan dampak nyata kepada puluhan ribu penerima manfaat di seluruh pelosok Indonesia.
                  </p>
                </div>
                <Link
                  to="/campaigns"
                  className="group inline-flex items-center gap-3 rounded-full bg-white px-8 py-4 text-sm font-bold text-emerald-900 transition-all hover:bg-emerald-50 hover:shadow-xl hover:shadow-black/10"
                >
                  Mulai Berdonasi
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="grid grid-cols-2 gap-4 sm:gap-6"
              >
                {[
                  { value: 'Rp 250 Juta+', label: 'Donasi Tersalurkan', icon: Heart },
                  { value: '60+', label: 'Pejuang Tanah Air', icon: Users },
                  { value: '5', label: 'Lokasi Provinsi', icon: CheckCircle2 },
                  { value: '9', label: 'Mitra Kolaborasi', icon: HandHeart },
                  { value: '3M+', label: 'Edukasi & Promosi', icon: BarChart3 },
                ].map((stat, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex flex-col justify-center rounded-2xl bg-white/5 p-6 border border-white/5 transition-colors hover:bg-white/10",
                      i === 4 ? "col-span-2 sm:col-span-1" : ""
                    )}
                  >
                    <stat.icon size={20} className="mb-4 text-emerald-400" />
                    <div className="space-y-1">
                      <h3 className="text-2xl font-black text-white sm:text-3xl">{stat.value}</h3>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-200/50">{stat.label}</p>
                    </div>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>
      )}

      {/* ═══════ 6 · INITIATIVES (PREMIUM CLEAN - MOBILE OPTIMIZED) ═══════ */}
      <section className="py-20 md:py-24 lg:py-32 bg-[#FAF9F6] overflow-hidden">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="mb-12 md:mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-200 pb-8 sm:pb-10">
            <div className="max-w-2xl">
              <p className="text-emerald-700 font-bold uppercase tracking-[0.2em] text-xs sm:text-sm mb-3 md:mb-4 flex items-center gap-3">
                <span className="w-8 md:w-10 h-[2px] bg-emerald-600"></span>
                Inisiatif Utama
              </p>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 leading-tight tracking-tight">
                Program Kami
              </h2>
            </div>
            <p className="max-w-md text-gray-600 text-[15px] md:text-lg leading-relaxed font-light">
              Tiga pilar inisiatif yang kami rancang untuk menciptakan ekosistem pendidikan yang inklusif, layak, dan berkelanjutan.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 lg:gap-8">
            {PROGRAMS.map((program, i) => {
              const ProgramIcon = getProgramIcon(program.icon_name);

              return (
                <motion.div
                  key={program.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                  className="h-full"
                >
                  <Link
                    to={program.detail_path}
                    className="group flex flex-col h-full bg-white border border-gray-100 p-6 md:p-8 lg:p-10 hover:border-emerald-200 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 rounded-2xl md:rounded-none"
                  >
                    <div className="flex items-center justify-between mb-8">
                      <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
                        <ProgramIcon size={28} strokeWidth={1.5} className="w-6 h-6 md:w-7 md:h-7" />
                      </div>
                      <span className="text-xs font-bold tracking-[0.15em] uppercase text-gray-400">
                        0{i + 1}
                      </span>
                    </div>

                    <div className="flex-1">
                      <span className="inline-block px-3 py-1.5 bg-gray-50 text-emerald-700 text-[10px] md:text-xs font-bold uppercase tracking-widest mb-4 rounded-full md:rounded-none">
                        {program.stage_value}
                      </span>
                      <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-3 md:mb-4 leading-snug group-hover:text-emerald-700 transition-colors duration-300">
                        {program.title}
                      </h3>
                      <p className="text-gray-600 text-[15px] md:text-base leading-relaxed font-light mb-8">
                        {program.short_description}
                      </p>
                    </div>

                    <div className="mt-auto pt-5 md:pt-6 border-t border-gray-50 flex items-center gap-3 text-sm font-bold uppercase tracking-wider text-emerald-700">
                      <span>Eksplorasi</span>
                      <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-2 w-4 h-4 md:w-5 md:h-5" />
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════ 8.5 · PETA DAMPAK ═══════ */}
      <section className="py-16 md:py-24 bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gray-50/50 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6 }}
            className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12"
          >
            <div className="max-w-2xl">
              <p className="text-emerald-700 font-bold tracking-widest text-sm uppercase mb-3 flex items-center gap-3">
                <span className="w-8 md:w-10 h-[2px] bg-emerald-600"></span>
                Peta Sebaran
              </p>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 leading-tight tracking-tight">
                Jejak Kebaikan di Pelosok Negeri
              </h2>
            </div>
            <p className="max-w-md text-gray-600 text-[15px] md:text-lg leading-relaxed font-light">
              Lihat bagaimana kontribusi Anda telah menciptakan senyum dan ruang belajar yang lebih baik bagi anak-anak Indonesia dari Sabang sampai Merauke.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="w-full relative rounded-2xl overflow-hidden shadow-2xl shadow-gray-200/50"
          >
            {/* InteractiveMap component is loaded here */}
            <InteractiveMap height="600px" />
          </motion.div>
        </div>
      </section>

      {/* ═══════ 9 · FINAL CTA ═══════ */}
      <section className="py-10 sm:py-14 md:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-0 rounded-2xl sm:rounded-[1.5rem] md:rounded-[2rem] overflow-hidden shadow-xl shadow-gray-200/30">
            {/* Text */}
            <div className="relative order-2 flex flex-col justify-center overflow-hidden bg-emerald-700 p-6 sm:p-10 md:p-14 lg:order-1 lg:p-16">
              <div className="absolute top-0 right-0 w-40 sm:w-48 h-40 sm:h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-28 sm:w-32 h-28 sm:h-32 bg-teal-800/20 rounded-full blur-2xl pointer-events-none" />
              <div className="relative z-10 space-y-4 sm:space-y-5">
                <Quote size={28} className="text-emerald-400/40" />
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white leading-tight">
                  Bergabunglah untuk Masa Depan yang Lebih Cerah
                </h2>
                <p className="text-emerald-100/75 text-sm sm:text-base leading-relaxed">
                  Setiap kontribusi Anda, sekecil apapun, adalah harapan bagi ribuan saudara kita. Mari bersama membangun Indonesia yang lebih baik.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  {/* HIDDEN FOR PRESENTATION MODE
                  <Link to="/campaigns" className="bg-white text-emerald-700 px-6 sm:px-7 py-3 sm:py-3.5 rounded-full font-bold hover:bg-emerald-50 transition-all text-center text-sm shadow-lg">
                    Mulai Berdonasi
                  </Link>
                  */}
                  {/* TEMPORARY CTA */}
                  <Link to="/laporkan" className="bg-white text-emerald-700 px-6 sm:px-7 py-3 sm:py-3.5 rounded-full font-bold hover:bg-emerald-50 transition-all text-center text-sm shadow-lg">
                    Laporkan Sekolah
                  </Link>
                  <Link to="/kontak" className="bg-emerald-800/60 text-white px-6 sm:px-7 py-3 sm:py-3.5 rounded-full font-bold hover:bg-emerald-800 transition-all text-center text-sm border border-emerald-600/40">
                    Hubungi Kami
                  </Link>
                </div>
              </div>
            </div>

            {/* Image */}
            <div className="relative aspect-[16/10] lg:aspect-auto order-1 lg:order-2">
              <img
                src="https://jfzvlzxslmgnssxekcme.supabase.co/storage/v1/object/public/campaign-assets/updates-demo/fundraising_milestone_1777146436734.png"
                alt="Kebersamaan"
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-l from-transparent to-emerald-700/5" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
