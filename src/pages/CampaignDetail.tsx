import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Users, Clock, Share2, Heart, ShieldCheck,
  MessageSquare, Info, ChevronRight, Calendar,
  ArrowLeft
} from 'lucide-react';
import { formatCurrency, calculateProgress } from '../lib/utils';
import { Campaign } from '../lib/supabase';

// Mock data untuk detail kampanye sementara
// Pada aplikasi produksi, data ini akan diambil dari Supabase berdasarkan slug URL
const MOCK_CAMPAIGN: Campaign = {
  id: '1',
  title: 'Beasiswa Pendidikan Anak Pesisir di Lombok',
  slug: 'beasiswa-pendidikan-anak-pesisir',
  short_description: 'Membantu 100 anak nelayan di pesisir Lombok untuk mendapatkan akses pendidikan yang layak dan peralatan sekolah.',
  full_description: `
    <p>Pendidikan adalah kunci untuk memutus rantai kemiskinan. Namun, bagi anak-anak nelayan di pesisir Lombok, sekolah seringkali menjadi kemewahan yang sulit dijangkau. Banyak dari mereka yang terpaksa putus sekolah untuk membantu orang tua melaut atau bekerja serabutan.</p>
    <br/>
    <p>Melalui program "Beasiswa Anak Pesisir", kami ingin memberikan kesempatan kedua bagi mereka. Donasi yang terkumpul akan digunakan untuk:</p>
    <ul class="list-disc pl-5 space-y-2 mt-4">
      <li>Biaya SPP dan uang saku selama 1 tahun ajaran.</li>
      <li>Seragam sekolah lengkap (nasional, pramuka, olahraga).</li>
      <li>Tas, sepatu, dan alat tulis.</li>
      <li>Buku pelajaran dan modul pendukung.</li>
      <li>Pendampingan belajar rutin setiap akhir pekan.</li>
    </ul>
    <br/>
    <p>Mari bersama kita pastikan masa depan mereka tidak tenggelam bersama ombak. Setiap kontribusi Anda, sekecil apapun, adalah investasi berharga bagi masa depan Indonesia.</p>
  `,
  target_amount: 500000000,
  current_amount: 325000000,
  thumbnail_url: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=1200',
  banner_url: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=1200',
  category_id: 'cat1',
  status: 'active',
  deadline: '2026-12-31',
  is_featured: true,
  created_at: '2026-01-01',
  donor_count: 1240
};

// Data riwayat pembaruan (update) status penyaluran kampanye
const UPDATES = [
  {
    date: '15 Maret 2026',
    title: 'Penyaluran Tahap Pertama: 25 Paket Sekolah',
    content: 'Alhamdulillah, berkat bantuan para donatur, kami telah menyalurkan 25 paket peralatan sekolah lengkap untuk anak-anak di Desa Teluk Awang.',
    image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=800'
  },
  {
    date: '1 Maret 2026',
    title: 'Campaign Dimulai!',
    content: 'Hari ini program Beasiswa Anak Pesisir resmi dibuka. Mohon doa dan dukungannya agar target 100 anak dapat tercapai.',
    image: null
  }
];

// Data riwayat donasi terbaru dari para donatur
const RECENT_DONATIONS = [
  { name: 'Hamba Allah', amount: 500000, time: '2 jam yang lalu', message: 'Semoga bermanfaat untuk adik-adik di Lombok.' },
  { name: 'Budi Santoso', amount: 1000000, time: '5 jam yang lalu', message: 'Semangat terus belajarnya!' },
  { name: 'Siti Aminah', amount: 250000, time: '1 hari yang lalu', message: null },
];

/**
 * Komponen halaman Detail Kampanye.
 * Menampilkan rincian program donasi, progres pengumpulan dana, deskripsi selengkapnya,
 * pembaruan riwayat (update), serta daftar donatur.
 */
