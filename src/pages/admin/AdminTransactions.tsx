import { AlertCircle, CheckCircle, Clock, Download, Eye, RefreshCw, Search, XCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import AdminModal from '../../components/admin/AdminModal';
import { downloadCsv } from '../../lib/admin-export';
import { formatAdminDate } from '../../lib/admin-helpers';
import { CampaignRow, DonationRow, supabase } from '../../lib/supabase';
import { cn, formatCurrency } from '../../lib/utils';

type TransactionView = DonationRow & {
  campaign_title: string;
};

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState<TransactionView[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | DonationRow['payment_status']>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionView | null>(null);

  async function loadTransactions() {
    setLoading(true);
    setError(null);

    const [donationsResult, campaignsResult] = await Promise.all([
      supabase.from('donations').select('*').order('created_at', { ascending: false }),
      supabase.from('campaigns').select('id, title'),
    ]);

    if (donationsResult.error || campaignsResult.error) {
      setError(donationsResult.error?.message ?? campaignsResult.error?.message ?? 'Terjadi kesalahan saat memuat data.');
      setTransactions([]);
      setLoading(false);
      return;
    }

    const donationRows = (donationsResult.data ?? []) as DonationRow[];
    const campaignRows = (campaignsResult.data ?? []) as Pick<CampaignRow, 'id' | 'title'>[];
    const campaignMap = new Map(campaignRows.map((campaign) => [campaign.id, campaign.title]));

    setTransactions(
      donationRows.map((transaction) => ({
        ...transaction,
        campaign_title: campaignMap.get(transaction.campaign_id) ?? 'Campaign tidak ditemukan',
      })),
    );

    setLoading(false);
  }

  useEffect(() => {
    loadTransactions();
  }, []);

  const filteredTransactions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return transactions.filter((transaction) => {
      const matchesQuery = !query || [
        transaction.id,
        transaction.donor_name ?? '',
        transaction.donor_email ?? '',
        transaction.campaign_title,
        transaction.payment_method ?? '',
        transaction.payment_status,
      ]
        .join(' ')
        .toLowerCase()
        .includes(query);

      const matchesStatus = statusFilter === 'all' || transaction.payment_status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [transactions, searchQuery, statusFilter]);

  const summary = useMemo(() => {
    const base = {
      success: { total: 0, count: 0 },
      pending: { total: 0, count: 0 },
      failed: { total: 0, count: 0 },
    };

    transactions.forEach((transaction) => {
      base[transaction.payment_status].total += transaction.amount;
      base[transaction.payment_status].count += 1;
    });

    return base;
  }, [transactions]);

  function exportTransactions() {
    if (filteredTransactions.length === 0) return;

    downloadCsv('sta-transactions.csv', filteredTransactions.map((transaction) => ({
      id: transaction.id,
      campaign_title: transaction.campaign_title,
      donor_name: transaction.is_anonymous ? 'Anonim' : (transaction.donor_name ?? ''),
      donor_email: transaction.is_anonymous ? '' : (transaction.donor_email ?? ''),
      amount: transaction.amount,
      payment_status: transaction.payment_status,
      payment_method: transaction.payment_method ?? '',
      message: transaction.message ?? '',
      created_at: transaction.created_at,
    })));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Riwayat Transaksi</h1>
          <p className="text-sm text-slate-500 mt-1">Pantau seluruh donasi yang masuk ke platform.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => loadTransactions()}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          <button
            onClick={exportTransactions}
            disabled={filteredTransactions.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium shadow-sm hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            <Download size={16} />
            Ekspor CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Berhasil', data: summary.success, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle },
          { label: 'Pending', data: summary.pending, color: 'text-amber-600', bg: 'bg-amber-50', icon: Clock },
          { label: 'Gagal', data: summary.failed, color: 'text-rose-600', bg: 'bg-rose-50', icon: XCircle },
        ].map((item) => (
          <div key={item.label} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
            <div className={cn('p-3 rounded-xl flex items-center justify-center shrink-0', item.bg, item.color)}>
              <item.icon size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{item.label}</p>
              <h3 className="text-xl font-bold text-slate-900 leading-tight mt-1">{formatCurrency(item.data.total)}</h3>
              <p className="text-xs font-medium text-slate-400 mt-0.5">{item.data.count} transaksi</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Cari ID, donor, atau campaign..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all placeholder:text-slate-400"
            />
          </div>
          <div className="flex bg-slate-100/50 p-1 rounded-xl overflow-x-auto">
            {[
              { label: 'Semua', value: 'all' as const },
              { label: 'Success', value: 'success' as const },
              { label: 'Pending', value: 'pending' as const },
              { label: 'Failed', value: 'failed' as const },
            ].map((item) => (
              <button
                key={item.value}
                onClick={() => setStatusFilter(item.value)}
                className={cn(
                  'px-4 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors whitespace-nowrap',
                  statusFilter === item.value
                    ? 'bg-white text-emerald-700 shadow-sm border border-slate-200/50'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50',
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="m-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 flex items-start gap-3">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Gagal memuat transaksi.</p>
              <p className="mt-1">{error}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="px-6 py-12 text-center text-sm text-slate-500">Memuat data transaksi...</div>
        ) : filteredTransactions.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-slate-500">
            Belum ada transaksi yang sesuai.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-xs font-semibold tracking-wider text-slate-500 uppercase">
                  <th className="px-6 py-4">ID Transaksi</th>
                  <th className="px-6 py-4">Campaign & Donatur</th>
                  <th className="px-6 py-4">Metode Bayar</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <p className="text-sm font-mono text-slate-900">{transaction.id.slice(0, 12)}...</p>
                      <p className="text-[11px] text-slate-500 mt-1">{formatAdminDate(transaction.created_at, true)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-slate-900 truncate max-w-[200px]" title={transaction.campaign_title}>
                        {transaction.campaign_title}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Oleh: <span className="font-medium text-slate-700">{transaction.is_anonymous ? 'Anonim' : transaction.donor_name ?? 'Tanpa nama'}</span>
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-emerald-600">{formatCurrency(transaction.amount)}</p>
                      <p className="text-xs text-slate-500 mt-1">{transaction.payment_method ?? '-'}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={cn(
                          'inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider',
                          transaction.payment_status === 'success'
                            ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/50'
                            : transaction.payment_status === 'failed'
                              ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-200/50'
                              : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/50',
                        )}
                      >
                        {transaction.payment_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setSelectedTransaction(transaction)}
                          className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Lihat Detail"
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AdminModal
        open={selectedTransaction !== null}
        onClose={() => setSelectedTransaction(null)}
        title="Detail Transaksi"
        description="Informasi lengkap mengenai histori donasi ini."
        widthClassName="max-w-2xl"
        footer={(
          <button
            type="button"
            onClick={() => setSelectedTransaction(null)}
            className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            Tutup
          </button>
        )}
      >
        {selectedTransaction && (
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ['ID Transaksi', selectedTransaction.id],
              ['Campaign', selectedTransaction.campaign_title],
              ['Donatur', selectedTransaction.is_anonymous ? 'Anonim' : (selectedTransaction.donor_name ?? 'Tanpa nama')],
              ['Email', selectedTransaction.is_anonymous ? '-' : (selectedTransaction.donor_email ?? '-')],
              ['Nominal', formatCurrency(selectedTransaction.amount)],
              ['Status', selectedTransaction.payment_status],
              ['Metode Bayar', selectedTransaction.payment_method ?? '-'],
              ['Waktu', formatAdminDate(selectedTransaction.created_at, true)],
              ['Pesan', selectedTransaction.message ?? '-'],
            ].map(([label, value]) => (
              <div key={label} className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
                <p className="mt-1 text-sm font-medium text-slate-700 break-words">{value}</p>
              </div>
            ))}
          </div>
        )}
      </AdminModal>
    </div>
  );
}
