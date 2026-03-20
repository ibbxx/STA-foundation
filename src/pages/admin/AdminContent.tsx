import { LayoutTemplate, MessageSquare, Briefcase, Plus, Search, Edit2, Trash2, X, Image as ImageIcon } from 'lucide-react';
import { useState } from 'react';

const TABS = [
    { id: 'categories', label: 'Kategori Kampanye', icon: LayoutTemplate },
    { id: 'updates', label: 'Pembaruan Berita', icon: MessageSquare },
    { id: 'partners', label: 'Mitra & Sponsor', icon: Briefcase },
];

const INITIAL_CATEGORIES = [
    { id: 1, name: 'Pendidikan', slug: 'pendidikan', count: 12 },
    { id: 2, name: 'Kesehatan & Medis', slug: 'kesehatan', count: 8 },
    { id: 3, name: 'Bencana Alam', slug: 'bencana-alam', count: 3 },
    { id: 4, name: 'Rumah Ibadah', slug: 'rumah-ibadah', count: 5 },
    { id: 5, name: 'Pemberdayaan Ekonomi', slug: 'ekonomi', count: 4 },
];

const INITIAL_UPDATES = [
    { id: 1, title: 'Distribusi Sembako Koloter Pertama Selesai', campaign: 'Sembako untuk Lansia Dhuafa', date: '20 Mar 2026', views: 450 },
    { id: 2, title: 'Peletakan Batu Pertama Dimulai', campaign: 'Pembangunan Sumur Air Bersih', date: '18 Mar 2026', views: 620 },
    { id: 3, title: 'Kisah Inspiratif: Beasiswa Anak Lombok', campaign: 'Beasiswa Anak Pesisir Lombok', date: '15 Mar 2026', views: 1200 },
];

const INITIAL_PARTNERS = [
    { id: 1, name: 'Bank Syariah Indonesia (BSI)', type: 'Sponsor Utama', joined: '12 Jan 2025' },
    { id: 2, name: 'Gojek GoPay', type: 'Mitra Pembayaran', joined: '05 Feb 2025' },
    { id: 3, name: 'Unicef Indonesia', type: 'Mitra Strategis', joined: '20 Mar 2025' },
];

/**
 * Komponen Prototipe UI Admin - Manajemen Konten Web (Diperjelas)
 * Fitur tab berita/update dan interaksi tombol lokal menggunakan state React.
 */
