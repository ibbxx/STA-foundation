import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Instagram, Facebook, Twitter } from 'lucide-react';
import Logo from '../shared/Logo';

/**
 * Komponen Catatan Kaki (Footer) yang berisi tautan navigasi tambahan,
 * informasi kontak, dan tautan sosial media.
 */
export default function Footer() {
  return (
    <footer className="bg-gray-950 py-10 text-gray-400 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4 lg:gap-16 mb-10">
          {/* Kolom Branding */}
          <div className="col-span-1 md:col-span-2 space-y-5">
            <Link to="/" className="inline-block">
              <Logo variant="light" size={32} showText={false} withCircle={true} opticalShift={0} />
            </Link>
            <p className="text-[13px] leading-relaxed max-w-sm text-gray-500 font-light">
              Platform kolaboratif penggalangan dana dan aksi nyata untuk membangkitkan fasilitas pendidikan Indonesia yang berakar pada kearifan lokal.
            </p>
            <div className="flex items-center gap-4">
              <a href="https://www.instagram.com/sekolah.tanahair" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all duration-300">
                <Instagram size={16} />
              </a>
              <a href="https://wa.me/6287882799026" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all duration-300">
                <Phone size={16} />
              </a>
            </div>
          </div>

          {/* Kolom Tautan */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-[0.2em] mb-5">Navigasi</h4>
            <ul className="space-y-3 text-[13px]">
              <li><Link to="/tentang-kami" className="hover:text-emerald-400 transition-colors">Tentang Kami</Link></li>
              <li><Link to="/events" className="hover:text-emerald-400 transition-colors">Event & Aksi</Link></li>
              <li><Link to="/kontak" className="hover:text-emerald-400 transition-colors">Kontak</Link></li>
            </ul>
          </div>

          {/* Kolom Kontak */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-[0.2em] mb-5">Kontak</h4>
            <ul className="space-y-3 text-[13px]">
              <li className="flex items-start gap-3">
                <Mail size={14} className="mt-0.5 text-emerald-500" />
                <a href="mailto:admin@sekolahtanahair.com" className="hover:text-white transition-colors truncate">admin@sekolahtanahair.com</a>
              </li>
              <li className="flex items-start gap-3">
                <Phone size={14} className="mt-0.5 text-emerald-500" />
                <span>0878-8279-9026</span>
              </li>
              <li className="flex items-start gap-3 text-gray-500 italic">
                <MapPin size={14} className="mt-0.5 text-emerald-500 shrink-0" />
                <span>Tangsel, Indonesia</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-8 border-t border-white/5 text-[11px] font-medium tracking-wide text-gray-600">
          <p>© 2026 SEKOLAH TANAH AIR. ALL RIGHTS RESERVED.</p>
          <div className="flex items-center gap-8 uppercase">
            <a href="#" className="hover:text-gray-400 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-gray-400 transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
