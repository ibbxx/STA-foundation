import { Search, Filter, Download, MoreVertical, CheckCircle, Clock, XCircle, FileText } from 'lucide-react';
import { formatCurrency, cn } from '../../lib/utils';
import { useState } from 'react';

// Data Mock Transaksi
const MOCK_TRANSACTIONS = [
    { id: 'TRX-90081', campaign: 'Beasiswa Anak Pesisir Lombok', donor: 'Budi Santoso', amount: 500000, method: 'QRIS / GoPay', status: 'paid', date: '2026-03-20 14:30:00' },
    { id: 'TRX-90082', campaign: 'Pembangunan Sumur Air Bersih', donor: 'Siti Aminah', amount: 250000, method: 'Bank Transfer (BCA)', status: 'pending', date: '2026-03-20 12:15:22' },
    { id: 'TRX-90083', campaign: 'Renovasi Sekolah Dasar Mekar Jaya', donor: 'Hamba Allah', amount: 1000000, method: 'Virtual Account Mandiri', status: 'paid', date: '2026-03-19 09:45:10' },
    { id: 'TRX-90084', campaign: 'Bantuan Biaya Operasi Katarak', donor: 'Andi Wijaya', amount: 100000, method: 'ShopeePay', status: 'failed', date: '2026-03-18 16:20:05' },
    { id: 'TRX-90085', campaign: 'Sembako untuk Lansia Dhuafa', donor: 'Agus Wijaya', amount: 5000000, method: 'Bank Transfer (BNI)', status: 'paid', date: '2026-03-17 11:10:00' },
];

/**
 * Komponen Prototipe UI Admin - Daftar Transaksi Donasi
 * Mengelola arus kas masuk dan verifikasi pembayaran.
 */
export default function AdminTransactions() {
    const [searchQuery, setSearchQuery] = useState('');

    return (
        <div className="space-y-8">
            {/* Header Aksi */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Riwayat Transaksi</h1>
                    <p className="text-gray-500 text-sm font-medium">Pantau dan verifikasi setiap aliran dana yang masuk.</p>
                </div>
                <div className="flex space-x-3">
                    <button className="bg-white border border-gray-200 text-gray-600 px-5 py-3 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all flex items-center shadow-sm">
                        <Filter size={18} className="mr-2" />
                        Filter
                    </button>
                    <button className="bg-emerald-600 text-white px-5 py-3 rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 flex items-center">
                        <Download size={18} className="mr-2" />
                        Ekspor Laporan
                    </button>
                </div>
            </div>

            {/* Ringkasan Cepat */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Berhasil (Paid)', value: 'Rp 6.500.000', count: '124 Transaksi', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle },
                    { label: 'Menunggu (Pending)', value: 'Rp 250.000', count: '3 Transaksi', color: 'text-amber-600', bg: 'bg-amber-50', icon: Clock },
                    { label: 'Gagal (Failed)', value: 'Rp 100.000', count: '1 Transaksi', color: 'text-rose-600', bg: 'bg-rose-50', icon: XCircle },
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center space-x-6">
                        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shrink-0", stat.bg, stat.color)}>
                            <stat.icon size={28} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
                            <h3 className="text-xl font-black text-gray-900 leading-tight mt-1">{stat.value}</h3>
                            <p className="text-sm font-medium text-gray-500">{stat.count}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Tabel Data Transaksi */}
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden mt-8">
                <div className="p-4 border-b border-gray-50 flex items-center justify-between">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Cari ID transaksi atau nama donatur..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-gray-700"
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 text-gray-400 text-[10px] font-black uppercase tracking-widest">
                                <th className="px-8 py-5">Detail Transaksi</th>
                                <th className="px-8 py-5">Tujuan & Donatur</th>
                                <th className="px-8 py-5">Metode Bayar</th>
                                <th className="px-8 py-5 text-center">Status</th>
                                <th className="px-8 py-5 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {MOCK_TRANSACTIONS.map((trx, i) => (
                                <tr key={trx.id} className="hover:bg-emerald-50/30 transition-colors group">
                                    <td className="px-8 py-5">
                                        <p className="text-sm font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">{trx.id}</p>
                                        <p className="text-xs font-mono font-bold text-gray-400 mt-1">{trx.date}</p>
                                    </td>
                                    <td className="px-8 py-5">
                                        <p className="text-sm font-bold text-gray-900 truncate max-w-[200px]" title={trx.campaign}>{trx.campaign}</p>
                                        <p className="text-xs text-gray-500 font-medium mt-1">Oleh: <span className="font-bold text-gray-700">{trx.donor}</span></p>
                                    </td>
                                    <td className="px-8 py-5">
                                        <p className="text-sm font-black text-emerald-600">{formatCurrency(trx.amount)}</p>
                                        <p className="text-xs font-medium text-gray-500 mt-1">{trx.method}</p>
                                    </td>
                                    <td className="px-8 py-5 text-center">
                                        <span className={cn(
                                            "inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                                            trx.status === 'paid' ? "bg-emerald-100 text-emerald-700" :
                                                trx.status === 'failed' ? "bg-rose-100 text-rose-700" :
                                                    "bg-amber-100 text-amber-700"
                                        )}>
                                            {trx.status === 'paid' && <CheckCircle size={10} className="mr-1" />}
                                            {trx.status === 'pending' && <Clock size={10} className="mr-1" />}
                                            {trx.status === 'failed' && <XCircle size={10} className="mr-1" />}
                                            {trx.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <div className="flex items-center justify-end space-x-2">
                                            <button className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all" title="Lihat Invoice">
                                                <FileText size={18} />
                                            </button>
                                            <button className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all opacity-0 group-hover:opacity-100" title="Opsi Lainnya">
                                                <MoreVertical size={18} />
                                            </button>
                                        </div>
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