export default function AdminContent() {
    const [activeTab, setActiveTab] = useState('categories');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState<'create' | 'edit'>('create');

    // Data State agar tombol hapus dsb berfungsi sementara (prototype)
    const [categories, setCategories] = useState(INITIAL_CATEGORIES);
    const [updates, setUpdates] = useState(INITIAL_UPDATES);
    const [partners, setPartners] = useState(INITIAL_PARTNERS);

    const [searchQuery, setSearchQuery] = useState('');

    // Fungsi Simulasi Hapus
    const handleDelete = (id: number) => {
        if (!window.confirm("Apakah Anda yakin ingin menghapus data ini?")) return;

        if (activeTab === 'categories') {
            setCategories(categories.filter(c => c.id !== id));
        } else if (activeTab === 'updates') {
            setUpdates(updates.filter(u => u.id !== id));
        } else if (activeTab === 'partners') {
            setPartners(partners.filter(p => p.id !== id));
        }
    };

    // Fungsi Simulasi Buka Modal
    const openModal = (type: 'create' | 'edit') => {
        setModalType(type);
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-8">
            {/* Header Aksi */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Manajemen Konten</h1>
                    <p className="text-gray-500 text-sm font-medium">Kelola kategori kampanye, jurnal/berita pembaruan, dan informasi mitra.</p>
                </div>
                <button
                    onClick={() => openModal('create')}
                    className="bg-emerald-600 text-white px-5 py-3 rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 flex items-center"
                >
                    <Plus size={18} className="mr-2" />
                    Tambah Baru
                </button>
            </div>

            {/* Tab Navigasi Konten */}
            <div className="bg-white p-2 rounded-2xl border border-gray-100 shadow-sm inline-flex flex-wrap gap-2">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center space-x-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id
                                ? 'bg-emerald-50 text-emerald-600 shadow-sm'
                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                    >
                        <tab.icon size={18} />
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Area Tampilan Konten Dinamis Berdasarkan Tab */}
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
                <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                    <h2 className="text-lg font-black text-gray-900">
                        {activeTab === 'categories' ? 'Daftar Kategori' :
                            activeTab === 'updates' ? 'Berita & Pembaruan Kampanye' :
                                'Daftar Mitra & Sponsor'}
                    </h2>
                    <div className="relative w-64">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Cari data..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-gray-700"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50 text-gray-400 text-[10px] font-black uppercase tracking-widest">
                                {activeTab === 'categories' && (
                                    <>
                                        <th className="px-8 py-4">Nama Kategori</th>
                                        <th className="px-8 py-4">Slug URL</th>
                                        <th className="px-8 py-4 text-center">Total Campaign</th>
                                    </>
                                )}
                                {activeTab === 'updates' && (
                                    <>
                                        <th className="px-8 py-4">Judul Berita</th>
                                        <th className="px-8 py-4">Terkait Campaign</th>
                                        <th className="px-8 py-4 text-center">Tanggal & View</th>
                                    </>
                                )}
                                {activeTab === 'partners' && (
                                    <>
                                        <th className="px-8 py-4">Nama Mitra</th>
                                        <th className="px-8 py-4">Kategori Mitra</th>
                                        <th className="px-8 py-4 text-center">Bergabung Sejak</th>
                                    </>
                                )}
                                <th className="px-8 py-4 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">

                            {/* Tampilan Tab Kategori */}
                            {activeTab === 'categories' && categories.map((cat) => (
                                <tr key={cat.id} className="hover:bg-emerald-50/30 transition-colors group">
                                    <td className="px-8 py-4 text-sm font-bold text-gray-900">{cat.name}</td>
                                    <td className="px-8 py-4 text-sm font-mono text-gray-500">/{cat.slug}</td>
                                    <td className="px-8 py-4 text-center">
                                        <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold">
                                            {cat.count}
                                        </span>
                                    </td>
                                    <td className="px-8 py-4 text-right">
                                        <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => openModal('edit')} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="Edit">
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(cat.id)} className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all" title="Hapus">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}

                            {/* Tampilan Tab Berita/Pembaruan */}
                            {activeTab === 'updates' && updates.map((update) => (
                                <tr key={update.id} className="hover:bg-emerald-50/30 transition-colors group">
                                    <td className="px-8 py-5">
                                        <p className="text-sm font-bold text-gray-900 leading-tight pr-4">{update.title}</p>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 truncate max-w-[200px]">
                                            {update.campaign}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-center">
                                        <p className="text-xs font-bold text-gray-900">{update.date}</p>
                                        <p className="text-[10px] font-medium text-gray-400 mt-1">{update.views} Dilihat</p>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <div className="flex items-center justify-end space-x-2 border-l border-gray-100 pl-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => openModal('edit')} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="Edit Berita">
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(update.id)} className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all" title="Hapus Berita">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}

                            {/* Tampilan Tab Mitra */}
                            {activeTab === 'partners' && partners.map((partner) => (
                                <tr key={partner.id} className="hover:bg-emerald-50/30 transition-colors group">
                                    <td className="px-8 py-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                                                <ImageIcon size={14} className="text-gray-400" />
                                            </div>
                                            <span className="text-sm font-bold text-gray-900">{partner.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-4 text-sm font-medium text-gray-600">
                                        {partner.type}
                                    </td>
                                    <td className="px-8 py-4 text-center text-xs font-medium text-gray-500">
                                        {partner.joined}
                                    </td>
                                    <td className="px-8 py-4 text-right">
                                        <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => openModal('edit')} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="Edit">
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(partner.id)} className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all" title="Hapus">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}

                        </tbody>
                    </table>

                    {/* Tampilan Kosong Jika Pencarian Mengosongkan Daftar */}
                    {((activeTab === 'categories' && categories.length === 0) ||
                        (activeTab === 'updates' && updates.length === 0) ||
                        (activeTab === 'partners' && partners.length === 0)) && (
                            <div className="py-16 text-center text-gray-500 text-sm font-medium">
                                Data tidak ditemukan. Silakan tambah data baru.
                            </div>
                        )}
                </div>
            </div>

            {/* Simulasi Modal Tambah/Edit */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                            <h3 className="text-xl font-black text-gray-900">
                                {modalType === 'create' ? 'Tambah' : 'Sunting'} {' '}
                                {activeTab === 'categories' ? 'Kategori' : activeTab === 'updates' ? 'Berita/Update' : 'Mitra'}
                            </h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                    Judul/Nama {activeTab === 'updates' ? 'Berita' : 'Data'}
                                </label>
                                <input
                                    type="text"
                                    placeholder="Masukkan judul di sini..."
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-medium text-gray-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm"
                                />
                            </div>

                            {activeTab === 'updates' && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                        Konten Berita
                                    </label>
                                    <textarea
                                        rows={4}
                                        placeholder="Tulis ringkasan laporan operasional kampanye di sini..."
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-medium text-gray-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="p-6 bg-gray-50 border-t border-gray-100 flex items-center justify-end space-x-3">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-200 transition-all"
                            >
                                Batal
                            </button>
                            <button
                                onClick={() => {
                                    alert('Data berhasil disimpan! (Ini adalah purwarupa)');
                                    setIsModalOpen(false);
                                }}
                                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all"
                            >
                                Simpan Perubahan
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
