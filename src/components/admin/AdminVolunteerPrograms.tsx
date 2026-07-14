import React, { useEffect, useRef, useState } from 'react';
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
import { cleanupUploadedFiles, deleteFilesFromStorage, storageCleanupNotice, uploadAdminImage } from '../../lib/supabase/storage';
import type { VolunteerProgramRow } from '../../lib/supabase/types';
import type { VolunteerTimelineItem } from '../../lib/eduxplore';
import {
  DEFAULT_BEASISWA_FORM_CONFIG,
  DEFAULT_REGULER_FORM_CONFIG,
  getVolunteerProgramStatus,
  normalizeEduxploreFormConfig,
} from '../../lib/eduxplore';
import { logError } from '../../lib/error-logger';
import { useConfirmDialog } from './ConfirmDialog';
import { slugify } from '../../lib/admin/campaign-utils';
import { normalizeGuidebookUrl, normalizeSafeUrl } from '../../lib/sanitize';

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

const questionSchema = z.object({
  id: z.string(),
  type: z.enum(['text', 'textarea', 'select', 'date', 'file', 'number', 'email', 'tel']),
  label: z.string().min(1, 'Label wajib diisi'),
  required: z.boolean(),
  options: z.array(z.string()).nullable().optional(),
});

const safeOptionalUrl = (message: string) =>
  z.string().trim().optional().nullable().or(z.literal('')).refine((value) => {
    if (!value) return true;
    try {
      normalizeSafeUrl(value);
      return true;
    } catch {
      return false;
    }
  }, message);

const safeOptionalGuidebookUrl = (message: string) =>
  z.string().trim().optional().nullable().or(z.literal('')).refine((value) => {
    if (!value) return true;
    try {
      normalizeGuidebookUrl(value);
      return true;
    } catch {
      return false;
    }
  }, message);

