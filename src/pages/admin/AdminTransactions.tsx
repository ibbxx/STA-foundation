import { AlertCircle, CheckCircle, Clock, Download, Eye, Plus, RefreshCw, Save, Search, Settings, Trash2, Upload, XCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import AdminModal from '../../components/admin/AdminModal';
import { downloadCsv } from '../../lib/admin-export';
import { formatAdminDate } from '../../lib/admin-helpers';
import { fetchSiteContentRows, fetchTransactionRows, updateDonationStatus, upsertSiteContent } from '../../lib/admin-repository';
import {
  buildTransactionSummary,
  buildTransactionViews,
  filterTransactions,
  type TransactionView,
} from '../../lib/admin-view-models';
import { logError } from '../../lib/error-logger';
import {
  DEFAULT_PAYMENT_SETTINGS,
  PAYMENT_SETTINGS_KEY,
  normalizePaymentSettings,
  type PaymentSettings,
} from '../../lib/payment-settings';
import { parseSiteContentValue, CampaignRow, DonationRow, supabase, type Json } from '../../lib/supabase';
import { uploadAdminImage } from '../../lib/supabase/storage';
import { cn, formatCurrency } from '../../lib/utils';

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState<TransactionView[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | DonationRow['payment_status']>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionView | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>(DEFAULT_PAYMENT_SETTINGS);
  const [savingPaymentSettings, setSavingPaymentSettings] = useState(false);
  const [uploadingQris, setUploadingQris] = useState(false);
  const [openingProof, setOpeningProof] = useState(false);

  async function loadTransactions() {
    setLoading(true);
    setError(null);

    const [donationsResult, campaignsResult] = await fetchTransactionRows();

    if (donationsResult.error || campaignsResult.error) {
      logError('AdminTransactions.loadTransactions', donationsResult.error ?? campaignsResult.error, {
        donationsError: donationsResult.error,
        campaignsError: campaignsResult.error,
      });
      setError(donationsResult.error?.message ?? campaignsResult.error?.message ?? 'Terjadi kesalahan saat memuat data.');
      setTransactions([]);
      setLoading(false);
      return;
    }

    const donationRows = (donationsResult.data ?? []) as DonationRow[];
    const campaignRows = (campaignsResult.data ?? []) as Pick<CampaignRow, 'id' | 'title'>[];
    setTransactions(buildTransactionViews(donationRows, campaignRows));

    setLoading(false);
  }

  useEffect(() => {
    loadTransactions();
    loadPaymentSettings();
  }, []);

  async function loadPaymentSettings() {
    const { data, error: settingsError } = await fetchSiteContentRows();
    if (settingsError) {
      logError('AdminTransactions.loadPaymentSettings', settingsError);
      setError(settingsError.message);
      return;
    }

    const row = (data ?? []).find((entry) => entry.key === PAYMENT_SETTINGS_KEY);
    const parsed = parseSiteContentValue<PaymentSettings>(row?.value);
    setPaymentSettings(normalizePaymentSettings(parsed));
  }

  const filteredTransactions = useMemo(
    () => filterTransactions(transactions, searchQuery, statusFilter),
    [transactions, searchQuery, statusFilter],
  );

  const summary = useMemo(() => buildTransactionSummary(transactions), [transactions]);

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
      payment_proof_path: transaction.payment_proof_path ?? '',
      message: transaction.message ?? '',
      created_at: transaction.created_at,
    })));
  }

  async function handleStatusUpdate(paymentStatus: DonationRow['payment_status']) {
    if (!selectedTransaction) return;
    setUpdatingStatus(true);
    setError(null);

    const { error: updateError } = await updateDonationStatus(selectedTransaction.id, paymentStatus);
    if (updateError) {
      logError('AdminTransactions.handleStatusUpdate', updateError, {
        donationId: selectedTransaction.id,
        paymentStatus,
      });
      setError(updateError.message);
      setUpdatingStatus(false);
      return;
    }

    setSelectedTransaction(null);
    setUpdatingStatus(false);
    await loadTransactions();
  }

  async function savePaymentSettings() {
    setSavingPaymentSettings(true);
    setError(null);
    setNotice(null);

    const sanitized = normalizePaymentSettings(paymentSettings);
    const { error: saveError } = await upsertSiteContent([{
      key: PAYMENT_SETTINGS_KEY,
      value: sanitized as unknown as Json,
    }]);

    if (saveError) {
      logError('AdminTransactions.savePaymentSettings', saveError);
      setError(saveError.message);
      setSavingPaymentSettings(false);
      return;
    }

    setPaymentSettings(sanitized);
    setNotice('Pengaturan pembayaran berhasil disimpan.');
    setSavingPaymentSettings(false);
  }

  async function handleQrisUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadingQris(true);
      const url = await uploadAdminImage(file, 'general');
      setPaymentSettings((current) => ({ ...current, qris_image_url: url }));
    } catch (uploadError) {
      logError('AdminTransactions.handleQrisUpload', uploadError);
      setError(uploadError instanceof Error ? uploadError.message : 'Gagal mengunggah QRIS.');
    } finally {
      setUploadingQris(false);
      event.target.value = '';
    }
  }

  function updateBankAccount(index: number, field: 'bank_name' | 'account_number' | 'account_name', value: string) {
    setPaymentSettings((current) => ({
      ...current,
      bank_accounts: current.bank_accounts.map((account, accountIndex) => (
        accountIndex === index ? { ...account, [field]: value } : account
      )),
    }));
  }

  function addBankAccount() {
    setPaymentSettings((current) => ({
      ...current,
      bank_accounts: [
        ...current.bank_accounts,
        {
          id: `bank_${Date.now()}`,
          bank_name: '',
          account_number: '',
          account_name: '',
        },
      ],
    }));
  }

  function removeBankAccount(index: number) {
    setPaymentSettings((current) => ({
      ...current,
      bank_accounts: current.bank_accounts.filter((_, accountIndex) => accountIndex !== index),
    }));
  }

  async function openPaymentProof() {
    if (!selectedTransaction?.payment_proof_path) return;

    setOpeningProof(true);
    setError(null);
    const { data, error: signedUrlError } = await supabase.storage
      .from('donation-proofs')
      .createSignedUrl(selectedTransaction.payment_proof_path, 60 * 10);

    if (signedUrlError || !data?.signedUrl) {
      logError('AdminTransactions.openPaymentProof', signedUrlError, {
        donationId: selectedTransaction.id,
      });
      setError(signedUrlError?.message ?? 'Gagal membuka bukti pembayaran.');
      setOpeningProof(false);
      return;
    }

    window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
    setOpeningProof(false);
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
            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-xl text-sm font-medium shadow-sm hover:bg-zinc-950 transition-colors disabled:opacity-50"
          >
            <Download size={16} />
            Ekspor CSV
          </button>
        </div>
      </div>

      {notice && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {notice}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Settings size={18} className="text-slate-500" />
              <h2 className="text-base font-bold text-slate-900">Pengaturan Pembayaran</h2>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Toggle manual donation mengatur apakah QRIS/transfer tampil di halaman publik.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void savePaymentSettings()}
            disabled={savingPaymentSettings || uploadingQris}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-950 disabled:opacity-50"
          >
            <Save size={16} />
            {savingPaymentSettings ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <input
              type="checkbox"
              checked={paymentSettings.manual_enabled}
              onChange={(event) => setPaymentSettings((current) => ({ ...current, manual_enabled: event.target.checked }))}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <div>
              <p className="text-sm font-bold text-slate-900">Aktifkan Donasi Manual</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                Jika dimatikan, QRIS, transfer bank, dan upload bukti tidak tampil di halaman publik.
              </p>
            </div>
          </label>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <input
              type="checkbox"
              checked={paymentSettings.gateway_enabled}
              onChange={(event) => setPaymentSettings((current) => ({ ...current, gateway_enabled: event.target.checked }))}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <div>
              <p className="text-sm font-bold text-slate-900">Aktifkan Payment Gateway</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                Disiapkan untuk fase integrasi pihak ketiga setelah dokumen provider siap.
              </p>
            </div>
          </label>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <div className="space-y-3 rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-slate-900">QRIS Manual</p>
                <p className="mt-1 text-xs text-slate-500">Gambar ini tampil ke donatur saat memilih QRIS.</p>
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                <Upload size={14} />
                {uploadingQris ? 'Upload...' : 'Upload'}
                <input type="file" accept="image/*" className="hidden" onChange={handleQrisUpload} disabled={uploadingQris} />
              </label>
            </div>
            {paymentSettings.qris_image_url ? (
              <img src={paymentSettings.qris_image_url} alt="QRIS Donasi" className="h-44 w-full rounded-xl border border-slate-100 object-contain bg-slate-50 p-2" />
            ) : (
              <div className="flex h-44 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-400">
                QRIS belum diunggah
              </div>
            )}
          </div>

          <div className="space-y-3 rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-slate-900">Rekening Transfer</p>
                <p className="mt-1 text-xs text-slate-500">Minimal satu rekening lengkap agar opsi transfer tampil publik.</p>
              </div>
              <button
                type="button"
                onClick={addBankAccount}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Plus size={14} />
                Tambah
              </button>
            </div>

            <div className="space-y-3">
              {paymentSettings.bank_accounts.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-400">
                  Belum ada rekening transfer
                </div>
              ) : paymentSettings.bank_accounts.map((account, index) => (
                <div key={account.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <div className="grid gap-2 sm:grid-cols-3">
                    <input
                      value={account.bank_name}
                      onChange={(event) => updateBankAccount(index, 'bank_name', event.target.value)}
                      placeholder="Bank"
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"
                    />
                    <input
                      value={account.account_number}
                      onChange={(event) => updateBankAccount(index, 'account_number', event.target.value)}
                      placeholder="Nomor rekening"
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"
                    />
                    <div className="flex gap-2">
                      <input
                        value={account.account_name}
                        onChange={(event) => updateBankAccount(index, 'account_name', event.target.value)}
                        placeholder="Atas nama"
                        className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => removeBankAccount(index)}
                        className="rounded-lg border border-rose-100 bg-white p-2 text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <label className="mt-5 block">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Instruksi Manual</span>
          <textarea
            value={paymentSettings.manual_instructions}
            onChange={(event) => setPaymentSettings((current) => ({ ...current, manual_instructions: event.target.value }))}
            rows={2}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
          />
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Berhasil', data: summary.success, color: 'text-zinc-900', bg: 'bg-zinc-100', icon: CheckCircle },
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
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 outline-none transition-all placeholder:text-slate-400"
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
                    ? 'bg-white text-zinc-950 shadow-sm border border-slate-200/50'
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
                      <p className="text-sm font-semibold text-zinc-900">{formatCurrency(transaction.amount)}</p>
                      <p className="text-xs text-slate-500 mt-1">{transaction.payment_method ?? '-'}</p>
                      {transaction.payment_proof_path ? (
                        <p className="mt-1 text-[11px] font-semibold text-emerald-600">Bukti tersedia</p>
                      ) : null}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={cn(
                          'inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider',
                          transaction.payment_status === 'success'
                            ? 'bg-zinc-100 text-zinc-950 ring-1 ring-zinc-200/50'
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
                          className="p-2 text-slate-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
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
          <div className="flex w-full flex-wrap justify-end gap-2">
            {selectedTransaction?.payment_status !== 'failed' ? (
              <button
                type="button"
                disabled={updatingStatus}
                onClick={() => void handleStatusUpdate('failed')}
                className="px-4 py-2 text-sm font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 transition-colors disabled:opacity-50"
              >
                Tandai Gagal
              </button>
            ) : null}
            {selectedTransaction?.payment_status !== 'success' ? (
              <button
                type="button"
                disabled={updatingStatus}
                onClick={() => void handleStatusUpdate('success')}
                className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 border border-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                Konfirmasi Pembayaran
              </button>
            ) : null}
            <button
              type="button"
              disabled={updatingStatus}
              onClick={() => setSelectedTransaction(null)}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Tutup
            </button>
          </div>
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
              ['Bukti Bayar', selectedTransaction.payment_proof_path ? 'Tersedia' : '-'],
              ['Waktu', formatAdminDate(selectedTransaction.created_at, true)],
              ['Pesan', selectedTransaction.message ?? '-'],
            ].map(([label, value]) => (
              <div key={label} className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
                <p className="mt-1 text-sm font-medium text-slate-700 break-words">{value}</p>
              </div>
            ))}
            {selectedTransaction.payment_proof_path ? (
              <button
                type="button"
                onClick={() => void openPaymentProof()}
                disabled={openingProof}
                className="sm:col-span-2 inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
              >
                <Eye size={16} />
                {openingProof ? 'Membuka...' : 'Lihat Bukti Pembayaran'}
              </button>
            ) : null}
          </div>
        )}
      </AdminModal>
    </div>
  );
}
