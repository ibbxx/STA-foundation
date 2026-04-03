import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Instagram, Facebook, Twitter } from 'lucide-react';
import Logo from './Logo';

/**
 * Komponen Catatan Kaki (Footer) yang berisi tautan navigasi tambahan,
 * informasi kontak, dan tautan sosial media.
 */
export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Kolom Informasi Merek & Sosial Media */}
          <div className="space-y-6">
            <Link to="/">
              <Logo variant="light" size={48} />
            </Link>
            <p className="text-sm leading-relaxed">
              Platform penggalangan dana modern yang berfokus pada transparansi dan dampak nyata bagi masyarakat Indonesia. Bersama kita bangun masa depan yang lebih baik.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-emerald-500 transition-colors"><Instagram size={20} /></a>
              <a href="#" className="hover:text-emerald-500 transition-colors"><Facebook size={20} /></a>
              <a href="#" className="hover:text-emerald-500 transition-colors"><Twitter size={20} /></a>
            </div>
          </div>

          {/* Kolom Tautan Cepat */}
          <div>
            <h3 className="text-white font-bold mb-6">Tautan Cepat</h3>
            <ul className="space-y-4 text-sm">
              <li><Link to="/campaigns" className="hover:text-emerald-500 transition-colors">Semua Campaign</Link></li>
              <li><Link to="/tentang-kami" className="hover:text-emerald-500 transition-colors">Tentang Kami</Link></li>
              <li><Link to="/faq" className="hover:text-emerald-500 transition-colors">FAQ</Link></li>
              <li><Link to="/kontak" className="hover:text-emerald-500 transition-colors">Kontak</Link></li>
            </ul>
          </div>

          {/* Kolom Kategori Donasi */}
          <div>
            <h3 className="text-white font-bold mb-6">Kategori</h3>
            <ul className="space-y-4 text-sm">
              <li><Link to="/campaigns?cat=pendidikan" className="hover:text-emerald-500 transition-colors">Pendidikan</Link></li>
              <li><Link to="/campaigns?cat=kesehatan" className="hover:text-emerald-500 transition-colors">Kesehatan</Link></li>
              <li><Link to="/campaigns?cat=lingkungan" className="hover:text-emerald-500 transition-colors">Lingkungan</Link></li>
              <li><Link to="/campaigns?cat=bencana" className="hover:text-emerald-500 transition-colors">Bencana Alam</Link></li>
            </ul>
          </div>

          {/* Kolom Informasi Kontak */}
          <div>
            <h3 className="text-white font-bold mb-6">Hubungi Kami</h3>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start space-x-3">
                <MapPin size={18} className="text-emerald-500 shrink-0" />
                <span>Jl. Kemanusiaan No. 123, Jakarta Selatan, Indonesia</span>
              </li>
              <li className="flex items-center space-x-3">
                <Phone size={18} className="text-emerald-500 shrink-0" />
                <span>+62 812 3456 7890</span>
              </li>
              <li className="flex items-center space-x-3">
                <Mail size={18} className="text-emerald-500 shrink-0" />
                <span>halo@tanahair.org</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bagian Bawah Footer (Copyright & Kebijakan) */}
        <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 text-xs">
          <p>© 2026 Sekolah Tanah Air. Seluruh Hak Cipta Dilindungi.</p>
          <div className="flex space-x-6">
            <a href="#" className="hover:text-white transition-colors">Kebijakan Privasi</a>
            <a href="#" className="hover:text-white transition-colors">Syarat & Ketentuan</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
