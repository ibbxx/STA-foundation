import { motion } from 'framer-motion';
import { Heart, Target, Users, ShieldCheck } from 'lucide-react';

/**
 * Komponen Halaman Tentang Kami (About).
 * Menjelaskan visi, misi, nilai-nilai inti, dan profil susunan tim dari organisasi Sekolah Tanah Air.
 */
export default function About() {
  return (
    <div className="bg-white">
      {/* Bagian Pahlawan (Hero Section) */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-gray-900">
        <div className="absolute inset-0 w-full h-full">
          <img 
            src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=2000&auto=format&fit=crop" 
            alt="Kebahagiaan Anak-Anak Indonesia"
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 text-center space-y-6">
          <p className="text-xs sm:text-sm font-bold text-[#F5F1E8] tracking-[0.2em] uppercase">Kisah Kami</p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-light text-white tracking-tight">Tentang Sekolah Tanah Air</h1>
          <p className="text-lg md:text-xl text-[#F5F1E8]/90 font-light max-w-2xl mx-auto leading-relaxed">
            Kami adalah jembatan kebaikan yang menghubungkan niat tulus donatur dengan mereka yang membutuhkan di seluruh pelosok Nusantara.
          </p>
        </div>
      </section>

      {/* Bagian Penjelasan Visi & Misi Organisasi */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h2 className="text-emerald-600 font-bold uppercase tracking-widest text-sm">Visi Kami</h2>
                <h3 className="text-3xl font-black text-gray-900">Menjadi platform filantropi paling terpercaya dan berdampak di Indonesia.</h3>
                <p className="text-gray-600 leading-relaxed">
                  Kami percaya bahwa setiap orang memiliki kapasitas untuk membantu. Dengan teknologi, kami mempermudah proses tersebut dan memastikan setiap bantuan sampai ke tangan yang tepat.
                </p>
              </div>
              <div className="space-y-4">
                <h2 className="text-emerald-600 font-bold uppercase tracking-widest text-sm">Misi Kami</h2>
                <ul className="space-y-4">
                  {[
                    'Menyediakan platform donasi yang aman, transparan, dan akuntabel.',
                    'Memberdayakan komunitas lokal melalui program-program berkelanjutan.',
                    'Meningkatkan kesadaran sosial masyarakat melalui edukasi dan kolaborasi.',
                    'Memastikan setiap program memiliki dampak nyata yang terukur.'
                  ].map((misi, i) => (
                    <li key={i} className="flex items-start space-x-3">
                      <div className="mt-1 bg-emerald-100 text-emerald-600 p-1 rounded-full">
                        <Target size={14} />
                      </div>
                      <span className="text-gray-600 font-medium">{misi}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?auto=format&fit=crop&q=80&w=1200"
                alt="Team"
                className="rounded-[3rem] shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Bagian Profil Tim Inti (Team Section) */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
            <h2 className="text-emerald-600 font-bold uppercase tracking-widest text-sm">Tim Kami</h2>
            <h3 className="text-4xl font-black text-gray-900">Dibalik Layar Sekolah Tanah Air</h3>
            <p className="text-gray-600 text-lg">Sekumpulan individu yang berdedikasi untuk menciptakan perubahan positif bagi Indonesia.</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { name: 'Ibnu Fajar', role: 'Founder & CEO', img: '12' },
              { name: 'Siti Aminah', role: 'Program Manager', img: '32' },
              { name: 'Budi Santoso', role: 'Tech Lead', img: '44' },
              { name: 'Andi Wijaya', role: 'Community Lead', img: '52' },
            ].map((member, i) => (
              <div key={i} className="text-center space-y-4 group">
                <div className="relative aspect-square rounded-[2.5rem] overflow-hidden shadow-lg group-hover:shadow-emerald-200 transition-all duration-500">
                  <img
                    src={`https://i.pravatar.cc/400?img=${member.img}`}
                    alt={member.name}
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                  />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-gray-900">{member.name}</h4>
                  <p className="text-sm text-emerald-600 font-bold uppercase tracking-widest">{member.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
