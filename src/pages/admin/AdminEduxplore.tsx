import React, { useEffect, useState } from 'react';
import { fetchAllVolunteerRegistrations, fetchVolunteerPrograms, updateVolunteerRegistrationStatus, deleteVolunteerRegistrations } from '../../lib/admin/repository';
import type { VolunteerRegistrationRow, VolunteerProgramRow } from '../../lib/supabase/types';
import { supabase } from '../../lib/supabase/types';
import { formatAdminDate } from '../../lib/admin/helpers';
import { DEFAULT_REGULER_FORM_CONFIG, DEFAULT_BEASISWA_FORM_CONFIG } from '../../components/admin/AdminVolunteerPrograms';
import {
  Loader2, RefreshCw, CheckCircle2, XCircle, Search, ExternalLink,
  UserCheck, Clock, Users, ChevronRight,
  X, MapPin, Phone, Mail, Cake, Shirt, BookOpen, Target, AlertCircle,
  FileImage, Filter, FileSpreadsheet, Trash2, FileText, MessageCircle
} from 'lucide-react';
import { logError } from '../../lib/error-logger';
import { downloadXlsx } from '../../lib/admin-export';

type StatusFilter = 'all' | 'pending' | 'verified' | 'rejected';
type TypeFilter = 'all' | 'reguler' | 'beasiswa';
type ProgramTypeFilter = 'all' | 'jelajah' | 'eduxplore' | 'bangun-asa';
type ExportField = { id: string; label: string; type?: string };
type FormQuestion = { id: string; label?: string; type?: string };

const VOLUNTEER_ASSETS_BUCKET = 'volunteer-assets';
const EXPORT_SIGNED_URL_EXPIRES_IN_SECONDS = 60 * 60 * 24 * 7;

const CORE_EXPORT_FIELDS: ExportField[] = [
  { id: 'nama_lengkap', label: 'Nama Lengkap' },
  { id: 'email', label: 'Email' },
  { id: 'whatsapp', label: 'WhatsApp' },
];

const LEGACY_DETAIL_FIELDS: ExportField[] = [
  { id: 'whatsapp_emergency', label: 'Kontak Darurat' },
  { id: 'alamat', label: 'Alamat' },
  { id: 'tanggal_lahir', label: 'Tanggal Lahir' },
  { id: 'size_baju', label: 'Ukuran Baju' },
  { id: 'pendidikan', label: 'Latar Belakang Pendidikan' },
  { id: 'bidang_diminati', label: 'Bidang Diminati' },
  { id: 'riwayat_penyakit', label: 'Riwayat Penyakit' },
];

const LEGACY_FILE_COLUMNS: Record<string, keyof VolunteerRegistrationRow> = {
  bukti_dp: 'bukti_dp_url',
  bukti_pembayaran: 'bukti_dp_url',
  bukti_follow_ig: 'bukti_follow_url',
  bukti_follow_sta: 'bukti_follow_url',
  bukti_follow_bepro: 'bukti_follow_url',
  foto_id_card: 'foto_id_url',
};

const PROGRAM_TYPE_LABELS: Record<ProgramTypeFilter, string> = {
  all: 'Semua Program',
  jelajah: 'Jelajah Tanah Air',
  eduxplore: 'EduXplore',
  'bangun-asa': 'Bangun 1000 Asa',
};

const STATUS_EXPORT_LABELS: Record<StatusFilter, string> = {
  all: 'Semua Status',
  pending: 'Perlu Review',
  verified: 'Diterima',
  rejected: 'Ditolak',
};

const METADATA_EXPORT_FIELDS: ExportField[] = [
  { id: 'registration_type_label', label: 'Jalur Pendaftaran' },
  { id: 'program_title', label: 'Program Relawan' },
  { id: 'program_type_label', label: 'Kategori Program' },
  { id: 'status_label', label: 'Status Pendaftaran' },
  { id: 'created_at_label', label: 'Tanggal Daftar' },
];

