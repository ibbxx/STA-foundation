import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck, Zap, BarChart3, Heart, CheckCircle2, Users, Hexagon, Triangle, CircleDashed, Chrome, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import CampaignCard from '../components/CampaignCard';
import { Campaign } from '../lib/supabase';
import { cn } from '../lib/utils';

/**
 * Data sampel sementara (mock data) untuk keperluan tata letak dan pengujian antarmuka.
 * Pada implementasi produksi, data ini akan ditarik dari basis data Supabase.
 */
const MOCK_CAMPAIGNS: Campaign[] = [
  {
    id: '1',
    title: 'Beasiswa Pendidikan Anak Pesisir di Lombok',
    slug: 'beasiswa-pendidikan-anak-pesisir',
    short_description: 'Membantu 100 anak nelayan di pesisir Lombok untuk mendapatkan akses pendidikan yang layak dan peralatan sekolah.',
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
    donor_count: 1240
  },
  {
    id: '2',
    title: 'Pembangunan Sumur Air Bersih di Gunung Kidul',
    slug: 'sumur-air-bersih-gunung-kidul',
    short_description: 'Menyediakan akses air bersih yang berkelanjutan bagi 5 desa yang terdampak kekeringan parah setiap tahunnya.',
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
    donor_count: 850
  },
  {
    id: '3',
    title: 'Operasi Katarak Gratis untuk Lansia Kurang Mampu',
    slug: 'operasi-katarak-gratis',
    short_description: 'Memberikan penglihatan kembali bagi 50 lansia di Jawa Barat melalui prosedur operasi katarak yang aman dan profesional.',
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
    donor_count: 320
  }
];

/**
 * Komponen Halaman Beranda (Home).
 * Merupakan titik masuk utama (landing page) yang menampilkan ringkasan layanan,
 * statistik keberhasilan, dan kampanye penggalangan dana unggulan.
 */
