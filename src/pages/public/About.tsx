import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Users, Heart, Target, Lightbulb, CheckCircle2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 }
};

const PARTNERS = [
  { name: 'Admedika', src: '/mitra/assets/admedika.png', href: 'https://www.instagram.com/admedika_ig?igsh=MW04d3hhMmYxa3pvMQ==', sizeClass: 'h-10 md:h-14 scale-110' },
  { name: 'Bali Nggih', src: '/mitra/assets/balinggih.png', href: 'https://www.instagram.com/balinggih?igsh=MTg5MDBsZ3JvdzJqZw==', sizeClass: 'h-6 md:h-10' },
  { name: 'Distrik Berisik', src: '/mitra/assets/blue-db.png', href: 'https://www.instagram.com/distrik_berisik?igsh=Mmk3bTN6eG5maHZ3', sizeClass: 'h-6 md:h-10' },
  { name: 'PIS Movement', src: '/mitra/assets/peacemaker.png', href: 'https://www.instagram.com/pismovement?igsh=c25kNWZtNDJkcWI1', sizeClass: 'h-10 md:h-14' },
  { name: 'Kawan Cendekia', src: '/mitra/assets/img-0338.png', href: 'https://www.instagram.com/kawancendekia?igsh=ZTlzNHhqem13MHlo', sizeClass: 'h-10 md:h-14' },
  { name: 'Perempuan Lestari', src: '/mitra/assets/wa-image.jpg', href: 'https://www.instagram.com/perempuan.lestari?igsh=MW5uMW9tcHltYWZ5OA==', sizeClass: 'h-10 md:h-14' },
];

