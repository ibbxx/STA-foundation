import {
  BarChart3, Users, Heart, Banknote,
  Plus, Search, Filter, MoreVertical,
  CheckCircle2, Clock, AlertCircle,
  TrendingUp, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatCurrency, cn } from '../lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, LineChart, Line
} from 'recharts';

// Kumpulan Data Statis Sampel (Mock Data) untuk visualisasi ringkasan KPI dasbor
const MOCK_STATS = [
  { label: 'Total Donasi', value: 'Rp 1.2M', change: '+12.5%', isUp: true, icon: Banknote, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { label: 'Donatur Baru', value: '1,240', change: '+5.2%', isUp: true, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
  { label: 'Campaign Aktif', value: '24', change: '-2', isUp: false, icon: Heart, color: 'text-rose-600', bg: 'bg-rose-50' },
  { label: 'Transaksi Pending', value: '12', change: '+4', isUp: true, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
];

// Data deret waktu untuk grafik performa donasi mingguan
const CHART_DATA = [
  { name: 'Sen', total: 4000, count: 24 },
  { name: 'Sel', total: 3000, count: 18 },
  { name: 'Rab', total: 5000, count: 32 },
  { name: 'Kam', total: 2780, count: 15 },
  { name: 'Jum', total: 1890, count: 10 },
  { name: 'Sab', total: 2390, count: 12 },
  { name: 'Min', total: 3490, count: 20 },
];

// Katalog riwayat transaksi terbaru sebagai cuplikan aktivitas realtime
const RECENT_TRANSACTIONS = [
  { id: 'TA-123', donor: 'Budi Santoso', campaign: 'Beasiswa Anak Pesisir', amount: 500000, status: 'paid', date: '10:24' },
  { id: 'TA-124', donor: 'Siti Aminah', campaign: 'Sumur Air Bersih', amount: 250000, status: 'pending', date: '09:15' },
  { id: 'TA-125', donor: 'Hamba Allah', campaign: 'Operasi Katarak', amount: 1000000, status: 'paid', date: '08:45' },
  { id: 'TA-126', donor: 'Andi Wijaya', campaign: 'Bantuan Banjir', amount: 100000, status: 'failed', date: '07:30' },
];

/**
 * Komponen Halaman Dasbor Navigasi Utama Panel Admin (AdminDashboard).
 * Menyajikan gambaran besar (bird's-eye view) atas indikator kinerja utama program penggalangan dana,
 * analisis tren donasi via grafik, hingga pantauan alur transaksi terkini.
 */
export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      {/* Bagian Tajuk Kontrol dan Navigasi Aksi Dasbor (Dashboard Header) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Ringkasan Statistik</h1>
          <p className="text-gray-500 text-sm font-medium">Selamat datang kembali, Admin Sekolah Tanah Air.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="bg-white border border-gray-200 px-4 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all">
            Export Laporan
          </button>
          <Link to="/admin/campaigns/new" className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 flex items-center">
            <Plus size={18} className="mr-2" />
            Tambah Campaign
          </Link>
        </div>
      </div>

      {/* Kisi Ringkasan Metrik KPI Utama (Stats Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {MOCK_STATS.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex justify-between items-start">
              <div className={cn("p-3 rounded-2xl", stat.bg, stat.color)}>
                <stat.icon size={24} />
              </div>
              <div className={cn(
                "flex items-center text-xs font-bold px-2 py-1 rounded-lg",
                stat.isUp ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
              )}>
                {stat.isUp ? <ArrowUpRight size={12} className="mr-1" /> : <ArrowDownRight size={12} className="mr-1" />}
                {stat.change}
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-400 font-bold uppercase tracking-wider">{stat.label}</p>
              <h3 className="text-2xl font-black text-gray-900">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Tampilan Visualisasi Grafik (Charts Section) */}
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-900">Performa Donasi Mingguan</h3>
            <select className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-600 focus:outline-none">
              <option>7 Hari Terakhir</option>
              <option>30 Hari Terakhir</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={CHART_DATA}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: '#9ca3af' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: '#9ca3af' }} />
                <Tooltip
                  cursor={{ fill: '#f9fafb' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="total" fill="#10b981" radius={[6, 6, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Panel Distribusi Persentase Kontribusi per Kategori */}
        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-6">
          <h3 className="text-lg font-bold text-gray-900">Kategori Terpopuler</h3>
          <div className="space-y-6">
            {[
              { name: 'Pendidikan', value: 45, color: 'bg-emerald-500' },
              { name: 'Kesehatan', value: 30, color: 'bg-blue-500' },
              { name: 'Bencana Alam', value: 15, color: 'bg-rose-500' },
              { name: 'Lainnya', value: 10, color: 'bg-gray-300' },
            ].map((cat, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-gray-600">{cat.name}</span>
                  <span className="text-gray-900">{cat.value}%</span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div className={cn("h-full rounded-full", cat.color)} style={{ width: `${cat.value}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="pt-6 border-t border-gray-50">
            <div className="flex items-center space-x-3 text-emerald-600">
              <TrendingUp size={20} />
              <span className="text-sm font-bold">Pendidikan naik 12% bulan ini</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabel Cuplikan Transaksi Donatur Terbaru (Recent Transactions Table) */}
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-50 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-900">Transaksi Terbaru</h3>
          <Link to="/admin/transactions" className="text-emerald-600 text-sm font-bold hover:underline">Lihat Semua</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-gray-400 text-[10px] font-black uppercase tracking-widest">
                <th className="px-8 py-4">ID Transaksi</th>
                <th className="px-8 py-4">Donatur</th>
                <th className="px-8 py-4">Campaign</th>
                <th className="px-8 py-4">Nominal</th>
                <th className="px-8 py-4">Status</th>
                <th className="px-8 py-4">Waktu</th>
                <th className="px-8 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {RECENT_TRANSACTIONS.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-8 py-5 text-sm font-mono font-bold text-gray-400">{tx.id}</td>
                  <td className="px-8 py-5 text-sm font-bold text-gray-900">{tx.donor}</td>
                  <td className="px-8 py-5 text-sm text-gray-500 font-medium">{tx.campaign}</td>
                  <td className="px-8 py-5 text-sm font-black text-emerald-600">{formatCurrency(tx.amount)}</td>
                  <td className="px-8 py-5">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                      tx.status === 'paid' ? "bg-emerald-100 text-emerald-700" :
                        tx.status === 'pending' ? "bg-amber-100 text-amber-700" :
                          "bg-rose-100 text-rose-700"
                    )}>
                      {tx.status}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-sm text-gray-400 font-medium">{tx.date}</td>
                  <td className="px-8 py-5 text-right">
                    <button className="text-gray-400 hover:text-gray-600">
                      <MoreVertical size={18} />
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