export default function Home() {
  return (
    <div className="overflow-hidden">
      {/* Bagian Hero: Sambutan Utama dan Ajakan Bertindak Primer */}
      <section className="relative pt-20 pb-32 lg:pt-32 lg:pb-48 bg-emerald-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Teks dan Tombol Navigasi dengan Animasi Masuk */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              <div className="inline-flex items-center space-x-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-bold tracking-wide uppercase">
                <Heart size={16} className="fill-current" />
                <span>Bersama Membangun Negeri</span>
              </div>
              <h1 className="text-5xl lg:text-7xl font-black text-gray-900 leading-[1.1] tracking-tight">
                Ubah Niat Baik Menjadi <span className="text-emerald-600">Dampak Nyata</span>
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed max-w-xl">
                Platform crowdfunding paling transparan dan terpercaya di Indonesia. Bantu mereka yang membutuhkan dengan proses donasi yang aman dan mudah.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link
                  to="/campaigns"
                  className="bg-emerald-600 text-white px-8 py-4 rounded-full text-lg font-bold hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 flex items-center justify-center group"
                >
                  Donasi Sekarang
                  <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/tentang-kami"
                  className="bg-white text-gray-900 border border-gray-200 px-8 py-4 rounded-full text-lg font-bold hover:bg-gray-50 transition-all flex items-center justify-center"
                >
                  Pelajari Lebih Lanjut
                </Link>
              </div>

              {/* Tampilan Ringkasan Partisipasi Pengguna (Social Proof) */}
              <div className="flex items-center space-x-6 pt-8">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    <img
                      key={i}
                      src={`https://i.pravatar.cc/100?img=${i + 10}`}
                      alt="Donatur"
                      className="w-12 h-12 rounded-full border-4 border-white object-cover"
                    />
                  ))}
                  <div className="w-12 h-12 rounded-full border-4 border-white bg-emerald-100 flex items-center justify-center text-emerald-700 text-xs font-bold">
                    +10k
                  </div>
                </div>
                <p className="text-sm text-gray-500 font-medium">
                  Bergabung dengan <span className="text-gray-900 font-bold">10,000+</span> donatur lainnya
                </p>
              </div>
            </motion.div>

            {/* Gambar Ilustrasi Utama dan Kartu Statistik Melayang */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="relative z-10 rounded-[2rem] overflow-hidden shadow-2xl shadow-emerald-200/50 rotate-2">
                <img
                  src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=1200"
                  alt="Crowdfunding Impact"
                  className="w-full aspect-[4/5] object-cover"
                />
              </div>
              <div className="absolute -top-10 -right-10 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl -z-10" />
              <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-emerald-600/10 rounded-full blur-3xl -z-10" />

              {/* Kartu Pencapaian (Floating Stats) */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1, duration: 0.5 }}
                className="absolute -bottom-6 -right-6 bg-white p-6 rounded-2xl shadow-xl border border-gray-100 z-20 max-w-[200px]"
              >
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <CheckCircle2 className="text-emerald-600 w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Terverifikasi</span>
                </div>
                <p className="text-2xl font-black text-gray-900">Rp 12.5M+</p>
                <p className="text-xs text-gray-500 font-medium">Total Donasi Tersalurkan</p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Bagian Statistik Utama Platform */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { label: 'Total Donasi', value: 'Rp 15.2M', icon: Heart },
              { label: 'Donatur Aktif', value: '25,400+', icon: Users },
              { label: 'Campaign Sukses', value: '1,200+', icon: BarChart3 },
              { label: 'Penerima Manfaat', value: '85,000+', icon: CheckCircle2 },
            ].map((stat, i) => (
              <div key={i} className="text-center space-y-2">
                <div className="inline-flex p-3 bg-emerald-50 rounded-2xl text-emerald-600 mb-2">
                  <stat.icon size={24} />
                </div>
                <h3 className="text-3xl font-black text-gray-900">{stat.value}</h3>
                <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bagian Nilai Jual / Keunggulan Layanan (Why Choose Us) */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
            <h2 className="text-emerald-600 font-bold uppercase tracking-widest text-sm">Keunggulan Kami</h2>
            <h3 className="text-4xl font-black text-gray-900">Mengapa Berdonasi di Sekolah Tanah Air?</h3>
            <p className="text-gray-600 text-lg">Kami membangun sistem yang mengedepankan kepercayaan dan kemudahan bagi setiap orang untuk berbagi.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'Transparansi Penuh',
                desc: 'Setiap rupiah yang Anda donasikan dapat dilacak penggunaannya melalui laporan real-time.',
                icon: ShieldCheck,
                color: 'bg-blue-500'
              },
              {
                title: 'Update Real-time',
                desc: 'Dapatkan notifikasi dan update langsung dari lapangan mengenai perkembangan program yang Anda bantu.',
                icon: Zap,
                color: 'bg-emerald-500'
              },
              {
                title: 'Mudah & Cepat',
                desc: 'Berbagai pilihan metode pembayaran mulai dari E-Wallet, QRIS, hingga Transfer Bank.',
                icon: Heart,
                color: 'bg-orange-500'
              }
            ].map((feature, i) => (
              <div key={i} className="bg-white p-10 rounded-[2rem] border border-gray-100 hover:shadow-2xl hover:shadow-emerald-100/30 transition-all duration-500 group">
                <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center text-white mb-8 shadow-lg", feature.color)}>
                  <feature.icon size={32} />
                </div>
                <h4 className="text-2xl font-bold text-gray-900 mb-4">{feature.title}</h4>
                <p className="text-gray-500 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bagian Daftar Kampanye Unggulan atau Mendesak */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div className="space-y-4">
              <h2 className="text-emerald-600 font-bold uppercase tracking-widest text-sm">Program Pilihan</h2>
              <h3 className="text-4xl font-black text-gray-900">Campaign Mendesak</h3>
            </div>
            <Link to="/campaigns" className="text-emerald-600 font-bold flex items-center hover:underline group">
              Lihat Semua Campaign
              <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {MOCK_CAMPAIGNS.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </div>
        </div>
      </section>

      {/* Bagian Mitra atau Sponsor (Partners) */}
      <section className="py-20 bg-gray-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-400 font-bold uppercase tracking-widest text-xs mb-12">Dipercaya oleh Mitra Strategis</p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 lg:gap-24">
            {[
              { id: 1, name: 'FundRaiser', icon: Hexagon, color: 'text-indigo-600' },
              { id: 2, name: 'NexusOrg', icon: Triangle, color: 'text-rose-600' },
              { id: 3, name: 'GlobalAid', icon: Globe, color: 'text-blue-600' },
              { id: 4, name: 'EcoTrust', icon: CircleDashed, color: 'text-emerald-600' },
              { id: 5, name: 'TechCare', icon: Chrome, color: 'text-amber-600' }
            ].map((partner) => (
              <div
                key={partner.id}
                className="flex items-center space-x-2.5 opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500 cursor-pointer group"
                title={partner.name}
              >
                <partner.icon size={32} className={cn("transition-transform group-hover:scale-110", partner.color)} />
                <span className="text-xl md:text-2xl font-black tracking-tight text-gray-900">{partner.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bagian Ajakan Bertindak Penutup (Final Call-to-Action) */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-emerald-600 rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden">
            {/* Efek Latar Belakang Desain Dekoratif */}
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
              <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
              <div className="absolute bottom-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
            </div>

            <div className="relative z-10 max-w-3xl mx-auto space-y-8">
              <h2 className="text-4xl md:text-6xl font-black text-white leading-tight">
                Siap Untuk Membuat Perubahan Hari Ini?
              </h2>
              <p className="text-emerald-50 text-xl">
                Setiap donasi Anda adalah harapan bagi mereka. Mari bergabung dalam misi kemanusiaan kami.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Link
                  to="/campaigns"
                  className="bg-white text-emerald-700 px-10 py-5 rounded-full text-xl font-bold hover:bg-emerald-50 transition-all shadow-2xl"
                >
                  Mulai Berdonasi
                </Link>
                <Link
                  to="/kontak"
                  className="bg-emerald-700 text-white px-10 py-5 rounded-full text-xl font-bold hover:bg-emerald-800 transition-all"
                >
                  Hubungi Kami
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
