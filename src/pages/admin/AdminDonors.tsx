import { Search, Filter, Download, Mail, MessageCircle, MoreHorizontal } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { useState } from 'react';

// Data Mock Donatur
const MOCK_DONORS = [
    { id: 'DNR-1001', name: 'Budi Santoso', email: 'budi.santoso@email.com', phone: '+6281234567890', total_donated: 1500000, join_date: '2025-11-10', status: 'verified' },
    { id: 'DNR-1002', name: 'Siti Aminah', email: 'siti.ami@email.biz', phone: '+6285712312312', total_donated: 750000, join_date: '2025-12-01', status: 'verified' },
    { id: 'DNR-1003', name: 'Agus Wijaya', email: 'agus_w@email.co.id', phone: '+6281987654321', total_donated: 5000000, join_date: '2026-01-15', status: 'verified' },
    { id: 'DNR-1004', name: 'Rini Permata', email: 'rini.p@email.com', phone: '+6282111223344', total_donated: 250000, join_date: '2026-02-28', status: 'unverified' },
    { id: 'DNR-1005', name: 'Hamba Allah', email: 'anon-882@hidden.org', phone: '-', total_donated: 150000, join_date: '2026-03-05', status: 'anonymous' },
];

/**
 * Komponen Prototipe UI Admin - Daftar Donatur
 * Mengelola basis data penyumbang untuk tujuan retensi dan korespondensi.
 */
export default function AdminDonors() {
    const [searchQuery, setSearchQuery] = useState('');

    return (
        <div className="space-y-8">
            {/* Header Aksi */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Database Donatur</h1>
                    <p className="text-gray-500 text-sm font-medium">Rekapitulasi orang-orang baik yang mendukung program Anda.</p>
                </div>
                <button className="bg-white border border-gray-200 text-gray-600 px-5 py-3 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all flex items-center shadow-sm">
                    <Download size={18} className="mr-2" />
                    Ekspor CSV
                </button>
            </div>

            {/* Bar Pencarian & Filter */}
            <div className="bg-white p-4 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Cari nama, email, atau ID donatur..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    />
                </div>
                <div className="flex items-center space-x-3 w-full md:w-auto">
                    <button className="flex items-center justify-center space-x-2 bg-gray-50 text-gray-600 px-5 py-3 rounded-2xl text-sm font-bold hover:bg-gray-100 transition-all border border-gray-100 w-full md:w-auto">
                        <Filter size={18} />
                        <span>Urutkan</span>
                    </button>
                </div>
            </div>

            {/* Tabel Data Donatur */}
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 text-gray-400 text-[10px] font-black uppercase tracking-widest">
                                <th className="px-8 py-5">Profil Donatur</th>
                                <th className="px-8 py-5">Kontak</th>
                                <th className="px-8 py-5 text-right">Total Donasi</th>
                                <th className="px-8 py-5 text-center">Status</th>
                                <th className="px-8 py-5 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {MOCK_DONORS.map((donor, i) => (
                                <tr key={donor.id} className="hover:bg-emerald-50/30 transition-colors group">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center space-x-4">
                                            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-black shrink-0">
                                                {donor.name.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">{donor.name}</p>
                                                <p className="text-xs font-mono font-bold text-gray-400 mt-0.5">ID: {donor.id} • Join: {donor.join_date}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="space-y-1">
                                            <div className="flex items-center text-xs text-gray-500 font-medium">
                                                <Mail size={12} className="mr-2 text-gray-400" />
                                                {donor.email}
                                            </div>
                                            <div className="flex items-center text-xs text-gray-500 font-medium">
                                                <MessageCircle size={12} className="mr-2 text-gray-400" />
                                                {donor.phone}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <p className="text-sm font-black text-emerald-600">{formatCurrency(donor.total_donated)}</p>
                                    </td>
                                    <td className="px-8 py-5 text-center">
                                        <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${donor.status === 'verified' ? 'bg-emerald-100 text-emerald-700' :
                                            donor.status === 'anonymous' ? 'bg-gray-100 text-gray-600' :
                                                'bg-amber-100 text-amber-700'
                                            }`}>
                                            {donor.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <button className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all opacity-0 group-hover:opacity-100" title="Informasi Lanjut">
                                            <MoreHorizontal size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
