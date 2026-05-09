import React from 'react';
import { Mail, Phone, MapPin, Send, MessageCircle, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase, parseSiteContentValue } from '../../lib/supabase';
import { logError } from '../../lib/error-logger';

/**
 * Komponen Halaman Kontak (Contact).
 * Menyediakan direktori informasi saluran komunikasi resmi lembaga dan sarana 
 * formulir pesan langsung bagi publik dan calon mitra.
 */
export default function Contact() {
  const [heroImage, setHeroImage] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function loadHero() {
      try {
        const { data } = await supabase.from('site_content').select('value').eq('key', 'hero_kontak').maybeSingle();
        const parsed = parseSiteContentValue<{ imageUrl?: string }>(data?.value);
        if (parsed?.imageUrl) setHeroImage(parsed.imageUrl);
      } catch (e) {
        logError('Contact.loadHero', e);
      }
    }
    loadHero();
  }, []);

  return (
    <div className="bg-white">
      {/* Spacer untuk Navbar agar tidak tumpang tindih */}
      <div className="h-16 sm:h-20 bg-white" />

      {/* Bagian Pahlawan (Hero Section) */}
      <section className="relative min-h-[50svh] w-full flex flex-col justify-center overflow-hidden bg-gray-900">
        {heroImage && (
          <div className="absolute inset-0 z-0">
            <img src={heroImage} className="w-full h-full object-cover" alt="Hubungi Kami" />
            <div className="absolute inset-0 bg-black/30" />
            <div className="absolute inset-0 bg-gradient-to-r from-gray-900/80 via-transparent to-transparent" />
          </div>
        )}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-5 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full md:max-w-2xl"
          >
            <h1 className="text-[24px] sm:text-4xl md:text-6xl lg:text-7xl font-black text-white leading-tight tracking-tight mb-4">
              Hubungi Kami
            </h1>
            <p className="text-[11px] sm:text-sm md:text-xl text-gray-300 leading-relaxed font-light max-w-xl">
              Punya pertanyaan atau ingin berkolaborasi? <br className="hidden md:block" /> Kami siap mendengarkan dan membantu mewujudkan aksi nyata Anda.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
            {/* Navigasi Informasi Kontak Langsung (Contact Info) */}
            <div className="space-y-8 sm:space-y-12">
              <div className="space-y-6">
                <h2 className="text-2xl font-black text-gray-900 sm:text-3xl">Mari Berdiskusi</h2>
                <p className="text-base leading-relaxed text-gray-600 sm:text-lg">
                  Tim kami siap membantu Anda memberikan informasi lebih lanjut mengenai program, donasi, atau kemitraan.
                </p>
              </div>

              <div className="grid gap-4 sm:gap-6">
                {[
                  { label: 'Email', value: 'halo@tanahair.org', icon: Mail, color: 'bg-blue-500' },
                  { label: 'WhatsApp', value: '+62 812 3456 7890', icon: MessageCircle, color: 'bg-emerald-500' },
                  { label: 'Alamat', value: 'Jl. Kemanusiaan No. 123, Jakarta Selatan', icon: MapPin, color: 'bg-rose-500' },
                ].map((item, i) => (
                  <div key={i} className="group flex items-start space-x-4 rounded-[1.5rem] border border-gray-100 bg-gray-50/70 p-4 sm:space-x-6 sm:p-5">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg sm:h-14 sm:w-14 ${item.color}`}>
                      <item.icon size={24} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{item.label}</p>
                      <p className="break-words text-base font-bold text-gray-900 transition-colors group-hover:text-emerald-600 sm:text-xl">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Antarmuka Formulir Pengiriman Pesan (Contact Form) */}
            <div className="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-xl shadow-emerald-100/30 sm:rounded-[3rem] sm:p-10 sm:shadow-2xl">
              <form className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Nama Lengkap</label>
                    <input
                      type="text"
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                      placeholder="Nama Anda"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Email</label>
                    <input
                      type="email"
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                      placeholder="email@anda.com"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Subjek</label>
                  <input
                    type="text"
                    className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    placeholder="Apa yang ingin Anda tanyakan?"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pesan</label>
                  <textarea
                    rows={5}
                    className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    placeholder="Tulis pesan Anda di sini..."
                  />
                </div>
                <button className="flex w-full items-center justify-center space-x-2 rounded-2xl bg-emerald-600 py-4 text-base font-bold text-white shadow-lg shadow-emerald-200 transition-all hover:bg-emerald-700 sm:py-5 sm:text-lg sm:shadow-xl">
                  <Send size={20} />
                  <span>Kirim Pesan</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
