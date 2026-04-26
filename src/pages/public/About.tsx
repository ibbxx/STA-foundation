import { motion } from 'framer-motion';
import { Target, Users, Globe, ArrowRight, Camera } from 'lucide-react';
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

const GALLERY_IMAGES = [
  {
    url: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=800',
    title: 'Penyaluran Buku',
    size: 'col-span-2 row-span-2'
  },
  {
    url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=800',
    title: 'Kelas Inspirasi',
    size: 'col-span-1 row-span-1'
  },
  {
    url: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=800',
    title: 'Relawan di Lapangan',
    size: 'col-span-1 row-span-2'
  },
  {
    url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=800',
    title: 'Pembangunan Sekolah',
    size: 'col-span-1 row-span-1'
  }
];

export default function About() {
  return (
    <div className="bg-white text-gray-900 font-sans selection:bg-emerald-600 selection:text-white">
      {/* ── Visual Hero ── */}
      <section className="relative h-screen w-full overflow-hidden bg-zinc-900">
        <img 
          src="https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&q=80&w=2000" 
          alt="Dunia Anak"
          className="h-full w-full object-cover opacity-60 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent" />
        
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl"
          >
            <h1 className="text-5xl md:text-8xl font-bold tracking-tight text-white leading-none mb-8">
              Masa Depan <br />
              Dimulai Dari <span className="text-emerald-500 italic">Sini.</span>
            </h1>
            <div className="flex items-center justify-center gap-4 text-emerald-400 text-sm font-bold tracking-[0.2em] uppercase">
              <span className="h-px w-8 bg-emerald-400" />
              Sekolah Tanah Air
              <span className="h-px w-8 bg-emerald-400" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Impact Stats (Visual) ── */}
      <section className="py-20 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
            {[
              { label: 'Sekolah Dibangun', value: '12', suffix: '+' },
              { label: 'Relawan Aktif', value: '500', suffix: '+' },
              { label: 'Anak Terbantu', value: '2.5', suffix: 'k' },
              { label: 'Desa Binaan', value: '8', suffix: '' }
            ].map((stat, i) => (
              <div key={i} className="space-y-2">
                <p className="text-4xl md:text-6xl font-bold tracking-tighter text-gray-900">
                  {stat.value}<span className="text-emerald-600">{stat.suffix}</span>
                </p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── The Narrative (Visual Split) ── */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative group">
              <div className="aspect-square bg-gray-100 overflow-hidden rounded-sm border border-gray-100">
                <img 
                  src="https://images.unsplash.com/photo-1542810634-71277d95dcbb?auto=format&fit=crop&q=80&w=1000" 
                  alt="Inspirasi"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
              </div>
              <div className="absolute -bottom-6 -right-6 bg-emerald-600 text-white p-8 md:p-12 max-w-xs rounded-sm shadow-xl">
                <p className="text-xl font-medium leading-snug">
                  "Kami tidak hanya membangun atap, kami membangun mimpi yang kokoh."
                </p>
              </div>
            </div>
            <div className="lg:pl-12 space-y-8">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-widest text-emerald-600 mb-4">Filosofi Gerakan</h2>
                <h3 className="text-4xl font-bold tracking-tight leading-tight mb-6">Setiap anak adalah aset bangsa yang tak ternilai.</h3>
                <p className="text-gray-500 font-light leading-relaxed text-lg">
                  Sekolah Tanah Air hadir di tengah keterbatasan untuk memastikan pendidikan berkualitas bukan lagi kemewahan, melainkan hak yang bisa diakses oleh siapa pun, di mana pun.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-3">
                  <div className="w-10 h-10 bg-emerald-50 rounded-sm flex items-center justify-center text-emerald-600">
                    <Users size={20} />
                  </div>
                  <h4 className="font-bold text-sm uppercase">Komunitas</h4>
                  <p className="text-xs text-gray-400 font-light">Melibatkan warga lokal secara utuh.</p>
                </div>
                <div className="space-y-3">
                  <div className="w-10 h-10 bg-emerald-50 rounded-sm flex items-center justify-center text-emerald-600">
                    <Target size={20} />
                  </div>
                  <h4 className="font-bold text-sm uppercase">Terukur</h4>
                  <p className="text-xs text-gray-400 font-light">Dampak nyata yang bisa dievaluasi.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Impact Gallery (The Core) ── */}
      <section className="py-24 bg-zinc-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div className="max-w-xl">
              <div className="flex items-center gap-2 text-emerald-600 mb-4">
                <Camera size={16} />
                <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Field Documentation</span>
              </div>
              <h3 className="text-4xl font-bold tracking-tight">Realita di Lapangan.</h3>
            </div>
            <p className="text-gray-400 text-sm max-w-xs font-light">Potret kegiatan relawan dan senyum anak-anak yang menjadi energi kami setiap hari.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {GALLERY_IMAGES.map((img, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -5 }}
                className={`${img.size} relative group overflow-hidden rounded-sm bg-gray-200 border border-gray-100 shadow-sm`}
              >
                <img 
                  src={img.url} 
                  alt={img.title}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                  <p className="text-white text-xs font-bold uppercase tracking-widest">{img.title}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Team Section ── */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16 text-center">
            <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-emerald-600 mb-4 block">Our Team</span>
            <h3 className="text-4xl font-bold tracking-tight">Di Balik Layar Sekolah Tanah Air.</h3>
          </div>
          <TeamShowcase members={TEAM_MEMBERS} />
        </div>
      </section>

      {/* ── Simple Visual CTA ── */}
      <section className="py-24 border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full border border-gray-100 bg-gray-50 text-emerald-600">
            <Globe size={32} />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Siap untuk membuat perubahan bersama?</h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4">
            <a 
              href="/kontak"
              className="w-full sm:w-auto px-10 py-4 bg-gray-900 text-white font-bold text-sm hover:bg-emerald-600 transition-all rounded-sm flex items-center justify-center gap-3"
            >
              Hubungi Kami <ArrowRight size={18} />
            </a>
            <a 
              href="/campaigns"
              className="text-sm font-bold border-b-2 border-emerald-600 pb-1 text-emerald-600 hover:text-emerald-700"
            >
              Lihat Campaign
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
