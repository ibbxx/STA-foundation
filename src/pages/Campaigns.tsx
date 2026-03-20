import { useState } from 'react';
import { Search, Filter, SlidersHorizontal } from 'lucide-react';
import CampaignCard from '../components/CampaignCard';
import { Campaign } from '../lib/supabase';

/**
 * Data sampel sementara// Mock data for initial development (sebagai placeholder data sebelum dihubungkan ke backend) daftar kampanye.
 * Menampilkan berbagai jenis kampanye untuk pengujian filter dan pencarian.
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
  },
  {
    id: '4',
    title: 'Bantuan Pangan untuk Korban Banjir Demak',
    slug: 'bantuan-pangan-banjir-demak',
    short_description: 'Penyaluran paket sembako dan makanan siap saji untuk ribuan warga yang mengungsi akibat banjir bandang di Demak.',
    full_description: '',
    target_amount: 100000000,
    current_amount: 85000000,
    thumbnail_url: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&q=80&w=800',
    banner_url: '',
    category_id: 'cat4',
    status: 'active',
    deadline: '2026-12-31',
    is_featured: false,
    created_at: '',
    donor_count: 560
  }
];

// Daftar kategori kampanye yang tersedia untuk filter pencarian
const CATEGORIES = [
  'Semua',
  'Pendidikan',
  'Kesehatan',
  'Lingkungan',
  'Bencana Alam',
  'Sosial'
];

/**
 * Komponen halaman daftar Kampanye.
 * Menampilkan semua program donasi yang tersedia, lengkap dengan fitur pencarian dan filter kategori.
 */
export default function Campaigns() {
  // State untuk melacak teks pencarian pengguna
  const [searchQuery, setSearchQuery] = useState('');
  // State untuk melacak filter kategori yang sedang aktif
  const [activeCategory, setActiveCategory] = useState('Semua');

  return (
    <div className="bg-gray-50 min-h-screen pb-24">
      {/* Bagian Tajuk Halaman (Header) */}
      <div className="bg-white border-b border-gray-100 pt-16 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-black text-gray-900 mb-4">Jelajahi Program Kebaikan</h1>
            <p className="text-gray-500 text-lg">
              Pilih campaign yang ingin Anda bantu dan jadilah bagian dari perubahan positif untuk Indonesia.
            </p>
          </div>
        </div>
      </div>

      {/* Bagian Kontrol Filter & Penelusuran (Sticky Header) */}
      <div className="sticky top-20 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 py-4 mb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-6 justify-between items-center">
            {/* Input Pencarian */}
            <div className="relative w-full lg:max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Cari campaign..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                aria-label="Pencarian kampanye"
              />
            </div>

            {/* Filter Kategori Mendatar (Horizontal Scroll) */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-2 lg:pb-0 w-full lg:w-auto no-scrollbar">
              <div className="flex items-center space-x-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all ${activeCategory === cat
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200'
                      : 'bg-white text-gray-600 border border-gray-200 hover:border-emerald-500 hover:text-emerald-600'
                      }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Tombol Pengurutan (Sort) - Saat ini sebagai placeholder visual */}
            <button className="hidden lg:flex items-center space-x-2 text-gray-600 font-bold text-sm hover:text-emerald-600 transition-colors">
              <SlidersHorizontal size={18} />
              <span>Urutkan</span>
            </button>
          </div>
        </div>
      </div>

      {/* Kisi Tampilan Kampanye (Campaign Grid) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {MOCK_CAMPAIGNS.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>

        {/* Tampilan Kondisi Kosong (Empty State) saat pencarian/filter tidak ada yang cocok */}
        {MOCK_CAMPAIGNS.length === 0 && (
          <div className="text-center py-32 bg-white rounded-[3rem] border border-dashed border-gray-200">
            <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search size={32} className="text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Campaign Tidak Ditemukan</h3>
            <p className="text-gray-500">Coba gunakan kata kunci lain atau filter kategori yang berbeda.</p>
          </div>
        )}

        {/* Penomoran Halaman Navigasi (Pagination) - Placeholder antarmuka */}
        <div className="mt-16 flex justify-center">
          <nav className="flex items-center space-x-2" aria-label="Navigasi Halaman">
            <button className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50 transition-colors">1</button>
            <button className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">2</button>
            <button className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50 transition-colors">3</button>
            <span className="px-2 text-gray-400">...</span>
            <button className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50 transition-colors">10</button>
          </nav>
        </div>
      </div>
    </div>
  );
}
