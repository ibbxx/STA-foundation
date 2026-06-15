import React, { useEffect, useState } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Edit2, Plus, Trash2, RefreshCw, AlertCircle, CheckCircle2, ChevronUp, ChevronDown, X } from 'lucide-react';

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
import { slugify } from '../../lib/admin/campaign-utils';

/** Label mapping untuk jenis program relawan */
const PROGRAM_TYPE_OPTIONS = [
  { value: 'jelajah', label: 'Jelajah Tanah Air', color: 'bg-sky-100 text-sky-700 border-sky-200' },
  { value: 'eduxplore', label: 'EduXplore Tanah Air', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { value: 'bangun-asa', label: 'Bangun 1000 Asa', color: 'bg-amber-100 text-amber-700 border-amber-200' },
] as const;

function getProgramTypeLabel(type: string) {
  return PROGRAM_TYPE_OPTIONS.find(o => o.value === type)?.label || type;
}

function getProgramTypeBadge(type: string) {
  return PROGRAM_TYPE_OPTIONS.find(o => o.value === type)?.color || 'bg-slate-100 text-slate-600 border-slate-200';
}

export const DEFAULT_FORM_CONFIG = [
  { id: 'nama_lengkap', type: 'text' as const, label: 'Nama Lengkap', required: true },
  { id: 'email', type: 'email' as const, label: 'Email Aktif', required: true },
  { id: 'whatsapp', type: 'tel' as const, label: 'No. WhatsApp', required: true },
  { id: 'whatsapp_emergency', type: 'tel' as const, label: 'WA Darurat', required: true },
  { id: 'alamat', type: 'textarea' as const, label: 'Alamat', required: true },
  { id: 'tanggal_lahir', type: 'date' as const, label: 'Tanggal Lahir', required: true },
  { id: 'size_baju', type: 'select' as const, label: 'Ukuran Baju', required: true, options: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'] },
  { id: 'pendidikan', type: 'text' as const, label: 'Latar Belakang Pendidikan', required: true },
  { id: 'bidang_diminati', type: 'select' as const, label: 'Bidang yang Diminati', required: true, options: ['Pengembangan Pemuda', 'Pendidikan dan Pengajaran Siswa Guru', 'Media dan Promosi serta Branding Desa', 'Branding Budaya dan Lingkungan Lokal'] },
  { id: 'riwayat_penyakit', type: 'textarea' as const, label: 'Riwayat Penyakit', required: false },
  { id: 'bukti_dp', type: 'file' as const, label: 'Bukti DP', required: true },
  { id: 'bukti_follow_ig', type: 'file' as const, label: 'Bukti Follow IG', required: true },
  { id: 'foto_id_card', type: 'file' as const, label: 'Pas Foto (untuk ID Card)', required: true }
];

const schema = z.object({
  title: z.string().min(1, 'Judul wajib diisi'),
  slug: z.string().min(1, 'Slug wajib diisi'),
  location: z.string().min(1, 'Lokasi wajib diisi'),
  description: z.string().optional(),
  short_description: z.string().optional(),
  image_url: z.string().optional(),
  show_in_hero: z.boolean(),
  program_type: z.enum(['jelajah', 'eduxplore', 'bangun-asa']),
  status: z.enum(['open', 'closed', 'ongoing']),
  timeline_text: z.string().optional(),
  requirements_text: z.string().optional(),
  form_config: z.array(z.object({
    id: z.string(),
    type: z.enum(['text', 'textarea', 'select', 'date', 'file', 'number', 'email', 'tel']),
    label: z.string().min(1, 'Label wajib diisi'),
    required: z.boolean(),
    options: z.array(z.string()).nullable().optional(),
  })).optional(),
  external_link: z.string().optional().nullable().or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;

const defaultValues: FormValues = {
  title: '',
  slug: '',
  location: '',
  description: '',
  short_description: '',
  image_url: '',
  show_in_hero: false,
  program_type: 'eduxplore',
  status: 'open',
  timeline_text: '',
  requirements_text: '',
  form_config: [...DEFAULT_FORM_CONFIG],
  external_link: '',
};

interface OptionsTagInputProps {
  value: string[] | null | undefined;
  onChange: (val: string[]) => void;
}

function OptionsTagInput({ value, onChange }: OptionsTagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const options = Array.isArray(value) ? value : [];

  const addOption = (text: string) => {
    const trimmed = text.trim();
    if (trimmed && !options.includes(trimmed)) {
      onChange([...options, trimmed]);
    }
    setInputValue('');
  };

  const removeOption = (indexToRemove: number) => {
    onChange(options.filter((_, idx) => idx !== indexToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addOption(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && options.length > 0) {
      removeOption(options.length - 1);
    }
  };

  const handleBlur = () => {
    addOption(inputValue);
  };

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-1.5 min-h-[36px] p-1.5 bg-white border border-slate-200 rounded-lg focus-within:ring-1 focus-within:ring-zinc-950 focus-within:border-zinc-950 transition-all">
        {options.map((opt, idx) => (
          <span
            key={idx}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-md border border-slate-200/60 hover:bg-slate-200 transition-colors"
          >
            {opt}
            <button
              type="button"
              onClick={() => removeOption(idx)}
              className="text-slate-400 hover:text-rose-600 transition-colors focus:outline-none"
            >
              <X size={12} />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={options.length === 0 ? "Ketik opsi lalu tekan Enter..." : "Tambah opsi..."}
          className="flex-1 min-w-[150px] bg-transparent text-xs focus:outline-none py-0.5 px-1 placeholder-slate-400"
        />
      </div>
      <p className="text-[10px] text-slate-400">
        Tekan <kbd className="px-1 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-500 font-sans font-medium text-[9px]">Enter</kbd> untuk menambahkan pilihan.
      </p>
    </div>
  );
}

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
    watch,
    formState: { errors, isSubmitting, dirtyFields },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const { fields, append, remove, swap } = useFieldArray({
    control,
    name: 'form_config',
  });

  const watchedTitle = watch('title');

  useEffect(() => {
    if (mode === 'create' && !dirtyFields.slug) {
      setValue('slug', slugify(watchedTitle || ''), { shouldValidate: true });
    }
  }, [watchedTitle, mode, setValue, dirtyFields.slug]);

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
    reset({
      ...defaultValues,
      form_config: [...DEFAULT_FORM_CONFIG],
    });
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

    let parsedFormConfig = [...DEFAULT_FORM_CONFIG] as any;
    if (program.form_config) {
      try {
        const raw = Array.isArray(program.form_config)
          ? program.form_config
          : JSON.parse(program.form_config as string);
        // Jika form_config dari DB adalah array kosong (default DB),
        // fallback ke DEFAULT_FORM_CONFIG agar form builder tidak kosong
        if (Array.isArray(raw) && raw.length > 0) {
          parsedFormConfig = raw;
        }
      } catch (e) {
        logError('AdminVolunteerPrograms.openEdit.parseFormConfig', e);
      }
    }

    reset({
      title: program.title,
      slug: program.slug,
      location: program.location,
      description: program.description || '',
      short_description: program.short_description || '',
      image_url: program.image_url || '',
      show_in_hero: program.show_in_hero,
      program_type: program.program_type || 'eduxplore',
      status: program.status || 'open',
      timeline_text: timelineText,
      requirements_text: reqText,
      form_config: parsedFormConfig,
      external_link: program.external_link || '',
    });
    setMode('edit');
  }

  function closeModal() {
    setMode(null);
    setEditingProgram(null);
    reset(defaultValues);
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
        short_description: values.short_description,
        image_url: values.image_url,
        show_in_hero: values.show_in_hero,
        program_type: values.program_type,
        status: values.status,
        timeline: timeline as unknown as import('../../lib/supabase/types').Json,
        requirements: requirements as unknown as import('../../lib/supabase/types').Json,
        form_config: values.form_config as unknown as import('../../lib/supabase/types').Json,
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

  const renderAllErrors = () => {
    const errorList: string[] = [];
    
    if (errors.title) errorList.push('Judul Program: ' + errors.title.message);
    if (errors.slug) errorList.push('Slug URL: ' + errors.slug.message);
    if (errors.location) errorList.push('Lokasi: ' + errors.location.message);
    if (errors.program_type) errorList.push('Jenis Program: ' + errors.program_type.message);
    if (errors.status) errorList.push('Status Pendaftaran: ' + errors.status.message);
    if (errors.external_link) errorList.push('Link Pendaftaran Eksternal: ' + errors.external_link.message);
    
    if (errors.form_config && Array.isArray(errors.form_config)) {
      errors.form_config.forEach((err: any, idx: number) => {
        if (err) {
          if (err.label) errorList.push(`Pertanyaan #${idx + 1}: ${err.label.message}`);
          if (err.options) errorList.push(`Pertanyaan #${idx + 1} (Opsi Dropdown): ${err.options.message}`);
        }
      });
    }

    if (errorList.length === 0 && Object.keys(errors).length > 0) {
      errorList.push('Terdapat beberapa kolom input yang tidak valid.');
    }

    return errorList;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-6">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">Program Relawan</h3>
          <p className="text-sm text-slate-500">Kelola event dan formulir pendaftaran relawan untuk semua program STA.</p>
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
        <div className="p-8 text-center text-sm text-slate-500">Belum ada program relawan.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase">
                <th className="px-6 py-4">Judul Program</th>
                <th className="px-6 py-4">Jenis Program</th>
                <th className="px-6 py-4">Slug URL</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {programs.map(p => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900">{p.title}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 text-[11px] font-semibold rounded-full border ${getProgramTypeBadge(p.program_type)}`}>
                      {getProgramTypeLabel(p.program_type)}
                    </span>
                  </td>
                  <td className="px-6 py-4"><span className="px-2 py-1 bg-slate-100 rounded text-slate-600 font-mono text-xs">{p.slug}</span></td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${(p.status || 'open') === 'open' ? 'bg-emerald-100 text-emerald-700' : (p.status || 'open') === 'closed' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                      {(p.status || 'open').toUpperCase()}
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
        title={mode === 'edit' ? 'Edit Program Relawan' : 'Tambah Program Relawan'}
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
          {error && (
            <div className="flex items-start gap-3 p-4 rounded-xl border border-rose-200 bg-rose-50 text-sm text-rose-700">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          {Object.keys(errors).length > 0 && (
            <div className="flex items-start gap-3 p-4 rounded-xl border border-rose-200 bg-rose-50 text-sm text-rose-700 animate-in fade-in duration-200">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-rose-800">Harap perbaiki kesalahan berikut sebelum menyimpan:</p>
                <ul className="list-disc pl-5 mt-1.5 space-y-1 text-xs text-rose-700">
                  {renderAllErrors().map((msg, i) => (
                    <li key={i}>{msg}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Row 1: Judul & Slug */}
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Judul Program</span>
              <input type="text" {...register('title')} className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-1 focus:ring-zinc-900" />
              {errors.title && <p className="text-xs text-rose-600 mt-1">{errors.title.message}</p>}
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Slug URL (tanpa spasi)</span>
              <input type="text" {...register('slug')} className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-1 focus:ring-zinc-900 font-mono" />
              {errors.slug && <p className="text-xs text-rose-600 mt-1">{errors.slug.message}</p>}
            </label>
          </div>

          {/* Row 2: Lokasi & Status */}
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Lokasi</span>
              <input type="text" {...register('location')} className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" />
              {errors.location && <p className="text-xs text-rose-600 mt-1">{errors.location.message}</p>}
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Status Pendaftaran</span>
              <select {...register('status')} className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 rounded-lg">
                <option value="open">Buka (Open)</option>
                <option value="closed">Tutup (Closed)</option>
                <option value="ongoing">Sedang Berlangsung (Ongoing)</option>
              </select>
              {errors.status && <p className="text-xs text-rose-600 mt-1">{errors.status.message}</p>}
            </label>
          </div>

          {/* Row 2.5: Jenis Program & Link Eksternal */}
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Jenis Program STA</span>
              <p className="text-[11px] text-slate-500 mt-0.5 mb-1">Pilih program utama yang terkait dengan kegiatan relawan ini.</p>
              <select {...register('program_type')} className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 rounded-lg">
                {PROGRAM_TYPE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              {errors.program_type && <p className="text-xs text-rose-600 mt-1">{errors.program_type.message}</p>}
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Link Panduan / Guidebook (Opsional)</span>
              <p className="text-[11px] text-slate-500 mt-0.5 mb-1">Jika diisi, tombol "Lihat Guidebook" akan muncul di halaman formulir pendaftaran.</p>
              <input type="text" {...register('external_link')} placeholder="https://example.com/guidebook.pdf" className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-1 focus:ring-zinc-900" />
              {errors.external_link && <p className="text-xs text-rose-600 mt-1">{errors.external_link.message}</p>}
            </label>
          </div>

          {/* Deskripsi Singkat — Rich Text */}
          <Controller
            name="short_description"
            control={control}
            render={({ field }) => (
              <RichTextEditor
                label="Deskripsi Singkat (Hero)"
                hint="Tuliskan deskripsi singkat untuk hero section (1-2 kalimat). Mendukung tulisan tebal/miring."
                value={field.value || ''}
                onChange={field.onChange}
              />
            )}
          />

          {/* Deskripsi Lengkap — Rich Text */}
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <RichTextEditor
                label="Deskripsi Lengkap Program"
                hint="Tuliskan penjelasan lengkap tentang program relawan ini."
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

          {/* Pembangun Formulir Dinamis (Google Forms Style) */}
          <div className="border-t border-slate-200 pt-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-slate-800">Desain Formulir Pendaftaran</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Buat pertanyaan/field kustom untuk calon relawan. Kolom <strong>Nama Lengkap</strong>, <strong>Email</strong>, dan <strong>WhatsApp</strong> selalu aktif secara bawaan demi kebutuhan dasar sistem.
                </p>
              </div>
              <button
                type="button"
                onClick={() => append({ id: `custom_${Date.now()}`, type: 'text', label: '', required: false, options: [] })}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-colors text-xs font-semibold shrink-0 cursor-pointer"
              >
                <Plus size={14} /> Tambah Pertanyaan
              </button>
            </div>

            <div className="space-y-3">
              {fields.map((field, index) => {
                const type = watch(`form_config.${index}.type`);
                return (
                  <div key={field.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 relative group">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-400">#{index + 1}</span>
                      
                      {/* Label/Pertanyaan */}
                      <div className="flex-1 flex flex-col">
                        <input
                          type="text"
                          {...register(`form_config.${index}.label` as const)}
                          placeholder="Teks Pertanyaan / Nama Field"
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900 bg-white font-medium"
                        />
                        {errors.form_config?.[index]?.label && (
                          <p className="text-[10px] text-rose-600 mt-0.5">{(errors.form_config[index] as any).label?.message}</p>
                        )}
                      </div>

                      {/* Tipe input */}
                      <select
                        {...register(`form_config.${index}.type` as const)}
                        className="px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none"
                      >
                        <option value="text">Jawaban Singkat (Text)</option>
                        <option value="email">Email (Email)</option>
                        <option value="tel">No. Telepon / WA (Tel)</option>
                        <option value="textarea">Paragraf (Textarea)</option>
                        <option value="select">Pilihan Ganda (Dropdown)</option>
                        <option value="date">Tanggal (Date)</option>
                        <option value="file">Unggah Berkas (File)</option>
                        <option value="number">Angka Saja (Number)</option>
                      </select>

                      {/* Required Toggle */}
                      <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          {...register(`form_config.${index}.required` as const)}
                          className="h-3.5 w-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                        Wajib
                      </label>

                      {/* Order Actions */}
                      <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => swap(index, index - 1)}
                          className="p-1.5 text-slate-400 hover:text-slate-800 disabled:opacity-30 disabled:hover:text-slate-400 border-r border-slate-100 cursor-pointer"
                        >
                          <ChevronUp size={12} />
                        </button>
                        <button
                          type="button"
                          disabled={index === fields.length - 1}
                          onClick={() => swap(index, index + 1)}
                          className="p-1.5 text-slate-400 hover:text-slate-800 disabled:opacity-30 disabled:hover:text-slate-400 cursor-pointer"
                        >
                          <ChevronDown size={12} />
                        </button>
                      </div>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {/* Options for Select Type */}
                    {type === 'select' && (
                      <div className="pl-6 space-y-2">
                        <span className="text-[10px] font-bold text-slate-500">Pilihan Opsi Dropdown:</span>
                        <Controller
                          name={`form_config.${index}.options`}
                          control={control}
                          render={({ field }) => (
                            <OptionsTagInput
                              value={field.value}
                              onChange={field.onChange}
                            />
                          )}
                        />
                        {errors.form_config?.[index]?.options && (
                          <p className="text-[10px] text-rose-600 mt-0.5">{(errors.form_config[index] as any).options?.message}</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Toggle Hero Beranda */}
          <label className="flex items-start gap-3 p-4 rounded-xl border-2 border-dashed border-emerald-200 bg-emerald-50/50 cursor-pointer hover:border-emerald-300 transition-colors">
            <input type="checkbox" {...register('show_in_hero')} className="mt-1 h-4 w-4 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500" />
            <div>
              <p className="text-sm font-bold text-emerald-800">Tampilkan di Hero Beranda</p>
              <p className="text-xs text-emerald-600 mt-0.5">Jika dicentang, program ini otomatis muncul sebagai slide utama di halaman Beranda dengan tombol "Daftar Relawan".</p>
            </div>
          </label>
        </form>
      </AdminModal>
      {ConfirmDialogElement}
    </div>
  );
}
