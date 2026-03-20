import { Plus, Search, Filter, Edit2, Trash2, X, UploadCloud, Calendar, DollarSign, Image as ImageIcon, CheckCircle, Info } from 'lucide-react';
import { formatCurrency, cn } from '../../lib/utils';
import { useState } from 'react';

// Data Mock Kampanye
const INITIAL_CAMPAIGNS = [
    { id: 'CMP-001', title: 'Beasiswa Anak Pesisir Lombok', target: 50000000, current: 35000000, status: 'active', deadline: '2026-12-31', backers: 145, imgUrl: 'https://images.unsplash.com/photo-1500000000000' },
    { id: 'CMP-002', title: 'Pembangunan Sumur Air Bersih', target: 20000000, current: 20000000, status: 'completed', deadline: '2025-10-15', backers: 89, imgUrl: 'https://images.unsplash.com/photo-1500000000001' },
];

export default function AdminCampaigns() {
    const [searchQuery, setSearchQuery] = useState('');
    const [campaigns, setCampaigns] = useState(INITIAL_CAMPAIGNS);

    // Kontrol Modal Integrasi Baru
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeStep, setActiveStep] = useState(1);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');

    const handleDelete = (id: string) => {
        if (window.confirm("Hapus kampanye ini beserta semua datanya?")) {
            setCampaigns(campaigns.filter(c => c.id !== id));
        }
    };

    const openModal = (mode: 'create' | 'edit') => {
        setModalMode(mode);
        setActiveStep(1);
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-8">
            {/* Header Aksi */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Manajemen Campaign</h1>
                    <p className="text-gray-500 text-sm font-medium mt-1">Sistem informasi program donasi, target, dan unggahan media.</p>
                </div>
                <button
                    onClick={() => openModal('create')}
                    className="bg-emerald-600 text-white px-5 py-3 rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200/50 flex items-center shrink-0"
                >
                    <Plus size={18} className="mr-2" />
                    Tambah Campaign
                </button>
            </div>

            {/* Bar Pencarian & Filter */}
            <div className="bg-white p-2 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                <div className="relative w-full max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Ketik nama atau ID kampanye..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-2.5 bg-transparent text-sm focus:outline-none text-gray-700 font-medium placeholder:text-gray-400"
                    />
                </div>
                <button className="flex items-center space-x-2 text-gray-500 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 px-4 py-2 rounded-xl transition-all mr-1 text-sm font-bold">
                    <Filter size={16} />
                    <span className="hidden sm:inline">Filter</span>
                </button>
            </div>

            {/* Tabel Data Kampanye yang Rapih */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 text-gray-400 text-[10px] font-black uppercase tracking-widest border-b border-gray-100">
                                <th className="px-6 py-4 whitespace-nowrap">Detail Campaign</th>
                                <th className="px-6 py-4 whitespace-nowrap">Progres Donasi</th>
                                <th className="px-6 py-4 whitespace-nowrap">Status & Deadline</th>
                                <th className="px-6 py-4 text-right whitespace-nowrap">Tindakan</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {campaigns.map((campaign, i) => {
                                const progress = Math.min(100, Math.round((campaign.current / campaign.target) * 100));
                                return (
                                    <tr key={campaign.id} className="hover:bg-emerald-50/30 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-14 h-14 rounded-2xl bg-gray-100 overflow-hidden shrink-0 border border-gray-100 shadow-sm">
                                                    <img
                                                        src={`${campaign.imgUrl}?auto=format&fit=crop&q=80&w=120`}
                                                        alt="Thumbnail"
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 grayscale group-hover:grayscale-0"
                                                    />
                                                </div>
                                                <div className="max-w-[200px] sm:max-w-xs">
                                                    <p className="text-sm font-bold text-gray-900 group-hover:text-emerald-700 transition-colors truncate">{campaign.title}</p>
                                                    <div className="flex items-center space-x-2 mt-1 whitespace-nowrap">
                                                        <span className="text-[10px] font-mono font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded">{campaign.id}</span>
                                                        <span className="text-xs text-gray-500 font-medium">{campaign.backers} Donatur</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-2 w-48">
                                                <p className="text-sm font-black text-emerald-600">{formatCurrency(campaign.current)}</p>
                                                <div className="flex items-center space-x-3">
                                                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                        <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${progress}%` }} />
                                                    </div>
                                                    <span className="text-[10px] font-bold text-gray-500 w-8">{progress}%</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="space-y-1.5">
                                                <span className={cn(
                                                    "inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider",
                                                    campaign.status === 'active' ? "bg-emerald-100 text-emerald-700" :
                                                        campaign.status === 'completed' ? "bg-blue-100 text-blue-700" :
                                                            "bg-gray-100 text-gray-500"
                                                )}>
                                                    {campaign.status === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />}
                                                    {campaign.status}
                                                </span>
                                                <p className="text-xs text-gray-500 font-medium">Berakhir: {campaign.deadline}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end space-x-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => openModal('edit')} className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all" title="Sunting">
                                                    <Edit2 size={18} />
                                                </button>
                                                <button onClick={() => handleDelete(campaign.id)} className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all" title="Hapus">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {campaigns.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="text-center py-16 text-gray-400 font-medium text-sm">Belum ada data kampanye.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL FULL-PAGE (WIZARD) UNTUK MANAJEMEN KAMPANYE LENGKAP - STRUKTUR LEBIH RAPI */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4 sm:p-6">
                    <div className="bg-white rounded-[2rem] w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200 ring-1 ring-gray-900/5">

                        {/* Modal Header (Fixed) */}
                        <div className="shrink-0 p-6 sm:px-8 border-b border-gray-100 flex items-center justify-between bg-white z-10">
                            <div className="space-y-1">
                                <h2 className="text-xl font-black text-gray-900 tracking-tight">
                                    {modalMode === 'create' ? 'Buat Kampanye Baru' : 'Sunting Informasi Kampanye'}
                                </h2>
                                <p className="text-xs text-gray-500 font-medium">Lengkapi langkah-langkah di bawah ini untuk menerbitkan kampanye.</p>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-2.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Tab Menu Formulir (Fixed) */}
                        <div className="shrink-0 px-6 sm:px-8 py-3 flex gap-2 overflow-x-auto bg-gray-50/50 border-b border-gray-100 z-10">
                            {[
                                { step: 1, label: 'Informasi Dasar', icon: Info },
                                { step: 2, label: 'Target & Jadwal', icon: Calendar },
                                { step: 3, label: 'Media & Galeri', icon: ImageIcon },
                            ].map((tab) => (
                                <button
                                    key={tab.step}
                                    onClick={() => setActiveStep(tab.step)}
                                    className={cn(
                                        "flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm transition-all whitespace-nowrap",
                                        activeStep === tab.step
                                            ? "bg-white text-emerald-600 shadow-sm border border-gray-200/50 font-bold"
                                            : "text-gray-500 hover:bg-gray-100 hover:text-gray-900 font-medium"
                                    )}
                                >
                                    <tab.icon size={16} className={activeStep === tab.step ? "text-emerald-500" : ""} />
                                    <span>{tab.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Modal Body: Content (Scrollable) */}
                        <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-white hide-scrollbar">
                            {activeStep === 1 && (
                                <div className="space-y-6 max-w-3xl animate-in fade-in duration-300">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-700">Judul Kampanye</label>
                                        <input type="text" placeholder="Misal: Pembangunan Sumur Desa Terpencil" className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white outline-none text-sm transition-all" />
                                    </div>
                                    <div className="grid sm:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-700">Kategori Utama</label>
                                            <select className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white outline-none text-sm transition-all appearance-none cursor-pointer">
                                                <option>Pendidikan</option>
                                                <option>Kesehatan</option>
                                                <option>Bencana Alam</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-700">Status Awal</label>
                                            <select className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white outline-none text-sm transition-all appearance-none cursor-pointer">
                                                <option>Draf (Tidak Publik)</option>
                                                <option>Aktif (Publik)</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-700 text-left w-full flex justify-between">
                                            <span>Deskripsi Singkat (SEO)</span>
                                            <span className="text-gray-400 font-normal">Maks 150 Karakter</span>
                                        </label>
                                        <textarea rows={2} placeholder="Satu kalimat yang menarik minat donatur..." className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white outline-none text-sm transition-all resize-none"></textarea>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-700">Cerita Lengkap (Proposal Campaign)</label>
                                        <textarea rows={8} placeholder="Ceritakan latar belakang, tujuan, dan rincian penggunaan dana secara transparan..." className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white outline-none text-sm transition-all"></textarea>
                                    </div>
                                </div>
                            )}

                            {activeStep === 2 && (
                                <div className="space-y-8 max-w-3xl animate-in fade-in duration-300">
                                    <div className="bg-gray-50/50 border border-gray-100 p-6 rounded-2xl flex flex-col items-center justify-center text-center space-y-4">
                                        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                                            <DollarSign size={28} />
                                        </div>
                                        <div className="space-y-2 w-full max-w-md">
                                            <label className="text-xs font-bold text-gray-700 block text-center">Tentukan Target Nominal Penggalangan (Rp)</label>
                                            <input type="number" placeholder="50000000" className="w-full text-center py-4 bg-white border border-gray-200 rounded-2xl font-black text-emerald-700 text-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all placeholder:text-gray-300" />
                                        </div>
                                    </div>

                                    <div className="grid sm:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-700">Tanggal Mulai Efektif</label>
                                            <input type="date" className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-600 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm transition-all" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-700">Batas Waktu (Deadline)</label>
                                            <input type="date" className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-600 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm transition-all" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeStep === 3 && (
                                <div className="space-y-8 max-w-3xl animate-in fade-in duration-300">
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-900 mb-1">Unggah Media Utama</h4>
                                        <p className="text-xs text-gray-500 mb-4">Seret berkas JPG/PNG untuk Thumbnail dan Sampul Latar Kampanye.</p>
                                        <div className="border-2 border-dashed border-gray-200 rounded-3xl p-10 flex flex-col items-center justify-center text-center hover:bg-gray-50 hover:border-emerald-500 transition-colors group cursor-pointer bg-white">
                                            <div className="w-16 h-16 bg-gray-50 text-gray-400 group-hover:bg-emerald-50 group-hover:text-emerald-500 rounded-full flex items-center justify-center mb-4 transition-all duration-300">
                                                <UploadCloud size={24} />
                                            </div>
                                            <p className="text-sm font-bold text-gray-900">Klik di sini atau seret foto ke dalam kotak</p>
                                            <p className="text-xs text-gray-400 font-medium mt-1">Ukuran Maksimal Berkas: 2 MB</p>
                                        </div>
                                    </div>

                                    {/* Simulasi Pratinjau Jika Media Terunggah (Hanya di mode edit untuk visual prototype) */}
                                    {modalMode === 'edit' && (
                                        <div className="pt-6 border-t border-gray-100">
                                            <h4 className="text-sm font-bold text-gray-900 mb-4">Aset Gambar Tersimpan</h4>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                {[1, 2].map(num => (
                                                    <div key={num} className="relative aspect-square rounded-2xl overflow-hidden group shadow-sm ring-1 ring-gray-200">
                                                        <img src={`https://images.unsplash.com/photo-${1500000000050 + num}?auto=format&fit=crop&q=80&w=300`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="Saved Media" />
                                                        <div className="absolute inset-0 bg-gray-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-[2px]">
                                                            <button className="bg-white text-rose-600 p-2.5 rounded-xl hover:bg-rose-50 transition-colors shadow-lg">
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Modal Footer (Action Buttons) - Fixed */}
                        <div className="shrink-0 px-6 sm:px-8 py-5 border-t border-gray-100 bg-white flex items-center justify-between z-10">
                            <div className="flex items-center space-x-2">
                                <div className="hidden sm:flex items-center space-x-1">
                                    {[1, 2, 3].map((step) => (
                                        <div key={step} className={cn("w-2 h-2 rounded-full transition-all duration-500", activeStep === step ? "bg-emerald-500 w-6" : "bg-gray-200")} />
                                    ))}
                                </div>
                                <span className="text-xs text-gray-400 font-bold ml-0 sm:ml-4">Tahap {activeStep} dari 3</span>
                            </div>
                            <div className="flex items-center space-x-3">
                                {activeStep > 1 && (
                                    <button
                                        onClick={() => setActiveStep(activeStep - 1)}
                                        className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all"
                                    >
                                        Mundur
                                    </button>
                                )}
                                {activeStep < 3 ? (
                                    <button
                                        onClick={() => setActiveStep(activeStep + 1)}
                                        className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200/50 transition-all flex items-center"
                                    >
                                        Selanjutnya
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => {
                                            setIsModalOpen(false);
                                        }}
                                        className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-gray-900 hover:bg-black shadow-xl shadow-gray-200 transition-all flex items-center"
                                    >
                                        <CheckCircle size={16} className="mr-2 text-emerald-400" />
                                        Simpan & Terbitkan
                                    </button>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            )}

        </div>
    );
}
