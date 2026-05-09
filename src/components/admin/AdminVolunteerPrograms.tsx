import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Edit2, Plus, Trash2, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

import AdminModal from './AdminModal';
import RichTextEditor from './campaigns/RichTextEditor';
import {
  fetchVolunteerPrograms,
  saveVolunteerProgram,
  deleteVolunteerProgram,
} from '../../lib/admin/repository';
import { uploadAdminImage } from '../../lib/supabase/storage';
import { formatAdminDate } from '../../lib/admin/helpers';
import type { VolunteerProgramRow } from '../../lib/supabase/types';
import type { VolunteerTimelineItem } from '../../lib/eduxplore';
import { logError } from '../../lib/error-logger';
import { useConfirmDialog } from './ConfirmDialog';

const schema = z.object({
  title: z.string().min(1, 'Judul wajib diisi'),
  slug: z.string().min(1, 'Slug wajib diisi'),
  location: z.string().min(1, 'Lokasi wajib diisi'),
  description: z.string().optional(),
  image_url: z.string().optional(),
  show_in_hero: z.boolean(),
  status: z.enum(['open', 'closed', 'ongoing']),
  timeline_text: z.string().optional(),
  requirements_text: z.string().optional(),
  external_link: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const defaultValues: FormValues = {
  title: '',
  slug: '',
  location: '',
  description: '',
  image_url: '',
  show_in_hero: false,
  status: 'open',
  timeline_text: '',
  requirements_text: '',
  external_link: '',
};

export default function AdminVolunteerPrograms() {
  const { confirm, ConfirmDialogElement } = useConfirmDialog();
  const [programs, setPrograms] = useState<VolunteerProgramRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [mode, setMode] = useState<'create' | 'edit' | null>(null);
  const [editingProgram, setEditingProgram] = useState<VolunteerProgramRow | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  async function loadData() {
    setLoading(true);
    const { data, error } = await fetchVolunteerPrograms();
    if (error) {
      setError(error.message);
    } else {
      setPrograms(data || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  function openCreate() {
    setNotice(null);
    setError(null);
    setEditingProgram(null);
    reset(defaultValues);
    setMode('create');
  }

  function openEdit(program: VolunteerProgramRow) {
    setNotice(null);
    setError(null);
    setEditingProgram(program);

    let timelineText = '';
    let reqText = '';

    try {
      const parsedTimeline = (Array.isArray(program.timeline) ? program.timeline : JSON.parse(program.timeline as string)) as VolunteerTimelineItem[];
      const items = parsedTimeline.map(t => `<li><strong>${t.date}</strong> — ${t.label}</li>`).join('');
      timelineText = `<ul>${items}</ul>`;
    } catch (e) {}

    try {
      const parsedReq = (Array.isArray(program.requirements) ? program.requirements : JSON.parse(program.requirements as string)) as string[];
      const items = parsedReq.map(r => `<li>${r}</li>`).join('');
      reqText = `<ul>${items}</ul>`;
    } catch (e) {}

    reset({
      title: program.title,
      slug: program.slug,
      location: program.location,
      description: program.description || '',
      image_url: program.image_url || '',
      show_in_hero: program.show_in_hero,
      status: program.status,
      timeline_text: timelineText,
      requirements_text: reqText,
      external_link: program.external_link || '',
    });
    setMode('edit');
  }

  function closeModal() {
    setMode(null);
    setEditingProgram(null);
  }

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingImage(true);
      const url = await uploadAdminImage(file, 'programs');
      setValue('image_url', url, { shouldDirty: true });
    } catch (err) {
      logError('AdminVolunteerPrograms.handleUploadImage', err);
      setError('Gagal mengunggah gambar banner.');
    } finally {
      setUploadingImage(false);
    }
  };

  function htmlToTimelineItems(html: string): VolunteerTimelineItem[] {
    const div = document.createElement('div');
    div.innerHTML = html;
    const items: VolunteerTimelineItem[] = [];
    div.querySelectorAll('li').forEach(li => {
      const text = li.textContent?.trim() || '';
      const sep = text.includes('—') ? '—' : '|';
      const parts = text.split(sep);
      if (parts.length >= 2) {
        items.push({ date: parts[0].trim(), label: parts.slice(1).join(sep).trim() });
      } else if (text) {
        items.push({ date: text, label: '' });
      }
    });
    if (items.length === 0 && html) {
      const plain = html.replace(/<[^>]+>/g, '\n').trim();
      plain.split('\n').filter(l => l.trim()).forEach(line => {
        const parts = line.split('|');
        items.push({ date: parts[0]?.trim() || '', label: parts[1]?.trim() || '' });
      });
    }
    return items;
  }

  function htmlToRequirements(html: string): string[] {
    const div = document.createElement('div');
    div.innerHTML = html;
    const reqs: string[] = [];
    div.querySelectorAll('li').forEach(li => {
      const text = li.textContent?.trim();
      if (text) reqs.push(text);
    });
    if (reqs.length === 0 && html) {
      const plain = html.replace(/<[^>]+>/g, '\n').trim();
      plain.split('\n').filter(l => l.trim()).forEach(l => reqs.push(l.trim()));
    }
    return reqs;
  }

  async function onSubmit(values: FormValues) {
    setError(null);
    setNotice(null);

    try {
      const timeline = htmlToTimelineItems(values.timeline_text || '');
      const requirements = htmlToRequirements(values.requirements_text || '');

      const payload = {
        title: values.title,
        slug: values.slug,
        location: values.location,
        description: values.description,
        image_url: values.image_url,
        show_in_hero: values.show_in_hero,
        status: values.status,
        timeline: timeline as unknown as import('../../lib/supabase/types').Json,
        requirements: requirements as unknown as import('../../lib/supabase/types').Json,
        external_link: values.external_link || null,
      };

      const { error: saveError } = await saveVolunteerProgram(payload, editingProgram?.id);
      if (saveError) throw saveError;

      setNotice(mode === 'edit' ? 'Program berhasil diperbarui.' : 'Program berhasil ditambahkan.');
      closeModal();
      loadData();
    } catch (err) {
      logError('AdminVolunteerPrograms.onSubmit', err);
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan saat menyimpan data.';
      setError(message);
    }
  }

  async function handleDelete(program: VolunteerProgramRow) {
    const ok = await confirm({
      title: 'Hapus Program',
      message: `Hapus program "${program.title}"? Semua pendaftar terkait juga akan terhapus!`,
      confirmText: 'Hapus Permanen',
    });
    if (!ok) return;

    setError(null);
    setNotice(null);

    const { error: delError } = await deleteVolunteerProgram(program.id);
    if (delError) {
      setError(delError.message);
    } else {
      setNotice('Program berhasil dihapus.');
      loadData();
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-6">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">Program EduXplore</h3>
          <p className="text-sm text-slate-500">Kelola event dan formulir pendaftaran relawan.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={loadData} className="p-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors">
            <RefreshCw size={16} />
          </button>
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium shadow-sm hover:bg-zinc-800 transition-colors">
            <Plus size={16} /> Tambah Program
          </button>
        </div>
      </div>

      {notice && (
        <div className="m-5 flex items-start gap-3 p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-sm text-emerald-800">
          <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
          <p>{notice}</p>
        </div>
      )}

      {error && (
        <div className="m-5 flex items-start gap-3 p-4 rounded-xl border border-rose-200 bg-rose-50 text-sm text-rose-700">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center text-sm text-slate-500">Memuat data...</div>
      ) : programs.length === 0 ? (
        <div className="p-8 text-center text-sm text-slate-500">Belum ada program EduXplore.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase">
                <th className="px-6 py-4">Judul Program</th>
                <th className="px-6 py-4">Slug URL</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {programs.map(p => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900">{p.title}</td>
                  <td className="px-6 py-4"><span className="px-2 py-1 bg-slate-100 rounded text-slate-600 font-mono text-xs">{p.slug}</span></td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${p.status === 'open' ? 'bg-emerald-100 text-emerald-700' : p.status === 'closed' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                      {p.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => openEdit(p)} className="p-2 text-slate-400 hover:text-zinc-900 mx-1"><Edit2 size={16} /></button>
                    <button onClick={() => handleDelete(p)} className="p-2 text-slate-400 hover:text-rose-600 mx-1"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AdminModal
        open={mode !== null}
        onClose={closeModal}
        title={mode === 'edit' ? 'Edit EduXplore' : 'Tambah EduXplore'}
        widthClassName="max-w-3xl"
        footer={(
          <>
            <button type="button" onClick={closeModal} className="px-4 py-2 text-sm text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50">Batal</button>
            <button type="submit" form="volunteer-form" disabled={isSubmitting || uploadingImage} className="px-4 py-2 text-sm text-white bg-zinc-900 rounded-xl hover:bg-zinc-800 disabled:opacity-50">
              {isSubmitting || uploadingImage ? 'Menyimpan...' : 'Simpan Program'}
            </button>
          </>
        )}
      >
        <form id="volunteer-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">

          {/* Row 1: Judul & Slug */}
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Judul Program</span>
              <input type="text" {...register('title')} className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-1 focus:ring-zinc-900" />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Slug URL (tanpa spasi)</span>
              <input type="text" {...register('slug')} className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-1 focus:ring-zinc-900 font-mono" />
            </label>
          </div>

          {/* Row 2: Lokasi & Status */}
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Lokasi</span>
              <input type="text" {...register('location')} className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Status Pendaftaran</span>
              <select {...register('status')} className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 rounded-lg">
                <option value="open">Buka (Open)</option>
                <option value="closed">Tutup (Closed)</option>
                <option value="ongoing">Sedang Berlangsung (Ongoing)</option>
              </select>
            </label>
          </div>

          {/* Deskripsi — Rich Text */}
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <RichTextEditor
                label="Deskripsi Program"
                hint="Tuliskan deskripsi singkat program ini."
                value={field.value || ''}
                onChange={field.onChange}
              />
            )}
          />

          {/* Gambar Banner */}
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Gambar Banner (Hero)</span>
            <div className="mt-1 flex gap-2">
              <input type="text" {...register('image_url')} readOnly className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50" placeholder="Otomatis terisi saat upload" />
              <label className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm cursor-pointer hover:bg-zinc-800">
                {uploadingImage ? 'Upload...' : 'Upload'}
                <input type="file" accept="image/*" className="hidden" onChange={handleUploadImage} disabled={uploadingImage} />
              </label>
            </div>
          </label>

          {/* Timeline — Rich Text */}
          <Controller
            name="timeline_text"
            control={control}
            render={({ field }) => (
              <RichTextEditor
                label="Timeline Kegiatan"
                hint="Gunakan bullet/numbered list. Format tiap item: Tanggal — Nama Kegiatan (contoh: 12 Mei 2026 — Briefing)"
                value={field.value || ''}
                onChange={field.onChange}
              />
            )}
          />

          {/* Persyaratan — Rich Text */}
          <Controller
            name="requirements_text"
            control={control}
            render={({ field }) => (
              <RichTextEditor
                label="Persyaratan Pendaftaran"
                hint="Gunakan bullet list untuk setiap syarat pendaftaran."
                value={field.value || ''}
                onChange={field.onChange}
              />
            )}
          />

          {/* Link Eksternal */}
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold text-slate-700">Link Pendaftaran Eksternal (Opsional)</span>
            <input type="url" {...register('external_link')} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" placeholder="Contoh: https://forms.gle/xyz123" />
            <p className="text-[11px] text-slate-500 leading-relaxed">Jika diisi, tombol 'Daftar' di website publik akan mengalihkan pengguna ke link ini (misal Google Form) alih-alih menggunakan form registrasi bawaan sistem.</p>
          </label>

          {/* Toggle Hero Beranda */}
          <label className="flex items-start gap-3 p-4 rounded-xl border-2 border-dashed border-emerald-200 bg-emerald-50/50 cursor-pointer hover:border-emerald-300 transition-colors">
            <input type="checkbox" {...register('show_in_hero')} className="mt-1 h-4 w-4 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500" />
            <div>
              <p className="text-sm font-bold text-emerald-800">Tampilkan di Hero Beranda</p>
              <p className="text-xs text-emerald-600 mt-0.5">Jika dicentang, program ini otomatis muncul sebagai slide utama di halaman Beranda dengan tombol "Daftar EduXplore".</p>
            </div>
          </label>
        </form>
      </AdminModal>
      {ConfirmDialogElement}
    </div>
  );
}
