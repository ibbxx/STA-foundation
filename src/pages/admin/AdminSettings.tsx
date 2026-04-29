import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertCircle,
  CheckCircle2,
  Database,
  Edit2,
  Globe,
  HardDrive,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import AdminModal from '../../components/admin/AdminModal';
import AdminHeroManager from '../../components/admin/AdminHeroManager';
import {
  AdminSiteContentValues,
  adminSiteContentSchema,
} from '../../lib/admin-schemas';
import { formatAdminDate, previewJson } from '../../lib/admin-helpers';
import {
  deleteSiteContent,
  fetchSiteContentRows,
  insertSiteContent,
  listStorageBuckets,
  updateSiteContent,
} from '../../lib/admin-repository';
import {
  defaultContentValues,
  heroKeys,
  stringifySiteContentValue,
} from '../../lib/admin-view-models';
import { logError } from '../../lib/error-logger';
import { SiteContentInsert, SiteContentRow } from '../../lib/supabase';

export default function AdminSettings() {
  const [entries, setEntries] = useState<SiteContentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [mode, setMode] = useState<'create' | 'edit' | null>(null);
  const [editingEntry, setEditingEntry] = useState<SiteContentRow | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [storageStatus, setStorageStatus] = useState<{
    siteMedia: boolean;
    campaignAssets: boolean;
    checking: boolean;
  }>({ siteMedia: false, campaignAssets: false, checking: false });

  const contentForm = useForm<AdminSiteContentValues>({
    resolver: zodResolver(adminSiteContentSchema),
    defaultValues: defaultContentValues,
  });

  async function loadSettings() {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await fetchSiteContentRows();

    if (fetchError) {
      logError('AdminSettings.loadSettings', fetchError);
      setError(fetchError.message);
      setEntries([]);
      setLoading(false);
      return;
    }

    const nextEntries = data ?? [];
    setEntries(nextEntries);
    setLoading(false);
    checkStorageBuckets();
  }

  async function checkStorageBuckets() {
    setStorageStatus((prev) => ({ ...prev, checking: true }));
    try {
      const { data: buckets, error: bucketError } = await listStorageBuckets();
      if (bucketError) throw bucketError;

      const bucketNames = buckets?.map((b) => b.name) ?? [];
      setStorageStatus({
        siteMedia: bucketNames.includes('site-media'),
        campaignAssets: bucketNames.includes('campaign-assets'),
        checking: false,
      });
    } catch (err) {
      logError('AdminSettings.checkStorageBuckets', err);
      setStorageStatus((prev) => ({ ...prev, checking: false }));
    }
  }

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (mode === 'edit' && editingEntry) {
      contentForm.reset({
        key: editingEntry.key,
        value_text: stringifySiteContentValue(editingEntry.value),
      });
      return;
    }

    contentForm.reset(defaultContentValues);
  }, [contentForm, editingEntry, mode]);

  const latestUpdate = useMemo(() => {
    if (entries.length === 0) return '-';
    return formatAdminDate(entries[0].updated_at, true);
  }, [entries]);

  function closeModal(force = false) {
    if (contentForm.formState.isSubmitting && !force) return;
    setMode(null);
    setEditingEntry(null);
    contentForm.reset(defaultContentValues);
  }

  function openCreateModal() {
    setNotice(null);
    setEditingEntry(null);
    setMode('create');
  }

  function openEditModal(entry: SiteContentRow) {
    setNotice(null);
    setEditingEntry(entry);
    setMode('edit');
  }

  async function handleContentSubmit(values: AdminSiteContentValues) {
    setNotice(null);
    setError(null);

    let parsedValue: SiteContentInsert['value'];
    try {
      parsedValue = JSON.parse(values.value_text);
    } catch (parseError) {
      logError('AdminSettings.handleContentSubmit.parseJson', parseError, {
        mode,
        key: values.key,
        entryId: editingEntry?.id,
      });
      throw parseError;
    }

    const payload: SiteContentInsert = {
      key: values.key.trim(),
      value: parsedValue,
    };

    const query = mode === 'edit' && editingEntry
      ? updateSiteContent(editingEntry.id, { value: payload.value })
      : insertSiteContent(payload);

    const { error: submitError } = await query;

    if (submitError) {
      logError('AdminSettings.handleContentSubmit', submitError, {
        mode,
        key: payload.key,
        entryId: editingEntry?.id,
      });
      setError(submitError.message);
      return;
    }

    closeModal(true);
    setNotice(mode === 'edit' ? 'Entri site content berhasil diperbarui.' : 'Entri site content berhasil ditambahkan.');
    await loadSettings();
  }

  async function handleDelete(entry: SiteContentRow) {
    setNotice(null);
    setError(null);
    const confirmed = window.confirm(
      `Apakah Anda yakin ingin menghapus site content "${entry.key}"?\n\nTindakan ini tidak dapat dibatalkan dan data tidak dapat dikembalikan lagi.`
    );
    if (!confirmed) return;

    setDeletingId(entry.id);
    const { error: deleteError } = await deleteSiteContent(entry.id);

    if (deleteError) {
      logError('AdminSettings.handleDelete', deleteError, {
        entryId: entry.id,
        key: entry.key,
      });
      setError(deleteError.message);
      setDeletingId(null);
      return;
    }

    setDeletingId(null);
    setNotice(`Entri "${entry.key}" berhasil dihapus.`);
    await loadSettings();
  }


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Pengaturan Portal</h1>
          <p className="text-sm text-slate-500 mt-1">Kelola konten halaman utama dan konfigurasi platform.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => loadSettings()}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-xl text-sm font-medium shadow-sm hover:bg-zinc-950 transition-colors"
          >
            <Plus size={16} />
            Tambah Entri
          </button>
        </div>
      </div>

      {notice && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-zinc-200 bg-zinc-100 text-sm text-zinc-950">
          <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Berhasil</p>
            <p className="mt-1">{notice}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-rose-200 bg-rose-50 text-sm text-rose-700">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Terjadi Kesalahan</p>
            <p className="mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* ═══════ HERO SLIDESHOW MANAGER ═══════ */}
      <AdminHeroManager />

      {/* Storage Status */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-2 text-slate-900 mb-4">
          <HardDrive size={18} className="text-amber-500" />
          <h3 className="text-base font-semibold">Storage & Media Status</h3>
        </div>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Database size={14} className="text-slate-400" />
              <span className="text-sm text-slate-500">site-media</span>
            </div>
            {storageStatus.checking ? (
              <Loader2 size={14} className="animate-spin text-slate-400" />
            ) : storageStatus.siteMedia ? (
              <span className="px-2 py-0.5 text-[10px] font-bold text-zinc-900 bg-zinc-100 rounded uppercase">Active</span>
            ) : (
              <span className="px-2 py-0.5 text-[10px] font-bold text-rose-600 bg-rose-50 rounded uppercase">Missing</span>
            )}
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Database size={14} className="text-slate-400" />
              <span className="text-sm text-slate-500">campaign-assets</span>
            </div>
            {storageStatus.checking ? (
              <Loader2 size={14} className="animate-spin text-slate-400" />
            ) : storageStatus.campaignAssets ? (
              <span className="px-2 py-0.5 text-[10px] font-bold text-zinc-900 bg-zinc-100 rounded uppercase">Active</span>
            ) : (
              <span className="px-2 py-0.5 text-[10px] font-bold text-rose-600 bg-rose-50 rounded uppercase">Missing</span>
            )}
          </div>
          {!storageStatus.checking && (!storageStatus.siteMedia || !storageStatus.campaignAssets) && (
            <div className="mt-2 p-3 bg-rose-50 border border-rose-100 rounded-lg">
              <p className="text-[11px] text-rose-700 leading-relaxed">
                <ShieldAlert size={12} className="inline mr-1 -mt-0.5" />
                Beberapa bucket belum terdeteksi. Pastikan bucket dibuat di Supabase Dashboard dengan akses <strong>Public</strong> agar media tampil.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h3 className="text-base font-semibold text-slate-900">Data Raw Konfigurasi</h3>
        </div>

        {loading ? (
          <div className="px-6 py-12 text-center text-sm text-slate-500">Memuat konfigurasi...</div>
        ) : entries.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-slate-500">Belum ada data pada tabel konfigurasi.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-xs font-semibold tracking-wider text-slate-500 uppercase">
                  <th className="px-6 py-4">Key</th>
                  <th className="px-6 py-4">Value</th>
                  <th className="px-6 py-4">Diperbarui</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {entries.map((entry) => (
                  <tr key={entry.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5 items-start">
                        <span className="px-2.5 py-1 text-[11px] font-mono font-medium text-slate-600 bg-slate-100 rounded-md">{entry.key}</span>
                        {heroKeys.includes(entry.key as (typeof heroKeys)[number]) && (
                          <span className="px-2 py-0.5 text-[9px] font-semibold text-zinc-950 bg-zinc-100 rounded-sm uppercase tracking-wider border border-zinc-200">
                            Hero
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600 line-clamp-2 max-w-sm">{previewJson(entry.value)}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">{formatAdminDate(entry.updated_at, true)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => openEditModal(entry)}
                          className="p-2 text-slate-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(entry)}
                          disabled={deletingId === entry.id}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
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
        open={mode !== null}
        onClose={closeModal}
        title={mode === 'edit' ? 'Edit Raw Entry' : 'Tambah Raw Entry'}
        description="Gunakan ini untuk menambah atau mengubah konfigurasi JSON yang belum memiliki form manager tersendiri."
        widthClassName="max-w-2xl"
        footer={(
          <>
            <button
              type="button"
              onClick={() => closeModal()}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              form="site-content-form"
              disabled={contentForm.formState.isSubmitting}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-zinc-900 rounded-xl hover:bg-zinc-950 transition-colors disabled:opacity-50"
            >
              {contentForm.formState.isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {contentForm.formState.isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </button>
          </>
        )}
      >
        <form id="site-content-form" onSubmit={contentForm.handleSubmit(handleContentSubmit)} className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-700">Kunci Konfigurasi (Key)</span>
            <input
              type="text"
              {...contentForm.register('key')}
              disabled={mode === 'edit'}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 outline-none transition-all placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-500"
            />
            {contentForm.formState.errors.key && <p className="text-xs text-rose-500">{contentForm.formState.errors.key.message}</p>}
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-700">Nilai Konfigurasi (JSON Value)</span>
            <textarea
              rows={8}
              {...contentForm.register('value_text')}
              className="w-full px-3 py-2 font-mono text-sm bg-white border border-slate-200 rounded-xl focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 outline-none transition-all placeholder:text-slate-400"
            />
            {contentForm.formState.errors.value_text && <p className="text-xs text-rose-500">{contentForm.formState.errors.value_text.message}</p>}
          </label>
        </form>
      </AdminModal>
    </div>
  );
}
