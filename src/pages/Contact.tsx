import { Mail, Phone, MapPin, Send, MessageCircle } from 'lucide-react';

/**
 * Komponen Halaman Kontak (Contact).
 * Menyediakan direktori informasi saluran komunikasi resmi lembaga dan sarana 
 * formulir pesan langsung bagi publik dan calon mitra.
 */
export default function Contact() {
  return (
    <div className="bg-white">
      {/* Bagian Pahlawan (Hero Section) Pengenalan Halaman */}
      <section className="py-24 bg-emerald-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h1 className="text-4xl md:text-6xl font-black text-gray-900">Hubungi Kami</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Punya pertanyaan atau ingin berkolaborasi? Kami siap mendengarkan dan membantu Anda.
          </p>
        </div>
      </section>

      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16">
            {/* Navigasi Informasi Kontak Langsung (Contact Info) */}
            <div className="space-y-12">
              <div className="space-y-6">
                <h2 className="text-3xl font-black text-gray-900">Mari Berdiskusi</h2>
                <p className="text-gray-600 text-lg leading-relaxed">
                  Tim kami siap membantu Anda memberikan informasi lebih lanjut mengenai program, donasi, atau kemitraan.
                </p>
              </div>

              <div className="grid gap-8">
                {[
                  { label: 'Email', value: 'halo@tanahair.org', icon: Mail, color: 'bg-blue-500' },
                  { label: 'WhatsApp', value: '+62 812 3456 7890', icon: MessageCircle, color: 'bg-emerald-500' },
                  { label: 'Telepon', value: '(021) 1234 5678', icon: Phone, color: 'bg-orange-500' },
                  { label: 'Alamat', value: 'Jl. Kemanusiaan No. 123, Jakarta Selatan', icon: MapPin, color: 'bg-rose-500' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start space-x-6 group">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg ${item.color}`}>
                      <item.icon size={24} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{item.label}</p>
                      <p className="text-xl font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Antarmuka Formulir Pengiriman Pesan (Contact Form) */}
            <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-2xl shadow-emerald-100/30">
              <form className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Nama Lengkap</label>
                    <input
                      type="text"
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                      placeholder="Nama Anda"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Email</label>
                    <input
                      type="email"
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                      placeholder="email@anda.com"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Subjek</label>
                  <input
                    type="text"
                    className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    placeholder="Apa yang ingin Anda tanyakan?"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pesan</label>
                  <textarea
                    rows={5}
                    className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    placeholder="Tulis pesan Anda di sini..."
                  />
                </div>
                <button className="w-full bg-emerald-600 text-white py-5 rounded-2xl text-lg font-bold hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 flex items-center justify-center space-x-2">
                  <Send size={20} />
                  <span>Kirim Pesan</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
