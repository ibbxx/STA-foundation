import { AlertCircle, Download, ExternalLink, Eye, Mail, MessageCircle, RefreshCw, Search, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import AdminModal from '../../components/admin/AdminModal';
import { useConfirmDialog } from '../../components/admin/ConfirmDialog';
import { downloadCsv } from '../../lib/admin-export';
import { formatAdminDate, getInitials } from '../../lib/admin-helpers';
import { deleteDonation, fetchTransactionRows, updateDonationStatus } from '../../lib/admin-repository';
import { buildCampaignTitleMap, deriveDonors, filterDonors, type DonorSummary } from '../../lib/admin-view-models';
import { logError } from '../../lib/error-logger';
import { supabase } from '../../lib/supabase';
import type { DonationRow } from '../../lib/supabase/types';
import { deleteFilesFromStorage, storageCleanupNotice } from '../../lib/supabase/storage';
import { cn, formatCurrency } from '../../lib/utils';

export default function AdminDonors() {
  const { confirm, ConfirmDialogElement } = useConfirmDialog();
  const [searchQuery, setSearchQuery] = useState('');
  const [donors, setDonors] = useState<DonorSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedDonor, setSelectedDonor] = useState<DonorSummary | null>(null);
  const [openingProofId, setOpeningProofId] = useState<string | null>(null);
  const [updatingTransactionId, setUpdatingTransactionId] = useState<string | null>(null);
  const [deletingDonorId, setDeletingDonorId] = useState<string | null>(null);
  const [deletingTransactionId, setDeletingTransactionId] = useState<string | null>(null);

  async function loadDonors(selectedDonorIdToKeep?: string) {
    setLoading(true);
    setError(null);

    const [donationsResult, campaignsResult] = await fetchTransactionRows();
    const fetchError = donationsResult.error ?? campaignsResult.error;

    if (fetchError) {
      logError('AdminDonors.loadDonors', fetchError);
      setError(fetchError.message);
      setDonors([]);
      setLoading(false);
      return;
    }

    const campaignMap = buildCampaignTitleMap(campaignsResult.data ?? []);
    const nextDonors = deriveDonors(donationsResult.data ?? [], campaignMap);
    setDonors(nextDonors);
    if (selectedDonorIdToKeep) {
      setSelectedDonor(nextDonors.find((donor) => donor.id === selectedDonorIdToKeep) ?? null);
    }
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

  async function openPaymentProof(transactionId: string, proofPath: string | null) {
    if (!proofPath) return;

    setOpeningProofId(transactionId);
    setError(null);

    const { data, error: signedUrlError } = await supabase.storage
      .from('donation-proofs')
      .createSignedUrl(proofPath, 60 * 10);

    setOpeningProofId(null);

    if (signedUrlError || !data?.signedUrl) {
      const message = signedUrlError?.message ?? 'Gagal membuka bukti pembayaran.';
      logError('AdminDonors.openPaymentProof', signedUrlError ?? new Error(message), { transactionId });
      setError(message);
      return;
    }

    window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
  }

  async function handleTransactionStatusUpdate(
    transactionId: string,
    paymentStatus: DonationRow['payment_status'],
  ) {
    setUpdatingTransactionId(transactionId);
    setError(null);

    const { error: updateError } = await updateDonationStatus(transactionId, paymentStatus);
    if (updateError) {
      logError('AdminDonors.handleTransactionStatusUpdate', updateError, {
        transactionId,
        paymentStatus,
      });
      setError(updateError.message);
      setUpdatingTransactionId(null);
      return;
    }

    const selectedDonorId = selectedDonor?.id;
    await loadDonors(selectedDonorId);
    setUpdatingTransactionId(null);
  }

  async function cleanupDonationProofs(transactions: DonationRow[], context: Record<string, unknown>) {
    const proofPaths = transactions
      .map((transaction) => transaction.payment_proof_path)
      .filter((path): path is string => Boolean(path));

    if (proofPaths.length === 0) return null;

    const cleanupResult = await deleteFilesFromStorage(proofPaths, { bucket: 'donation-proofs' });
    if (cleanupResult.failed > 0) {
      logError('AdminDonors.cleanupDonationProofs', new Error('Gagal membersihkan sebagian bukti pembayaran.'), {
        ...context,
        cleanupResult,
      });
    }
    return cleanupResult;
  }

  async function handleDeleteTransaction(transaction: DonationRow) {
    const confirmed = await confirm({
      title: 'Hapus Transaksi',
      message: `Hapus transaksi ${transaction.id.slice(0, 12)}? Data donasi ini akan hilang permanen dan total campaign akan dihitung ulang oleh database.`,
      confirmText: 'Hapus',
      variant: 'danger',
    });
    if (!confirmed) return;

    setDeletingTransactionId(transaction.id);
    setError(null);
    setNotice(null);

    const { error: deleteError } = await deleteDonation(transaction.id);
    if (deleteError) {
      logError('AdminDonors.handleDeleteTransaction', deleteError, { transactionId: transaction.id });
      setError(deleteError.message);
      setDeletingTransactionId(null);
      return;
    }

    const cleanupResult = await cleanupDonationProofs([transaction], { transactionId: transaction.id });
    const selectedDonorId = selectedDonor?.id;
    setNotice(storageCleanupNotice('Transaksi berhasil dihapus.', cleanupResult));
    await loadDonors(selectedDonorId);
    setDeletingTransactionId(null);
  }

  async function handleDeleteDonor(donor: DonorSummary) {
    const confirmed = await confirm({
      title: 'Hapus Donatur',
      message: `Hapus donatur "${donor.name}" beserta ${donor.transaction_count} transaksi? Semua histori donasi donor ini akan hilang permanen.`,
      confirmText: 'Hapus',
      variant: 'danger',
    });
    if (!confirmed) return;

    setDeletingDonorId(donor.id);
    setError(null);
    setNotice(null);

    const deletedTransactions: DonationRow[] = [];
    for (const transaction of donor.transactions) {
      const { error: deleteError } = await deleteDonation(transaction.id);
      if (deleteError) {
        logError('AdminDonors.handleDeleteDonor', deleteError, {
          donorId: donor.id,
          transactionId: transaction.id,
        });
        setError(deleteError.message);
        setDeletingDonorId(null);
        return;
      }
      deletedTransactions.push(transaction);
    }

    const cleanupResult = await cleanupDonationProofs(deletedTransactions, { donorId: donor.id });
    if (selectedDonor?.id === donor.id) {
      setSelectedDonor(null);
    }
    setNotice(storageCleanupNotice('Donatur berhasil dihapus.', cleanupResult));
    setDeletingDonorId(null);
    await loadDonors();
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

      {notice && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {notice}
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
                        <button
                          type="button"
                          onClick={() => void handleDeleteDonor(donor)}
                          disabled={deletingDonorId === donor.id}
                          className="p-2 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Hapus Donatur"
                        >
                          <Trash2 size={16} />
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
        widthClassName="max-w-5xl"
        footer={(
          <div className="flex w-full flex-wrap justify-end gap-2">
            <button
              type="button"
              disabled={!selectedDonor || deletingDonorId === selectedDonor.id}
              onClick={() => {
                if (selectedDonor) void handleDeleteDonor(selectedDonor);
              }}
              className="mr-auto px-4 py-2 text-sm font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 transition-colors disabled:opacity-50"
            >
              {deletingDonorId === selectedDonor?.id ? 'Menghapus...' : 'Hapus Donatur'}
            </button>
            <button
              type="button"
              onClick={() => setSelectedDonor(null)}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Tutup
            </button>
          </div>
        )}
      >
        {selectedDonor && (
          <div className="space-y-6">
            {/* Profil Summary Header Card */}
            <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 shrink-0 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100 flex items-center justify-center font-bold text-lg">
                  {getInitials(selectedDonor.name)}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-lg font-bold text-slate-900 leading-tight">{selectedDonor.name}</h2>
                    <span
                      className={cn(
                        'px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider',
                        selectedDonor.status === 'identified'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50'
                          : 'bg-slate-50 text-slate-600 border border-slate-200',
                      )}
                    >
                      {selectedDonor.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5 mt-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <Mail size={14} className="text-slate-400" />
                      {selectedDonor.email ?? '-'}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MessageCircle size={14} className="text-slate-400" />
                      {selectedDonor.phone ?? '-'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Statistik Kontribusi Grid */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
              {[
                ['Total Donasi', formatCurrency(selectedDonor.total_donated), 'text-emerald-700 bg-emerald-50/20 border-emerald-100/50'],
                ['Jumlah Transaksi', `${selectedDonor.transaction_count} transaksi`, 'bg-slate-50/50'],
                ['Donasi Pertama', formatAdminDate(selectedDonor.first_donation_at, true), 'bg-slate-50/50'],
                ['Donasi Terakhir', formatAdminDate(selectedDonor.last_donation_at, true), 'bg-slate-50/50'],
              ].map(([label, value, extraClass = '']) => (
                <div key={label} className={cn('p-4 border border-slate-100 rounded-2xl flex flex-col justify-between', extraClass)}>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
                  <p className="mt-2 text-base font-black text-slate-900 break-words">{value}</p>
                </div>
              ))}
            </div>

            {/* Metadata Footer */}
            <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400">
              <span className="font-medium">ID Donor / ID Pengguna</span>
              <span className="font-mono select-all text-slate-600 break-all">{selectedDonor.id}</span>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-sm font-bold text-slate-900">Riwayat Transaksi</h3>
                <span className="text-xs font-medium text-slate-500">
                  {selectedDonor.transactions.length} transaksi
                </span>
              </div>
              <div className="space-y-3">
                {selectedDonor.transactions.map((transaction) => (
                  <div key={transaction.id} className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900">{transaction.campaign_title}</p>
                        <p className="mt-1 text-xs font-mono text-slate-400 break-all">{transaction.id}</p>
                        <p className="mt-2 text-xs text-slate-500">
                          {formatAdminDate(transaction.created_at, true)}
                        </p>
                      </div>
                      <div className="sm:text-right">
                        <p className="text-base font-black text-zinc-950">{formatCurrency(transaction.amount)}</p>
                        <span
                          className={cn(
                            'mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider',
                            transaction.payment_status === 'success'
                              ? 'bg-emerald-100 text-emerald-700'
                              : transaction.payment_status === 'pending'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-rose-100 text-rose-700',
                          )}
                        >
                          {transaction.payment_status}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      {[
                        ['Metode Bayar', transaction.payment_method ?? '-'],
                        ['Anonim', transaction.is_anonymous ? 'Ya' : 'Tidak'],
                        ['Bukti Bayar', transaction.payment_proof_path ? 'Tersedia' : '-'],
                        ['Campaign ID', transaction.campaign_id],
                      ].map(([label, value]) => (
                        <div key={`${transaction.id}-${label}`} className="rounded-lg bg-slate-50 p-3">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
                          <p className="mt-1 text-xs font-semibold text-slate-700 break-words">{value}</p>
                        </div>
                      ))}
                    </div>

                    {transaction.message ? (
                      <div className="mt-3 rounded-lg bg-slate-50 p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Pesan</p>
                        <p className="mt-1 text-sm text-slate-700">{transaction.message}</p>
                      </div>
                    ) : null}

                    {transaction.payment_proof_path ? (
                      <button
                        type="button"
                        onClick={() => openPaymentProof(transaction.id, transaction.payment_proof_path)}
                        disabled={openingProofId === transaction.id}
                        className="mt-3 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <ExternalLink size={14} />
                        {openingProofId === transaction.id ? 'Membuka...' : 'Lihat Bukti Pembayaran'}
                      </button>
                    ) : null}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {transaction.payment_status !== 'success' ? (
                        <button
                          type="button"
                          onClick={() => void handleTransactionStatusUpdate(transaction.id, 'success')}
                          disabled={updatingTransactionId === transaction.id}
                          className="inline-flex items-center rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {updatingTransactionId === transaction.id ? 'Menyimpan...' : 'Konfirmasi Pembayaran'}
                        </button>
                      ) : null}
                      {transaction.payment_status !== 'failed' ? (
                        <button
                          type="button"
                          onClick={() => void handleTransactionStatusUpdate(transaction.id, 'failed')}
                          disabled={updatingTransactionId === transaction.id}
                          className="inline-flex items-center rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 transition-colors hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Tandai Gagal
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => void handleDeleteTransaction(transaction)}
                        disabled={deletingTransactionId === transaction.id}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs font-bold text-rose-700 transition-colors hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Trash2 size={14} />
                        {deletingTransactionId === transaction.id ? 'Menghapus...' : 'Hapus Transaksi'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </AdminModal>
      {ConfirmDialogElement}
    </div>
  );
}