export default function About() {
  const [heroImage, setHeroImage] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function loadHero() {
      try {
        const { data } = await supabase.from('site_content').select('value').eq('key', 'hero_tentang_kami').single();
        if (data && (data as any).value) {
          const val = (data as any).value;
          const parsed = typeof val === 'string' ? JSON.parse(val) : val;
          if (parsed.imageUrl) setHeroImage(parsed.imageUrl);
        }
      } catch (e) {}
    }
    loadHero();
  }, []);

  return (
    <div className="bg-white text-gray-900 font-sans selection:bg-emerald-600 selection:text-white">
      
      {/* 1. HERO SECTION */}
      <section className="relative min-h-[100svh] w-full flex flex-col justify-start md:justify-center overflow-hidden bg-gray-900">
        {heroImage && (
          <div className="absolute inset-0 z-0">
            {/* Image fills the container */}
            <img src={heroImage} className="w-full h-full object-cover object-top md:object-center" alt="Tentang Kami" />
            
            {/* Subtle overlay to ensure white text is readable even outside the card area */}
            <div className="absolute inset-0 bg-black/20" />
            
            {/* Directional gradient to fade smoothly behind the text card */}
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/40 to-transparent md:bg-gradient-to-r md:from-gray-900/90 md:via-gray-900/40 md:to-transparent" />
          </div>
        )}
        
        <div className="relative z-10 w-full max-w-7xl mx-auto px-5 md:px-8 pb-12 md:pb-0 pt-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full md:max-w-xl"
          >
            <div className="inline-flex items-center gap-1.5 md:gap-2 px-2.5 py-1 md:px-3 md:py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-4 md:mb-5">
              <span className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-emerald-400"></span>
              <p className="text-white font-medium tracking-widest uppercase text-[8px] md:text-xs">
                Pendidikan Untuk Semua
              </p>
            </div>
            
            <h1 className="text-[15px] md:text-3xl lg:text-4xl font-bold text-white leading-[1.3] md:leading-snug mb-2 md:mb-4">
              Membangun Masa Depan Pendidikan Indonesia Lewat Data & Aksi
            </h1>
            
            <p className="text-[11px] md:text-base text-gray-300 leading-relaxed font-light mb-4 md:mb-8 line-clamp-2 md:line-clamp-none">
              Pendidikan yang layak adalah hak setiap anak bangsa. Kami hadir untuk menjembatani niat baik dengan aksi nyata, memastikan tidak ada lagi mimpi yang tertinggal.
            </p>
            
            <Link 
              to="/kontak" 
              className="inline-flex items-center gap-1.5 md:gap-2 bg-emerald-600 text-white px-4 py-1.5 md:px-6 md:py-3 rounded-full font-medium hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-900/30 text-[10px] md:text-sm w-fit"
            >
              Kolaborasi <ArrowRight size={12} className="md:w-4 md:h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* 2. STATS STRIP */}
      <section className="bg-white py-12 md:py-16 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 text-center divide-x divide-gray-100">
            {[
              { value: '115 Jt', suffix: '+', label: 'Donasi Terkumpul' },
              { value: '52', suffix: '+', label: 'Pejuang Tanah Air' },
              { value: '3', suffix: '+', label: 'Lokasi di 3 Pulau Berbeda' },
              { value: '7', suffix: '+', label: 'Mitra Kolabolator' }
            ].map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="px-2 md:px-4"
              >
                <h3 className="text-3xl md:text-5xl font-black text-gray-900 mb-2 tracking-tight">
                  {stat.value}<span className="text-emerald-600">{stat.suffix}</span>
                </h3>
                <p className="text-[10px] md:text-xs text-gray-500 uppercase font-bold tracking-widest">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. THE CORE VALUES */}
      <section className="py-20 md:py-32 bg-[#F8FBF9]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div {...fadeUp} className="text-center max-w-3xl mx-auto mb-16 md:mb-20">
            <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-6 tracking-tight">The Core Values</h2>
            <p className="text-gray-600 text-base md:text-xl font-light leading-relaxed">
              Sekolah Tanah Air memiliki nilai keyakinan bersama dengan harapan membangun masa depan pendidikan Indonesia.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 md:gap-10">
            {[
              { icon: Shield, title: 'Transparan & Terukur', desc: 'Setiap rupiah yang didonasikan dan setiap progres pembangunan dapat dipantau langsung melalui dasbor data statistik kami.' },
              { icon: Users, title: 'Community Driven', desc: 'Kekuatan kami terletak pada laporan warga. Kami percaya masyarakat adalah narasumber terbaik untuk kondisi lapangan.' },
              { icon: Heart, title: 'Impact Oriented', desc: 'Kami tidak hanya berhenti pada pembangunan gedung, tapi memastikan ekosistem pendidikan di dalamnya hidup kembali.' }
            ].map((val, i) => (
              <motion.div 
                key={val.title}
                {...fadeUp}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-8 md:p-10 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center hover:border-emerald-100 transition-colors"
              >
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-700 mb-6">
                  <val.icon size={28} strokeWidth={1.5} />
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">{val.title}</h3>
                <p className="text-gray-600 leading-relaxed font-light">{val.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. VISI KAMI + MISI KAMI */}
      <section className="py-20 md:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-12 gap-16 lg:gap-24 items-start">
            
            {/* Visi */}
            <motion.div {...fadeUp} className="lg:col-span-5 lg:sticky lg:top-32">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 mb-6">
                <Target size={28} strokeWidth={1.5} />
              </div>
              <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-600 mb-4">Visi Kami</h2>
              <h3 className="text-3xl md:text-4xl lg:text-5xl font-black leading-tight text-gray-900 tracking-tight">
                Menjadi pusat data dan penggerak utama dalam mewujudkan kesetaraan fasilitas pendidikan di seluruh pelosok Indonesia melalui inovasi teknologi dan semangat kolaborasi.
              </h3>
            </motion.div>

            {/* Misi */}
            <motion.div {...fadeUp} transition={{ delay: 0.2 }} className="lg:col-span-7 space-y-8 md:space-y-12">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-teal-50 text-teal-700 mb-2">
                <Lightbulb size={28} strokeWidth={1.5} />
              </div>
              <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-teal-600 mb-6">Misi Kami</h2>
              
              <div className="grid gap-6 md:gap-8">
                {[
                  { title: "Memetakan Kesenjangan", desc: "Mengumpulkan data faktual secara partisipatif dari masyarakat mengenai kondisi sekolah yang kritis." },
                  { title: "Menggalang Kolaborasi", desc: "Menjadi jembatan yang menghubungkan donatur, relawan, komunitas, dan pemerintah dalam semangat gotong royong." },
                  { title: "Membangun Fisik & Manusia", desc: "Melakukan renovasi infrastruktur sekolah sekaligus menjalankan program pemberdayaan guru, siswa, dan ekonomi sirkular desa." },
                  { title: "Menjunjung Transparansi", desc: "Menyajikan pelaporan dana dan progres pembangunan secara real-time yang dapat diakses oleh publik." }
                ].map((misi, i) => (
                  <div key={i} className="flex gap-5 md:gap-6 bg-[#F8FBF9] p-6 md:p-8 rounded-2xl border border-gray-50">
                    <div className="flex-shrink-0 w-10 h-10 bg-emerald-100/50 rounded-full flex items-center justify-center text-emerald-700 font-bold text-sm">
                      {i + 1}
                    </div>
                    <div>
                      <h4 className="text-lg md:text-xl font-bold mb-2 text-gray-900">{misi.title}</h4>
                      <p className="text-gray-600 font-light leading-relaxed text-sm md:text-base">{misi.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* 5. MITRA KOLABORATOR */}
      <section className="py-20 md:py-32 bg-[#F8FBF9] border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <motion.div {...fadeUp} className="max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-6 tracking-tight">Mitra Kolaborator</h2>
            <p className="text-gray-600 text-base md:text-xl font-light leading-relaxed">
              Langkah besar ini terwujud berkat sinergi dari mitra dan kolaborator strategis kami.
            </p>
          </motion.div>

          <motion.div 
            {...fadeUp} 
            transition={{ delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 md:gap-12 items-center justify-items-center"
          >
            {PARTNERS.map((partner) => (
              <a 
                key={partner.name} 
                href={partner.href}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center w-full h-20 hover:scale-110 transition-all duration-300"
              >
                <img 
                  src={partner.src} 
                  alt={`Logo ${partner.name}`} 
                  className={`w-auto object-contain mix-blend-multiply ${partner.sizeClass}`}
                />
              </a>
            ))}
          </motion.div>
        </div>
      </section>

    </div>
  );
}