export default function CampaignDetail() {
  // Mengambil parameter slug dari URL untuk dimanfaatkan dalam pencarian data kampanye
  const { slug } = useParams();

  // State untuk mengontrol tab navigasi yang aktif (deskripsi, update, atau donatur)
  const [activeTab, setActiveTab] = useState('deskripsi');

  // Menghitung persentase dana terkumpul menggunakan fungsi utilitas
  const progress = calculateProgress(MOCK_CAMPAIGN.current_amount, MOCK_CAMPAIGN.target_amount);

  return (
    <div className="bg-gray-50 min-h-screen pb-24">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Link to="/" className="hover:text-emerald-600">Beranda</Link>
          <ChevronRight size={14} />
          <Link to="/campaigns" className="hover:text-emerald-600">Campaign</Link>
          <ChevronRight size={14} />
          <span className="text-gray-900 font-medium truncate">{MOCK_CAMPAIGN.title}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-10">
            {/* Header & Image */}
            <div className="space-y-6">
              <h1 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight">
                {MOCK_CAMPAIGN.title}
              </h1>
              <div className="relative aspect-video rounded-[2rem] overflow-hidden shadow-2xl shadow-emerald-100">
                <img
                  src={MOCK_CAMPAIGN.banner_url}
                  alt={MOCK_CAMPAIGN.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-6 left-6">
                  <span className="bg-emerald-600 text-white text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full shadow-lg">
                    Pendidikan
                  </span>
                </div>
              </div>
            </div>

            {/* Mobile Stats (Only visible on mobile) */}
            <div className="lg:hidden bg-white p-6 rounded-3xl border border-gray-100 shadow-xl shadow-emerald-100/50 space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="text-sm text-gray-400 font-bold uppercase tracking-wider">Terkumpul</p>
                    <p className="text-3xl font-black text-emerald-600">{formatCurrency(MOCK_CAMPAIGN.current_amount)}</p>
                  </div>
                  <p className="text-sm text-gray-400 font-bold">Target: {formatCurrency(MOCK_CAMPAIGN.target_amount)}</p>
                </div>
                <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm font-bold text-gray-600">
                  <div className="flex items-center space-x-2">
                    <Users size={16} className="text-emerald-500" />
                    <span>{MOCK_CAMPAIGN.donor_count} Donatur</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock size={16} className="text-emerald-500" />
                    <span>15 Hari Lagi</span>
                  </div>
                </div>
              </div>
              <Link
                to={`/donate/${MOCK_CAMPAIGN.slug}`}
                className="block w-full text-center bg-emerald-600 text-white py-4 rounded-2xl text-lg font-bold hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200"
              >
                Donasi Sekarang
              </Link>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm">
              <div className="flex border-b border-gray-100">
                {['deskripsi', 'update', 'donatur'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-5 text-sm font-bold uppercase tracking-widest transition-all ${activeTab === tab
                      ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/30'
                      : 'text-gray-400 hover:text-gray-600'
                      }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="p-8 md:p-10">
                {activeTab === 'deskripsi' && (
                  <div className="prose prose-emerald max-w-none text-gray-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: MOCK_CAMPAIGN.full_description }} />
                )}

                {activeTab === 'update' && (
                  <div className="space-y-12">
                    {UPDATES.map((update, i) => (
                      <div key={i} className="relative pl-8 border-l-2 border-emerald-100 space-y-4">
                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-emerald-500 border-4 border-white shadow-sm" />
                        <div className="flex items-center space-x-2 text-xs font-bold text-emerald-600 uppercase tracking-wider">
                          <Calendar size={14} />
                          <span>{update.date}</span>
                        </div>
                        <h4 className="text-xl font-bold text-gray-900">{update.title}</h4>
                        <p className="text-gray-600 leading-relaxed">{update.content}</p>
                        {update.image && (
                          <img src={update.image} alt={update.title} className="rounded-2xl w-full max-w-md" />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'donatur' && (
                  <div className="space-y-6">
                    {RECENT_DONATIONS.map((donation, i) => (
                      <div key={i} className="flex items-start space-x-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                        <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-lg">
                          {donation.name[0]}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex justify-between items-center">
                            <h5 className="font-bold text-gray-900">{donation.name}</h5>
                            <span className="text-xs text-gray-400 font-medium">{donation.time}</span>
                          </div>
                          <p className="text-emerald-600 font-bold text-sm">Berdonasi {formatCurrency(donation.amount)}</p>
                          {donation.message && (
                            <p className="text-gray-500 text-sm italic mt-2 bg-white p-3 rounded-xl border border-gray-100">
                              "{donation.message}"
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Transparency Section */}
            <div className="bg-emerald-900 text-white p-10 rounded-[2rem] space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-800 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-50" />
              <div className="relative z-10 flex items-start space-x-6">
                <div className="p-4 bg-emerald-800 rounded-2xl">
                  <ShieldCheck size={32} className="text-emerald-400" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-2xl font-bold">Komitmen Transparansi</h4>
                  <p className="text-emerald-100 leading-relaxed">
                    Kami menjamin setiap donasi Anda disalurkan 100% sesuai peruntukan. Laporan penggunaan dana akan diperbarui secara berkala di tab "Update" dan dapat diunduh di halaman Laporan Transparansi.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar (Sticky on Desktop) */}
          <div className="hidden lg:block">
            <div className="sticky top-32 space-y-6">
              <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-xl shadow-emerald-100/50 space-y-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <p className="text-sm text-gray-400 font-bold uppercase tracking-wider">Dana Terkumpul</p>
                    <p className="text-4xl font-black text-emerald-600">{formatCurrency(MOCK_CAMPAIGN.current_amount)}</p>
                    <p className="text-sm text-gray-400 font-bold">Target: {formatCurrency(MOCK_CAMPAIGN.target_amount)}</p>
                  </div>

                  <div className="space-y-4">
                    <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-sm font-bold text-gray-600">
                      <div className="flex items-center space-x-2">
                        <Users size={18} className="text-emerald-500" />
                        <span>{MOCK_CAMPAIGN.donor_count} Donatur</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock size={18} className="text-emerald-500" />
                        <span>15 Hari Lagi</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <Link
                    to={`/donate/${MOCK_CAMPAIGN.slug}`}
                    className="block w-full text-center bg-emerald-600 text-white py-5 rounded-2xl text-xl font-bold hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200"
                  >
                    Donasi Sekarang
                  </Link>
                  <button className="w-full flex items-center justify-center space-x-2 py-4 text-gray-600 font-bold hover:text-emerald-600 transition-colors">
                    <Share2 size={20} />
                    <span>Bagikan Campaign</span>
                  </button>
                </div>
              </div>

              {/* Fundraiser Info */}
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center space-x-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                  <Heart className="text-emerald-600 w-6 h-6 fill-current" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Penggalang Dana</p>
                  <p className="font-bold text-gray-900">Yayasan Sekolah Tanah Air</p>
                  <div className="flex items-center text-[10px] text-emerald-600 font-bold uppercase tracking-widest mt-0.5">
                    <CheckCircle2 size={10} className="mr-1" />
                    Terverifikasi
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CheckCircle2({ size, className }: { size: number, className?: string }) {
  return <CheckCircle2Icon size={size} className={className} />;
}

import { CheckCircle2 as CheckCircle2Icon } from 'lucide-react';