function getDefaultFormConfig(registrationType: string | null | undefined) {
  return registrationType === 'beasiswa' ? DEFAULT_BEASISWA_FORM_CONFIG : DEFAULT_REGULER_FORM_CONFIG;
}

// Helper to extract dynamic form config based on path
function getRegistrationFormConfig(prog: VolunteerProgramRow | undefined, registrationType: string | null | undefined) {
  const fallbackConfig = getDefaultFormConfig(registrationType);
  if (!prog || !prog.form_config) return fallbackConfig;
  let raw: any;
  try {
    raw = typeof prog.form_config === 'string'
      ? JSON.parse(prog.form_config)
      : prog.form_config;
  } catch {
    return fallbackConfig;
  }

  if (Array.isArray(raw)) {
    return raw.length > 0 ? raw : fallbackConfig;
  }

  if (raw && typeof raw === 'object') {
    const type = registrationType || 'reguler';
    return raw[type] || raw['reguler'] || fallbackConfig;
  }

  return fallbackConfig;
}

function parseAnswers(value: VolunteerRegistrationRow['answers']): Record<string, unknown> {
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // Broken JSON should not break the admin page or exports.
  }
  return {};
}

function valueIsBlank(value: unknown) {
  if (value == null) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.every(valueIsBlank);
  if (typeof value === 'object') return Object.values(value as Record<string, unknown>).every(valueIsBlank);
  return false;
}

function stringifyValue(value: unknown): string {
  if (valueIsBlank(value)) return '-';
  if (Array.isArray(value)) return value.map(stringifyValue).filter((item) => item !== '-').join(', ') || '-';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function getFileReference(value: unknown) {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) {
    return value.map(getFileReference).find(Boolean) || '';
  }
  if (value && typeof value === 'object') {
    const objectValue = value as Record<string, unknown>;
    for (const key of ['url', 'publicUrl', 'public_url', 'path', 'filePath', 'file_path', 'storagePath', 'storage_path']) {
      const candidate = objectValue[key];
      if (typeof candidate === 'string' && candidate) return candidate;
    }
  }
  return '';
}

function isHttpUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

function isFileExportField(field: ExportField) {
  return field.type === 'file' || field.id in LEGACY_FILE_COLUMNS;
}

function getExportFieldValue(registration: VolunteerRegistrationRow, field: ExportField) {
  const answersObj = parseAnswers(registration.answers);
  const legacyFileColumn = LEGACY_FILE_COLUMNS[field.id];
  const answerValue = answersObj[field.id];

  if (isFileExportField(field)) {
    return getFileReference(answerValue) || (legacyFileColumn ? registration[legacyFileColumn] : '');
  }

  if (!valueIsBlank(answerValue)) return answerValue;
  return registration[field.id as keyof VolunteerRegistrationRow];
}

function hasExportableValue(registration: VolunteerRegistrationRow, field: ExportField) {
  const value = getExportFieldValue(registration, field);
  return isFileExportField(field) ? Boolean(getFileReference(value)) : !valueIsBlank(value);
}

async function resolveFileExportUrl(pathOrUrl: string) {
  if (!pathOrUrl) return '';
  if (isHttpUrl(pathOrUrl)) return pathOrUrl;

  const { data, error } = await supabase.storage
    .from(VOLUNTEER_ASSETS_BUCKET)
    .createSignedUrl(pathOrUrl, EXPORT_SIGNED_URL_EXPIRES_IN_SECONDS);

  if (!error && data?.signedUrl) return data.signedUrl;
  return pathOrUrl;
}

function slugifyFilenamePart(value: string) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function addExportField(fields: ExportField[], seen: Set<string>, field: ExportField) {
  if (!field.id || seen.has(field.id)) return;
  fields.push(field);
  seen.add(field.id);
}

