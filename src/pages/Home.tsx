import React from 'react';
import { Logos3 } from '../components/blocks/logos3';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import {
  ArrowRight,
  Play,
  ChevronDown,
  Droplets,
  Stethoscope,
  GraduationCap,
  HandHeart,
  Quote,
  ArrowUpRight,
  Search,
  Heart,
  Users,
  BarChart3,
  CheckCircle2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Campaign } from '../lib/supabase';
import { formatCurrency, calculateProgress, cn } from '../lib/utils';

/* ─────────── Mock Data ─────────── */

const MOCK_CAMPAIGNS: Campaign[] = [
  {
    id: '1',
    title: 'Beasiswa Pendidikan Anak Pesisir di Lombok',
    slug: 'beasiswa-pendidikan-anak-pesisir',
    short_description: 'Membantu 100 anak nelayan di pesisir Lombok untuk mendapatkan akses pendidikan yang layak.',
    full_description: '',
    target_amount: 500000000,
    current_amount: 325000000,
    thumbnail_url: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=800',
    banner_url: '',
    category_id: 'cat1',
    status: 'active',
    deadline: '2026-12-31',
    is_featured: true,
    created_at: '',
    donor_count: 1240,
  },
  {
    id: '2',
    title: 'Pembangunan Sumur Air Bersih di Gunung Kidul',
    slug: 'sumur-air-bersih-gunung-kidul',
    short_description: 'Menyediakan akses air bersih berkelanjutan bagi 5 desa terdampak kekeringan.',
    full_description: '',
    target_amount: 250000000,
    current_amount: 180000000,
    thumbnail_url: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&q=80&w=800',
    banner_url: '',
    category_id: 'cat2',
    status: 'active',
    deadline: '2026-12-31',
    is_featured: true,
    created_at: '',
    donor_count: 850,
  },
  {
    id: '3',
    title: 'Operasi Katarak Gratis untuk Lansia',
    slug: 'operasi-katarak-gratis',
    short_description: 'Memberikan penglihatan kembali bagi 50 lansia melalui operasi katarak profesional.',
    full_description: '',
    target_amount: 150000000,
    current_amount: 45000000,
    thumbnail_url: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=800',
    banner_url: '',
    category_id: 'cat3',
    status: 'active',
    deadline: '2026-12-31',
    is_featured: true,
    created_at: '',
    donor_count: 320,
  },
  {
    id: '4',
    title: 'Bantuan Pangan untuk Desa Terpencil NTT',
    slug: 'bantuan-pangan-ntt',
    short_description: 'Distribusi paket pangan bergizi untuk 200 keluarga di pedalaman NTT.',
    full_description: '',
    target_amount: 300000000,
    current_amount: 210000000,
    thumbnail_url: 'https://images.unsplash.com/photo-1594708767771-a7502209ff51?auto=format&fit=crop&q=80&w=800',
    banner_url: '',
    category_id: 'cat4',
    status: 'active',
    deadline: '2026-12-31',
    is_featured: true,
    created_at: '',
    donor_count: 960,
  },
];

