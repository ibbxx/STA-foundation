import { useEffect, useMemo, useState } from 'react';
import { formatAdminDate } from '../../lib/admin-helpers';
import { RefreshCw, History, ShieldAlert, Search } from 'lucide-react';
import { logError } from '../../lib/error-logger';
import AdminModal from '../../components/admin/AdminModal';
import { fetchAuditLogRows } from '../../lib/admin/repository';
import type { AuditLogRow, Json } from '../../lib/supabase/types';

type AuditAction = AuditLogRow['action_type'];
type RiskCategory =
  | 'Penghapusan'
  | 'Pembayaran'
  | 'Publikasi'
  | 'Berkas & Gambar'
  | 'Pengaturan'
  | 'Data Sensitif'
  | 'Data Umum';

type AuditLogView = AuditLogRow & {
  actionLabel: string;
  changedFields: ChangedField[];
  riskCategory: RiskCategory;
  summary: string;
  targetLabel: string;
};

type ChangedField = {
  field: string;
  oldValue: Json | undefined;
  newValue: Json | undefined;
};

const RISK_CATEGORIES: Array<RiskCategory | 'Semua kategori'> = [
  'Semua kategori',
  'Penghapusan',
  'Pembayaran',
  'Publikasi',
  'Berkas & Gambar',
  'Pengaturan',
  'Data Sensitif',
  'Data Umum',
];

const ACTION_FILTERS: Array<AuditAction | 'ALL'> = ['ALL', 'INSERT', 'UPDATE', 'DELETE'];

const PAYMENT_FIELDS = new Set(['payment_status', 'amount', 'payment_method', 'payment_proof_path']);
const PUBLICATION_FIELDS = new Set(['status', 'is_featured', 'show_in_hero', 'registration_start', 'registration_end', 'program_end']);
const CONFIG_FIELDS = new Set(['form_config', 'timeline', 'requirements', 'key', 'value']);
const SENSITIVE_FIELDS = new Set([
  'email',
  'donor_email',
  'donor_name',
  'donor_phone',
  'phone',
  'whatsapp',
  'whatsapp_emergency',
  'reporter_phone',
  'reporter_name',
  'alamat',
  'tanggal_lahir',
  'riwayat_penyakit',
]);

const FIELD_LABELS: Record<string, string> = {
  title: 'judul',
  name: 'nama',
  status: 'status',
  payment_status: 'status pembayaran',
  amount: 'nominal',
  payment_method: 'metode pembayaran',
  payment_proof_path: 'bukti pembayaran',
  image_url: 'gambar',
  images: 'galeri gambar',
  image_urls: 'foto laporan',
  form_config: 'formulir pendaftaran',
  value: 'isi pengaturan',
  key: 'jenis pengaturan',
  is_featured: 'ditampilkan sebagai unggulan',
  show_in_hero: 'ditampilkan di halaman utama',
  donor_name: 'nama donor',
  donor_email: 'email donor',
  donor_phone: 'telepon donor',
  email: 'email',
  whatsapp: 'whatsapp',
  description: 'deskripsi',
  content: 'isi konten',
  category_id: 'kategori',
  category_name: 'nama kategori',
  target_amount: 'target donasi',
  current_amount: 'donasi terkumpul',
  registration_start: 'awal pendaftaran',
  registration_end: 'akhir pendaftaran',
  program_end: 'akhir program',
  updated_at: 'waktu pembaruan',
};

const ENTITY_LABELS: Record<string, string> = {
  campaigns: 'Program donasi',
  campaign_updates: 'Kabar terbaru program',
  categories: 'Kategori program',
  donations: 'Donasi',
  programs: 'Program',
  school_reports: 'Laporan sekolah',
  site_content: 'Konten situs',
  spammer_blacklist: 'Daftar nomor diblokir',
  volunteer_programs: 'Program Eduxplore',
  volunteer_registrations: 'Pendaftaran Eduxplore',
};

function isRecord(value: unknown): value is Record<string, Json | undefined> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function stringifyValue(value: Json | undefined): string {
  if (value === undefined) return '-';
  if (value === null || value === '') return 'Belum diisi';
  if (typeof value === 'boolean') return value ? 'Ya' : 'Tidak';
  if (typeof value === 'number') return new Intl.NumberFormat('id-ID').format(value);
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.length === 0 ? 'Belum diisi' : `${value.length} item tersimpan`;
  return 'Informasi lengkap tersimpan';
}

