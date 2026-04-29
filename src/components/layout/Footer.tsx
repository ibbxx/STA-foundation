import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Instagram, Facebook, Twitter } from 'lucide-react';
import Logo from '../shared/Logo';

/**
 * Komponen Catatan Kaki (Footer) yang berisi tautan navigasi tambahan,
 * informasi kontak, dan tautan sosial media.
 */
export default function Footer() {
  return (
    <footer className="bg-gray-900 pb-8 pt-16 text-gray-300 sm:pb-10 sm:pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 grid grid-cols-1 gap-12 md:grid-cols-3 lg:gap-24 lg:mb-16">
          {/* Kolom Informasi Merek & Sosial Media */}
          <div className="flex flex-col items-center text-center md:items-start md:text-left space-y-6">
            <Link to="/">
              <Logo variant="light" size={40} showText={false} withCircle={true} opticalShift={0} />
            </Link>
            <p className="text-sm leading-relaxed max-w-xs">
              Platform kolaboratif penggalangan dana dan aksi nyata untuk membangkitkan fasilitas pendidikan Indonesia yang berakar pada kearifan lokal.
            </p>
            <div className="flex space-x-4">
              <a href="https://www.instagram.com/sekolah.tanahair" target="_blank" rel="noreferrer" className="hover:text-white transition-colors"><Instagram size={20} /></a>
              <a href="https://wa.me/6287882799026" target="_blank" rel="noreferrer" className="hover:text-white transition-colors"><Phone size={20} /></a>
            </div>
          </div>

          {/* Kolom Tautan Cepat - Digeser ke kanan dengan md:pl-20 */}
          <div className="md:pl-20">
            <h3 className="text-white font-bold mb-6">Tautan Cepat</h3>
            <ul className="space-y-4 text-sm">
              <li><Link to="/tentang-kami" className="hover:text-white transition-colors">Tentang Kami</Link></li>
              <li><Link to="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
              <li><Link to="/kontak" className="hover:text-white transition-colors">Kontak</Link></li>
            </ul>
          </div>

          {/* Kolom Informasi Kontak */}
          <div>
            <h3 className="text-white font-bold mb-6">Hubungi Kami</h3>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start space-x-3">
                <MapPin size={18} className="text-white shrink-0 mt-0.5" />
                <a href="https://maps.app.goo.gl/2TCDEiREJtVFZCv4A" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
                  Jalan Rusa 1, Pondok Ranji, Ciputat Timur, Tangerang Selatan 15412
                </a>
              </li>
              <li className="flex items-center space-x-3">
                <Phone size={18} className="text-white shrink-0" />
                <a href="https://wa.me/6287882799026" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
                  0878-8279-9026
                </a>
              </li>
              <li className="flex items-center space-x-3">
                <Mail size={18} className="text-white shrink-0" />
                <a href="mailto:admin@sekolahtanahair.com" className="hover:text-white transition-colors">
                  admin@sekolahtanahair.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bagian Bawah Footer (Copyright & Kebijakan) */}
        <div className="flex flex-col items-start justify-between gap-4 border-t border-gray-800 pt-8 text-xs md:flex-row md:items-center">
          <p>© 2026 Sekolah Tanah Air. Seluruh Hak Cipta Dilindungi.</p>
          <div className="flex flex-wrap gap-4 sm:gap-6">
            <a href="#" className="hover:text-white transition-colors">Kebijakan Privasi</a>
            <a href="#" className="hover:text-white transition-colors">Syarat & Ketentuan</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
