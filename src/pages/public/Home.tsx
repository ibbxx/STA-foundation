import React from 'react';
import { Logos3 } from '../../components/shared/LogoCarousel';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  ChevronDown,
  HandHeart,
  Quote,
  Heart,
  Users,
  BarChart3,
  CheckCircle2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Campaign } from '../../lib/supabase';
import { fetchPublicCampaigns } from '../../lib/public-campaigns';
import { getProgramIcon } from '../../lib/program-icons';
import { PROGRAMS } from '../../lib/programs';
import { formatCurrency, calculateProgress, cn } from '../../lib/utils';

const CATEGORIES = [
  { name: 'Pendidikan', image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=600', count: 24 },
  { name: 'Kesehatan', image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=600', count: 18 },
  { name: 'Lingkungan', image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=600', count: 12 },
  { name: 'Bencana Alam', image: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&q=80&w=600', count: 9 },
  { name: 'Pangan', image: 'https://images.unsplash.com/photo-1594708767771-a7502209ff51?auto=format&fit=crop&q=80&w=600', count: 15 },
];

const FAQ_ITEMS = [
  { q: 'Bagaimana cara memulai penggalangan dana?', a: 'Anda cukup mendaftar akun, membuat halaman campaign dengan informasi lengkap, dan membagikannya ke jaringan Anda. Tim kami akan memverifikasi campaign dalam 1x24 jam.' },
  { q: 'Apakah ada biaya yang dikenakan saat berdonasi?', a: 'Kami mengenakan biaya platform sebesar 5% dari total donasi yang terkumpul untuk operasional dan pengembangan platform. Tidak ada biaya tersembunyi.' },
  { q: 'Bagaimana saya bisa yakin dananya tersalur dengan benar?', a: 'Setiap campaign wajib memberikan update berkala dan laporan penggunaan dana. Kami juga melakukan verifikasi identitas penggalang dana dan menyediakan laporan transparansi publik.' },
  { q: 'Berapa lama proses pencairan dana ke penggalang?', a: 'Dana dapat dicairkan kapan saja setelah minimal terkumpul Rp 1.000.000. Proses transfer membutuhkan 1-3 hari kerja ke rekening yang terdaftar.' },
  { q: 'Apakah saya bisa membuat campaign anonim?', a: 'Ya, Anda bisa memilih untuk menyembunyikan identitas Anda sebagai penggalang dana. Namun, kami tetap memerlukan verifikasi identitas untuk keamanan.' },
];

/* ─────────── Sub-Components ─────────── */

function FAQItem({ q, a, isOpen, onClick }: { q: string; a: string; isOpen: boolean; onClick: () => void }) {
  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <button onClick={onClick} className="w-full flex items-center justify-between py-5 md:py-6 text-left group">
        <span className="text-sm sm:text-base md:text-lg font-semibold text-gray-800 group-hover:text-emerald-700 transition-colors pr-6 leading-snug">
          {q}
        </span>
        <ChevronDown
          size={18}
          className={cn('shrink-0 text-gray-400 transition-transform duration-300', isOpen && 'rotate-180 text-emerald-600')}
        />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <p className="pb-5 md:pb-6 text-gray-500 leading-relaxed text-sm">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────── Animation Variants ─────────── */

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
};

/* ─────────── Main Component ─────────── */

export default function Home() {
  const [openFaq, setOpenFaq] = React.useState<number | null>(0);
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

      {/* ═══════ 1 · HERO (COMPONENT BUNDLE INTEGRATION) ═══════ */}
      <section className="relative min-h-[100svh] w-full overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=2070&auto=format&fit=crop"
            alt="Humanitarian background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80" />
        </div>

        <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-7xl items-center px-4 sm:px-6 lg:px-12">
          <div className="max-w-3xl pb-20 pt-24 sm:pb-24 sm:pt-20">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="space-y-5 sm:space-y-6"
            >
              <h1 className="text-[2rem] font-black leading-[1.05] tracking-tight text-[#F5F1E8] sm:text-4xl md:text-5xl lg:text-[3.5rem] uppercase">
                GOTONG ROYONG BENERIN 1000 SEKOLAH
              </h1>

              <p className="max-w-xl text-sm font-light leading-relaxed text-[#F5F1E8]/90 sm:text-base md:text-lg">
                Karena setiap anak berhak belajar di ruang yang aman, layak, dan penuh harapan.<br className="hidden sm:block" />
                Mari jadi bagian dari gerakan ini. Kolaborasi Anda, sebagai individu, komunitas, institusi, maupun mitra adalah langkah nyata untuk membangun masa depan yang lebih adil dan berkelanjutan.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Link
                  to="/campaigns"
                  className="px-6 py-3.5 bg-[#2C5F4F] text-[#F5F1E8] text-sm md:text-base font-bold rounded-full hover:bg-[#234A3D] transition-all duration-300 flex items-center justify-center gap-2"
                >
                  Donasi Sekarang
                </Link>
                <a
                  href="https://wa.me/6287882799026"
                  target="_blank"
                  rel="noreferrer"
                  className="px-6 py-3.5 border border-[#F5F1E8]/30 text-[#F5F1E8] text-sm md:text-base font-medium rounded-full hover:bg-[#F5F1E8]/10 transition-all duration-300 flex items-center justify-center"
                >
                  Jadi Mitra Kolaborator
                </a>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
      </section>

      {/* ═══════ 2 · SOCIAL PROOF TRUST BAR (AUTO-SCROLL) ═══════ */}
      <Logos3 />



      {/* ═══════ 4 · HAPPENING NOW — EDITORIAL BENTO ═══════ */}
      <section className="py-12 sm:py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 sm:mb-10 gap-3">
            <motion.div {...fadeUp}>
              <p className="text-emerald-600 font-bold uppercase tracking-[0.15em] text-[11px] sm:text-xs mb-1.5">Terkini</p>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900">Sedang Berlangsung</h2>
            </motion.div>
            <Link to="/campaigns" className="text-emerald-600 font-semibold flex items-center hover:text-emerald-700 group text-sm transition-colors">
              Lihat Semua
              <ArrowRight size={15} className="ml-1 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {featuredCampaignError ? (
            <div className="rounded-3xl border border-gray-200 bg-white px-6 py-5 text-sm text-red-600 shadow-sm">
              {featuredCampaignError}
            </div>
          ) : loadingFeaturedCampaigns ? (
            <div className="rounded-3xl border border-gray-200 bg-white px-6 py-16 text-center text-sm text-gray-500 shadow-sm">
              Memuat campaign unggulan...
            </div>
          ) : featuredCampaigns.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900">Belum ada campaign featured</h3>
              <p className="mt-2 text-sm text-gray-500">
                Pilih campaign featured dari admin panel agar tampil di beranda.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:gap-5 lg:grid-cols-12">
              {featuredCampaigns[0] ? (() => {
                const hero = featuredCampaigns[0];
                const progress = calculateProgress(hero.current_amount, hero.target_amount);
                return (
                  <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ duration: 0.5 }}
                    className="lg:col-span-7 xl:col-span-8"
                  >
                    <Link
                      to={`/campaigns/${hero.slug}`}
                      className="group relative block aspect-[4/3] overflow-hidden rounded-2xl bg-gray-900 sm:aspect-[16/10] lg:h-full lg:aspect-auto"
                    >
                      <img
                        src={hero.thumbnail_url}
                        alt={hero.title}
                        className="absolute inset-0 h-full w-full object-cover opacity-80 transition-transform duration-700 group-hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                      <div className="absolute bottom-0 left-0 right-0 space-y-3 p-5 sm:p-7 md:p-8">
                        <span className="inline-block rounded-full bg-emerald-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-400 backdrop-blur-sm sm:text-xs">
                          Kampanye Utama
                        </span>
                        <h3 className="max-w-lg text-xl font-bold leading-snug text-white transition-colors group-hover:text-emerald-300 sm:text-2xl md:text-3xl">
                          {hero.title}
                        </h3>
                        <p className="max-w-md line-clamp-2 text-sm font-light leading-relaxed text-white/60">
                          {hero.short_description}
                        </p>

                        <div className="flex items-center gap-4 pt-1">
                          <div className="max-w-xs flex-1">
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/20">
                              <div className="h-full rounded-full bg-emerald-400 transition-all duration-700" style={{ width: `${progress}%` }} />
                            </div>
                          </div>
                          <span className="whitespace-nowrap text-sm font-bold text-emerald-400">{progress}%</span>
                        </div>
                        <div className="flex items-center justify-between pt-1 text-xs sm:text-sm">
                          <span className="font-semibold text-white/90">{formatCurrency(hero.current_amount)}</span>
                          <span className="flex items-center gap-1.5 text-white/50">
                            <Users size={13} /> {hero.donor_count} donatur
                          </span>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })() : null}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-5 lg:col-span-5 lg:grid-cols-1 xl:col-span-4">
                {featuredCampaigns.slice(1).map((campaign, index) => {
                  const progress = calculateProgress(campaign.current_amount, campaign.target_amount);
                  return (
                    <motion.div
                      key={campaign.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '-40px' }}
                      transition={{ delay: 0.1 + index * 0.08, duration: 0.45 }}
                    >
                      <Link
                        to={`/campaigns/${campaign.slug}`}
                        className="group flex flex-col overflow-hidden rounded-xl border border-gray-100 bg-white transition-all duration-300 hover:shadow-lg hover:shadow-emerald-100/40 lg:flex-row"
                      >
                        <div className="relative aspect-[16/10] shrink-0 overflow-hidden lg:w-28 lg:aspect-square xl:w-32">
                          <img
                            src={campaign.thumbnail_url}
                            alt={campaign.title}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            loading="lazy"
                            decoding="async"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent lg:bg-none" />
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col justify-center p-3 sm:p-4">
                          <h4 className="mb-1 line-clamp-2 text-xs font-bold leading-snug text-gray-900 transition-colors group-hover:text-emerald-700 sm:text-sm">
                            {campaign.title}
                          </h4>
                          <p className="mb-2 hidden line-clamp-1 text-[11px] leading-relaxed text-gray-400 lg:block sm:text-xs">
                            {campaign.short_description}
                          </p>
                          <div className="space-y-1.5">
                            <div className="h-1 w-full overflow-hidden rounded-full bg-gray-100">
                              <div className="h-full rounded-full bg-emerald-500 transition-all duration-700" style={{ width: `${progress}%` }} />
                            </div>
                            <div className="flex items-center justify-between text-[10px] sm:text-[11px]">
                              <span className="font-bold text-emerald-600">{formatCurrency(campaign.current_amount)}</span>
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

      {/* ═══════ 5 · STATS CTA ═══════ */}
      <section className="relative overflow-hidden py-14 sm:py-20 md:py-24">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600" />
        <div className="absolute top-0 right-0 w-80 sm:w-[500px] h-80 sm:h-[500px] bg-emerald-400/15 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-60 sm:w-[350px] h-60 sm:h-[350px] bg-teal-800/20 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="space-y-5 sm:space-y-6"
            >
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[2.75rem] font-extrabold text-white leading-tight">
                Berdonasi Bersama Kami — Simpel, Efektif, dan Berdampak
              </h2>
              <p className="text-emerald-100/80 text-sm sm:text-base leading-relaxed max-w-lg">
                Lebih dari 1.000 campaign telah berhasil disalurkan dan memberikan dampak nyata kepada puluhan ribu penerima manfaat di seluruh Indonesia.
              </p>
              <Link
                to="/campaigns"
                className="inline-flex items-center bg-white text-emerald-700 px-6 sm:px-7 py-3 sm:py-3.5 rounded-full font-bold hover:bg-emerald-50 transition-all shadow-lg text-sm group"
              >
                Mulai Berdonasi
                <ArrowRight size={16} className="ml-2 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="grid grid-cols-2 gap-3 sm:gap-4"
            >
              {[
                { value: 'Rp 250 Juta+', label: 'Total Donasi Tersalurkan', icon: Heart },
                { value: '60', label: 'Pejuang Tanah Air', icon: Users },
                { value: '5 Lokasi', label: 'Di 4 Pulau Berbeda', icon: CheckCircle2 },
                { value: '9', label: 'Mitra Kolaborator', icon: HandHeart },
                { value: '+3M', label: 'Penayangan Eksukasi & Promosi', icon: BarChart3 },
              ].map((stat, i) => (
                <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 border border-white/10">
                  <stat.icon size={20} className="text-emerald-300 mb-2 sm:mb-3" />
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white leading-none">{stat.value}</h3>
                  <p className="text-emerald-200/70 text-[10px] sm:text-[11px] mt-1.5 font-medium tracking-wide uppercase">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

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
                  <Link to="/campaigns" className="bg-white text-emerald-700 px-6 sm:px-7 py-3 sm:py-3.5 rounded-full font-bold hover:bg-emerald-50 transition-all text-center text-sm shadow-lg">
                    Mulai Berdonasi
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
                src="https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&q=80&w=1200"
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