const CATEGORIES = [
  { name: 'Pendidikan', image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=600', count: 24 },
  { name: 'Kesehatan', image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=600', count: 18 },
  { name: 'Lingkungan', image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=600', count: 12 },
  { name: 'Bencana Alam', image: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&q=80&w=600', count: 9 },
  { name: 'Pangan', image: 'https://images.unsplash.com/photo-1594708767771-a7502209ff51?auto=format&fit=crop&q=80&w=600', count: 15 },
];

const BLOG_POSTS = [
  { id: 1, title: 'Kisah Inspiratif: Anak Nelayan Meraih Beasiswa Kedokteran', excerpt: 'Dari desa kecil di pesisir Lombok, seorang anak nelayan berhasil meraih mimpinya...', image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=600', date: '28 Mar 2026', category: 'Inspirasi' },
  { id: 2, title: '5 Desa di NTT Kini Punya Akses Air Bersih', excerpt: 'Program sumur bor berhasil memberikan akses air bersih untuk ribuan warga...', image: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&q=80&w=600', date: '22 Mar 2026', category: 'Laporan' },
  { id: 3, title: 'Cara Mudah Berdonasi Online yang Aman', excerpt: 'Panduan lengkap cara berdonasi secara digital dengan jaminan keamanan...', image: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&q=80&w=600', date: '15 Mar 2026', category: 'Edukasi' },
];

const FAQ_ITEMS = [
  { q: 'Bagaimana cara memulai penggalangan dana?', a: 'Anda cukup mendaftar akun, membuat halaman campaign dengan informasi lengkap, dan membagikannya ke jaringan Anda. Tim kami akan memverifikasi campaign dalam 1x24 jam.' },
  { q: 'Apakah ada biaya yang dikenakan saat berdonasi?', a: 'Kami mengenakan biaya platform sebesar 5% dari total donasi yang terkumpul untuk operasional dan pengembangan platform. Tidak ada biaya tersembunyi.' },
  { q: 'Bagaimana saya bisa yakin dananya tersalur dengan benar?', a: 'Setiap campaign wajib memberikan update berkala dan laporan penggunaan dana. Kami juga melakukan verifikasi identitas penggalang dana dan menyediakan laporan transparansi publik.' },
  { q: 'Berapa lama proses pencairan dana ke penggalang?', a: 'Dana dapat dicairkan kapan saja setelah minimal terkumpul Rp 1.000.000. Proses transfer membutuhkan 1-3 hari kerja ke rekening yang terdaftar.' },
  { q: 'Apakah saya bisa membuat campaign anonim?', a: 'Ya, Anda bisa memilih untuk menyembunyikan identitas Anda sebagai penggalang dana. Namun, kami tetap memerlukan verifikasi identitas untuk keamanan.' },
];

const INITIATIVES = [
  { icon: Droplets, label: 'Pangan & Air', desc: 'Akses pangan dan air bersih untuk daerah terpencil' },
  { icon: Stethoscope, label: 'Kesehatan', desc: 'Layanan kesehatan gratis untuk masyarakat kurang mampu' },
  { icon: HandHeart, label: 'Kesejahteraan', desc: 'Program pemberdayaan ekonomi dan sosial masyarakat' },
  { icon: GraduationCap, label: 'Pendidikan', desc: 'Beasiswa dan akses pendidikan untuk anak Indonesia' },
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

function CampaignMiniCard({ campaign }: { campaign: Campaign }) {
  const progress = calculateProgress(campaign.current_amount, campaign.target_amount);
  return (
    <Link
      to={`/campaigns/${campaign.slug}`}
      className="group bg-white rounded-xl sm:rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg hover:shadow-emerald-100/40 transition-all duration-300 flex flex-col"
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <img
          src={campaign.thumbnail_url}
          alt={campaign.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
        <div className="absolute bottom-2.5 left-2.5 right-2.5 sm:bottom-3 sm:left-3 sm:right-3">
          <div className="h-1 sm:h-1.5 w-full bg-white/30 rounded-full overflow-hidden backdrop-blur-sm">
            <div className="h-full bg-emerald-400 rounded-full transition-all duration-700" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>
      <div className="p-3.5 sm:p-4 md:p-5 flex flex-col flex-1">
        <h4 className="font-bold text-gray-900 mb-1 sm:mb-1.5 line-clamp-2 group-hover:text-emerald-700 transition-colors text-xs sm:text-sm leading-snug">
          {campaign.title}
        </h4>
        <p className="text-gray-400 text-[11px] sm:text-xs mb-2 sm:mb-3 line-clamp-2 leading-relaxed flex-1">
          {campaign.short_description}
        </p>
        <div className="flex items-center justify-between text-[11px] sm:text-xs pt-2 border-t border-gray-50">
          <span className="font-bold text-emerald-600">{formatCurrency(campaign.current_amount)}</span>
          <span className="text-gray-400 flex items-center gap-1">
            <Users size={12} /> {campaign.donor_count}
          </span>
        </div>
      </div>
    </Link>
  );
}

/* ─────────── Animation Variants ─────────── */

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
};

/* ─────────── Main Component ─────────── */

export default function Home() {
  const [openFaq, setOpenFaq] = React.useState<number | null>(0);
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 1000], [0, 300]);

  return (
    <div className="overflow-hidden bg-white">

      {/* ═══════ 1 · HERO (COMPONENT BUNDLE INTEGRATION) ═══════ */}
      <section className="relative min-h-screen w-full overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=2070&auto=format&fit=crop"
            alt="Humanitarian background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80" />
        </div>

        <div className="relative z-10 container mx-auto px-6 lg:px-12 flex items-center min-h-screen max-w-7xl">
          <div className="max-w-3xl pt-20 pb-24">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="space-y-6"
            >
              <h1 className="text-3xl md:text-4xl lg:text-[3.5rem] font-light leading-[1.1] text-[#F5F1E8] tracking-tight">
                Bersama Membangun
                <br />
                Harapan Kemanusiaan
              </h1>

              <p className="text-base md:text-lg font-light text-[#F5F1E8]/80 leading-relaxed max-w-lg">
                Setiap kontribusi Anda membawa perubahan nyata bagi mereka yang membutuhkan
              </p>

              <div className="flex flex-col sm:flex-row gap-3 pt-3">
                <Link
                  to="/campaigns"
                  className="px-6 py-3 bg-[#2C5F4F] text-[#F5F1E8] text-sm md:text-base font-light rounded-sm hover:bg-[#234A3D] transition-all duration-300 flex items-center justify-center gap-2"
                >
                  Donasi Sekarang
                </Link>
                <Link
                  to="/laporkan"
                  className="px-6 py-3 border border-[#F5F1E8]/30 text-[#F5F1E8] text-sm md:text-base font-light rounded-sm hover:bg-[#F5F1E8]/10 transition-all duration-300 flex items-center justify-center"
                >
                  Laporkan Sekolah
                </Link>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
      </section>

      {/* ═══════ 2 · SOCIAL PROOF TRUST BAR (AUTO-SCROLL) ═══════ */}
      <Logos3 />



      {/* ═══════ 4 · HAPPENING NOW — EDITORIAL BENTO ═══════ */}
      <section className="py-14 sm:py-16 md:py-20">
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

          {/* Bento Grid: 1 Hero + 3 Stacked */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-5">
            
            {/* HERO CARD — Campaign pertama, mendominasi kiri */}
            {MOCK_CAMPAIGNS[0] && (() => {
              const hero = MOCK_CAMPAIGNS[0];
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
                    className="group relative block rounded-2xl overflow-hidden bg-gray-900 aspect-[4/3] sm:aspect-[16/10] lg:aspect-auto lg:h-full"
                  >
                    <img
                      src={hero.thumbnail_url}
                      alt={hero.title}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-80"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    
                    <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-7 md:p-8 space-y-3">
                      <span className="inline-block text-[10px] sm:text-xs font-bold uppercase tracking-widest text-emerald-400 bg-emerald-400/10 backdrop-blur-sm px-2.5 py-1 rounded-full">
                        Kampanye Utama
                      </span>
                      <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-white leading-snug group-hover:text-emerald-300 transition-colors max-w-lg">
                        {hero.title}
                      </h3>
                      <p className="text-white/60 text-sm font-light leading-relaxed max-w-md line-clamp-2">
                        {hero.short_description}
                      </p>
                      
                      <div className="flex items-center gap-4 pt-1">
                        <div className="flex-1 max-w-xs">
                          <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-400 rounded-full transition-all duration-700" style={{ width: `${progress}%` }} />
                          </div>
                        </div>
                        <span className="text-emerald-400 font-bold text-sm whitespace-nowrap">{progress}%</span>
                      </div>
                      <div className="flex items-center justify-between text-xs sm:text-sm pt-1">
                        <span className="text-white/90 font-semibold">{formatCurrency(hero.current_amount)}</span>
                        <span className="text-white/50 flex items-center gap-1.5">
                          <Users size={13} /> {hero.donor_count} donatur
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })()}

            {/* SIDE STACK — 3 kampanye lainnya */}
            <div className="lg:col-span-5 xl:col-span-4 grid grid-cols-2 lg:grid-cols-1 gap-4 md:gap-5">
              {MOCK_CAMPAIGNS.slice(1).map((campaign, i) => {
                const progress = calculateProgress(campaign.current_amount, campaign.target_amount);
                return (
                  <motion.div
                    key={campaign.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ delay: 0.1 + i * 0.08, duration: 0.45 }}
                  >
                    <Link
                      to={`/campaigns/${campaign.slug}`}
                      className="group flex flex-col lg:flex-row bg-white rounded-xl overflow-hidden border border-gray-100 hover:shadow-lg hover:shadow-emerald-100/40 transition-all duration-300"
                    >
                      {/* Thumbnail */}
                      <div className="relative aspect-[16/10] lg:aspect-square lg:w-28 xl:w-32 shrink-0 overflow-hidden">
                        <img
                          src={campaign.thumbnail_url}
                          alt={campaign.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent lg:bg-none" />
                      </div>
                      {/* Info */}
                      <div className="p-3 sm:p-4 flex flex-col flex-1 justify-center min-w-0">
                        <h4 className="font-bold text-gray-900 mb-1 line-clamp-2 group-hover:text-emerald-700 transition-colors text-xs sm:text-sm leading-snug">
                          {campaign.title}
                        </h4>
                        <p className="text-gray-400 text-[11px] sm:text-xs line-clamp-1 leading-relaxed mb-2 hidden lg:block">
                          {campaign.short_description}
                        </p>
                        {/* Progress */}
                        <div className="space-y-1.5">
                          <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full transition-all duration-700" style={{ width: `${progress}%` }} />
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
        </div>
      </section>

      {/* ═══════ 5 · STATS CTA ═══════ */}
      <section className="relative py-16 sm:py-20 md:py-24 overflow-hidden">
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
                { value: 'Rp 15.2M', label: 'Dana Tersalurkan', icon: Heart },
                { value: '25,400+', label: 'Donatur Aktif', icon: Users },
                { value: '1,200+', label: 'Campaign Sukses', icon: BarChart3 },
                { value: '85,000+', label: 'Penerima Manfaat', icon: CheckCircle2 },
              ].map((stat, i) => (
                <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 border border-white/10">
                  <stat.icon size={20} className="text-emerald-300 mb-2 sm:mb-3" />
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white leading-none">{stat.value}</h3>
                  <p className="text-emerald-200/70 text-[10px] sm:text-xs mt-1 font-medium">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════ 6 · INITIATIVES ═══════ */}
      <section className="py-14 sm:py-16 md:py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto mb-10 sm:mb-14 space-y-3">
            <p className="text-emerald-600 font-bold uppercase tracking-[0.15em] text-[11px] sm:text-xs">Program Kami</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 leading-snug">
              Inisiatif Kami untuk Memberdayakan Sesama
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {INITIATIVES.map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ delay: i * 0.08, duration: 0.45 }}
                className="group text-center p-5 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl border border-gray-100 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-50 transition-all duration-300 bg-white"
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 mx-auto rounded-xl sm:rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-3 sm:mb-4 md:mb-5 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
                  <item.icon size={24} className="sm:w-7 sm:h-7" />
                </div>
                <h4 className="font-bold text-gray-900 text-sm sm:text-base md:text-lg mb-1 sm:mb-2">{item.label}</h4>
                <p className="text-gray-500 text-[11px] sm:text-xs md:text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ 7 · BLOG ═══════ */}
      <section className="py-14 sm:py-16 md:py-20 bg-gray-50/80">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 sm:mb-10 gap-3">
            <motion.div {...fadeUp}>
              <p className="text-emerald-600 font-bold uppercase tracking-[0.15em] text-[11px] sm:text-xs mb-1.5">Cerita Kami</p>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900">Blog dan Berita</h2>
            </motion.div>
            <Link to="/laporan" className="text-emerald-600 font-semibold flex items-center hover:text-emerald-700 group text-sm transition-colors">
              Lihat Semua
              <ArrowRight size={15} className="ml-1 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
            {BLOG_POSTS.map((post, i) => (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ delay: i * 0.08, duration: 0.45 }}
                className="group bg-white rounded-xl sm:rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg hover:shadow-emerald-50 transition-all duration-300"
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img src={post.image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3">
                    <span className="bg-white/90 backdrop-blur-sm text-emerald-700 text-[10px] font-bold uppercase tracking-wider px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full">
                      {post.category}
                    </span>
                  </div>
                </div>
                <div className="p-4 sm:p-5">
                  <p className="text-gray-400 text-[11px] sm:text-xs mb-1.5 sm:mb-2 font-medium">{post.date}</p>
                  <h3 className="font-bold text-gray-900 mb-1.5 sm:mb-2 line-clamp-2 group-hover:text-emerald-700 transition-colors text-xs sm:text-sm md:text-base leading-snug">
                    {post.title}
                  </h3>
                  <p className="text-gray-500 text-[11px] sm:text-xs line-clamp-2 leading-relaxed">{post.excerpt}</p>
                  <div className="mt-3 sm:mt-4 flex items-center text-emerald-600 text-[11px] sm:text-xs font-bold group-hover:text-emerald-700">
                    Baca Selengkapnya <ArrowUpRight size={13} className="ml-1" />
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>



      {/* ═══════ 9 · FINAL CTA ═══════ */}
      <section className="py-10 sm:py-14 md:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-0 rounded-2xl sm:rounded-[1.5rem] md:rounded-[2rem] overflow-hidden shadow-xl shadow-gray-200/30">
            {/* Text */}
            <div className="bg-emerald-700 p-8 sm:p-10 md:p-14 lg:p-16 flex flex-col justify-center relative overflow-hidden order-2 lg:order-1">
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
              />
              <div className="absolute inset-0 bg-gradient-to-l from-transparent to-emerald-700/5" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
