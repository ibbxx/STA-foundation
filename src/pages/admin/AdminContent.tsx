import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, CheckCircle2, Edit2, Layers3, Plus, RefreshCw, Save, Search, Sparkles, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import AdminModal from '../../components/admin/AdminModal';
import { adminProgramSchema, programIconOptions, type AdminProgramValues } from '../../lib/admin-schemas';
import { formatAdminDate } from '../../lib/admin-helpers';
import { deleteProgram, fetchProgramRows, insertProgram, updateProgram } from '../../lib/admin-repository';
import {
  buildProgramSummary,
  defaultProgramValues,
  filterPrograms,
  toProgramPayload,
} from '../../lib/admin-view-models';
import { logError } from '../../lib/error-logger';
import { ProgramRow } from '../../lib/supabase';
import { cn } from '../../lib/utils';

export default function AdminContent() {
  const [programs, setPrograms] = useState<ProgramRow[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [mode, setMode] = useState<'create' | 'edit' | null>(null);
  const [editingProgram, setEditingProgram] = useState<ProgramRow | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AdminProgramValues>({
    resolver: zodResolver(adminProgramSchema),
    defaultValues: defaultProgramValues,
  });

  async function loadPrograms() {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await fetchProgramRows();

    if (fetchError) {
      logError('AdminContent.loadPrograms', fetchError);
      setError(fetchError.message);
      setPrograms([]);
      setLoading(false);
      return;
    }

    setPrograms(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadPrograms();
  }, []);

  useEffect(() => {
    if (mode === 'edit' && editingProgram) {
      reset({
        slug: editingProgram.slug,
        title: editingProgram.title,
        description: editingProgram.description,
        icon_name: editingProgram.icon_name,
        content: editingProgram.content ?? '',
      });
      return;
    }

    reset(defaultProgramValues);
  }, [editingProgram, mode, reset]);

  const filteredPrograms = useMemo(() => filterPrograms(programs, searchQuery), [programs, searchQuery]);

  const summary = useMemo(() => buildProgramSummary(programs), [programs]);

  function closeModal(force = false) {
    if (isSubmitting && !force) return;
    setMode(null);
    setEditingProgram(null);
    reset(defaultProgramValues);
  }

  function openCreateModal() {
    setNotice(null);
    setEditingProgram(null);
    setMode('create');
  }

  function openEditModal(program: ProgramRow) {
    setNotice(null);
    setEditingProgram(program);
    setMode('edit');
  }

  async function onSubmit(values: AdminProgramValues) {
    setNotice(null);
    setError(null);

    const payload = toProgramPayload(values);
    const query = mode === 'edit' && editingProgram
      ? updateProgram(editingProgram.id, payload)
      : insertProgram(payload);

    const { error: submitError } = await query;

    if (submitError) {
      logError('AdminContent.submitProgram', submitError, {
        mode,
        programId: editingProgram?.id,
      });
      setError(submitError.message);
      return;
    }

    closeModal(true);
    setNotice(mode === 'edit' ? 'Program berhasil diperbarui.' : 'Program baru berhasil ditambahkan.');
    await loadPrograms();
  }

  async function handleDelete(program: ProgramRow) {
    setNotice(null);
    setError(null);
    const confirmed = window.confirm(
      `Apakah Anda yakin ingin menghapus program "${program.title}"?\n\nTindakan ini tidak dapat dibatalkan dan data tidak dapat dikembalikan lagi.`
    );
    if (!confirmed) return;

    setDeletingId(program.id);
    const { error: deleteError } = await deleteProgram(program.id);

    if (deleteError) {
      logError('AdminContent.deleteProgram', deleteError, {
        programId: program.id,
      });
      setError(deleteError.message);
      setDeletingId(null);
      return;
    }

    setDeletingId(null);
    setNotice(`Program "${program.title}" berhasil dihapus.`);
    await loadPrograms();
  }

  const selectedIcon = watch('icon_name');
  const modalTitle = mode === 'edit' ? 'Edit Program' : 'Tambah Program';

  return (
    <div className="space-y-8">
      {/* ═══════ PROGRAMS ═══════ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Program STA</h1>
          <p className="text-sm text-slate-500 mt-1">Kelola konten dan deskripsi dari program Sekolah Tanah Air.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => loadPrograms()}
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
            Tambah Program
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm flex items-start gap-4">
          <div className="p-3 bg-zinc-100 text-zinc-900 rounded-xl">
            <Layers3 size={24} />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Total Program</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{summary.total}</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm flex items-start gap-4">
          <div className="p-3 bg-sky-50 text-sky-600 rounded-xl">
            <Sparkles size={24} />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Program dengan Detail Konten</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{summary.withContent}</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col justify-center">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Update Terakhir</p>
          <p className="mt-1 text-xl font-bold text-slate-900">{summary.lastUpdated}</p>
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

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Cari program..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 outline-none transition-all placeholder:text-slate-400"
            />
          </div>
          <div className="flex flex-wrap gap-2 hidden lg:flex">
            {programIconOptions.slice(0, 5).map((iconName) => (
              <span key={iconName} className="px-2.5 py-1 text-[10px] font-mono font-medium text-slate-500 bg-slate-100 rounded-md">
                {iconName}
              </span>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="px-6 py-12 text-center text-sm text-slate-500">Memuat data program...</div>
        ) : filteredPrograms.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-slate-500">Belum ada program yang ditemukan.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-xs font-semibold tracking-wider text-slate-500 uppercase">
                  <th className="px-6 py-4">Program</th>
                  <th className="px-6 py-4">Slug</th>
                  <th className="px-6 py-4">Icon</th>
                  <th className="px-6 py-4">Diperbarui</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPrograms.map((program) => (
                  <tr key={program.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-slate-900">{program.title}</p>
                      <p className="mt-1 text-xs text-slate-500 max-w-sm truncate">{program.description}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 text-xs font-mono text-slate-600 bg-slate-100 rounded-md">{program.slug}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 text-[11px] font-semibold text-zinc-950 bg-zinc-100 rounded-md uppercase tracking-wider">{program.icon_name}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">{formatAdminDate(program.updated_at, true)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => openEditModal(program)}
                          className="p-2 text-slate-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(program)}
                          disabled={deletingId === program.id}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Hapus"
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
        title={modalTitle}
        description="Kelola narasi dan detail program di sini."
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
              form="program-form"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-zinc-900 rounded-xl hover:bg-zinc-950 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </button>
          </>
        )}
      >
        <form id="program-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-slate-700">Judul Program</span>
              <input
                type="text"
                {...register('title')}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 outline-none transition-all placeholder:text-slate-400"
              />
              {errors.title && <p className="text-xs text-rose-500">{errors.title.message}</p>}
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-slate-700">Slug</span>
              <input
                type="text"
                {...register('slug')}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 outline-none transition-all placeholder:text-slate-400"
              />
              {errors.slug && <p className="text-xs text-rose-500">{errors.slug.message}</p>}
            </label>
          </div>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-700">Deskripsi Singkat</span>
            <textarea
              rows={3}
              {...register('description')}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 outline-none transition-all placeholder:text-slate-400"
            />
            {errors.description && <p className="text-xs text-rose-500">{errors.description.message}</p>}
          </label>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <p className="text-sm font-medium text-slate-700">Pilih Ikon</p>
            <div className="flex flex-wrap gap-2">
              {programIconOptions.map((iconName) => (
                <button
                  key={iconName}
                  type="button"
                  onClick={() => setValue('icon_name', iconName, { shouldDirty: true, shouldValidate: true })}
                  className={cn(
                    'px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider rounded-lg transition-colors border',
                    selectedIcon === iconName
                      ? 'bg-zinc-900 text-white border-zinc-900'
                      : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-700',
                  )}
                >
                  {iconName}
                </button>
              ))}
            </div>
            {errors.icon_name && <p className="text-xs text-rose-500">{errors.icon_name.message}</p>}
          </div>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-700">Konten Detail</span>
            <textarea
              rows={8}
              {...register('content')}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 outline-none transition-all placeholder:text-slate-400"
            />
            {errors.content && <p className="text-xs text-rose-500">{errors.content.message}</p>}
          </label>
        </form>
      </AdminModal>
    </div>
  );
}
