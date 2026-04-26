import { AlertCircle, Download, Eye, Mail, MessageCircle, RefreshCw, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import AdminModal from '../../components/admin/AdminModal';
import { downloadCsv } from '../../lib/admin-export';
import { formatAdminDate, getInitials } from '../../lib/admin-helpers';
import { fetchDonorDonationRows } from '../../lib/admin-repository';
import { deriveDonors, filterDonors, type DonorSummary } from '../../lib/admin-view-models';
import { logError } from '../../lib/error-logger';
import { cn, formatCurrency } from '../../lib/utils';

export default function AdminDonors() {
  const [searchQuery, setSearchQuery] = useState('');
  const [donors, setDonors] = useState<DonorSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDonor, setSelectedDonor] = useState<DonorSummary | null>(null);

  async function loadDonors() {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await fetchDonorDonationRows();

    if (fetchError) {
      logError('AdminDonors.loadDonors', fetchError);
      setError(fetchError.message);
      setDonors([]);
      setLoading(false);
      return;
    }

    setDonors(deriveDonors(data ?? []));
    setLoading(false);
  }

  useEffect(() => {
    loadDonors();
  }, []);

  const filteredDonors = useMemo(() => filterDonors(donors, searchQuery), [donors, searchQuery]);

  function exportDonors() {
    if (filteredDonors.length === 0) return;

    downloadCsv('sta-donors.csv', filteredDonors.map((donor) => ({
      donor_id: donor.id,
      name: donor.name,
      email: donor.email ?? '',
      phone: donor.phone ?? '',
      total_donated: donor.total_donated,
      transaction_count: donor.transaction_count,
      first_donation_at: donor.first_donation_at,
      last_donation_at: donor.last_donation_at,
      status: donor.status,
    })));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Database Donatur</h1>
          <p className="text-sm text-slate-500 mt-1">Kelola data donatur.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => loadDonors()}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          <button
            onClick={exportDonors}
            disabled={filteredDonors.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-xl text-sm font-medium shadow-sm hover:bg-zinc-950 transition-colors disabled:opacity-50"
          >
            <Download size={16} />
            Ekspor CSV
          </button>
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

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Cari nama, email, atau ID donor..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 outline-none transition-all placeholder:text-slate-400"
            />
          </div>
        </div>

        {loading ? (
          <div className="px-6 py-12 text-center text-sm text-slate-500">Memuat data donatur...</div>
        ) : filteredDonors.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-slate-500">Belum ada donatur yang ditemukan.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-xs font-semibold tracking-wider text-slate-500 uppercase">
                  <th className="px-6 py-4">Profil Donatur</th>
                  <th className="px-6 py-4">Kontak</th>
                  <th className="px-6 py-4 text-right">Total Donasi</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDonors.map((donor) => (
                  <tr key={donor.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 flex-shrink-0 rounded-full bg-zinc-200 text-zinc-950 flex items-center justify-center font-bold text-sm">
                          {getInitials(donor.name)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{donor.name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[11px] font-mono text-slate-400">{donor.id.slice(0, 10)}</span>
                            <span className="text-slate-300">•</span>
                            <span className="text-[11px] text-slate-500">{formatAdminDate(donor.first_donation_at)}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center text-xs text-slate-500">
                          <Mail size={14} className="mr-2 text-slate-400" />
                          {donor.email ?? 'Tidak tersedia'}
                        </div>
                        <div className="flex items-center text-xs text-slate-500">
                          <MessageCircle size={14} className="mr-2 text-slate-400" />
                          {donor.phone ?? 'Tidak tersedia'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="text-sm font-semibold text-zinc-900">{formatCurrency(donor.total_donated)}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{donor.transaction_count} transaksi</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={cn(
                          'inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider',
                          donor.status === 'identified'
                            ? 'bg-zinc-100 text-zinc-950 ring-1 ring-zinc-200/50'
                            : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
                        )}
                      >
                        {donor.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setSelectedDonor(donor)}
                          className="p-2 text-slate-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
                          title="Detail"
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
        open={selectedDonor !== null}
        onClose={() => setSelectedDonor(null)}
        title="Detail Donatur"
        description="Informasi lengkap histori donasi donatur."
        footer={(
          <button
            type="button"
            onClick={() => setSelectedDonor(null)}
            className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            Tutup
          </button>
        )}
      >
        {selectedDonor && (
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ['Nama', selectedDonor.name],
              ['Email', selectedDonor.email ?? '-'],
              ['Telepon', selectedDonor.phone ?? '-'],
              ['Status', selectedDonor.status],
              ['Total Donasi', formatCurrency(selectedDonor.total_donated)],
              ['Jumlah Transaksi', `${selectedDonor.transaction_count} transaksi`],
              ['Donasi Pertama', formatAdminDate(selectedDonor.first_donation_at, true)],
              ['Donasi Terakhir', formatAdminDate(selectedDonor.last_donation_at, true)],
              ['ID Donor', selectedDonor.id],
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
