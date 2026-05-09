import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, CheckCircle2, Edit2, Layers3, Plus, RefreshCw, Save, Search, Settings, Sparkles, Trash2 } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import AdminModal from '../../components/admin/AdminModal';
import AdminHeroManager from '../../components/admin/AdminHeroManager';
import AdminOtherPagesHero from '../../components/admin/AdminOtherPagesHero';
import AdminVolunteerPrograms from '../../components/admin/AdminVolunteerPrograms';
import { adminProgramSchema, programIconOptions, type AdminProgramValues } from '../../lib/admin/schemas';
import { formatAdminDate } from '../../lib/admin/helpers';
import { deleteProgram, fetchProgramRows, insertProgram, updateProgram, fetchSiteContentRows, upsertSiteContent } from '../../lib/admin/repository';
import {
  buildProgramSummary,
  defaultProgramValues,
  filterPrograms,
  toProgramPayload,
} from '../../lib/admin-view-models';
import { uploadAdminImage } from '../../lib/supabase/storage';
import { getProgramIcon } from '../../lib/program-icons';
import { logError } from '../../lib/error-logger';
import { ProgramRow, parseSiteContentValue } from '../../lib/supabase/types';
import { cn } from '../../lib/utils';
import RichTextEditor from '../../components/admin/campaigns/RichTextEditor';
import { parseProgramContent } from '../../lib/programs';
import { DEFAULT_PROGRAMS_HEADER, DEFAULT_CTA_DATA } from '../../lib/constants';
import type { ProgramsHeaderData, CtaData } from '../../lib/constants';
import { useConfirmDialog } from '../../components/admin/ConfirmDialog';