function humanizeKey(value: string): string {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getFieldLabel(field: string): string {
  return FIELD_LABELS[field] ?? humanizeKey(field);
}

function getEntityLabel(entityType: string): string {
  return ENTITY_LABELS[entityType] ?? humanizeKey(entityType);
}

function valueSignature(value: Json | undefined): string {
  if (value === undefined) return '__undefined__';
  return JSON.stringify(value);
}

function getChangedFields(log: AuditLogRow): ChangedField[] {
  if (log.action_type !== 'UPDATE' || !isRecord(log.old_values) || !isRecord(log.new_values)) {
    return [];
  }

  const fields = new Set([...Object.keys(log.old_values), ...Object.keys(log.new_values)]);
  const changedFields = Array.from(fields)
    .filter((field) => valueSignature(log.old_values?.[field]) !== valueSignature(log.new_values?.[field]))
    .map((field) => ({
      field,
      oldValue: log.old_values?.[field],
      newValue: log.new_values?.[field],
    }));

  if (changedFields.length <= 1) return changedFields;
  return changedFields.filter((field) => !['created_at', 'updated_at'].includes(field.field));
}

function hasFieldPrefix(fields: string[], prefixes: string[]) {
  return fields.some((field) => prefixes.some((prefix) => field.startsWith(prefix) || field.includes(`_${prefix}`)));
}

function getEntityKey(log: AuditLogRow): string | undefined {
  const source = isRecord(log.new_values) ? log.new_values : isRecord(log.old_values) ? log.old_values : null;
  return typeof source?.key === 'string' ? source.key : undefined;
}

function getRiskCategory(log: AuditLogRow, changedFields: ChangedField[]): RiskCategory {
  const changedFieldNames = changedFields.map((field) => field.field);
  const rowFieldNames = new Set([
    ...(isRecord(log.new_values) ? Object.keys(log.new_values) : []),
    ...(isRecord(log.old_values) ? Object.keys(log.old_values) : []),
  ]);
  const fieldNames = log.action_type === 'UPDATE' ? changedFieldNames : Array.from(rowFieldNames);
  const entityKey = getEntityKey(log);

  if (log.action_type === 'DELETE') return 'Penghapusan';
  if (log.entity_type === 'donations' || fieldNames.some((field) => PAYMENT_FIELDS.has(field))) return 'Pembayaran';
  if (fieldNames.some((field) => PUBLICATION_FIELDS.has(field))) return 'Publikasi';
  if (
    hasFieldPrefix(fieldNames, ['image', 'images', 'foto', 'bukti', 'file', 'url', 'path'])
    || fieldNames.some((field) => field.endsWith('_url') || field.endsWith('_path'))
  ) {
    return 'Berkas & Gambar';
  }
  if (
    log.entity_type === 'site_content'
    || entityKey === 'payment_settings'
    || fieldNames.some((field) => CONFIG_FIELDS.has(field))
  ) {
    return 'Pengaturan';
  }
  if (fieldNames.some((field) => SENSITIVE_FIELDS.has(field))) return 'Data Sensitif';

  return 'Data Umum';
}

function getActionLabel(action: AuditAction) {
  if (action === 'INSERT') return 'Tambah';
  if (action === 'UPDATE') return 'Ubah';
  if (action === 'DELETE') return 'Hapus';
  return action;
}

function getTargetLabel(log: AuditLogRow) {
  const source = isRecord(log.new_values) ? log.new_values : isRecord(log.old_values) ? log.old_values : null;
  const readable = source?.title ?? source?.name ?? source?.school_name ?? source?.nama_lengkap ?? source?.donor_name ?? source?.key;
  return readable && typeof readable === 'string'
    ? `${getEntityLabel(log.entity_type)}: ${readable}`
    : getEntityLabel(log.entity_type);
}

function getSummary(log: AuditLogRow, changedFields: ChangedField[]): string {
  if (log.action_type === 'DELETE') return 'Data dihapus';

  if (log.action_type === 'INSERT') {
    const source = isRecord(log.new_values) ? log.new_values : null;
    const readable = source?.title ?? source?.name ?? source?.school_name ?? source?.nama_lengkap ?? source?.donor_name ?? source?.key;
    return readable && typeof readable === 'string'
      ? `Data baru ditambahkan: ${readable}`
      : 'Data baru ditambahkan';
  }

  if (changedFields.length === 0) return 'Data diperbarui';

  const statusChange = changedFields.find((field) => field.field === 'status' || field.field === 'payment_status');
  if (statusChange) {
    return `${getFieldLabel(statusChange.field)} berubah dari ${stringifyValue(statusChange.oldValue)} menjadi ${stringifyValue(statusChange.newValue)}`;
  }

  if (changedFields.length === 1) {
    const field = changedFields[0];
    return `${getFieldLabel(field.field)} diperbarui`;
  }

  return `${changedFields.length} informasi diperbarui: ${changedFields.slice(0, 3).map((field) => getFieldLabel(field.field)).join(', ')}`;
}

function getActionBadge(action: AuditAction) {
  switch (action) {
    case 'INSERT':
      return <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 rounded">Tambah</span>;
    case 'UPDATE':
      return <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 rounded">Ubah</span>;
    case 'DELETE':
      return <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-700 rounded">Hapus</span>;
    default:
      return <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 rounded">{action}</span>;
  }
}

function getRiskBadge(category: RiskCategory) {
  const className = {
    Penghapusan: 'bg-rose-100 text-rose-700',
    Pembayaran: 'bg-emerald-100 text-emerald-700',
    Publikasi: 'bg-sky-100 text-sky-700',
    'Berkas & Gambar': 'bg-indigo-100 text-indigo-700',
    Pengaturan: 'bg-violet-100 text-violet-700',
    'Data Sensitif': 'bg-orange-100 text-orange-700',
    'Data Umum': 'bg-slate-100 text-slate-700',
  }[category];

  return <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded ${className}`}>{category}</span>;
}

function toSearchText(log: AuditLogView) {
  return [
    log.user_email,
    log.user_id,
    log.entity_type,
    log.entity_id,
    log.targetLabel,
    log.summary,
    log.riskCategory,
    log.actionLabel,
  ].filter(Boolean).join(' ').toLowerCase();
}

function mapAuditLog(log: AuditLogRow): AuditLogView {
  const changedFields = getChangedFields(log);
  const riskCategory = getRiskCategory(log, changedFields);

  return {
    ...log,
    actionLabel: getActionLabel(log.action_type),
    changedFields,
    riskCategory,
    summary: getSummary(log, changedFields),
    targetLabel: getTargetLabel(log),
  };
}

export default function AdminLogs() {
  const [logs, setLogs] = useState<AuditLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<AuditLogView | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<RiskCategory | 'Semua kategori'>('Semua kategori');
  const [actionFilter, setActionFilter] = useState<AuditAction | 'ALL'>('ALL');
  const [search, setSearch] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await fetchAuditLogRows(100);

      if (fetchError) throw fetchError;
      setLogs(data ?? []);
    } catch (err: any) {
      logError('AdminLogs.fetchLogs', err);
      setError(err.message || 'Gagal memuat log aktivitas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const viewLogs = useMemo(() => logs.map(mapAuditLog), [logs]);
  const filteredLogs = useMemo(() => {
    const query = search.trim().toLowerCase();

    return viewLogs.filter((log) => {
      if (categoryFilter !== 'Semua kategori' && log.riskCategory !== categoryFilter) return false;
      if (actionFilter !== 'ALL' && log.action_type !== actionFilter) return false;
      if (query && !toSearchText(log).includes(query)) return false;
      return true;
    });
  }, [actionFilter, categoryFilter, search, viewLogs]);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Riwayat Aktivitas Admin</h1>
          <p className="text-sm text-slate-500 mt-1">Lihat perubahan yang dilakukan oleh tim admin.</p>
        </div>
        <button
          onClick={fetchLogs}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Muat Ulang
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 text-sm text-rose-700 flex gap-3 items-start">
          <ShieldAlert size={18} className="shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_180px_180px] gap-3">
          <label className="relative block">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari nama admin atau aktivitas"
              className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-200"
            />
          </label>
          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value as RiskCategory | 'Semua kategori')}
            className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200"
          >
            {RISK_CATEGORIES.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          <select
            value={actionFilter}
            onChange={(event) => setActionFilter(event.target.value as AuditAction | 'ALL')}
            className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200"
          >
            {ACTION_FILTERS.map((action) => (
              <option key={action} value={action}>{action === 'ALL' ? 'Semua aksi' : getActionLabel(action)}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="px-6 py-12 text-center text-sm text-slate-500">Memuat riwayat aktivitas...</div>
        ) : logs.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-slate-500">
            Belum ada aktivitas admin yang tercatat.
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-slate-500">
            Tidak ada aktivitas yang cocok dengan pilihan saat ini.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-xs font-semibold tracking-wider text-slate-500 uppercase">
                  <th className="px-6 py-4">Waktu</th>
                  <th className="px-6 py-4">Admin</th>
                  <th className="px-6 py-4">Jenis Aktivitas</th>
                  <th className="px-6 py-4">Tindakan</th>
                  <th className="px-6 py-4">Data yang Diubah</th>
                  <th className="px-6 py-4">Keterangan</th>
                  <th className="px-6 py-4">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
                      {formatAdminDate(log.created_at, true)}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900 max-w-[220px] truncate">
                      {log.user_email || 'Sistem'}
                    </td>
                    <td className="px-6 py-4">
                      {getRiskBadge(log.riskCategory)}
                    </td>
                    <td className="px-6 py-4">
                      {getActionBadge(log.action_type)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      <div className="max-w-[240px] truncate" title={log.targetLabel}>{log.targetLabel}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 max-w-[320px]">
                      {log.summary}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors whitespace-nowrap"
                      >
                        <History size={14} />
                        Lihat Detail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AdminModal
        open={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="Detail Aktivitas"
        description="Informasi perubahan yang dilakukan oleh admin."
        widthClassName="max-w-3xl"
        footer={
          <button
            onClick={() => setSelectedLog(null)}
            className="px-4 py-2 text-sm font-medium text-white bg-zinc-900 rounded-xl hover:bg-zinc-950 transition-colors"
          >
            Tutup
          </button>
        }
      >
        {selectedLog && (
          <div className="space-y-6">
            <div className="p-5 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {getActionBadge(selectedLog.action_type)}
                {getRiskBadge(selectedLog.riskCategory)}
              </div>
              <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-slate-500">Dilakukan oleh</dt>
                  <dd className="mt-1 font-semibold text-slate-900">{selectedLog.user_email || 'Sistem'}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Waktu</dt>
                  <dd className="mt-1 font-semibold text-slate-900">{formatAdminDate(selectedLog.created_at, true)}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Data yang diubah</dt>
                  <dd className="mt-1 font-semibold text-slate-900">{selectedLog.targetLabel}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Keterangan</dt>
                  <dd className="mt-1 font-semibold text-slate-900">{selectedLog.summary}</dd>
                </div>
              </dl>
            </div>

            {selectedLog.action_type === 'UPDATE' && (
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-slate-700">Rincian Perubahan</h4>
                {selectedLog.changedFields.length === 0 ? (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm text-slate-500">
                    Data berhasil diperbarui. Tidak ada rincian tambahan yang perlu ditampilkan.
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-100 rounded-xl">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-50 text-xs font-semibold tracking-wider text-slate-500 uppercase">
                        <tr>
                          <th className="px-4 py-3">Informasi</th>
                          <th className="px-4 py-3">Sebelum</th>
                          <th className="px-4 py-3">Sesudah</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {selectedLog.changedFields.map((field) => (
                          <tr key={field.field}>
                            <td className="px-4 py-3 font-medium text-slate-700">{getFieldLabel(field.field)}</td>
                            <td className="px-4 py-3 text-slate-600 max-w-[260px] truncate" title={stringifyValue(field.oldValue)}>{stringifyValue(field.oldValue)}</td>
                            <td className="px-4 py-3 text-slate-600 max-w-[260px] truncate" title={stringifyValue(field.newValue)}>{stringifyValue(field.newValue)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

          </div>
        )}
      </AdminModal>
    </div>
  );
}
