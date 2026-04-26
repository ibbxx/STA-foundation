import { motion } from 'framer-motion';
import { Heart, Target, Users, ShieldCheck } from 'lucide-react';
import TeamShowcase, { type TeamMember } from '../../components/ui/team-showcase';

const TEAM_MEMBERS: TeamMember[] = [
  {
    id: '1',
    name: 'Ibnu Fajar',
    role: 'FOUNDER & CEO',
    image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=400',
    social: { linkedin: '#', instagram: '#' },
  },
  {
    id: '2',
    name: 'Sarah Chen',
    role: 'CO-FOUNDER & COO',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400',
    social: { linkedin: '#', instagram: '#' },
  },
  {
    id: '3',
    name: 'Dimas Anggara',
    role: 'HEAD OF FIELD OPS',
    image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=400',
    social: { linkedin: '#' },
  },
  {
    id: '4',
    name: 'Nadia Putri',
    role: 'DIRECTOR OF PARTNERSHIPS',
    image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=400',
    social: { linkedin: '#', instagram: '#' },
  },
  {
    id: '5',
    name: 'Andi Prasetyo',
    role: 'CTO - TECH LEAD',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
    social: { linkedin: '#', twitter: '#' },
  },
  {
    id: '6',
    name: 'Rina Maharani',
    role: 'HEAD OF COMMUNITY',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=400',
    social: { instagram: '#' },
  },
];

/**
 * Komponen Halaman Tentang Kami (About).
 * Menjelaskan visi, misi, nilai-nilai inti, dan profil susunan tim dari organisasi Sekolah Tanah Air.
 */
export default function About() {
  return (
    <div className="bg-white">
      {/* Bagian Pahlawan (Hero Section) */}
      <section className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden bg-gray-900">
        <div className="absolute inset-0 w-full h-full">
          <img 
            src="https://jfzvlzxslmgnssxekcme.supabase.co/storage/v1/object/public/campaign-assets/updates-demo/book_distribution_1777146402888.png" 
            alt="Kebahagiaan Anak-Anak Indonesia"
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-5 sm:space-y-6">
          <p className="text-xs sm:text-sm font-bold text-[#F5F1E8] tracking-[0.2em] uppercase">Kisah Kami</p>
          <h1 className="text-[2.5rem] font-light tracking-tight text-white sm:text-5xl lg:text-6xl xl:text-7xl">Tentang Sekolah Tanah Air</h1>
        </div>
      </section>

      {/* Bagian Latar Belakang / Kisah Kami */}
      <section className="bg-gray-50 py-16 sm:py-20 border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-5">
          <h2 className="text-emerald-600 font-bold uppercase tracking-widest text-sm">Latar Belakang</h2>
          <p className="text-gray-600 leading-relaxed sm:text-lg md:text-xl font-light">
            Sekolah Tanah Air lahir dari keyakinan sederhana namun kuat, yaitu setiap anak Indonesia berhak belajar dengan layak, bermimpi tanpa batas, dan tumbuh di lingkungan yang mendukung masa depannya. Kami bergerak sebagai gerakan kolaboratif yang tidak hanya membangun sekolah darurat atau memperbaiki fasilitas, tetapi juga membangun harapan, memberdayakan masyarakat, menghidupkan kembali potensi budaya lokal, serta mengembangkan ekonomi sirkular desa melalui eco-tourism agar dampaknya berkelanjutan.
          </p>
        </div>
      </section>


      {/* Bagian Penjelasan Visi & Misi Organisasi */}
      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
            <div className="space-y-6 sm:space-y-8">
              <div className="space-y-4">
                <h2 className="text-emerald-600 font-bold uppercase tracking-widest text-sm">Visi Kami</h2>
                <h3 className="text-3xl font-black text-gray-900">Mewujudkan pemerataan pendidikan yang berkelanjutan dan berakar pada kearifan lokal di seluruh Indonesia.</h3>
                <p className="text-gray-600 leading-relaxed">
                  Menghadirkan 1.000 sekolah berdampak sebagai pusat pembelajaran, pemberdayaan, dan penguatan desa.
                </p>
              </div>
              <div className="space-y-4">
                <h2 className="text-emerald-600 font-bold uppercase tracking-widest text-sm">Misi Kami</h2>
                <ul className="space-y-3">
                  {[
                    'Mengintegrasikan kearifan lokal dan budaya ke dalam pembelajaran.',
                    'Mengembangkan proyek berbasis lingkungan dan sosial.',
                    'Menyusun kurikulum adaptif kebutuhan daerah & abad ke-21.',
                    'Menyediakan fasilitas sekolah layak dan inklusif.',
                    'Memberdayakan SDM lokal sebagai penggerak pendidikan.',
                    'Optimalisasi potensi desa melalui pariwisata (eco-tourism).',
                    'Menginisiasi 1.000 Sekolah Tanah Air untuk pemerataan pendidikan.'
                  ].map((misi, i) => (
                    <li key={i} className="flex items-start space-x-3">
                      <div className="mt-1 bg-emerald-100 text-emerald-600 p-1 rounded-full shrink-0">
                        <Target size={14} />
                      </div>
                      <span className="text-gray-600 font-medium text-sm lg:text-base">{misi}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="space-y-6 sm:space-y-8">
              <div className="space-y-4">
                <h2 className="text-emerald-600 font-bold uppercase tracking-widest text-sm">Arah Gerak</h2>
                <div className="grid gap-4">
                  <div className="bg-emerald-50 rounded-xl p-4">
                    <h4 className="font-bold text-emerald-800 mb-1">Holistik & Kontekstual</h4>
                    <p className="text-sm text-gray-600">Pendekatan menyeluruh menyesuaikan potensi unik setiap daerah.</p>
                  </div>
                  <div className="bg-emerald-50 rounded-xl p-4">
                    <h4 className="font-bold text-emerald-800 mb-1">Berbasis Komunitas</h4>
                    <p className="text-sm text-gray-600">Berjalan berkolaborasi dengan pemuda dan warga lokal.</p>
                  </div>
                  <div className="bg-emerald-50 rounded-xl p-4">
                    <h4 className="font-bold text-emerald-800 mb-1">Inklusif & Adaptif</h4>
                    <p className="text-sm text-gray-600">Akses setara bagi semua anak dengan model fleksibel.</p>
                  </div>
                  <div className="bg-emerald-50 rounded-xl p-4">
                    <h4 className="font-bold text-emerald-800 mb-1">Terukur Dampaknya</h4>
                    <p className="text-sm text-gray-600">Evaluasi data kuantitatif & kualitatif yang transparan.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <img
                src="https://jfzvlzxslmgnssxekcme.supabase.co/storage/v1/object/public/campaign-assets/updates-demo/teacher_training_1777146418184.png"
                alt="Team"
                className="rounded-[2rem] shadow-xl sm:rounded-[3rem] sm:shadow-2xl"
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Bagian Tim Inti (Founder / CEO / dll) — TeamShowcase */}
      <section className="bg-gray-50 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-10 max-w-3xl space-y-4 text-center sm:mb-14">
            <h2 className="text-emerald-600 font-bold uppercase tracking-widest text-sm">Di Balik Layar</h2>
            <h3 className="text-3xl font-black text-gray-900 sm:text-4xl">Tim Sekolah Tanah Air</h3>
          </div>

          <TeamShowcase members={TEAM_MEMBERS} />
        </div>
      </section>
    </div>
  );
}
