import { FileText, Download, CheckCircle2, BarChart3 } from 'lucide-react';
import { formatCurrency } from '../lib/utils';

// Data sampel daftar laporan publik dan dokumen audit yang tersedia untuk diunduh
const REPORTS = [
  { title: 'Laporan Tahunan 2025', date: 'Januari 2026', size: '4.2 MB', type: 'PDF' },
  { title: 'Laporan Dampak Kuartal IV 2025', date: 'Desember 2025', size: '2.8 MB', type: 'PDF' },
  { title: 'Laporan Keuangan Audit 2024', date: 'Maret 2025', size: '5.1 MB', type: 'PDF' },
];

/**
 * Komponen Halaman Laporan (Reports).
 * Menampilkan rincian metrik dampak secara visual dan memfasilitasi akses pengunduhan 
 * dokumen laporan pertanggungjawaban publik serta finansial lembaga.
 */
export default function Reports() {
  return (
    <div className="bg-white">
      {/* Bagian Pahlawan (Hero Section) Pengenalan Halaman */}
      <section className="py-24 bg-emerald-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h1 className="text-4xl md:text-6xl font-black text-gray-900">Laporan Transparansi</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Kepercayaan Anda adalah amanah bagi kami. Lihat bagaimana setiap donasi Anda memberikan dampak nyata bagi masyarakat.
          </p>
        </div>
      </section>

      {/* Rangkuman Metrik Utama (Stats Summary) */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { label: 'Dana Tersalurkan', value: '94%', icon: CheckCircle2, desc: 'Dari total donasi masuk langsung ke program.' },
              { label: 'Audit Independen', value: 'WTP', icon: BarChart3, desc: 'Opini Wajar Tanpa Pengecualian selama 3 tahun.' },
              { label: 'Penerima Manfaat', value: '85k+', icon: Download, desc: 'Jiwa yang telah terbantu melalui program kami.' },
            ].map((stat, i) => (
              <div key={i} className="bg-gray-50 p-10 rounded-[2.5rem] border border-gray-100 space-y-4">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
                  <stat.icon size={24} />
                </div>
                <h3 className="text-4xl font-black text-gray-900">{stat.value}</h3>
                <p className="text-lg font-bold text-emerald-600">{stat.label}</p>
                <p className="text-sm text-gray-500 leading-relaxed">{stat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Daftar Dokumen Laporan yang Dapat Diunduh (Downloadable Reports) */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-black text-gray-900">Unduh Laporan Resmi</h2>
              <p className="text-gray-600">Dapatkan detail lengkap penggunaan dana dan laporan dampak program kami.</p>
            </div>

            <div className="space-y-4">
              {REPORTS.map((report, i) => (
                <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 flex items-center justify-between hover:shadow-xl hover:shadow-emerald-100/30 transition-all group">
                  <div className="flex items-center space-x-6">
                    <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all">
                      <FileText size={28} />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-lg">{report.title}</h4>
                      <p className="text-sm text-gray-400 font-medium">Diterbitkan: {report.date} • {report.size}</p>
                    </div>
                  </div>
                  <button className="p-4 bg-gray-50 text-gray-400 rounded-2xl hover:bg-emerald-50 hover:text-emerald-600 transition-all">
                    <Download size={24} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
