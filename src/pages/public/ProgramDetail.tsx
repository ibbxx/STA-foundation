import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, CheckCircle2, Users, Globe, Target, Loader2 } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { getProgramIcon } from '../../lib/program-icons';
import { getProgramBySlug, PROGRAMS } from '../../lib/programs';
import { fetchHomeProgramsContent, type HomeProgramSlide } from '../../lib/admin/home-programs';
import { supabase } from '../../lib/supabase/types';

export default function ProgramDetail() {
  const { slug } = useParams();
  const [loading, setLoading] = useState(true);
  const [dynamicProgram, setDynamicProgram] = useState<HomeProgramSlide | null>(null);
  
  // Static fallback data
  const staticProgram = getProgramBySlug(slug);

  useEffect(() => {
    async function loadDynamicData() {
      try {
        const { data, error } = await supabase
          .from('programs')
          .select('*')
          .eq('slug', slug)
          .maybeSingle();
        
        if (data) {
          const item = data as any;
          let parsedContent = {};
          try {
            if (item.content && (item.content.startsWith('{') || item.content.startsWith('['))) {
              parsedContent = JSON.parse(item.content);
            }
          } catch (e) {
            console.warn("Content is not JSON:", item.content);
          }

          setDynamicProgram({
            id: item.id,
            slug: item.slug,
            title: item.title,
            short_description: item.description,
            imageUrl: '', // Not used in detail hero
            ...parsedContent
          } as any);
        }
      } catch (err) {
        console.error("Failed to load dynamic program data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDynamicData();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  // Combine static and dynamic data
  // Dynamic data (from admin) takes precedence for title, description, and images
  const program = dynamicProgram || staticProgram;

  if (!program) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center py-24 px-5">
        <div className="max-w-md w-full text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600">
              <Globe size={32} />
            </div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Program Tidak Ditemukan</h1>
            <p className="text-gray-500 leading-relaxed">
              Maaf, halaman program yang Anda cari tidak tersedia atau telah dipindahkan.
            </p>
            <Link
              to="/"
              className="inline-flex items-center justify-center px-8 py-4 bg-emerald-600 text-white rounded-full font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all hover:-translate-y-1"
            >
              <ArrowLeft size={18} className="mr-2" />
              Kembali ke Beranda
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  // Helper to get Icon
  const iconName = 'icon_name' in program ? program.icon_name : 'search';
  const Icon = getProgramIcon(iconName as any);
  
  const relatedPrograms = PROGRAMS.filter((item) => item.slug !== slug);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } as any }
  };

  // Image Logic: 
  // 1. dynamic hero_image_url
  const heroImage = ('hero_image_url' in program && program.hero_image_url) 
    ? (program as any).hero_image_url as string
    : '';

  return (
    <div className="bg-white min-h-screen selection:bg-emerald-100 selection:text-emerald-900 overflow-x-hidden">
      
      {/* ═══════ NAVIGATION ═══════ */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link to="/" className="group flex items-center gap-2 text-sm font-bold text-gray-900">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
              <ArrowLeft size={16} />
            </div>
            <span className="hidden sm:inline uppercase tracking-widest text-[10px]">Kembali ke Beranda</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link to="/tentang-kami" className="text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-emerald-600 transition-colors">Visi & Misi</Link>
            <Link to="/kontak" className="px-5 py-2.5 bg-emerald-600 text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200">Hubungi Kami</Link>
          </div>
        </div>
      </nav>

      {/* ═══════ HERO SECTION ═══════ */}
      <section className="relative pt-12 pb-6 sm:pt-24 sm:pb-10 overflow-hidden">
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-8"
            >
              <motion.div variants={itemVariants} className="space-y-2 sm:space-y-3">
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-5xl font-black text-gray-900 leading-tight tracking-tight">
                  {program.title.split(' ').map((word, i) => (
                    <span key={i} className={i === 1 ? "text-emerald-600 block sm:inline" : ""}>
                      {word}{' '}
                    </span>
                  ))}
                </h1>
                <p className="text-xs sm:text-sm lg:text-base text-gray-500 font-light leading-relaxed max-w-lg">
                  {program.short_description}
                </p>
              </motion.div>

              <motion.div variants={itemVariants} className="flex flex-wrap gap-2 pt-1">
                <Link
                  to="/kontak"
                  className="flex-1 sm:flex-none px-5 py-2.5 sm:px-7 sm:py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all hover:shadow-lg hover:shadow-emerald-200/50 hover:-translate-y-0.5 text-xs sm:text-sm text-center"
                >
                  Kolaborasi
                </Link>
                <Link
                  to="/laporkan"
                  className="flex-1 sm:flex-none px-5 py-2.5 sm:px-7 sm:py-3 bg-white border border-gray-200 text-gray-900 rounded-xl font-bold hover:border-emerald-600 hover:text-emerald-600 transition-all hover:-translate-y-0.5 text-xs sm:text-sm text-center"
                >
                  Lapor
                </Link>
              </motion.div>

              <motion.div variants={itemVariants} className="grid grid-cols-3 gap-4 sm:gap-6 pt-6 border-t border-gray-100">
                <div>
                  <p className="text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">Penerima</p>
                  <p className="text-lg sm:text-xl font-black text-gray-900">12k+</p>
                </div>
                <div>
                  <p className="text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">Wilayah</p>
                  <p className="text-lg sm:text-xl font-black text-gray-900">15+</p>
                </div>
                <div>
                  <p className="text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">Relawan</p>
                  <p className="text-lg sm:text-xl font-black text-gray-900">500+</p>
                </div>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="relative group"
            >
              <div className="absolute -inset-2 bg-emerald-100/40 rounded-2xl blur-xl group-hover:bg-emerald-200/40 transition-colors duration-500"></div>
              <div className="relative aspect-video sm:aspect-[4/3] lg:aspect-square rounded-2xl overflow-hidden shadow-xl">
                {heroImage ? (
                  <img 
                    src={heroImage} 
                    alt={program.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                ) : (
                  <div className="w-full h-full bg-emerald-900 group-hover:scale-105 transition-transform duration-700"></div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ═══════ OVERVIEW SECTION ═══════ */}
      <section className="py-8 sm:py-16 bg-gray-50/50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-16 items-center">
            <div className="lg:col-span-5 order-2 lg:order-1">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="grid grid-cols-2 gap-3 sm:gap-4"
              >
                {(() => {
                  const dynamicGallery = ('gallery_images' in program && Array.isArray(program.gallery_images))
                    ? program.gallery_images.filter(Boolean)
                    : [];
                  
                  // Jika benar-benar tidak ada gambar sama sekali (baik dinamis maupun statis), sembunyikan grid
                  if (dynamicGallery.length === 0) return null;

                  // Gunakan placeholder berkualitas tinggi jika gambar < 4 agar grid tetap cantik
                  const placeholders = [
                    'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=800&auto=format&fit=crop',
                    'https://images.unsplash.com/photo-1523050335392-93851179428c?q=80&w=800&auto=format&fit=crop',
                    'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=800&auto=format&fit=crop',
                    'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=800&auto=format&fit=crop'
                  ];

                  const displayGallery = [
                    dynamicGallery[0] || placeholders[0],
                    dynamicGallery[1] || placeholders[1],
                    dynamicGallery[2] || placeholders[2],
                    dynamicGallery[3] || placeholders[3],
                  ];
                  
                  return (
                    <>
                      <div className="space-y-3 sm:space-y-4">
                        <div className="aspect-[4/5] rounded-2xl overflow-hidden shadow-lg bg-gray-100">
                          <img src={displayGallery[0]} className="w-full h-full object-cover" alt="Detail 1" />
                        </div>
                        <div className="aspect-square rounded-2xl overflow-hidden shadow-lg bg-gray-100">
                          <img src={displayGallery[1]} className="w-full h-full object-cover" alt="Detail 2" />
                        </div>
                      </div>
                      <div className="space-y-3 sm:space-y-4">
                        <div className="aspect-square rounded-2xl overflow-hidden shadow-lg bg-gray-100">
                          <img src={displayGallery[2]} className="w-full h-full object-cover" alt="Detail 3" />
                        </div>
                        <div className="aspect-[4/5] rounded-2xl overflow-hidden shadow-lg bg-gray-100">
                          <img src={displayGallery[3]} className="w-full h-full object-cover" alt="Detail 4" />
                        </div>
                      </div>
                    </>
                  );
                })()}
              </motion.div>
            </div>
            <div className="lg:col-span-7 order-1 lg:order-2 space-y-8">
              <div className="space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-600">Filosofi Program</p>
                <h2 className="text-xl sm:text-3xl md:text-4xl font-black text-gray-900 tracking-tight leading-tight">
                  Mengapa {program.title} <br className="hidden sm:block" />Sangat Penting?
                </h2>
              </div>
              <p className="text-base sm:text-lg text-gray-600 font-light leading-relaxed">
                {'overview' in program ? program.overview : 'Program ini dirancang untuk menciptakan dampak berkelanjutan bagi pendidikan di pelosok negeri.'}
              </p>
              <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
                {[
                  { title: 'Dampak Terukur', desc: 'Setiap progres dipantau dengan matriks yang jelas.', icon: Target },
                  { title: 'Berbasis Lokal', desc: 'Intervensi disesuaikan dengan konteks wilayah.', icon: Users }
                ].map((item, i) => (
                  <div key={i} className="p-5 sm:p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                      <item.icon size={20} />
                    </div>
                    <h4 className="font-bold text-gray-900 mb-1">{item.title}</h4>
                    <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ STRATEGY SECTION ═══════ */}
      <section className="py-8 sm:py-16 overflow-hidden">
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-16 space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-600">Implementasi</p>
            <h2 className="text-xl sm:text-3xl md:text-4xl font-black text-gray-900 tracking-tight">Fokus Strategis Kami</h2>
            <p className="text-xs sm:text-sm text-gray-500 font-light">
              Langkah-langkah konkret yang kami ambil untuk memastikan visi program menjadi realita di lapangan.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {('focus_areas' in program ? program.focus_areas : []).map((focus, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group relative p-5 bg-white border border-gray-100 rounded-2xl hover:border-emerald-200 transition-all hover:shadow-lg hover:shadow-emerald-100/30 overflow-hidden"
              >
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl font-black text-emerald-600/20 group-hover:text-emerald-600/40 transition-colors">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <CheckCircle2 size={14} />
                    </div>
                  </div>
                  <p className="text-sm font-bold text-gray-800 leading-snug">
                    {focus}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ RELATED PROGRAMS ═══════ */}
      <section className="py-10 sm:py-16 bg-gray-900 text-white rounded-3xl mx-4 mb-8 overflow-hidden relative">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="max-w-7xl mx-auto px-5 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-400">Eksplorasi Lainnya</p>
              <h2 className="text-2xl md:text-4xl font-black tracking-tight">Inisiatif Terkait</h2>
            </div>
            <Link to="/" className="group flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-400">
              Lihat Semua <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {relatedPrograms.map((item, index) => {
              const RelatedIcon = getProgramIcon(item.icon_name);
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                >
                  <Link
                    to={item.detail_path}
                    className="group block p-6 sm:p-8 bg-white/5 border border-white/10 rounded-3xl hover:bg-white/10 transition-all hover:border-emerald-500/50"
                  >
                    <div className="flex items-start justify-between mb-12">
                      <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all duration-500">
                        <RelatedIcon size={32} />
                      </div>
                      <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center group-hover:bg-white group-hover:text-gray-900 transition-all">
                        <ArrowRight size={20} className="-rotate-45 group-hover:rotate-0 transition-transform" />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-2xl md:text-3xl font-black group-hover:text-emerald-400 transition-colors">{item.title}</h3>
                      <p className="text-gray-400 font-light leading-relaxed line-clamp-2">
                        {item.short_description}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

    </div>
  );
}

