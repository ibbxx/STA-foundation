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
      <section className="bg-emerald-50/50 pt-24 pb-16 sm:pt-32 sm:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h1 className="text-3xl font-black text-gray-900 sm:text-4xl md:text-6xl">Hubungi Kami</h1>
          <p className="mx-auto max-w-3xl text-base leading-relaxed text-gray-600 sm:text-xl">
            Punya pertanyaan atau ingin berkolaborasi? Kami siap mendengarkan dan membantu Anda.
          </p>
        </div>
      </section>

      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
            {/* Navigasi Informasi Kontak Langsung (Contact Info) */}
            <div className="space-y-8 sm:space-y-12">
              <div className="space-y-6">
                <h2 className="text-2xl font-black text-gray-900 sm:text-3xl">Mari Berdiskusi</h2>
                <p className="text-base leading-relaxed text-gray-600 sm:text-lg">
                  Tim kami siap membantu Anda memberikan informasi lebih lanjut mengenai program, donasi, atau kemitraan.
                </p>
              </div>

              <div className="grid gap-4 sm:gap-6">
                {[
                  { label: 'Email', value: 'halo@tanahair.org', icon: Mail, color: 'bg-blue-500' },
                  { label: 'WhatsApp', value: '+62 812 3456 7890', icon: MessageCircle, color: 'bg-emerald-500' },
                  { label: 'Telepon', value: '(021) 1234 5678', icon: Phone, color: 'bg-orange-500' },
                  { label: 'Alamat', value: 'Jl. Kemanusiaan No. 123, Jakarta Selatan', icon: MapPin, color: 'bg-rose-500' },
                ].map((item, i) => (
                  <div key={i} className="group flex items-start space-x-4 rounded-[1.5rem] border border-gray-100 bg-gray-50/70 p-4 sm:space-x-6 sm:p-5">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg sm:h-14 sm:w-14 ${item.color}`}>
                      <item.icon size={24} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{item.label}</p>
                      <p className="break-words text-base font-bold text-gray-900 transition-colors group-hover:text-emerald-600 sm:text-xl">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Antarmuka Formulir Pengiriman Pesan (Contact Form) */}
            <div className="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-xl shadow-emerald-100/30 sm:rounded-[3rem] sm:p-10 sm:shadow-2xl">
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
                <button className="flex w-full items-center justify-center space-x-2 rounded-2xl bg-emerald-600 py-4 text-base font-bold text-white shadow-lg shadow-emerald-200 transition-all hover:bg-emerald-700 sm:py-5 sm:text-lg sm:shadow-xl">
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
