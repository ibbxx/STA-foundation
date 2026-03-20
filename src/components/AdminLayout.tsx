import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users,
  Banknote, Settings, LogOut,
  Bell, Search, Menu, X,
  FileText, Image as ImageIcon
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '../lib/utils';
import Logo from './Logo';

/**
 * Komponen tata letak (layout) khusus untuk halaman panel admin.
 * Memuat bilah sisi (sidebar) navigasi dan tajuk (header) bagian atas,
 * beserta area konten dinamis di tengah.
 */
export default function AdminLayout() {
  // State untuk mengontrol visibilitas teks dan lebar sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Default tertutup di mobile

  // Deteksi lokasi rute saat ini untuk menandai menu aktif
  const location = useLocation();

  // Daftar menu yang tersedia di bilah sisi panel admin
  const menuItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Campaigns', path: '/admin/campaigns', icon: FileText },
    { name: 'Donatur', path: '/admin/donors', icon: Users },
    { name: 'Transaksi', path: '/admin/transactions', icon: Banknote },
    { name: 'Konten Web', path: '/admin/content', icon: FileText },
    { name: 'Pengaturan', path: '/admin/settings', icon: Settings },
  ];

  // Fungsi pengecekan rute aktif
  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50 flex overflow-hidden">
      {/* Mobile Overlay Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Bilah Sisi (Sidebar) Navigasi */}
      <aside className={cn(
        "bg-white border-r border-gray-100 transition-all duration-300 fixed lg:static inset-y-0 left-0 z-50 h-[100dvh] flex flex-col",
        isSidebarOpen
          ? "translate-x-0 w-64"
          : "-translate-x-full lg:translate-x-0 lg:w-20"
      )}>
        {/* Logo Aplikasi */}
        <div className="h-20 flex items-center px-6 border-b border-gray-50 shrink-0">
          <Link to="/" className="flex items-center">
            <Logo size={isSidebarOpen ? 32 : 40} showText={isSidebarOpen} />
          </Link>
        </div>

        {/* Navigasi Utama Sidebar */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2 hide-scrollbar">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => { if (window.innerWidth < 1024) setIsSidebarOpen(false) }}
              className={cn(
                "flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all group",
                isActive(item.path)
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200"
                  : "text-gray-500 hover:bg-gray-50 hover:text-emerald-600"
              )}
            >
              <item.icon size={20} className={cn(
                "shrink-0",
                isActive(item.path) ? "text-white" : "group-hover:text-emerald-600"
              )} />
              {/* Teks hanya muncul jika sidebar terbuka ATAU jika tertutup di layar kecil (krn kalau tertutup di HP dia sembunyi penuh) */}
              <span className={cn(
                "text-sm font-bold whitespace-nowrap",
                !isSidebarOpen ? "lg:opacity-0 lg:w-0 lg:overflow-hidden" : "opacity-100"
              )}>
                {item.name}
              </span>
            </Link>
          ))}
        </nav>

        {/* Bagian Profil Pengguna / Tombol Keluar */}
        <div className="p-4 border-t border-gray-50 shrink-0">
          <button className={cn(
            "w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-rose-600 hover:bg-rose-50 transition-all font-bold text-sm",
            !isSidebarOpen && "lg:justify-center"
          )}>
            <LogOut size={20} className="shrink-0" />
            <span className={cn(
              "whitespace-nowrap",
              !isSidebarOpen ? "lg:opacity-0 lg:w-0 lg:overflow-hidden" : "opacity-100"
            )}>
              Keluar
            </span>
          </button>
        </div>
      </aside>

      {/* Area Konten Utama */}
      <div className="flex-1 flex flex-col min-w-0 h-[100dvh] overflow-y-auto">
        {/* Tajuk Atas (Top Header) */}
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-4 sm:px-8 sticky top-0 z-30 shrink-0">
          <div className="flex items-center space-x-4">
            {/* Tombol Toggle Sidebar */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-all"
              aria-label="Toggle navigasi panel admin"
            >
              {isSidebarOpen ? <X size={20} className="lg:hidden" /> : <Menu size={20} />}
              {isSidebarOpen && <Menu size={20} className="hidden lg:block" />}
            </button>
            {/* Kolom Pencarian Global */}
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Cari data..."
                className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 w-48 lg:w-64"
              />
            </div>
          </div>

          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Ikon Notifikasi */}
            <button className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
            </button>
            <div className="hidden sm:block h-8 w-px bg-gray-100 mx-2" />

            {/* Informasi Profil Admin */}
            <div className="flex items-center space-x-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-gray-900">Ibnu Fajar</p>
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Super Admin</p>
              </div>
              <img
                src="https://i.pravatar.cc/100?img=12"
                alt="Gambar Profil Admin"
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl border border-gray-200 object-cover"
              />
            </div>
          </div>
        </header>

        {/* Konten Halaman sesuai Rute (Outlet) */}
        <main className="p-4 sm:p-8 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
