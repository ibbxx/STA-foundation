import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { cn } from '../lib/utils';
import Logo from './Logo';

/**
 * Komponen Navbar untuk navigasi utama situs.
 * Mendukung tata letak responsif untuk perangkat desktop dan seluler.
 */
export default function Navbar() {
  // State untuk mengontrol visibilitas menu seluler (hamburger menu)
  const [isOpen, setIsOpen] = React.useState(false);

  // Mengambil informasi rute saat ini untuk penandaan menu aktif
  const location = useLocation();

  // Daftar tautan navigasi utama
  const navLinks = [
    { name: 'Beranda', path: '/' },
    { name: 'Campaign', path: '/campaigns' },
    { name: 'Tentang Kami', path: '/tentang-kami' },
    { name: 'Laporan', path: '/laporan' },
    { name: 'Kontak', path: '/kontak' },
  ];

  // Fungsi utilitas untuk memeriksa apakah sebuah rute sedang aktif
  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <Logo size={48} />
            </Link>
          </div>

          {/* Navigasi Desktop */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-emerald-600",
                  isActive(link.path) ? "text-emerald-600" : "text-gray-600"
                )}
              >
                {link.name}
              </Link>
            ))}
            <Link
              to="/campaigns"
              className="bg-emerald-600 text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
            >
              Donasi Sekarang
            </Link>
          </div>

          {/* Tombol Menu Seluler */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-600 hover:text-gray-900 focus:outline-none"
              aria-label="Toggle navigasi menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Tampilan Menu Seluler */}
      {isOpen && (
        <div className="md:hidden bg-white border-b border-gray-100 animate-in slide-in-from-top duration-300">
          <div className="px-4 pt-2 pb-6 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "block px-3 py-3 rounded-lg text-base font-medium",
                  isActive(link.path)
                    ? "bg-emerald-50 text-emerald-600"
                    : "text-gray-600 hover:bg-gray-50"
                )}
              >
                {link.name}
              </Link>
            ))}
            <div className="pt-4">
              <Link
                to="/campaigns"
                onClick={() => setIsOpen(false)}
                className="block w-full text-center bg-emerald-600 text-white px-6 py-3 rounded-full text-base font-semibold hover:bg-emerald-700 transition-all"
              >
                Donasi Sekarang
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
