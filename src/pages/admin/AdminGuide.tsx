import React, { useState, useMemo } from 'react';
import {
  BookOpen, LayoutDashboard, FileText, Banknote, Users, MapPinned, Building2, BookText,
  Search, Lightbulb, AlertTriangle, Info, ArrowRight, CheckCircle2, ChevronDown,
  Plus, RefreshCw, Image as ImageIcon, ExternalLink, Filter, Map, XCircle, Mail
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';

/* ── Guide Section Data ── */

interface GuideStep {
  title: string;
  detail: string;
  tip?: string;
  warning?: string;
  info?: string;
  visual?: React.ReactNode;
}

interface GuideSection {
  id: string;
  title: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  path: string;
  description: string;
  steps: GuideStep[];
}

const GUIDE_SECTIONS: GuideSection[] = [
  {
    id: 'dashboard',
    title: 'Dashboard Utama',
    icon: LayoutDashboard,
    path: '/admin',
    description: 'Halaman pertama yang Anda lihat saat login. Gunakan ini untuk memantau "kesehatan" dan aktivitas terbaru yayasan Anda setiap pagi.',
    steps: [
      {
        title: 'Membaca Ringkasan Angka (Stat Card)',
        detail: 'Terdapat 4 kotak utama di paling atas layar. Angka-angka ini adalah metrik paling penting yayasan Anda:\n\n1. Total Donasi Sukses: Seluruh uang yang sudah masuk ke rekening/Xendit.\n2. Donatur Unik: Jumlah orang berbeda yang menyumbang.\n3. Campaign Aktif: Jumlah penggalangan dana yang masih berjalan hari ini.\n4. Laporan Pending: Jika angkanya lebih dari 0, berarti ada warga yang melaporkan sekolah rusak dan menunggu Anda baca.',
        visual: (
          <div className="flex gap-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-4 w-full">
            <div className="flex flex-1 items-center gap-3 rounded-lg bg-white p-3 shadow-sm border border-slate-100">
              <div className="rounded-md bg-emerald-100 p-2 text-emerald-600"><Banknote size={16} /></div>
              <div><div className="text-[10px] text-slate-500 font-bold uppercase">Total Donasi</div><div className="text-sm font-black">Rp 12.500.000</div></div>
            </div>
            <div className="flex flex-1 items-center gap-3 rounded-lg bg-white p-3 shadow-sm border border-slate-100">
              <div className="rounded-md bg-rose-100 p-2 text-rose-600"><Building2 size={16} /></div>
              <div><div className="text-[10px] text-slate-500 font-bold uppercase">Laporan Pending</div><div className="text-sm font-black text-rose-600">3 Laporan</div></div>
            </div>
          </div>
        )
      },
      {
        title: 'Menyegarkan Data Secara Langsung',
        detail: 'Sistem ini berjalan real-time. Jika Anda sedang menunggu konfirmasi donasi dari seseorang, Anda tidak perlu menekan tombol F5 (Reload Browser) yang akan membuat layar memuat ulang dari nol.\n\nCara yang benar: Klik tombol "Refresh" bergambar panah melingkar di pojok kanan atas layar Anda.',
        visual: (
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 shadow-sm pointer-events-none">
            <RefreshCw size={14} className="text-emerald-500" /> Refresh Data
          </button>
        )
      },
    ],
  },
  {
    id: 'campaigns',
    title: 'Kelola Campaign (Program Donasi)',
    icon: FileText,
    path: '/admin/campaigns',
    description: 'Modul operasi utama Anda. Di sinilah Anda membuat program baru, mengedit cerita donasi, hingga memposting laporan progres ke publik.',
    steps: [
      {
        title: 'Cara Membuat Campaign Baru',
        detail: '1. Masuk ke halaman Kelola Campaign.\n2. Di pojok kanan atas, klik tombol hitam "+ Tambah Campaign".\n3. Sebuah formulir panjang akan muncul. Isi mulai dari Judul, Target Uang, dan Kategori.',
        visual: (
          <button className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-xl text-sm font-medium shadow-md pointer-events-none">
            <Plus size={16} /> Tambah Campaign
          </button>
        )
      },
      {
        title: 'Mengupload Foto & Menulis Cerita',
        detail: '1. Pada bagian "Gambar Campaign", Anda akan melihat kotak putus-putus. Klik kotak tersebut, lalu pilih foto dari perangkat Anda.\n2. Di kotak "Cerita Lengkap", tulis latar belakang yang menyentuh hati. Anda bisa menebalkan teks atau membuat poin-poin agar mudah dibaca donatur.',
        visual: (
          <div className="w-full max-w-sm h-24 border-2 border-dashed border-emerald-300 bg-emerald-50 rounded-xl flex flex-col items-center justify-center text-emerald-600">
            <ImageIcon size={20} className="mb-1" />
            <span className="text-xs font-bold">Klik untuk Unggah Gambar</span>
          </div>
        ),
        tip: 'Sistem otomatis mengecilkan ukuran gambar Anda agar website tetap cepat dibuka. Tidak perlu repot kompres gambar sendiri!'
      },
      {
        title: 'Menerbitkan Campaign ke Publik (Active)',
        detail: 'Ketika Anda pertama kali menekan "Simpan", campaign tidak akan langsung muncul di website. Statusnya adalah "Draft" (hanya Anda yang bisa lihat).\n\nUntuk menerbitkannya:\n1. Di tabel daftar campaign, klik ikon Pensil (Edit) pada baris campaign tersebut.\n2. Cari kolom "Status".\n3. Ubah dari "Draft" menjadi "Active".\n4. Klik Simpan di paling bawah form.',
        visual: (
          <div className="flex gap-2 items-center bg-slate-50 p-4 rounded-xl border border-slate-200">
            <span className="px-3 py-1 text-xs font-bold rounded-full bg-slate-200 text-slate-500 border border-slate-300">Draft</span>
            <ArrowRight size={16} className="text-slate-400" />
            <span className="px-3 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 shadow-sm animate-pulse">Active</span>
          </div>
        )
      },
      {
        title: 'Cara Menambahkan Update (Kabar Terbaru)',
        detail: '1. Klik ikon Pensil (Edit) pada campaign yang sedang berjalan.\n2. Scroll ke bawah, klik tab "Update Campaign".\n3. Klik "+ Tambah Update".\n4. Tulis pesan (contoh: "Alhamdulillah material batu bata sudah sampai") lalu unggah foto buktinya.',
        info: 'Transparansi ini sangat penting. Update akan muncul di halaman publik dan membuat donatur percaya bahwa uang mereka benar-benar disalurkan.'
      },
    ],
  },
  {
    id: 'transactions',
    title: 'Transaksi Donasi (Keuangan)',
    icon: Banknote,
    path: '/admin/transactions',
    description: 'Catatan arus kas otomatis. Setiap kali seseorang menekan tombol donasi di website, datanya akan langsung terekam di sini.',
    steps: [
      {
        title: 'Memahami Status Pembayaran (Xendit)',
        detail: 'Di kolom "Status", Anda akan melihat 3 warna berbeda:\n\n- HIJAU (Success): Uang sudah sah masuk. Donasi ini dihitung ke total target campaign.\n- KUNING (Pending): Donatur sudah mengisi form, tapi belum transfer uang ke Virtual Account/Qris. Sistem masih menunggu pelunasan.\n- MERAH (Failed/Expired): Transaksi dibatalkan atau donatur lupa membayar hingga batas waktu habis (biasanya 24 jam).',
        visual: (
          <div className="flex flex-col gap-2 bg-slate-50 p-4 rounded-xl border border-slate-200 max-w-sm">
            <div className="flex justify-between items-center bg-white p-2 border border-slate-100 rounded">
              <span className="text-xs font-medium">Budi Santoso</span>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-100 text-emerald-700">Success</span>
            </div>
            <div className="flex justify-between items-center bg-white p-2 border border-slate-100 rounded">
              <span className="text-xs font-medium">Siti Aminah</span>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-100 text-amber-700">Pending</span>
            </div>
          </div>
        ),
        info: 'Anda TIDAK PERLU mengubah status dari Kuning ke Hijau secara manual. Sistem kami terhubung dengan Xendit, sehingga begitu donatur transfer via bank/e-wallet, statusnya akan otomatis berubah menjadi Hijau detik itu juga.'
      },
      {
        title: 'Melacak Donasi Bermasalah',
        detail: 'Jika ada donatur yang komplain "Saya sudah transfer tapi belum masuk", lakukan ini:\n1. Ketikkan nama atau email donatur tersebut di Kotak Pencarian di atas tabel.\n2. Cek statusnya. Jika masih "Pending", beritahu donatur bahwa pembayaran dari bank-nya mungkin tertunda.\n3. Anda bisa mengeklik tombol filter "Status" dan memilih "Pending" untuk melacak siapa saja yang belum melunasi donasi mereka hari ini.',
        visual: (
          <div className="flex gap-2 max-w-md">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-500 w-full shadow-sm">
              <Search size={14} />
              <span className="truncate">Cari email: budi@gmail.com</span>
            </div>
          </div>
        )
      },
    ],
  },
  {
    id: 'donors',
    title: 'Data Donatur (Buku Kontak)',
    icon: Users,
    path: '/admin/donors',
    description: 'Sistem yang cerdas merangkum siapa saja pahlawan pendukung yayasan Anda dan seberapa loyal mereka.',
    steps: [
      {
        title: 'Membaca Total Kontribusi',
        detail: 'Halaman ini berbeda dengan halaman Transaksi. Jika Ibu Tati berdonasi 5 kali di bulan yang berbeda, namanya hanya akan muncul 1 kali di halaman ini.\n\nPerhatikan kolom "Total Donasi". Sistem akan menotalkan kelima donasi Ibu Tati tersebut.',
        visual: (
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm max-w-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center">T</div>
              <div>
                <p className="text-sm font-bold">Ibu Tati</p>
                <div className="flex items-center gap-1 text-[10px] text-slate-500">
                  <Mail size={10} /> tati@example.com
                </div>
              </div>
              <div className="ml-auto text-right">
                <p className="text-xs text-slate-500 font-medium">Total (5x)</p>
                <p className="text-sm font-bold text-emerald-600">Rp 2.500.000</p>
              </div>
            </div>
          </div>
        ),
        tip: 'Urutkan (Sort) tabel berdasarkan Total Donasi untuk menemukan Top Donors Anda. Kirimkan email ucapan terima kasih personal kepada mereka untuk merawat hubungan baik.'
      },
    ],
  },
  {
    id: 'eduxplore',
    title: 'Pendaftar EduXplore (Relawan)',
    icon: Users,
    path: '/admin/eduxplore',
    description: 'Pusat kendali untuk menyortir dan menyeleksi ribuan calon relawan pendidikan dengan sangat cepat.',
    steps: [
      {
        title: 'Fokus pada Satu Batch EduXplore',
        detail: '1. Di bagian atas layar, temukan tombol filter "Semua Program".\n2. Klik dan pilih program spesifik (misal: "EduXplore #4 Lombok").\n3. Tabel antrean di sebelah kiri sekarang hanya menampilkan pendaftar untuk ke Lombok saja.',
        visual: (
          <div className="flex gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl max-w-sm">
            <Filter size={16} className="text-slate-400 mt-1.5 shrink-0" />
            <div className="w-full h-8 bg-white border border-slate-200 rounded-md flex items-center px-3 text-xs text-slate-600 font-medium justify-between shadow-sm">
              <span>EduXplore #4 Lombok</span>
              <ChevronDown size={14} className="text-slate-400" />
            </div>
          </div>
        )
      },
      {
        title: 'Standar Operasional (SOP) Seleksi',
        detail: '1. Di kolom kiri (Antrean), klik satu nama pendaftar (contoh: "Ahmad").\n2. Panel di sebelah kanan akan terbuka, menampilkan biodata lengkap Ahmad.\n3. Cek motivasi dan riwayat penyakitnya.\n4. Scroll ke bawah, klik tautan "Bukti Pembayaran DP". Pastikan tidak palsu.\n5. Scroll ke paling bawah. Klik tombol "Terima" (Hijau) atau "Tolak" (Merah).',
        visual: (
          <div className="space-y-2 max-w-sm border-l-4 border-indigo-500 pl-4 py-2">
            <div className="flex items-center justify-between px-4 py-2 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 text-xs font-bold cursor-pointer hover:bg-indigo-100 transition-colors">
              <div className="flex items-center gap-2"><ImageIcon size={14}/> Cek Bukti DP</div>
              <ExternalLink size={12}/>
            </div>
            <div className="flex gap-2 mt-3">
              <button className="flex-1 flex items-center justify-center gap-2 py-2 bg-emerald-600 text-white rounded-lg font-bold text-xs shadow-sm">
                <CheckCircle2 size={14} /> Terima
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 py-2 bg-rose-600 text-white rounded-lg font-bold text-xs shadow-sm">
                <XCircle size={14} /> Tolak
              </button>
            </div>
          </div>
        )
      },
      {
        title: 'Mencetak Absen Lapangan (Export Excel)',
        detail: 'Sistem menyediakan fitur unduh data sekali klik:\n1. Filter status menjadi "Diterima".\n2. Filter program ke batch yang akan diberangkatkan.\n3. Klik tombol hijau "Export Excel" di pojok kanan atas.\n4. File akan terunduh. Buka file tersebut, semua data (termasuk ukuran baju) sudah tertata rapi siap diprint.',
      },
    ],
  },
  {
    id: 'school-reports',
    title: 'Laporan Sekolah (Lapor Rusak)',
    icon: Building2,
    path: '/admin/school-reports',
    description: 'Kotak masuk pengaduan dari masyarakat terkait sekolah-sekolah rusak yang butuh bantuan di sekitar mereka.',
    steps: [
      {
        title: 'Cara Menindaklanjuti Laporan Warga',
        detail: '1. Klik pada laporan yang baru masuk (Status: Pending warna kuning).\n2. Di panel detail, klik foto sekolah yang dikirimkan warga. Foto akan membesar di layar (zoom) sehingga Anda bisa melihat kerusakan dinding/atap dengan jelas.\n3. Jika laporannya meyakinkan, ubah statusnya di pojok kanan menjadi "Ditinjau" (artinya Anda sedang memverifikasinya).',
        visual: (
          <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl max-w-sm">
            <div className="w-16 h-16 bg-slate-200 rounded-lg flex flex-col items-center justify-center text-slate-400 cursor-pointer hover:bg-slate-300">
              <ImageIcon size={20} />
              <span className="text-[9px] mt-1">Klik Zoom</span>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">SDN 01 Atap Bocor</p>
              <div className="flex gap-2 mt-1">
                <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-[10px] font-bold">Pending</span>
                <ArrowRight size={12} className="text-slate-400 mt-0.5" />
                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold">Ditinjau</span>
              </div>
            </div>
          </div>
        )
      },
      {
        title: 'Menghubungi Pelapor',
        detail: 'Jangan langsung mengirim relawan ke lokasi! Lihat nomor HP atau Email "Nama Pelapor" di panel detail. Telepon mereka terlebih dahulu untuk memastikan letak geografis sekolah tidak fiktif.',
      },
    ],
  },
  {
    id: 'impact-map',
    title: 'Peta Dampak (Map Lokasi)',
    icon: MapPinned,
    path: '/admin/impact-map',
    description: 'Pajang seluruh pencapaian yayasan dalam bentuk titik-titik (pin) pada peta nusantara yang ada di beranda publik.',
    steps: [
      {
        title: 'Cara Sangat Mudah Mendapatkan Koordinat',
        detail: 'Untuk menaruh pin di peta, Anda butuh 2 angka: Latitude & Longitude.\n\n1. Buka tab baru di browser, pergi ke google.com/maps.\n2. Cari nama sekolah/desa.\n3. Di peta Google, KLIK KANAN tepat di icon merah lokasinya.\n4. Muncul menu hitam kecil. Baris paling atas adalah angka koordinat (contoh: -6.123, 106.456). KLIK angka tersebut, ia otomatis ter-Copy.\n5. Kembali ke admin panel, tekan CTRL+V (Paste) di kotak Latitude untuk angka pertama, dan kotak Longitude untuk angka kedua.',
        visual: (
          <div className="flex gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl max-w-sm">
            <div className="flex-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1"><Map size={10}/> Latitude</label>
              <div className="px-3 py-2 mt-1 bg-white border border-slate-200 rounded-md text-xs font-mono">-8.3405</div>
            </div>
            <div className="flex-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1"><Map size={10}/> Longitude</label>
              <div className="px-3 py-2 mt-1 bg-white border border-slate-200 rounded-md text-xs font-mono">116.0384</div>
            </div>
          </div>
        ),
        warning: 'Perhatian: Untuk wilayah Indonesia, angka Latitude hampir selalu mengandung tanda minus di depannya (-). Jika Anda lupa minusnya, pin peta Anda akan meleset ke negara lain!'
      },
      {
        title: 'Beri Label Status Proyek',
        detail: 'Pilih "Berjalan" jika dana sudah cair tapi sekolah sedang dibangun (ditandai warna kuning di peta). Pilih "Selesai" jika bangunan sudah diresmikan (warna hijau).',
      }
    ],
  },
  {
    id: 'content',
    title: 'Pengaturan Konten (Tampilan)',
    icon: BookText,
    path: '/admin/content',
    description: 'Tempat ajaib untuk mengubah foto beranda, tulisan besar, dan menu program unggulan tanpa perlu memanggil programmer.',
    steps: [
      {
        title: 'Sistem Berbasis Tab (Penting)',
        detail: 'Perhatikan bagian atas halaman ini. Ada 3 buah tab (Tampilan Website, Program Utama, Program Relawan). Klik tab-tab tersebut untuk berpindah halaman pengaturan. Pastikan Anda berada di tab yang tepat sebelum mengedit.',
        visual: (
          <div className="flex gap-2 p-1 bg-slate-100 rounded-lg max-w-md border border-slate-200">
            <div className="px-4 py-1.5 text-xs font-bold text-slate-500">Tampilan Website</div>
            <div className="px-4 py-1.5 text-xs font-bold text-slate-900 bg-white rounded shadow-sm border border-slate-200">Program Utama</div>
            <div className="px-4 py-1.5 text-xs font-bold text-slate-500">Program Relawan</div>
          </div>
        )
      },
      {
        title: 'Mengganti Gambar Geser (Hero Banner) Beranda',
        detail: '1. Pastikan Anda di tab "Tampilan Website".\n2. Di bagian "Hero Banner", Anda akan melihat urutan banner yang ada sekarang.\n3. Klik "+ Tambah Slide" jika ingin menambah gambar baru. Atau klik gambar yang sudah ada untuk menukarnya.\n4. Isi kotak Judul yang akan tampil melayang di atas gambar tersebut.\n5. Tekan "Simpan Perubahan" di paling bawah.',
      },
      {
        title: 'Cara Khusus: Menautkan Relawan ke Google Form',
        detail: 'Jika yayasan Anda sedang tidak ingin menggunakan form website untuk pendaftaran EduXplore, dan lebih memilih menggunakan Google Forms/Typeform:\n\n1. Buka tab "Program Relawan".\n2. Edit program EduXplore yang diinginkan.\n3. Di dalam formulir, cari kotak bernama "Link Eksternal".\n4. Tempelkan (Paste) link Google Form Anda ke situ.\n5. Selesai! Kini setiap tombol "Daftar Sekarang" di website akan melempar pengguna ke link Google Form tersebut.',
        tip: 'Di tab Program Relawan yang sama, jika Anda menyalakan tombol (toggle) "Jadikan Hero Banner" menjadi warna hijau, poster relawan tersebut akan memaksa masuk ke urutan paling depan di banner raksasa halaman beranda secara otomatis.'
      }
    ],
  }
];

/* ── Main Component ── */

export default function AdminGuide() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSectionId, setActiveSectionId] = useState<string>(GUIDE_SECTIONS[0].id);

  const isSearching = searchQuery.trim().length > 0;
  
  const searchResults = useMemo(() => {
    if (!isSearching) return [];
    const q = searchQuery.toLowerCase();
    
    return GUIDE_SECTIONS.map(section => {
      const matchSection = section.title.toLowerCase().includes(q) || section.description.toLowerCase().includes(q);
      
      const matchingSteps = section.steps.filter(step => 
        step.title.toLowerCase().includes(q) || 
        step.detail.toLowerCase().includes(q) ||
        (step.tip && step.tip.toLowerCase().includes(q)) ||
        (step.info && step.info.toLowerCase().includes(q)) ||
        (step.warning && step.warning.toLowerCase().includes(q))
      );
      
      if (matchSection || matchingSteps.length > 0) {
        return { section, steps: matchingSteps };
      }
      return null;
    }).filter(Boolean) as { section: GuideSection, steps: GuideStep[] }[];
  }, [searchQuery, isSearching]);

  const activeSection = useMemo(() => 
    GUIDE_SECTIONS.find(s => s.id === activeSectionId) || GUIDE_SECTIONS[0],
  [activeSectionId]);

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] -m-6 bg-slate-50/50">
      
      {/* Top Header Bar */}
      <div className="bg-white border-b border-slate-200 px-6 sm:px-10 py-5 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
            <BookOpen size={20} className="text-emerald-600" />
            Pusat Bantuan & Tutorial
          </h1>
          <p className="text-sm text-slate-500 mt-1">Panduan rinci cara mengoperasikan seluruh halaman admin panel.</p>
        </div>
        
        <div className="relative w-full sm:w-80 shrink-0 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={16} />
          <input
            type="text"
            placeholder="Ketik kata kunci pencarian..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-100/50 border border-transparent rounded-full text-sm focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all placeholder:text-slate-400"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              &times;
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        
        {/* Left Sidebar */}
        {!isSearching && (
          <div className="w-64 shrink-0 bg-white border-r border-slate-200 overflow-y-auto hidden md:block">
            <div className="p-4 space-y-1">
              <p className="px-3 text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 mt-2">Daftar Halaman</p>
              {GUIDE_SECTIONS.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSectionId(section.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all",
                    activeSectionId === section.id
                      ? "bg-emerald-50 text-emerald-700 font-semibold"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <section.icon size={16} className={activeSectionId === section.id ? "text-emerald-600" : "text-slate-400"} />
                  <span className="text-sm truncate">{section.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Right Content Area */}
        <div className="flex-1 overflow-y-auto bg-slate-50/50">
          <div className="max-w-4xl mx-auto p-6 sm:p-10">
            
            {isSearching ? (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-4">
                  Hasil Pencarian untuk "{searchQuery}"
                </h2>
                {searchResults.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-3xl border border-slate-200">
                    <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 text-sm font-medium">Tidak ada panduan ditemukan.</p>
                  </div>
                ) : (
                  searchResults.map((res, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
                      <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center gap-3">
                        <res.section.icon size={18} className="text-slate-500" />
                        <h3 className="font-bold text-slate-900">{res.section.title}</h3>
                      </div>
                      <div className="p-6 space-y-8">
                        {(res.steps.length > 0 ? res.steps : res.section.steps).map((step, idx) => (
                          <GuideStepItem key={idx} step={step} index={idx} />
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="bg-white rounded-3xl md:border md:border-slate-200 md:shadow-sm overflow-hidden mb-8">
                {/* Header Reader */}
                <div className="px-6 py-8 sm:p-10 border-b border-slate-100 bg-gradient-to-br from-white to-slate-50/50">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
                    <div>
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
                          <activeSection.icon size={24} />
                        </div>
                        <div>
                          <h2 className="text-2xl font-black text-slate-900 tracking-tight">{activeSection.title}</h2>
                          <p className="text-sm text-emerald-600 font-semibold mt-0.5 tracking-wide uppercase">Tutorial Penggunaan Detail</p>
                        </div>
                      </div>
                      <p className="text-slate-600 leading-relaxed text-[15px] max-w-2xl font-medium">
                        {activeSection.description}
                      </p>
                    </div>
                    <Link
                      to={activeSection.path}
                      className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-500 transition-all shadow-md shadow-emerald-600/20"
                    >
                      Buka Halaman Ini <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
                
                {/* Steps Reader */}
                <div className="p-6 sm:p-10 space-y-12">
                  {activeSection.steps.map((step, idx) => (
                    <GuideStepItem key={idx} step={step} index={idx} />
                  ))}
                </div>

              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}

function GuideStepItem({ step, index }: { step: GuideStep, index: number }) {
  return (
    <div className="flex gap-4 sm:gap-6 group">
      <div className="shrink-0 mt-0.5">
        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-sm border-2 border-white ring-1 ring-slate-200 group-hover:bg-emerald-500 group-hover:text-white group-hover:ring-emerald-200 transition-all duration-300 shadow-sm">
          {index + 1}
        </div>
      </div>
      
      <div className="flex-1 min-w-0">
        <h4 className="text-lg font-bold text-slate-900 mb-2">{step.title}</h4>
        <div className="text-slate-600 leading-relaxed text-[15px] whitespace-pre-wrap">
          {step.detail}
        </div>

        {/* --- THE VISUAL / UI MOCKUP --- */}
        {step.visual && (
          <div className="mt-5 mb-2 bg-slate-50/80 rounded-2xl p-6 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-x-auto">
            {step.visual}
          </div>
        )}

        {/* Actionable Alerts */}
        <div className="mt-4 space-y-3">
          {step.info && (
            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100 shadow-sm">
              <Info size={18} className="text-blue-600 shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900 leading-relaxed font-medium">
                {step.info}
              </div>
            </div>
          )}

          {step.tip && (
            <div className="flex items-start gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-100 shadow-sm">
              <Lightbulb size={18} className="text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-sm text-emerald-900 leading-relaxed font-medium">
                <span className="font-bold uppercase tracking-wider text-[10px] block text-emerald-700 mb-0.5">Tips Ekstra</span>
                {step.tip}
              </div>
            </div>
          )}

          {step.warning && (
            <div className="flex items-start gap-3 p-4 bg-rose-50 rounded-xl border border-rose-100 shadow-sm">
              <AlertTriangle size={18} className="text-rose-600 shrink-0 mt-0.5" />
              <div className="text-sm text-rose-900 leading-relaxed font-medium">
                <span className="font-bold uppercase tracking-wider text-[10px] block text-rose-700 mb-0.5">Perhatian Penting</span>
                {step.warning}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