const schema = z.object({
  title: z.string().min(1, 'Judul wajib diisi'),
  slug: z.string().min(1, 'Slug wajib diisi'),
  location: z.string().min(1, 'Lokasi wajib diisi'),
  description: z.string().optional(),
  short_description: z.string().optional(),
  image_url: safeOptionalUrl('URL gambar tidak aman atau domain belum diizinkan.'),
  show_in_hero: z.boolean(),
  program_type: z.enum(['jelajah', 'eduxplore', 'bangun-asa']),
  status: z.enum(['open', 'closed', 'ongoing']),
  timeline_text: z.string().optional(),
  requirements_text: z.string().optional(),
  form_config: z.object({
    reguler: z.array(questionSchema),
    beasiswa: z.array(questionSchema),
    enabled_registration_types: z.object({
      reguler: z.boolean(),
      beasiswa: z.boolean(),
    }),
  }).optional(),
  external_link: safeOptionalGuidebookUrl('Link guidebook tidak aman atau domain belum diizinkan.'),
  registration_start: z.string().optional().nullable().or(z.literal('')),
  registration_end: z.string().optional().nullable().or(z.literal('')),
  program_end: z.string().optional().nullable().or(z.literal('')),
}).superRefine((data, ctx) => {
  const startStr = data.registration_start;
  const endStr = data.registration_end;
  const progEndStr = data.program_end;

  if (startStr && endStr) {
    const start = new Date(startStr);
    const end = new Date(endStr);
    if (start > end) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Mulai pendaftaran tidak boleh setelah selesai pendaftaran',
        path: ['registration_start'],
      });
    }
  }

  if (endStr && progEndStr) {
    const end = new Date(endStr);
    const progEnd = new Date(progEndStr);
    if (end > progEnd) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Selesai pendaftaran tidak boleh setelah selesai kegiatan',
        path: ['registration_end'],
      });
    }
  }

  if (startStr && progEndStr) {
    const start = new Date(startStr);
    const progEnd = new Date(progEndStr);
    if (start > progEnd) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Mulai pendaftaran tidak boleh setelah selesai kegiatan',
        path: ['registration_start'],
      });
    }
  }
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
  form_config: {
    reguler: [...DEFAULT_REGULER_FORM_CONFIG],
    beasiswa: [...DEFAULT_BEASISWA_FORM_CONFIG],
    enabled_registration_types: {
      reguler: true,
      beasiswa: true,
    },
  },
  external_link: '',
  registration_start: '',
  registration_end: '',
  program_end: '',
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
  const [activeFormTab, setActiveFormTab] = useState<'reguler' | 'beasiswa'>('reguler');
  const sessionUploads = useRef<string[]>([]);

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

  // Dual Field Arrays untuk form builder Reguler dan Beasiswa
  const { fields: regulerFields, append: appendReguler, remove: removeReguler, swap: swapReguler } = useFieldArray({
    control,
    name: 'form_config.reguler',
  });

  const { fields: beasiswaFields, append: appendBeasiswa, remove: removeBeasiswa, swap: swapBeasiswa } = useFieldArray({
    control,
    name: 'form_config.beasiswa',
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
    const defaultFormConfig = normalizeEduxploreFormConfig(null);
    setNotice(null);
    setError(null);
    setEditingProgram(null);
    setActiveFormTab('reguler');
    reset({
      ...defaultValues,
      form_config: defaultFormConfig,
    });
    setMode('create');
  }

  // Format Helper to convert DB ISO String to local HTML input format 'yyyy-MM-ddThh:mm'
  const formatToDatetimeLocal = (dateStr: string | null | undefined) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  function openEdit(program: VolunteerProgramRow) {
    setNotice(null);
    setError(null);
    setEditingProgram(program);
    setActiveFormTab('reguler');

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

    const parsedFormConfig = normalizeEduxploreFormConfig(program.form_config);

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
      registration_start: formatToDatetimeLocal(program.registration_start),
      registration_end: formatToDatetimeLocal(program.registration_end),
      program_end: formatToDatetimeLocal(program.program_end),
    });
    setMode('edit');
  }

  async function closeModal(saved = false) {
    const pendingUploads = [...sessionUploads.current];
    sessionUploads.current = [];
    if (!saved && pendingUploads.length > 0) {
      const cleanupResult = await cleanupUploadedFiles(pendingUploads);
      if (cleanupResult.failed > 0) {
        logError('AdminVolunteerPrograms.closeModal.cleanupUploads', new Error('Gagal membersihkan upload program relawan yang dibatalkan.'), cleanupResult);
      }
    }
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
      sessionUploads.current.push(url);
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
        form_config: normalizeEduxploreFormConfig(values.form_config) as unknown as import('../../lib/supabase/types').Json,
        external_link: values.external_link || null,
        registration_start: values.registration_start ? new Date(values.registration_start).toISOString() : null,
        registration_end: values.registration_end ? new Date(values.registration_end).toISOString() : null,
        program_end: values.program_end ? new Date(values.program_end).toISOString() : null,
      };

      const { error: saveError } = await saveVolunteerProgram(payload, editingProgram?.id);
      if (saveError) throw saveError;

      const cleanupTargets = [
        ...sessionUploads.current.filter((url) => url !== values.image_url),
        ...(editingProgram?.image_url && editingProgram.image_url !== values.image_url ? [editingProgram.image_url] : []),
      ];
      const cleanupResult = cleanupTargets.length > 0 ? await deleteFilesFromStorage(cleanupTargets) : null;
      if (cleanupResult?.failed) {
        logError('AdminVolunteerPrograms.cleanupAfterSave', new Error('Sebagian file program relawan gagal dihapus.'), cleanupResult);
      }
      sessionUploads.current = [];
      setNotice(storageCleanupNotice(mode === 'edit' ? 'Program berhasil diperbarui.' : 'Program berhasil ditambahkan.', cleanupResult));
      await closeModal(true);
      loadData();
    } catch (err) {
      if (sessionUploads.current.length > 0) {
        const cleanupResult = await cleanupUploadedFiles(sessionUploads.current);
        if (cleanupResult.failed > 0) {
          logError('AdminVolunteerPrograms.cleanupFreshUploadsAfterSaveFailure', new Error('Gagal membersihkan upload program relawan baru.'), cleanupResult);
        }
        sessionUploads.current = [];
        setValue('image_url', editingProgram?.image_url ?? '', { shouldDirty: true });
      }
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
      let cleanupResult = null;
      if (program.image_url) {
        cleanupResult = await deleteFilesFromStorage([program.image_url]);
        if (cleanupResult.failed > 0) {
          logError('AdminVolunteerPrograms.deleteStorage', new Error('Sebagian file program relawan gagal dihapus.'), cleanupResult);
        }
      }
      setNotice(storageCleanupNotice('Program berhasil dihapus.', cleanupResult));
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
    if (errors.registration_start) errorList.push('Tanggal Mulai: ' + errors.registration_start.message);
    if (errors.registration_end) errorList.push('Tanggal Selesai: ' + errors.registration_end.message);
    if (errors.program_end) errorList.push('Tanggal Kegiatan Selesai: ' + errors.program_end.message);

    if (errors.form_config) {
      const regulerErrors = (errors.form_config as any).reguler;
      const beasiswaErrors = (errors.form_config as any).beasiswa;

      if (Array.isArray(regulerErrors)) {
        regulerErrors.forEach((err: any, idx: number) => {
          if (err) {
            if (err.label) errorList.push(`[Form Reguler] Pertanyaan #${idx + 1}: ${err.label.message}`);
            if (err.options) errorList.push(`[Form Reguler] Pertanyaan #${idx + 1} (Dropdown): ${err.options.message}`);
          }
        });
      }

      if (Array.isArray(beasiswaErrors)) {
        beasiswaErrors.forEach((err: any, idx: number) => {
          if (err) {
            if (err.label) errorList.push(`[Form Beasiswa] Pertanyaan #${idx + 1}: ${err.label.message}`);
            if (err.options) errorList.push(`[Form Beasiswa] Pertanyaan #${idx + 1} (Dropdown): ${err.options.message}`);
          }
        });
      }
    }

    if (errorList.length === 0 && Object.keys(errors).length > 0) {
      errorList.push('Terdapat beberapa kolom input yang tidak valid.');
    }

    return errorList;
  };

  const renderProgramStatusBadge = (p: VolunteerProgramRow) => {
    const computed = getVolunteerProgramStatus({
      status: p.status,
      registration_start: p.registration_start,
      registration_end: p.registration_end,
      program_end: p.program_end,
    });

    const hasDates = p.registration_start && p.registration_end && p.program_end;
    const suffix = hasDates ? ' (Otomatis)' : '';

    let color = 'bg-emerald-100 text-emerald-700';
    if (computed === 'closed') color = 'bg-rose-100 text-rose-700';
    else if (computed === 'ongoing') color = 'bg-amber-100 text-amber-700';

    return (
      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${color}`}>
        {computed.toUpperCase()}{suffix}
      </span>
    );
  };

  // Alias pembantu untuk render form builder dinamis kustom Reguler / Beasiswa
  const currentFields = activeFormTab === 'beasiswa' ? beasiswaFields : regulerFields;
  const currentAppend = activeFormTab === 'beasiswa' ? appendBeasiswa : appendReguler;
  const currentRemove = activeFormTab === 'beasiswa' ? removeBeasiswa : removeReguler;
  const currentSwap = activeFormTab === 'beasiswa' ? swapBeasiswa : swapReguler;
  const currentFieldName = activeFormTab === 'beasiswa' ? 'form_config.beasiswa' : 'form_config.reguler';

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
                    {renderProgramStatusBadge(p)}
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
        onClose={() => void closeModal()}
        title={mode === 'edit' ? 'Edit Program Relawan' : 'Tambah Program Relawan'}
        widthClassName="max-w-3xl"
        footer={(
          <>
            <button type="button" onClick={() => void closeModal()} className="px-4 py-2 text-sm text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50">Batal</button>
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

          {/* Row 2: Lokasi & Status Manual */}
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Lokasi</span>
              <input type="text" {...register('location')} className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" />
              {errors.location && <p className="text-xs text-rose-600 mt-1">{errors.location.message}</p>}
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Status Pendaftaran (Manual Override)</span>
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

          {/* Row 2.7: Penjadwalan Otomatisasi Status (Tanggal) */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Penjadwalan Otomatisasi Status (Opsional)</h4>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Jika semua kolom tanggal diisi, status pendaftaran relawan akan ter-update secara otomatis berdasarkan waktu. Kosongkan jika ingin mengontrol status secara manual.
            </p>
            <div className="grid grid-cols-3 gap-3">
              <label className="block">
                <span className="text-[11px] font-semibold text-slate-600">Mulai Pendaftaran</span>
                <input type="datetime-local" {...register('registration_start')} className={`mt-1 w-full px-2.5 py-1.5 text-xs border rounded-lg bg-white focus:outline-none ${errors.registration_start ? 'border-rose-300 focus:ring-1 focus:ring-rose-500' : 'border-slate-200'}`} />
                {errors.registration_start && <p className="text-[10px] text-rose-600 mt-1">{errors.registration_start.message}</p>}
              </label>
              <label className="block">
                <span className="text-[11px] font-semibold text-slate-600">Selesai Pendaftaran</span>
                <input type="datetime-local" {...register('registration_end')} className={`mt-1 w-full px-2.5 py-1.5 text-xs border rounded-lg bg-white focus:outline-none ${errors.registration_end ? 'border-rose-300 focus:ring-1 focus:ring-rose-500' : 'border-slate-200'}`} />
                {errors.registration_end && <p className="text-[10px] text-rose-600 mt-1">{errors.registration_end.message}</p>}
              </label>
              <label className="block">
                <span className="text-[11px] font-semibold text-slate-600">Selesai Kegiatan</span>
                <input type="datetime-local" {...register('program_end')} className={`mt-1 w-full px-2.5 py-1.5 text-xs border rounded-lg bg-white focus:outline-none ${errors.program_end ? 'border-rose-300 focus:ring-1 focus:ring-rose-500' : 'border-slate-200'}`} />
                {errors.program_end && <p className="text-[10px] text-rose-600 mt-1">{errors.program_end.message}</p>}
              </label>
            </div>
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-slate-800">Desain Formulir Pendaftaran</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Buat pertanyaan/field kustom untuk calon relawan. Kolom Nama, Email, dan WhatsApp selalu aktif secara bawaan demi kebutuhan sistem.
                </p>
              </div>

              {/* Tab selector untuk mengedit reguler vs beasiswa */}
              <div className="inline-flex p-1 bg-slate-100 border border-slate-200 rounded-xl">
                <button
                  type="button"
                  onClick={() => setActiveFormTab('reguler')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeFormTab === 'reguler' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  Reguler
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFormTab('beasiswa')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeFormTab === 'beasiswa' ? 'bg-zinc-900 text-white shadow-sm' : 'text-slate-500'
                  }`}
                >
                  Beasiswa
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 bg-white cursor-pointer hover:border-emerald-300 transition-colors">
                <input
                  type="checkbox"
                  {...register('form_config.enabled_registration_types.reguler')}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <div>
                  <p className="text-xs font-bold text-slate-800">Tampilkan Jalur Reguler di halaman user</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Pertanyaan reguler tetap tersimpan meski jalur disembunyikan.</p>
                </div>
              </label>
              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 bg-white cursor-pointer hover:border-violet-300 transition-colors">
                <input
                  type="checkbox"
                  {...register('form_config.enabled_registration_types.beasiswa')}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500 cursor-pointer"
                />
                <div>
                  <p className="text-xs font-bold text-slate-800">Tampilkan Jalur Beasiswa di halaman user</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Pertanyaan beasiswa tetap tersimpan meski jalur disembunyikan.</p>
                </div>
              </label>
            </div>

            <div className="flex justify-between items-center bg-emerald-50/50 border border-emerald-100 p-3.5 rounded-xl">
              <span className="text-xs text-emerald-800 font-semibold">
                Mengedit: Form Pendaftaran <span className="underline uppercase">{activeFormTab}</span>
              </span>
              <button
                type="button"
                onClick={() => currentAppend({ id: `custom_${Date.now()}`, type: 'text', label: '', required: false, options: [] })}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors text-xs font-semibold shrink-0 cursor-pointer shadow-sm"
              >
                <Plus size={14} /> Tambah Pertanyaan
              </button>
            </div>

            <div className="space-y-3">
              {currentFields.map((field, index) => {
                const type = watch(`${currentFieldName}.${index}.type` as any);
                return (
                  <div key={field.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 relative group">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-400">#{index + 1}</span>
                      
                      {/* Label/Pertanyaan */}
                      <div className="flex-1 flex flex-col">
                        <input
                          type="text"
                          {...register(`${currentFieldName}.${index}.label` as any)}
                          placeholder="Teks Pertanyaan / Nama Field"
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900 bg-white font-medium"
                        />
                        {errors.form_config && (errors.form_config as any)[activeFormTab]?.[index]?.label && (
                          <p className="text-[10px] text-rose-600 mt-0.5">{(errors.form_config as any)[activeFormTab][index].label.message}</p>
                        )}
                      </div>

                      {/* Tipe input */}
                      <select
                        {...register(`${currentFieldName}.${index}.type` as any)}
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
                          {...register(`${currentFieldName}.${index}.required` as any)}
                          className="h-3.5 w-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                        Wajib
                      </label>

                      {/* Order Actions */}
                      <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => currentSwap(index, index - 1)}
                          className="p-1.5 text-slate-400 hover:text-slate-800 disabled:opacity-30 disabled:hover:text-slate-400 border-r border-slate-100 cursor-pointer"
                        >
                          <ChevronUp size={12} />
                        </button>
                        <button
                          type="button"
                          disabled={index === currentFields.length - 1}
                          onClick={() => currentSwap(index, index + 1)}
                          className="p-1.5 text-slate-400 hover:text-slate-800 disabled:opacity-30 disabled:hover:text-slate-400 cursor-pointer"
                        >
                          <ChevronDown size={12} />
                        </button>
                      </div>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => currentRemove(index)}
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
                          name={`${currentFieldName}.${index}.options` as any}
                          control={control}
                          render={({ field }) => (
                            <OptionsTagInput
                              value={field.value}
                              onChange={field.onChange}
                            />
                          )}
                        />
                        {errors.form_config && (errors.form_config as any)[activeFormTab]?.[index]?.options && (
                          <p className="text-[10px] text-rose-600 mt-0.5">{(errors.form_config as any)[activeFormTab][index].options.message}</p>
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
