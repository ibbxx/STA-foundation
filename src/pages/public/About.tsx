import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Users, Heart, Target, Lightbulb, CheckCircle2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

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
  return (
    <div className="bg-white text-gray-900 font-sans selection:bg-emerald-600 selection:text-white">
      
      {/* 1. HERO SECTION */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 bg-[#F8FBF9] overflow-hidden">
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-emerald-600 font-bold tracking-[0.2em] uppercase text-xs md:text-sm mb-6 inline-flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-full">
              #PendidikanUntukSemua
            </p>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-gray-900 leading-[1.15] mb-8">
              Membangun Masa Depan Pendidikan Indonesia Lewat Data dan Aksi Nyata
            </h1>
            <p className="text-base md:text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto mb-10 font-light">
              Pendidikan yang layak adalah hak setiap anak bangsa. Kami hadir untuk menjembatani niat baik dengan aksi nyata, memastikan tidak ada lagi mimpi yang runtuh hanya karena atap ruang kelas yang rapuh.
            </p>
            <Link 
              to="/kontak" 
              className="inline-flex items-center gap-2 bg-emerald-700 text-white px-8 py-4 rounded-full font-bold hover:bg-emerald-800 transition-colors shadow-lg shadow-emerald-900/10 hover:shadow-xl hover:shadow-emerald-900/20"
            >
              Mari Berkolaborasi Bersama Kami <ArrowRight size={18} />
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
