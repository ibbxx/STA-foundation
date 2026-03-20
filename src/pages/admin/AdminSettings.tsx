import { Save, ShieldAlert, Globe, Bell, ServerCrash, CreditCard } from 'lucide-react';

/**
 * Komponen Prototipe UI Admin - Pengaturan Portal
 * Simulasi laman formulir statis untuk mengonfigurasi variabel global situs.
 */
export default function AdminSettings() {
    return (
        <div className="space-y-8">
            {/* Header Aksi */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Pengaturan Portal</h1>
                    <p className="text-gray-500 text-sm font-medium">Kelola konfigurasi hierarki sistem dan batas limit global.</p>
                </div>
                <button className="bg-emerald-600 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 flex items-center">
                    <Save size={18} className="mr-2" />
                    Simpan Perubahan
                </button>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">

                {/* Kolom Informasi Lanjut & Konfirmasi */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-rose-50 blur-3xl rounded-full" />
                        <ShieldAlert size={28} className="text-rose-500 mb-4" />
                        <h3 className="text-base font-black text-gray-900 mb-2">Perhatian</h3>
                        <p className="text-xs text-gray-500 leading-relaxed font-medium">Perubahan yang diajukan pada panel ini berdampak langsung kepada fungsionalitas publik aplikasi. Pastikan semua variabel sinkron sebelum menyimpan.</p>
                    </div>
                </div>

                {/* Formulir Master - Simulasi */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Section: General Info */}
                    <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-6">
                        <div className="flex items-center justify-between border-b border-gray-50 pb-4">
                            <div className="flex items-center space-x-3 text-gray-900 font-black">
                                <Globe size={20} className="text-gray-400" />
                                <h2>Informasi Dasar Platform</h2>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Nama Organisasi</label>
                                    <input type="text" defaultValue="Sekolah Tanah Air" className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-gray-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Email Utama (Kontak)</label>
                                    <input type="email" defaultValue="halo@tanahair.org" className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-gray-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Deskripsi Singkat (SEO Meta)</label>
                                <textarea rows={3} defaultValue="Platform crowdfunding fokus filantropi pendidikan dan sosial." className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-medium text-gray-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm" />
                            </div>
                        </div>
                    </div>

                    {/* Section: Feature Toggles */}
                    <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-6">
                        <div className="flex items-center justify-between border-b border-gray-50 pb-4">
                            <div className="flex items-center space-x-3 text-gray-900 font-black">
                                <ServerCrash size={20} className="text-gray-400" />
                                <h2>Kontrol Fitur Sistem</h2>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-emerald-200 transition-colors">
                                <div>
                                    <h4 className="text-sm font-bold text-gray-900">Mode Sistem Perbaikan (Maintenance Mode)</h4>
                                    <p className="text-xs text-gray-500 font-medium">Bila diaktifkan, situs donasi dialihkan menjadi "Segera Kembali".</p>
                                </div>
                                {/* Mock Toggle Switch (Off) */}
                                <button className="w-12 h-6 bg-gray-200 rounded-full relative transition-colors select-none">
                                    <div className="w-4 h-4 bg-white rounded-full absolute top-1 left-1 shadow-sm transition-transform" />
                                </button>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 transition-colors">
                                <div>
                                    <h4 className="text-sm font-bold text-emerald-900">Pembayaran Anonimus Diizinkan</h4>
                                    <p className="text-xs text-emerald-600/70 font-medium">Menginisialisasi opsi centang untuk Hamba Allah saat checkout.</p>
                                </div>
                                {/* Mock Toggle Switch (On) */}
                                <button className="w-12 h-6 bg-emerald-500 rounded-full relative transition-colors select-none shadow-inner shadow-emerald-700/20">
                                    <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1 shadow-sm transition-transform" />
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