export default function AdminContent() {
  const { confirm, ConfirmDialogElement } = useConfirmDialog();
  const [programs, setPrograms] = useState<ProgramRow[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [mode, setMode] = useState<'create' | 'edit' | null>(null);
  const [editingProgram, setEditingProgram] = useState<ProgramRow | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Header Config State
  const [headerModalOpen, setHeaderModalOpen] = useState(false);
  const [headerData, setHeaderData] = useState<ProgramsHeaderData>({ ...DEFAULT_PROGRAMS_HEADER });
  const [savingHeader, setSavingHeader] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // CTA Config State
  const [ctaModalOpen, setCtaModalOpen] = useState(false);
  const [ctaData, setCtaData] = useState<CtaData>({ ...DEFAULT_CTA_DATA });
  const [savingCta, setSavingCta] = useState(false);

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'hero_image_url' | 'home_slider_image') => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingImage(true);
      const oldUrl = watch(fieldName);
      const url = await uploadAdminImage(file, 'programs');
      setValue(fieldName, url, { shouldDirty: true, shouldValidate: true });
      if (oldUrl) {
        import('../../lib/supabase/storage').then(m => m.deleteFilesFromStorage([oldUrl]));
      }
    } catch (err) {
      setError('Gagal mengunggah gambar. Pastikan ukuran file tidak terlalu besar.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleUploadCtaImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingImage(true);
      const oldUrl = ctaData.imageUrl;
      const url = await uploadAdminImage(file, 'general');
      setCtaData(prev => ({ ...prev, imageUrl: url }));
      if (oldUrl) {
        import('../../lib/supabase/storage').then(m => m.deleteFilesFromStorage([oldUrl]));
      }
    } catch (err) {
      setError('Gagal mengunggah gambar.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleUploadGallery = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    try {
      setUploadingImage(true);
      const urls = [];
      for (const f of files) {
        const url = await uploadAdminImage(f as File, 'programs');
        urls.push(url);
      }
      const existing = watch('gallery_images') || '';
      const newText = existing ? existing + '\n' + urls.join('\n') : urls.join('\n');
      setValue('gallery_images', newText, { shouldDirty: true, shouldValidate: true });
    } catch (err) {
      setError('Gagal mengunggah gambar galeri.');
    } finally {
      setUploadingImage(false);
    }
  };

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
  async function loadSiteContentData() {
    const { data } = await fetchSiteContentRows();
    if (!data) return;

    // Parse header data
    const headerRow = data.find(r => r.key === 'home_programs_header');
    if (headerRow?.value) {
      const parsed = parseSiteContentValue<ProgramsHeaderData>(headerRow.value);
      if (parsed) {
        setHeaderData({
          label: parsed.label || DEFAULT_PROGRAMS_HEADER.label,
          title: parsed.title || DEFAULT_PROGRAMS_HEADER.title,
          description: parsed.description || DEFAULT_PROGRAMS_HEADER.description,
        });
      } else {
        logError('AdminContent.loadHeaderData', new Error('Gagal parse header data'), { value: headerRow.value });
      }
    }

    // Parse CTA data
    const ctaRow = data.find(r => r.key === 'home_cta');
    if (ctaRow?.value) {
      const parsed = parseSiteContentValue<CtaData>(ctaRow.value);
      if (parsed) {
        setCtaData({
          title: parsed.title || DEFAULT_CTA_DATA.title,
          description: parsed.description || DEFAULT_CTA_DATA.description,
          primaryButtonText: parsed.primaryButtonText || DEFAULT_CTA_DATA.primaryButtonText,
          primaryButtonLink: parsed.primaryButtonLink || DEFAULT_CTA_DATA.primaryButtonLink,
          secondaryButtonText: parsed.secondaryButtonText || DEFAULT_CTA_DATA.secondaryButtonText,
          secondaryButtonLink: parsed.secondaryButtonLink || DEFAULT_CTA_DATA.secondaryButtonLink,
          imageUrl: parsed.imageUrl || DEFAULT_CTA_DATA.imageUrl,
        });
      } else {
        logError('AdminContent.loadCtaData', new Error('Gagal parse CTA data'), { value: ctaRow.value });
      }
    }
  }

  useEffect(() => {
    loadPrograms();
    loadSiteContentData();
  }, []);

  useEffect(() => {
    if (mode === 'edit' && editingProgram) {
      const detail = parseProgramContent(editingProgram.content);

      reset({
        slug: editingProgram.slug,
        title: editingProgram.title,
        description: editingProgram.description,
        icon_name: editingProgram.icon_name,
        hero_image_url: detail.hero_image_url,
        home_slider_image: detail.home_slider_image,
        overview: detail.overview,
        stage_label: detail.stage_label,
        stage_value: detail.stage_value,
        focus_areas: detail.focus_areas.join('\n'),
        gallery_images: detail.gallery_images.join('\n'),
        content: detail.body_content,
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
    const confirmed = await confirm({
      title: 'Hapus Program',
      message: `Apakah Anda yakin ingin menghapus program "${program.title}"? Tindakan ini tidak dapat dibatalkan.`,
      confirmText: 'Hapus Permanen',
    });
    if (!confirmed) return;

    setDeletingId(program.id);

    const urlsToDelete: string[] = [];
    const detail = parseProgramContent(program.content);
    if (detail.hero_image_url) urlsToDelete.push(detail.hero_image_url);
    if (detail.home_slider_image) urlsToDelete.push(detail.home_slider_image);
    if (detail.gallery_images.length > 0) urlsToDelete.push(...detail.gallery_images);

    const { error: deleteError } = await deleteProgram(program.id);

    if (deleteError) {
      logError('AdminContent.deleteProgram', deleteError, {
        programId: program.id,
      });
      setError(deleteError.message);
      setDeletingId(null);
      return;
    }

    if (urlsToDelete.length > 0) {
      import('../../lib/supabase/storage').then(m => m.deleteFilesFromStorage(urlsToDelete).catch(err => logError('AdminContent.deleteStorage', err)));
    }

    setDeletingId(null);
    setNotice(`Program "${program.title}" berhasil dihapus.`);
    await loadPrograms();
  }

  async function saveHeaderData() {
    setSavingHeader(true);
    setNotice(null);
    setError(null);
    try {
      const payload = {
        key: 'home_programs_header',
        value: headerData
      };
      const { error } = await upsertSiteContent([payload]);
      if (error) throw error;
      
      setNotice('Header program berhasil diperbarui.');
      setHeaderModalOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal menyimpan header.';
      setError(message);
    } finally {
      setSavingHeader(false);
    }
  }

  async function saveCtaData() {
    setSavingCta(true);
    setNotice(null);
    setError(null);
    try {
      const payload = {
        key: 'home_cta',
        value: ctaData
      };
      const { error } = await upsertSiteContent([payload]);
      if (error) throw error;
      
      setNotice('Konten CTA berhasil diperbarui.');
      setCtaModalOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal menyimpan CTA.';
      setError(message);
    } finally {
      setSavingCta(false);
    }
  }

  const selectedIcon = watch('icon_name');
  const modalTitle = mode === 'edit' ? 'Edit Program' : 'Tambah Program';

  async function handleSeedData() {
    const ok = await confirm({
      title: 'Muat Data Default',
      message: 'Apakah Anda ingin memuat data program default ke database? Ini akan memudahkan Anda mengelola konten yang sudah ada.',
      confirmText: 'Muat Data',
      variant: 'warning',
    });
    if (!ok) return;
    
    setLoading(true);
    const { PROGRAMS } = await import('../../lib/programs');
    
    for (const p of PROGRAMS) {
      const detailData = {
        hero_image_url: '',
        home_slider_image: '',
        overview: p.overview,
        stage_label: p.stage_label,
        stage_value: p.stage_value,
        focus_areas: p.focus_areas,
        gallery_images: [],
        body_content: '',
      };

      await insertProgram({
        slug: p.slug,
        title: p.title,
        description: p.short_description,
        icon_name: p.icon_name,
        content: JSON.stringify(detailData),
      });
    }
    
    await loadPrograms();
    setNotice('Data program default berhasil diinisialisasi.');
  }

  return (
    <div className="space-y-12 pb-12">
      {/* ═══════ PAGE HEADER ═══════ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Manajemen Konten</h1>
          <p className="text-sm text-slate-500 mt-1">Kelola hero, konten program, dan deskripsi aplikasi Sekolah Tanah Air.</p>
        </div>
      </div>

      {/* ═══════ SECTION: HERO BERANDA ═══════ */}
      <div className="space-y-4">
        <div className="border-b border-slate-200 pb-4">
          <h2 className="text-lg font-bold text-slate-900">Hero Beranda</h2>
          <p className="text-sm text-slate-500">Atur media dan teks utama yang pertama kali dilihat pengunjung.</p>
        </div>
        <AdminHeroManager />
        <AdminOtherPagesHero />
      </div>

      {/* ═══════ SECTION: PROGRAM VOLUNTEER (EDUXPLORE) ═══════ */}
      <AdminVolunteerPrograms />

      {/* ═══════ SECTION: PROGRAM STA ═══════ */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Program & Inisiatif</h2>
            <p className="text-sm text-slate-500">Kelola halaman detail program dan slider di Beranda.</p>
          </div>
          <div className="flex items-center gap-3">
            {programs.length === 0 && !loading && (
              <button
                onClick={handleSeedData}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm font-medium hover:bg-emerald-100 transition-colors"
              >
                <Sparkles size={16} />
                Inisialisasi Data
              </button>
            )}
            <button
              onClick={() => loadPrograms()}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
            <button
              onClick={() => setHeaderModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              <Settings size={16} />
              Pengaturan Header
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
      </div>

      {/* ═══════ SECTION: CTA BERANDA ═══════ */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Ajakan Bertindak (CTA)</h2>
              <p className="text-sm text-slate-500">Sesuaikan teks, gambar, dan tombol ajakan di bagian bawah Beranda.</p>
            </div>
          </div>
          <button
            onClick={() => setCtaModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white rounded-xl text-sm font-semibold hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-100 whitespace-nowrap"
          >
            Edit Konten CTA
          </button>
        </div>
        
        {/* Konten Terpasang (Preview) */}
        <div className="px-6 pb-6">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-wrap gap-x-12 gap-y-4">
             <div className="space-y-1">
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Judul Saat Ini</p>
               <p className="text-sm font-medium text-slate-700">{ctaData.title}</p>
             </div>
             <div className="space-y-1">
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Aksi Utama</p>
               <p className="text-sm font-medium text-slate-700">{ctaData.primaryButtonText} ({ctaData.primaryButtonLink})</p>
             </div>
             <div className="space-y-1">
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status Gambar</p>
               <p className="text-sm font-medium text-slate-700">{ctaData.imageUrl ? 'Terpasang' : 'Tidak Ada'}</p>
             </div>
          </div>
        </div>
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
              disabled={isSubmitting || uploadingImage}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-zinc-900 rounded-xl hover:bg-zinc-950 transition-colors disabled:opacity-50"
            >
              {isSubmitting || uploadingImage ? 'Memproses...' : 'Simpan'}
            </button>
          </>
        )}
      >
        <form id="program-form" onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* ── SEKSI 1: IDENTITAS & NAVIGASI ── */}
          <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-5 shadow-sm">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              Identitas & Navigasi
            </h3>
            <div className="grid gap-5 md:grid-cols-2">
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-slate-700">Judul Program</span>
                <input
                  type="text"
                  {...register('title')}
                  placeholder="Contoh: Jelajah Tanah Air"
                  className="w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 outline-none transition-all placeholder:text-slate-400"
                />
                {errors.title && <p className="text-xs text-rose-500">{errors.title.message}</p>}
              </label>

              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-slate-700">Slug (URL)</span>
                <input
                  type="text"
                  {...register('slug')}
                  placeholder="contoh-slug-program"
                  className="w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 outline-none transition-all placeholder:text-slate-400"
                />
                {errors.slug && <p className="text-xs text-rose-500">{errors.slug.message}</p>}
              </label>
            </div>
          </div>

          {/* ── SEKSI 2: MEDIA VISUAL ── */}
          <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-5 shadow-sm">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              Media Visual & Gambar
            </h3>
            
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-slate-700">Gambar Hero Halaman Detail</span>
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  {...register('hero_image_url')}
                  placeholder="URL gambar akan terisi otomatis setelah upload..."
                  className="flex-1 px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 outline-none transition-all"
                  readOnly
                />
                <label className="px-4 py-2.5 bg-zinc-900 text-white text-sm font-medium rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer whitespace-nowrap shadow-sm">
                  {uploadingImage ? 'Mengunggah...' : 'Upload Gambar'}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUploadImage(e, 'hero_image_url')} disabled={uploadingImage} />
                </label>
              </div>
              {errors.hero_image_url && <p className="text-xs text-red-600">{errors.hero_image_url.message}</p>}
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-slate-700">Gambar Slider Beranda</span>
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  {...register('home_slider_image')}
                  placeholder="URL gambar akan terisi otomatis setelah upload..."
                  className="flex-1 px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 outline-none transition-all"
                  readOnly
                />
                <label className="px-4 py-2.5 bg-zinc-900 text-white text-sm font-medium rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer whitespace-nowrap shadow-sm">
                  {uploadingImage ? 'Mengunggah...' : 'Upload Gambar'}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUploadImage(e, 'home_slider_image')} disabled={uploadingImage} />
                </label>
              </div>
              {errors.home_slider_image && <p className="text-xs text-red-600">{errors.home_slider_image.message}</p>}
            </label>
          </div>

          {/* ── SEKSI 3: NARASI & DETAIL ── */}
          <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-5 shadow-sm">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              Narasi & Detail Konten
            </h3>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-slate-700">Label Tahap (Contoh: Fase Program)</span>
                <input
                  type="text"
                  {...register('stage_label')}
                  placeholder="Fase Program"
                  className="w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 outline-none transition-all placeholder:text-slate-400"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-slate-700">Nilai Tahap (Contoh: Survei & Pemetaan)</span>
                <input
                  type="text"
                  {...register('stage_value')}
                  placeholder="Survei & Pemetaan"
                  className="w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 outline-none transition-all placeholder:text-slate-400"
                />
              </label>
            </div>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-slate-700">Deskripsi Singkat (Muncul di Kartu)</span>
              <textarea
                rows={2}
                {...register('description')}
                placeholder="Tulis deskripsi singkat untuk kartu di beranda..."
                className="w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 outline-none transition-all placeholder:text-slate-400"
              />
              {errors.description && <p className="text-xs text-rose-500">{errors.description.message}</p>}
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-slate-700">Filosofi / Overview (Halaman Detail)</span>
              <textarea
                rows={4}
                {...register('overview')}
                placeholder="Jelaskan filosofi mendalam di balik program ini..."
                className="w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 outline-none transition-all placeholder:text-slate-400"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-slate-700">Fokus Strategis (Satu poin per baris)</span>
              <textarea
                rows={4}
                {...register('focus_areas')}
                placeholder="Contoh:&#10;Pemberdayaan Guru Lokal&#10;Pengadaan Fasilitas Belajar&#10;Kurikulum Berbasis Budaya"
                className="w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 outline-none transition-all placeholder:text-slate-400"
              />
              {errors.focus_areas && <p className="text-xs text-red-600">{errors.focus_areas.message}</p>}
            </label>
          </div>

          {/* ── SEKSI 4: GALERI & LANJUTAN ── */}
          <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-5 shadow-sm">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-500" />
              Galeri & Konten Lanjutan
            </h3>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-slate-700">Galeri Gambar (Multi-upload)</span>
              <div className="flex gap-2 items-start">
                <textarea
                  rows={3}
                  {...register('gallery_images')}
                  placeholder="Klik tombol upload untuk memilih banyak gambar sekaligus..."
                  className="flex-1 px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 outline-none transition-all"
                  readOnly
                />
                <label className="px-4 py-2.5 bg-zinc-900 text-white text-sm font-medium rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer whitespace-nowrap shadow-sm">
                  {uploadingImage ? 'Mengunggah...' : 'Upload Banyak'}
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleUploadGallery} disabled={uploadingImage} />
                </label>
              </div>
              <p className="text-[10px] text-slate-400 italic">Disarankan memilih minimal 4 gambar untuk tampilan optimal di halaman detail.</p>
              {errors.gallery_images && <p className="text-xs text-red-600">{errors.gallery_images.message}</p>}
            </label>

            <div className="space-y-1.5">
              <RichTextEditor
                label="Catatan Internal / Konten Tambahan (Opsional)"
                value={watch('content')}
                onChange={(val) => setValue('content', val, { shouldValidate: true })}
                error={errors.content?.message}
                hint="Tambahkan informasi tambahan jika diperlukan..."
              />
            </div>
          </div>
        </form>
      </AdminModal>

      {/* MODAL HEADER */}
      <AdminModal
        open={headerModalOpen}
        onClose={() => setHeaderModalOpen(false)}
        title="Pengaturan Header Beranda"
        description="Atur teks yang muncul di atas daftar program pada halaman utama."
        widthClassName="max-w-md"
        footer={(
          <>
            <button
              onClick={() => setHeaderModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button
              onClick={saveHeaderData}
              disabled={savingHeader}
              className="px-4 py-2 text-sm font-medium text-white bg-zinc-900 rounded-xl hover:bg-zinc-950 transition-colors disabled:opacity-50"
            >
              {savingHeader ? 'Menyimpan...' : 'Simpan'}
            </button>
          </>
        )}
      >
        <div className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-700">Label (Teks Kecil di Atas)</span>
            <input
              type="text"
              value={headerData.label}
              onChange={(e) => setHeaderData({ ...headerData, label: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 outline-none transition-all"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-700">Judul Utama</span>
            <input
              type="text"
              value={headerData.title}
              onChange={(e) => setHeaderData({ ...headerData, title: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 outline-none transition-all"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-700">Deskripsi Singkat</span>
            <textarea
              rows={3}
              value={headerData.description}
              onChange={(e) => setHeaderData({ ...headerData, description: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 outline-none transition-all"
            />
          </label>
        </div>
      </AdminModal>

      {/* MODAL CTA */}
      <AdminModal
        open={ctaModalOpen}
        onClose={() => setCtaModalOpen(false)}
        title="Pengaturan CTA Beranda"
        description="Atur teks dan tombol pada bagian ajakan bertindak (Call to Action) di bagian bawah halaman Beranda."
        widthClassName="max-w-xl"
        footer={(
          <>
            <button
              onClick={() => setCtaModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button
              onClick={saveCtaData}
              disabled={savingCta}
              className="px-4 py-2 text-sm font-medium text-white bg-zinc-900 rounded-xl hover:bg-zinc-950 transition-colors disabled:opacity-50"
            >
              {savingCta ? 'Menyimpan...' : 'Simpan'}
            </button>
          </>
        )}
      >
        <div className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-700">Judul Utama CTA</span>
            <input
              type="text"
              value={ctaData.title}
              onChange={(e) => setCtaData({ ...ctaData, title: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 outline-none transition-all"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-700">Gambar CTA</span>
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={ctaData.imageUrl}
                placeholder="URL gambar..."
                className="flex-1 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 outline-none transition-all"
                readOnly
              />
              <label className="px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer whitespace-nowrap shadow-sm">
                {uploadingImage ? 'Uploading...' : 'Upload'}
                <input type="file" accept="image/*" className="hidden" onChange={handleUploadCtaImage} disabled={uploadingImage} />
              </label>
            </div>
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-700">Deskripsi</span>
            <textarea
              rows={3}
              value={ctaData.description}
              onChange={(e) => setCtaData({ ...ctaData, description: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 outline-none transition-all"
            />
          </label>
          
          <div className="grid grid-cols-2 gap-4">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-slate-700">Teks Tombol Utama</span>
              <input
                type="text"
                value={ctaData.primaryButtonText}
                onChange={(e) => setCtaData({ ...ctaData, primaryButtonText: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 outline-none transition-all"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-slate-700">Link Tombol Utama</span>
              <input
                type="text"
                value={ctaData.primaryButtonLink}
                onChange={(e) => setCtaData({ ...ctaData, primaryButtonLink: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 outline-none transition-all"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-slate-700">Teks Tombol Kedua</span>
              <input
                type="text"
                value={ctaData.secondaryButtonText}
                onChange={(e) => setCtaData({ ...ctaData, secondaryButtonText: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 outline-none transition-all"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-slate-700">Link Tombol Kedua</span>
              <input
                type="text"
                value={ctaData.secondaryButtonLink}
                onChange={(e) => setCtaData({ ...ctaData, secondaryButtonLink: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 outline-none transition-all"
              />
            </label>
          </div>
        </div>
      </AdminModal>
      {ConfirmDialogElement}
    </div>
  );
}