export default function AdminEduxplore() {
  const [registrations, setRegistrations] = useState<VolunteerRegistrationRow[]>([]);
  const [programs, setPrograms] = useState<VolunteerProgramRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProgramType, setSelectedProgramType] = useState<ProgramTypeFilter>('all');
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>('all');
  const [selectedType, setSelectedType] = useState<TypeFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selected, setSelected] = useState<VolunteerRegistrationRow | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [updating, setUpdating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

  const handleProgramTypeChange = (type: ProgramTypeFilter) => {
    setSelectedProgramType(type);
  };

  // Resolve dynamic signed URLs for selected registration files
  useEffect(() => {
    if (!selected) {
      setSignedUrls({});
      return;
    }

    async function resolveUrls() {
      const urls: Record<string, string> = {};
      const answersObj = parseAnswers(selected!.answers);

      // Find program formConfig
      const prog = programs.find(p => p.id === selected!.program_id);
      const activeConfig = getRegistrationFormConfig(prog, selected!.registration_type);

      const fileQuestions = activeConfig.filter((q: any) => q.type === 'file');

      await Promise.all(
        fileQuestions.map(async (q: any) => {
          let pathOrUrl = getFileReference(answersObj[q.id]);

          // Fallback to table columns (legacy support)
          if (!pathOrUrl) {
            const legacyFileColumn = LEGACY_FILE_COLUMNS[q.id];
            pathOrUrl = legacyFileColumn ? selected![legacyFileColumn] : '';
          }

          if (pathOrUrl) {
            if (isHttpUrl(pathOrUrl)) {
              urls[q.id] = pathOrUrl;
            } else {
              const { data, error } = await supabase.storage
                .from(VOLUNTEER_ASSETS_BUCKET)
                .createSignedUrl(pathOrUrl, 60 * 60);

              if (!error && data) {
                urls[q.id] = data.signedUrl;
              }
            }
          }
        })
      );

      setSignedUrls(urls);
    }

    resolveUrls();
  }, [selected, programs]);

  async function loadData() {
    setLoading(true);
    try {
      const [regRes, progRes] = await Promise.all([
        fetchAllVolunteerRegistrations(),
        fetchVolunteerPrograms(),
      ]);
      if (regRes.data) setRegistrations(regRes.data);
      if (progRes.data) setPrograms(progRes.data);
    } catch (err) {
      logError('AdminEduxplore.loadData', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  async function handleUpdateStatus(id: string, newStatus: 'verified' | 'rejected' | 'pending') {
    setUpdating(true);
    setActionError(null);
    try {
      const { error } = await updateVolunteerRegistrationStatus(id, { status: newStatus });
      if (error) throw error;
      setRegistrations(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
      if (selected?.id === id) setSelected(prev => prev ? { ...prev, status: newStatus } : null);
    } catch (err) {
      logError('AdminEduxplore.handleUpdateStatus', err);
      setActionError('Gagal mengupdate status. Coba lagi.');
    } finally {
      setUpdating(false);
    }
  }

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filtered.map(r => r.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(i => i !== id));
    }
  };

  const handleDeleteSelected = async () => {
    if (!confirm(`Apakah Anda yakin ingin menghapus ${selectedIds.length} data pendaftar? Tindakan ini tidak dapat dibatalkan.`)) return;
    setUpdating(true);
    setActionError(null);
    try {
      const { error } = await deleteVolunteerRegistrations(selectedIds);
      if (error) throw error;
      setRegistrations(prev => prev.filter(r => !selectedIds.includes(r.id)));
      if (selected && selectedIds.includes(selected.id)) setSelected(null);
      setSelectedIds([]);
    } catch (err) {
      logError('AdminEduxplore.handleDeleteSelected', err);
      setActionError('Gagal menghapus data. Coba lagi.');
    } finally {
      setUpdating(false);
    }
  };

  const filtered = registrations.filter(r => {
    const prog = programs.find(p => p.id === r.program_id);
    if (selectedProgramType !== 'all' && prog?.program_type !== selectedProgramType) return false;
    if (selectedStatus !== 'all' && r.status !== selectedStatus) return false;
    if (selectedType !== 'all' && (r.registration_type || 'reguler') !== selectedType) return false;
    const q = searchQuery.toLowerCase();
    return (
      (r.nama_lengkap || '').toLowerCase().includes(q) ||
      (r.email || '').toLowerCase().includes(q) ||
      (r.whatsapp || '').includes(q)
    );
  });

  const statsFiltered = registrations.filter(r => {
    const prog = programs.find(p => p.id === r.program_id);
    if (selectedProgramType !== 'all' && prog?.program_type !== selectedProgramType) return false;
    if (selectedType !== 'all' && (r.registration_type || 'reguler') !== selectedType) return false;
    return true;
  });

  const stats = {
    total: statsFiltered.length,
    pending: statsFiltered.filter(r => r.status === 'pending').length,
    verified: statsFiltered.filter(r => r.status === 'verified').length,
    rejected: statsFiltered.filter(r => r.status === 'rejected').length,
  };

  const exportExcel = async () => {
    if (filtered.length === 0 || exporting) return;

    setExporting(true);
    setActionError(null);

    try {
      const fieldsToExport: ExportField[] = [];
      const seenFields = new Set<string>();
      const candidateFields: ExportField[] = [];
      const reservedFieldIds = [...CORE_EXPORT_FIELDS, ...METADATA_EXPORT_FIELDS].map((field) => field.id);
      const seenCandidates = new Set<string>(reservedFieldIds);

      const addCandidateField = (field: ExportField) => {
        if (!field.id || seenCandidates.has(field.id)) return;
        candidateFields.push(field);
        seenCandidates.add(field.id);
      };

      CORE_EXPORT_FIELDS.forEach((field) => addExportField(fieldsToExport, seenFields, field));

      filtered.forEach((registration) => {
        const registrationProgram = programs.find(p => p.id === registration.program_id);
        const activeConfig = getRegistrationFormConfig(registrationProgram, registration.registration_type);
        activeConfig.forEach((question: FormQuestion) => {
          addCandidateField({
            id: question.id,
            label: question.label || question.id,
            type: question.type,
          });
        });
      });

      LEGACY_DETAIL_FIELDS.forEach(addCandidateField);

      filtered.forEach((registration) => {
        const answersObj = parseAnswers(registration.answers);
        Object.keys(answersObj).forEach((key) => {
          addCandidateField({ id: key, label: key });
        });
      });

      candidateFields
        .filter((field) => filtered.some((registration) => hasExportableValue(registration, field)))
        .forEach((field) => addExportField(fieldsToExport, seenFields, field));

      METADATA_EXPORT_FIELDS.forEach((field) => addExportField(fieldsToExport, seenFields, field));

      const exportData = await Promise.all(filtered.map(async (registration) => {
        const registrationProgram = programs.find(p => p.id === registration.program_id);
        const programType = registrationProgram?.program_type as ProgramTypeFilter | undefined;
        const row: Record<string, string> = {};

        const rowEntries = await Promise.all(fieldsToExport.map(async (field) => {
          let value: string;
          if (field.id === 'nama_lengkap') value = stringifyValue(registration.nama_lengkap);
          else if (field.id === 'email') value = stringifyValue(registration.email);
          else if (field.id === 'whatsapp') value = stringifyValue(registration.whatsapp);
          else if (field.id === 'registration_type_label') value = (registration.registration_type || 'reguler').toUpperCase();
          else if (field.id === 'program_title') value = stringifyValue(registrationProgram?.title);
          else if (field.id === 'program_type_label') value = PROGRAM_TYPE_LABELS[programType || 'all'] || stringifyValue(programType);
          else if (field.id === 'status_label') value = statusLabel(registration.status);
          else if (field.id === 'created_at_label') value = formatAdminDate(registration.created_at);
          else if (isFileExportField(field)) {
            const fileReference = getFileReference(getExportFieldValue(registration, field));
            value = fileReference ? await resolveFileExportUrl(fileReference) : '-';
          } else {
            value = stringifyValue(getExportFieldValue(registration, field));
          }

          return [field.label, value] as const;
        }));
        rowEntries.forEach(([label, value]) => {
          row[label] = value;
        });

        return row;
      }));

      const datePart = new Date().toISOString().split('T')[0];
      const filenameParts = [
        'sta-volunteer',
        selectedProgramType === 'all' ? 'semua-program' : selectedProgramType,
        selectedType !== 'all' ? selectedType : '',
        selectedStatus !== 'all' ? slugifyFilenamePart(STATUS_EXPORT_LABELS[selectedStatus]) : '',
        searchQuery.trim() ? 'search' : '',
        datePart,
      ].filter(Boolean);

      await downloadXlsx(
        `${filenameParts.join('-')}.xlsx`,
        'Pendaftar Volunteer',
        exportData,
      );
    } catch (err) {
      logError('AdminEduxplore.exportExcel', err);
      setActionError('Gagal mengekspor data. Coba lagi.');
    } finally {
      setExporting(false);
    }
  };

  const getProgramName = (id: string) => programs.find(p => p.id === id)?.title || 'Unknown';

  const statusBadge = (status: string) => {
    if (status === 'verified') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (status === 'rejected') return 'bg-rose-100 text-rose-700 border-rose-200';
    return 'bg-amber-100 text-amber-700 border-amber-200';
  };

  const statusLabel = (status: string) => {
    if (status === 'verified') return 'Diterima';
    if (status === 'rejected') return 'Ditolak';
    return 'Perlu Review';
  };

  const program = programs.find(p => p.id === selected?.program_id);
  const activeFormConfig = getRegistrationFormConfig(program, selected?.registration_type);

  const parsedAnswers = selected ? parseAnswers(selected.answers) : {};

  const getAnswerValue = (qId: string) => {
    if (!selected) return null;
    if (parsedAnswers && parsedAnswers[qId] !== undefined) {
      return parsedAnswers[qId];
    }
    const colName = qId as keyof VolunteerRegistrationRow;
    if (selected[colName] !== undefined) {
      return selected[colName];
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Pendaftar Relawan</h1>
          <p className="text-sm text-slate-500 mt-0.5">Tinjau dan verifikasi setiap pendaftar volunteer dari semua program.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportExcel}
            disabled={filtered.length === 0 || exporting}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 transition-colors text-sm font-semibold shadow-sm disabled:opacity-40"
          >
            {exporting ? <Loader2 size={15} className="animate-spin" /> : <FileSpreadsheet size={15} />}
            {exporting ? 'Mengekspor...' : 'Export Excel'}
          </button>
          <button onClick={loadData} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors text-sm">
            <RefreshCw size={15} /> Refresh
          </button>
        </div>
      </div>

      {/* Action Error Banner */}
      {actionError && (
        <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-rose-200 bg-rose-50 text-sm text-rose-700">
          <div className="flex items-center gap-2.5">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-rose-400 hover:text-rose-600 transition-colors">
            <X size={14} />
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: stats.total, icon: Users, color: 'text-slate-600 bg-slate-100', filter: 'all' as StatusFilter },
          { label: 'Perlu Review', value: stats.pending, icon: Clock, color: 'text-amber-600 bg-amber-100', filter: 'pending' as StatusFilter },
          { label: 'Diterima', value: stats.verified, icon: UserCheck, color: 'text-emerald-600 bg-emerald-100', filter: 'verified' as StatusFilter },
          { label: 'Ditolak', value: stats.rejected, icon: XCircle, color: 'text-rose-600 bg-rose-100', filter: 'rejected' as StatusFilter },
        ].map(({ label, value, icon: Icon, color, filter }) => (
          <button
            key={filter}
            onClick={() => setSelectedStatus(filter)}
            className={`bg-white p-4 rounded-2xl border transition-all text-left flex items-center gap-3 shadow-sm hover:shadow ${selectedStatus === filter ? 'border-slate-400 ring-1 ring-slate-300' : 'border-slate-200'}`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
              <Icon size={20} />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-500">{label}</p>
              <p className="text-xl font-black text-slate-900">{value}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-4" style={{ minHeight: '600px' }}>
        {/* Left: List */}
        <div className={`flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all ${selected ? 'lg:w-[380px] flex-shrink-0' : 'flex-1'}`}>
          {/* Filters */}
          <div className="p-4 border-b border-slate-100 space-y-3 bg-slate-50/60">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Cari nama, email, atau WA..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
              />
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                <select
                  value={selectedProgramType}
                  onChange={e => handleProgramTypeChange(e.target.value as ProgramTypeFilter)}
                  className="w-full pl-7 pr-2 py-2 bg-white border border-slate-200 rounded-xl text-[11px] outline-none appearance-none font-medium text-slate-700"
                >
                  <option value="all">Semua Kategori</option>
                  <option value="jelajah">Jelajah Tanah Air</option>
                  <option value="eduxplore">EduXplore</option>
                  <option value="bangun-asa">Bangun 1000 Asa</option>
                </select>
              </div>
              <select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value as StatusFilter)}
                className="px-2 py-2 bg-white border border-slate-200 rounded-xl text-[11px] outline-none font-medium text-slate-700"
              >
                <option value="all">Semua Status</option>
                <option value="pending">Perlu Review</option>
                <option value="verified">Diterima</option>
                <option value="rejected">Ditolak</option>
              </select>
              <select
                value={selectedType}
                onChange={e => setSelectedType(e.target.value as TypeFilter)}
                className="px-2 py-2 bg-white border border-slate-200 rounded-xl text-[11px] outline-none font-medium text-slate-700"
              >
                <option value="all">Semua Jalur</option>
                <option value="reguler">Reguler</option>
                <option value="beasiswa">Beasiswa</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 bg-white">
            <div className="flex items-center gap-3">
              <input 
                type="checkbox" 
                checked={filtered.length > 0 && selectedIds.length === filtered.length}
                onChange={handleSelectAll}
                className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600"
              />
              <span className="text-xs font-semibold text-slate-500">
                {selectedIds.length > 0 ? `${selectedIds.length} Dipilih` : `${filtered.length} Pendaftar`}
              </span>
            </div>
            {selectedIds.length > 0 && (
              <button 
                onClick={handleDeleteSelected}
                disabled={updating}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors disabled:opacity-50"
              >
                <Trash2 size={14} /> Hapus
              </button>
            )}
          </div>

          {/* List */}
          {loading ? (
            <div className="flex-1 flex items-center justify-center p-12">
              <Loader2 className="w-7 h-7 animate-spin text-slate-400" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
              <Users className="w-10 h-10 text-slate-200 mb-3" />
              <p className="text-slate-400 text-sm font-medium">Belum ada pendaftar</p>
              <p className="text-slate-300 text-xs mt-1">Coba ubah filter atau cari kata lain</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {filtered.map(reg => (
                <div key={reg.id} className={`w-full flex items-stretch hover:bg-slate-50 transition-colors ${selected?.id === reg.id ? 'bg-emerald-50/50 border-l-2 border-emerald-500' : ''}`}>
                  <div className="pl-4 flex items-center justify-center">
                    <input 
                      type="checkbox" 
                      checked={selectedIds.includes(reg.id)}
                      onChange={(e) => handleSelectRow(reg.id, e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600"
                    />
                  </div>
                  <button
                    onClick={() => setSelected(reg)}
                    className="flex-1 text-left px-3 py-4 flex items-center gap-3 overflow-hidden min-w-0"
                  >
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {(reg.nama_lengkap || '?')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-sm font-semibold text-slate-900 truncate">{reg.nama_lengkap}</p>
                        <span className={`inline-flex text-[9px] font-bold px-1.5 py-0.5 rounded border flex-shrink-0 ${
                          (reg.registration_type || 'reguler') === 'beasiswa'
                            ? 'bg-violet-50 text-violet-700 border-violet-100'
                            : 'bg-blue-50 text-blue-700 border-blue-100'
                        }`}>
                          {(reg.registration_type || 'reguler').toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <p className="text-xs text-slate-500 truncate flex-1">{reg.bidang_diminati || reg.email}</p>
                        <span className={`inline-flex text-[9px] font-bold px-1.5 py-0.5 rounded-full border flex-shrink-0 ${statusBadge(reg.status)}`}>
                          {statusLabel(reg.status)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1.5 text-[10px] text-slate-400">
                        <span className="truncate max-w-[150px] bg-slate-100 px-1.5 py-0.5 rounded font-medium text-slate-600">{getProgramName(reg.program_id)}</span>
                        <span>{formatAdminDate(reg.created_at)}</span>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-slate-300 flex-shrink-0 pr-1" />
                  </button>
              </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Detail Panel */}
        {selected ? (
          <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            {/* Detail Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold">
                  {(selected.nama_lengkap || '?')[0].toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-slate-900">{selected.nama_lengkap}</p>
                    <span className={`inline-flex text-[9px] font-extrabold px-1.5 py-0.5 rounded border ${
                      (selected.registration_type || 'reguler') === 'beasiswa'
                        ? 'bg-violet-100 text-violet-800 border-violet-200'
                        : 'bg-blue-100 text-blue-800 border-blue-200'
                    }`}>
                      JALUR {(selected.registration_type || 'reguler').toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{getProgramName(selected.program_id)}</p>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors">
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Status Banner */}
              <div className={`mx-6 mt-5 flex items-center gap-3 p-3 rounded-xl border ${statusBadge(selected.status)}`}>
                {selected.status === 'verified' ? <CheckCircle2 size={18} /> : selected.status === 'rejected' ? <XCircle size={18} /> : <Clock size={18} />}
                <div>
                  <p className="text-sm font-bold">{statusLabel(selected.status)}</p>
                  <p className="text-[11px] opacity-80">Terdaftar {formatAdminDate(selected.created_at)}</p>
                </div>
              </div>

              <div className="px-6 py-5 space-y-6">
                {/* Core Contact Info */}
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Kontak Utama</h3>
                  <div className="space-y-3">
                    {[
                      { icon: Mail, label: 'Email', value: selected.email },
                      { icon: Phone, label: 'WhatsApp', value: selected.whatsapp },
                    ].map(({ icon: Icon, label, value }) => (
                      <div key={label} className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Icon size={14} className="text-slate-500" />
                        </div>
                        <div>
                          <p className="text-[11px] text-slate-400 font-medium">{label}</p>
                          <p className="text-sm text-slate-800 font-medium leading-snug">{value || '-'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dynamic Form Information */}
                {activeFormConfig.filter((q: any) => q.type !== 'file').length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Detail Jawaban</h3>
                    <div className="space-y-4">
                      {activeFormConfig
                        .filter((q: any) => q.type !== 'file')
                        .map((q: any) => {
                          const val = getAnswerValue(q.id);
                          const displayValue = stringifyValue(val);

                          // Determine color/icon for specific standard questions to look premium
                          let icon = Target;
                          let bgClass = 'bg-slate-100 text-slate-600';
                          if (q.id === 'alamat') { icon = MapPin; bgClass = 'bg-slate-100 text-slate-600'; }
                          else if (q.id === 'tanggal_lahir') { icon = Cake; bgClass = 'bg-slate-100 text-slate-600'; }
                          else if (q.id === 'size_baju') { icon = Shirt; bgClass = 'bg-slate-100 text-slate-600'; }
                          else if (q.id === 'pendidikan') { icon = BookOpen; bgClass = 'bg-blue-50 text-blue-500'; }
                          else if (q.id === 'bidang_diminati') { icon = Target; bgClass = 'bg-emerald-50 text-emerald-500'; }
                          else if (q.id === 'riwayat_penyakit') { icon = AlertCircle; bgClass = 'bg-rose-50 text-rose-500'; }

                          const Icon = icon;

                          return (
                            <div key={q.id} className="flex items-start gap-3">
                              <div className={`w-7 h-7 rounded-lg ${bgClass} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                                <Icon size={14} />
                              </div>
                              <div className="flex-1">
                                <p className="text-[11px] text-slate-400 font-medium">{q.label}</p>
                                <p className="text-sm text-slate-800 font-semibold leading-relaxed whitespace-pre-wrap">
                                  {displayValue !== '-' ? displayValue : <span className="italic text-slate-300 font-normal">Belum diisi</span>}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Dynamic Documents */}
                {activeFormConfig.filter((q: any) => q.type === 'file').length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Dokumen Pendaftaran</h3>
                    <div className="grid grid-cols-1 gap-2">
                      {activeFormConfig
                        .filter((q: any) => q.type === 'file')
                        .map((q: any) => {
                          const url = signedUrls[q.id];
                          const isPdf = url && (url.toLowerCase().includes('.pdf') || url.toLowerCase().includes('pdf%2F') || q.id === 'cv' || q.id === 'motivation_letter' || q.id === 'social_project_proposal');

                          let color = 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100';
                          if (q.id === 'bukti_dp' || q.id === 'bukti_pembayaran') color = 'bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100';
                          else if (q.id === 'bukti_follow_ig' || q.id === 'bukti_follow_sta' || q.id === 'bukti_follow_bepro') color = 'bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100';
                          else if (q.id === 'foto_id_card' || q.id === 'cv') color = 'bg-violet-50 text-violet-700 border-violet-100 hover:bg-violet-100';
                          else if (q.id === 'motivation_letter' || q.id === 'social_project_proposal') color = 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100 hover:bg-fuchsia-100';

                          return url ? (
                            <a key={q.id} href={url} target="_blank" rel="noreferrer"
                              className={`flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${color}`}
                            >
                              <div className="flex items-center gap-2.5">
                                {isPdf ? <FileText size={16} /> : <FileImage size={16} />}
                                <span>{q.label}</span>
                              </div>
                              <ExternalLink size={14} className="opacity-60" />
                            </a>
                          ) : (
                            <div key={q.id} className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-dashed border-slate-200 text-sm text-slate-400">
                              <FileImage size={16} /> <span>{q.label}</span>
                              <span className="ml-auto text-[11px]">Tidak diunggah</span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Footer */}
            <div className="border-t border-slate-100 px-6 py-4 bg-slate-50/60 space-y-3">
              {/* WhatsApp */}
              <a
                href={`https://wa.me/${(selected.whatsapp || '').replace(/\D/g, '')}?text=${encodeURIComponent(`Halo ${selected.nama_lengkap}, kami ingin menginformasikan mengenai pendaftaran relawan ${getProgramName(selected.program_id)} Anda.`)}`}
                target="_blank" rel="noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 bg-[#25D366] text-white rounded-xl font-semibold text-sm hover:bg-[#1EB85A] transition-colors shadow-sm"
              >
                <MessageCircle size={18} /> Hubungi via WhatsApp
              </a>

              {/* Status Actions */}
              {selected.status !== 'verified' && (
                <button
                  onClick={() => handleUpdateStatus(selected.id, 'verified')}
                  disabled={updating}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-emerald-600 text-white rounded-xl font-semibold text-sm hover:bg-emerald-500 transition-colors shadow-sm disabled:opacity-50"
                >
                  {updating ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={18} />}
                  {selected.status === 'rejected' ? 'Pulihkan & Terima' : 'Terima Pendaftaran'}
                </button>
              )}
              {selected.status === 'pending' && (
                <button
                  onClick={() => handleUpdateStatus(selected.id, 'rejected')}
                  disabled={updating}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-white border border-rose-200 text-rose-600 rounded-xl font-semibold text-sm hover:bg-rose-50 transition-colors disabled:opacity-50"
                >
                  {updating ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={18} />}
                  Tolak Pendaftaran
                </button>
              )}
              {selected.status === 'verified' && (
                <p className="text-center text-xs text-emerald-600 font-medium py-1">✓ Pendaftaran ini telah diterima.</p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 hidden lg:flex items-center justify-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
            <div className="text-center">
              <UserCheck className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400 font-medium text-sm">Pilih pendaftar untuk melihat detail</p>
              <p className="text-slate-300 text-xs mt-1">Klik salah satu nama di daftar sebelah kiri</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
