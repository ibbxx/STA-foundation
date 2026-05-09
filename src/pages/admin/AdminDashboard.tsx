import {
  AlertCircle,
  Banknote,
  CheckCircle2,
  Clock,
  Heart,
  Plus,
  RefreshCw,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatAdminDate } from '../../lib/admin-helpers';
import {
  buildCampaignTitleMap,
  buildCategorySeries,
  buildRecentTransactions,
  buildSevenDaySeries,
  buildUniqueDonorCount,
} from '../../lib/admin-view-models';
import { fetchDashboardRows } from '../../lib/admin-repository';
import { logError } from '../../lib/error-logger';
import { CampaignRow, DonationRow, SchoolReportRow } from '../../lib/supabase';
import { cn, formatCurrency } from '../../lib/utils';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export default function AdminDashboard() {
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [donations, setDonations] = useState<DonationRow[]>([]);
  const [reports, setReports] = useState<SchoolReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadDashboard() {
    setLoading(true);
    setError(null);

    const [
      { data: campaignRows, error: campaignsError },
      { data: donationRows, error: donationsError },
      { data: reportRows, error: reportsError },
    ] = await fetchDashboardRows();

    if (campaignsError || donationsError || reportsError) {
      logError('AdminDashboard.loadDashboard', campaignsError ?? donationsError ?? reportsError, {
        campaignsError,
        donationsError,
        reportsError,
      });
      setError(campaignsError?.message ?? donationsError?.message ?? reportsError?.message ?? 'Terjadi kesalahan saat memuat data.');
      setCampaigns([]);
      setDonations([]);
      setReports([]);
      setLoading(false);
      return;
    }

    setCampaigns((campaignRows as CampaignRow[]) ?? []);
    setDonations((donationRows as DonationRow[]) ?? []);
    setReports((reportRows as SchoolReportRow[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const campaignMap = useMemo(
    () => buildCampaignTitleMap(campaigns),
    [campaigns],
  );

  const totalSuccessfulDonations = useMemo(
    () => donations.filter((donation) => donation.payment_status === 'success').reduce((sum, donation) => sum + donation.amount, 0),
    [donations],
  );

  const uniqueDonorCount = useMemo(() => buildUniqueDonorCount(donations), [donations]);
  const activeCampaignCount = useMemo(() => campaigns.filter((campaign) => campaign.status === 'active').length, [campaigns]);
  const pendingReportsCount = useMemo(() => reports.filter((report) => report.status === 'pending').length, [reports]);
  const donationChartData = useMemo(() => buildSevenDaySeries(donations), [donations]);
  const categorySeries = useMemo(() => buildCategorySeries(campaigns), [campaigns]);

  const recentTransactions = useMemo(
    () => buildRecentTransactions(donations, campaignMap),
    [campaignMap, donations],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Ikhtisar data platform terkini.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => loadDashboard()}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          <Link
            to="/admin/campaigns"
            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-xl text-sm font-medium shadow-sm hover:bg-zinc-950 transition-colors"
          >
            <Plus size={16} />
            Tambah Campaign
          </Link>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-rose-200 bg-rose-50 text-sm text-rose-700">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Gagal memuat data</p>
            <p className="mt-1">{error}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Donasi Sukses', value: formatCurrency(totalSuccessfulDonations), icon: Banknote, color: 'text-zinc-900', bg: 'bg-zinc-100' },
          { label: 'Donatur Unik', value: uniqueDonorCount.toString(), icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Campaign Aktif', value: activeCampaignCount.toString(), icon: Heart, color: 'text-rose-600', bg: 'bg-rose-50' },
          { label: 'Laporan Pending', value: pendingReportsCount.toString(), icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div className={cn('p-2.5 rounded-xl', stat.bg, stat.color)}>
                <stat.icon size={20} />
              </div>
              <TrendingUp size={16} className="text-slate-300" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{stat.label}</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1 tracking-tight">{loading ? '...' : stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-semibold text-slate-900">Donasi 7 Hari Terakhir</h3>
          </div>
          <div className="h-[280px] w-full">
            {loading ? (
              <div className="h-full flex items-center justify-center text-sm text-slate-400">Memuat grafik...</div>
            ) : donationChartData.every((item) => item.total === 0) ? (
              <div className="h-full flex items-center justify-center text-sm text-slate-400">Belum ada donasi sukses dalam 7 hari terakhir.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={donationChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(value) => value === 0 ? '0' : `${value / 1000}k`} />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="total" fill="#059669" radius={[4, 4, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-6">
          <h3 className="text-base font-semibold text-slate-900">Kategori Campaign</h3>
          {loading ? (
            <div className="flex-1 flex items-center justify-center text-sm text-slate-400">Memuat distribusi...</div>
          ) : categorySeries.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-sm text-slate-400">Belum ada data.</div>
          ) : (
            <div className="space-y-5">
              {categorySeries.map((category) => (
                <div key={category.name} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-slate-700">{category.name}</span>
                    <span className="text-slate-500">{category.percentage}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-zinc-950" style={{ width: `${category.percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="pt-4 border-t border-slate-100 flex items-center gap-2 text-zinc-900">
            <CheckCircle2 size={16} />
            <span className="text-sm font-medium">{campaigns.length} total campaign terdaftar</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-base font-semibold text-slate-900">Transaksi Terbaru</h3>
          <Link to="/admin/transactions" className="text-zinc-900 text-sm font-medium hover:text-zinc-950 transition-colors">Lihat Semua</Link>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-slate-400">Memuat transaksi terbaru...</div>
        ) : recentTransactions.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-400">Belum ada transaksi.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="py-3 px-6 text-xs font-semibold tracking-wider text-slate-500 uppercase">Donatur</th>
                  <th className="py-3 px-6 text-xs font-semibold tracking-wider text-slate-500 uppercase">Campaign</th>
                  <th className="py-3 px-6 text-xs font-semibold tracking-wider text-slate-500 uppercase">Nominal</th>
                  <th className="py-3 px-6 text-xs font-semibold tracking-wider text-slate-500 uppercase">Status</th>
                  <th className="py-3 px-6 text-xs font-semibold tracking-wider text-slate-500 uppercase">Waktu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 text-sm font-medium text-slate-900">
                      {transaction.is_anonymous ? 'Anonim' : transaction.donor_name ?? 'Tanpa nama'}
                      <div className="text-xs text-slate-400 font-mono mt-0.5">{transaction.id.slice(0,8)}...</div>
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-600">{transaction.campaign_title}</td>
                    <td className="py-4 px-6 text-sm font-semibold text-zinc-900">{formatCurrency(transaction.amount)}</td>
                    <td className="py-4 px-6">
                      <span
                        className={cn(
                          'px-2.5 py-1 rounded-full text-[11px] font-medium uppercase tracking-wider',
                          transaction.payment_status === 'success'
                            ? 'bg-zinc-100 text-zinc-950 ring-1 ring-zinc-200/50'
                            : transaction.payment_status === 'pending'
                              ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/50'
                              : 'bg-rose-50 text-rose-700 ring-1 ring-rose-200/50',
                        )}
                      >
                        {transaction.payment_status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-500">{formatAdminDate(transaction.created_at, true)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
