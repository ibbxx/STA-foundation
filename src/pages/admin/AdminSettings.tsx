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
  Settings2,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import AdminModal from '../../components/admin/AdminModal';
import {
  AdminHeroSettingsValues,
  AdminSiteContentValues,
  adminHeroSettingsSchema,
  adminSiteContentSchema,
} from '../../lib/admin-schemas';
import { formatAdminDate, previewJson } from '../../lib/admin-helpers';
import { SiteContentInsert, SiteContentRow, supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';

const heroKeys = [
  'hero_title',
  'hero_description',
  'hero_primary_label',
  'hero_primary_link',
  'hero_secondary_label',
  'hero_secondary_link',
] as const;

const defaultHeroValues: AdminHeroSettingsValues = {
  hero_title: '',
  hero_description: '',
  hero_primary_label: '',
  hero_primary_link: '',
  hero_secondary_label: '',
  hero_secondary_link: '',
};

const defaultContentValues: AdminSiteContentValues = {
  key: '',
  value_text: '{\n  \n}',
};

function stringifyValue(value: SiteContentRow['value']) {
  return value === null ? 'null' : JSON.stringify(value, null, 2);
}

function getStringValue(value: SiteContentRow['value']) {
  if (typeof value === 'string') return value;
  if (value === null) return '';
  return JSON.stringify(value);
}

function buildHeroValues(entries: SiteContentRow[]): AdminHeroSettingsValues {
  const entryByKey = new Map(entries.map((entry) => [entry.key, entry]));

  return {
    hero_title: getStringValue(entryByKey.get('hero_title')?.value ?? null),
    hero_description: getStringValue(entryByKey.get('hero_description')?.value ?? null),
    hero_primary_label: getStringValue(entryByKey.get('hero_primary_label')?.value ?? null),
    hero_primary_link: getStringValue(entryByKey.get('hero_primary_link')?.value ?? null),
    hero_secondary_label: getStringValue(entryByKey.get('hero_secondary_label')?.value ?? null),
    hero_secondary_link: getStringValue(entryByKey.get('hero_secondary_link')?.value ?? null),
  };
}

export default function AdminSettings() {
  const [entries, setEntries] = useState<SiteContentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [mode, setMode] = useState<'create' | 'edit' | null>(null);
  const [editingEntry, setEditingEntry] = useState<SiteContentRow | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [heroSaving, setHeroSaving] = useState(false);
  const [storageStatus, setStorageStatus] = useState<{
    siteMedia: boolean;
    campaignAssets: boolean;
    checking: boolean;
  }>({ siteMedia: false, campaignAssets: false, checking: false });

  const heroForm = useForm<AdminHeroSettingsValues>({
    resolver: zodResolver(adminHeroSettingsSchema),
    defaultValues: defaultHeroValues,
  });

  const contentForm = useForm<AdminSiteContentValues>({
    resolver: zodResolver(adminSiteContentSchema),
    defaultValues: defaultContentValues,
  });

  async function loadSettings() {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from('site_content')
      .select('*')
      .order('updated_at', { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
      setEntries([]);
      setLoading(false);
      return;
    }

    const nextEntries = data ?? [];
    setEntries(nextEntries);
    heroForm.reset(buildHeroValues(nextEntries));
    setLoading(false);
    checkStorageBuckets();
  }

  async function checkStorageBuckets() {
    setStorageStatus((prev) => ({ ...prev, checking: true }));
    try {
      const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
      if (bucketError) throw bucketError;

      const bucketNames = buckets?.map((b) => b.name) ?? [];
      setStorageStatus({
        siteMedia: bucketNames.includes('site-media'),
        campaignAssets: bucketNames.includes('campaign-assets'),
        checking: false,
      });
    } catch (err) {
      console.error('Storage check failed:', err);
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
        value_text: stringifyValue(editingEntry.value),
      });
      return;
    }

    contentForm.reset(defaultContentValues);
  }, [contentForm, editingEntry, mode]);

  const latestUpdate = useMemo(() => {
    if (entries.length === 0) return '-';
    return formatAdminDate(entries[0].updated_at, true);
  }, [entries]);

  const heroConfiguredCount = useMemo(
    () => entries.filter((entry) => heroKeys.includes(entry.key as (typeof heroKeys)[number])).length,
    [entries],
  );

  async function handleHeroSubmit(values: AdminHeroSettingsValues) {
    setNotice(null);
    setError(null);
    setHeroSaving(true);

    const payload: SiteContentInsert[] = [
      { key: 'hero_title', value: values.hero_title.trim() },
      { key: 'hero_description', value: values.hero_description.trim() },
      { key: 'hero_primary_label', value: values.hero_primary_label.trim() },
      { key: 'hero_primary_link', value: values.hero_primary_link.trim() },
      { key: 'hero_secondary_label', value: values.hero_secondary_label.trim() || null },
      { key: 'hero_secondary_link', value: values.hero_secondary_link.trim() || null },
    ];

    const { error: submitError } = await supabase
      .from('site_content')
      .upsert(payload as never, { onConflict: 'key' });

    if (submitError) {
      setError(submitError.message);
      setHeroSaving(false);
      return;
    }

    setHeroSaving(false);
    setNotice('Konten hero berhasil diperbarui.');
    await loadSettings();
  }

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

    const payload: SiteContentInsert = {
      key: values.key.trim(),
      value: JSON.parse(values.value_text),
    };

    const query = mode === 'edit' && editingEntry
      ? supabase.from('site_content').update({ value: payload.value } as never).eq('id', editingEntry.id)
      : supabase.from('site_content').insert(payload as never);

    const { error: submitError } = await query;

    if (submitError) {
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
    const confirmed = window.confirm(`Hapus site content "${entry.key}"?`);
    if (!confirmed) return;

    setDeletingId(entry.id);
    const { error: deleteError } = await supabase.from('site_content').delete().eq('id', entry.id);

    if (deleteError) {
      setError(deleteError.message);
      setDeletingId(null);
      return;
    }

    setDeletingId(null);
    setNotice(`Entri "${entry.key}" berhasil dihapus.`);
    await loadSettings();
  }

  const heroPreview = heroForm.watch();

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
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium shadow-sm hover:bg-emerald-700 transition-colors"
          >
            <Plus size={16} />
            Tambah Entri
          </button>
        </div>
      </div>

      {notice && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-sm text-emerald-700">
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

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <form
            onSubmit={heroForm.handleSubmit(handleHeroSubmit)}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Hero Section Manager</h3>
                <p className="text-sm text-slate-500 mt-1">Ubah judul dan teks ajakan (CTA) yang muncul paling atas di halaman utama.</p>
              </div>
              <button
                type="submit"
                disabled={heroSaving}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {heroSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {heroSaving ? 'Menyimpan...' : 'Simpan Hero'}
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-slate-700">Judul Utama</span>
                <input
                  type="text"
                  {...heroForm.register('hero_title')}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all placeholder:text-slate-400"
                />
                {heroForm.formState.errors.hero_title && <p className="text-xs text-rose-500">{heroForm.formState.errors.hero_title.message}</p>}
              </label>

              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-slate-700">Deskripsi</span>
                <textarea
                  rows={3}
                  {...heroForm.register('hero_description')}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all placeholder:text-slate-400"
                />
                {heroForm.formState.errors.hero_description && <p className="text-xs text-rose-500">{heroForm.formState.errors.hero_description.message}</p>}
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-slate-700">Label CTA Utama</span>
                  <input
                    type="text"
                    {...heroForm.register('hero_primary_label')}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all placeholder:text-slate-400"
                  />
                  {heroForm.formState.errors.hero_primary_label && <p className="text-xs text-rose-500">{heroForm.formState.errors.hero_primary_label.message}</p>}
                </label>

                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-slate-700">Link CTA Utama</span>
                  <input
                    type="text"
                    {...heroForm.register('hero_primary_link')}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all placeholder:text-slate-400"
                  />
                  {heroForm.formState.errors.hero_primary_link && <p className="text-xs text-rose-500">{heroForm.formState.errors.hero_primary_link.message}</p>}
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-slate-700">Label CTA Sekunder</span>
                  <input
                    type="text"
                    {...heroForm.register('hero_secondary_label')}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all placeholder:text-slate-400"
                  />
                  {heroForm.formState.errors.hero_secondary_label && <p className="text-xs text-rose-500">{heroForm.formState.errors.hero_secondary_label.message}</p>}
                </label>

                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-slate-700">Link CTA Sekunder</span>
                  <input
                    type="text"
                    {...heroForm.register('hero_secondary_link')}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all placeholder:text-slate-400"
                  />
                  {heroForm.formState.errors.hero_secondary_link && <p className="text-xs text-rose-500">{heroForm.formState.errors.hero_secondary_link.message}</p>}
                </label>
              </div>
            </div>
          </form>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-2 text-slate-900 mb-4">
              <Globe size={18} className="text-emerald-600" />
              <h3 className="text-base font-semibold">Preview Ringkas</h3>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
              <h4 className="text-lg font-bold text-slate-900 leading-tight">{heroPreview.hero_title || 'Judul hero'}</h4>
              <p className="mt-2 text-xs text-slate-500 leading-relaxed">{heroPreview.hero_description || 'Deskripsi hero.'}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-white bg-emerald-600 rounded-lg">
                  {heroPreview.hero_primary_label || 'CTA Utama'}
                </span>
                {heroPreview.hero_secondary_label && (
                  <span className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600 bg-white border border-slate-200 rounded-lg">
                    {heroPreview.hero_secondary_label}
                  </span>
                )}
              </div>
            </div>
          </div>

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
                  <span className="px-2 py-0.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 rounded uppercase">Active</span>
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
                  <span className="px-2 py-0.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 rounded uppercase">Active</span>
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
                          <span className="px-2 py-0.5 text-[9px] font-semibold text-emerald-700 bg-emerald-50 rounded-sm uppercase tracking-wider border border-emerald-100">
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
                          className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
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
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50"
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
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-500"
            />
            {contentForm.formState.errors.key && <p className="text-xs text-rose-500">{contentForm.formState.errors.key.message}</p>}
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-700">Nilai Konfigurasi (JSON Value)</span>
            <textarea
              rows={8}
              {...contentForm.register('value_text')}
              className="w-full px-3 py-2 font-mono text-sm bg-white border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all placeholder:text-slate-400"
            />
            {contentForm.formState.errors.value_text && <p className="text-xs text-rose-500">{contentForm.formState.errors.value_text.message}</p>}
          </label>
        </form>
      </AdminModal>
    </div>
  );
}
