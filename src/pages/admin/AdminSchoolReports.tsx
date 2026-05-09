import { AlertCircle, Ban, CheckCircle2, Eye, MapPin, Phone, RefreshCw, School, Search, ShieldCheck, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import AdminModal from '../../components/admin/AdminModal';
import { formatAdminDate } from '../../lib/admin-helpers';
import { addToBlacklist, deleteSchoolReport, fetchSchoolReportRows, updateSchoolReportStatus } from '../../lib/admin-repository';
import {
  buildReportSummary,
  filterReports,
  getReportImageUrls,
  type ReportStatus,
} from '../../lib/admin-view-models';
import { logError } from '../../lib/error-logger';
import { deleteFilesFromStorage } from '../../lib/supabase-storage';
import { SchoolReportRow } from '../../lib/supabase';
import { cn } from '../../lib/utils';
import { useConfirmDialog } from '../../components/admin/ConfirmDialog';

export default function AdminSchoolReports() {
  const { confirm, ConfirmDialogElement } = useConfirmDialog();
  const [reports, setReports] = useState<SchoolReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ReportStatus>('all');
  const [selectedReport, setSelectedReport] = useState<SchoolReportRow | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [bulkUpdating, setBulkUpdating] = useState(false);

  async function loadReports() {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await fetchSchoolReportRows();

    if (fetchError) {
      logError('AdminSchoolReports.loadReports', fetchError);
      setError(fetchError.message);
      setReports([]);
      setLoading(false);
      return;
    }

    setReports(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadReports();
  }, []);

  const filteredReports = useMemo(
    () => filterReports(reports, searchQuery, statusFilter),
    [reports, searchQuery, statusFilter],
  );

  const summary = useMemo(() => buildReportSummary(reports), [reports]);
  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const visibleReportIds = useMemo(() => filteredReports.map((report) => report.id), [filteredReports]);
  const selectedReports = useMemo(
    () => reports.filter((report) => selectedIdSet.has(report.id)),
    [reports, selectedIdSet],
  );
  const selectedVisibleCount = useMemo(
    () => filteredReports.filter((report) => selectedIdSet.has(report.id)).length,
    [filteredReports, selectedIdSet],
  );
  const allVisibleSelected = filteredReports.length > 0 && selectedVisibleCount === filteredReports.length;

  useEffect(() => {
    setSelectedIds((current) => current.filter((id) => reports.some((report) => report.id === id)));
  }, [reports]);

  async function updateStatus(report: SchoolReportRow, nextStatus: ReportStatus) {
    setError(null);
    setNotice(null);
    setUpdatingId(report.id);
    const { error: updateError } = await updateSchoolReportStatus(report.id, { status: nextStatus });

    if (updateError) {
      logError('AdminSchoolReports.updateStatus', updateError, {
        reportId: report.id,
        nextStatus,
      });
      setError(updateError.message);
      setUpdatingId(null);
      return;
    }

    setUpdatingId(null);
    await loadReports();
  }

  function toggleReportSelection(reportId: string) {
    setSelectedIds((current) => (
      current.includes(reportId)
        ? current.filter((id) => id !== reportId)
        : [...current, reportId]
    ));
  }

  function toggleSelectAllVisible() {
    setSelectedIds((current) => {
      if (allVisibleSelected) {
        return current.filter((id) => !visibleReportIds.includes(id));
      }

      const next = new Set(current);
      visibleReportIds.forEach((id) => next.add(id));
      return Array.from(next);
    });
  }

  async function deleteReports(reportsToDelete: SchoolReportRow[]) {
    const deletedIds: string[] = [];
    const failedNames: string[] = [];

    setError(null);
    setNotice(null);

    if (reportsToDelete.length === 1) {
      setUpdatingId(reportsToDelete[0].id);
    } else {
      setBulkUpdating(true);
    }

    for (const report of reportsToDelete) {
      const imageUrls = getReportImageUrls(report.image_urls);
      const { error: deleteError } = await deleteSchoolReport(report.id);

      if (deleteError) {
        logError('AdminSchoolReports.deleteReport', deleteError, {
          reportId: report.id,
        });
        failedNames.push(report.school_name);
        continue;
      }

      deletedIds.push(report.id);

      if (imageUrls.length > 0) {
        const result = await deleteFilesFromStorage(imageUrls);
        if (result.failed > 0) {
          logError('AdminSchoolReports.storageCleanupAfterDelete', new Error('Sebagian file storage gagal dihapus.'), {
            reportId: report.id,
            deleted: result.deleted,
            failed: result.failed,
          });
        }
      }
    }

    setUpdatingId(null);
    setBulkUpdating(false);

    if (deletedIds.length > 0) {
      setSelectedIds((current) => current.filter((id) => !deletedIds.includes(id)));
      if (selectedReport && deletedIds.includes(selectedReport.id)) {
        setSelectedReport(null);
      }
    }

    if (deletedIds.length > 0 && failedNames.length === 0) {
      setNotice(
        reportsToDelete.length === 1
          ? `Laporan "${reportsToDelete[0].school_name}" berhasil dihapus.`
          : `${deletedIds.length} laporan berhasil dihapus.`
      );
    }

    if (deletedIds.length > 0 && failedNames.length > 0) {
      setNotice(`${deletedIds.length} laporan berhasil dihapus.`);
      setError(`Sebagian laporan gagal dihapus: ${failedNames.join(', ')}`);
    }

    if (deletedIds.length === 0 && failedNames.length > 0) {
      setError(`Gagal menghapus laporan: ${failedNames.join(', ')}`);
    }

    await loadReports();
  }

  async function handleDeleteReport(report: SchoolReportRow) {
    const confirmed = await confirm({
      title: 'Hapus Laporan',
      message: `Apakah Anda yakin ingin menghapus laporan "${report.school_name}"? Tindakan ini tidak dapat dibatalkan.`,
      confirmText: 'Hapus Permanen',
    });
    if (!confirmed) return;

    await deleteReports([report]);
  }

  async function handleBulkDelete() {
    if (selectedReports.length === 0) return;

    const confirmed = await confirm({
      title: 'Hapus Massal',
      message: `Apakah Anda yakin ingin menghapus ${selectedReports.length} laporan terpilih? Tindakan ini tidak dapat dibatalkan.`,
      confirmText: 'Hapus Semua',
    });
    if (!confirmed) return;

    await deleteReports(selectedReports);
  }

  async function blockSpammer(report: SchoolReportRow) {
    const ok = await confirm({
      title: 'Blokir Spammer',
      message: `Blokir pelapor "${report.reporter_name}"? Nomor WA dan IP akan dimasukkan ke daftar hitam permanen.`,
      confirmText: 'Blokir',
      variant: 'warning',
    });
    if (!ok) return;

    setError(null);
    setNotice(null);
    setUpdatingId(report.id);

    // Block WA number
    await addToBlacklist({
      identifier: report.reporter_phone,
      reason: `Spam report: ${report.school_name} (by admin)`,
    });

    // Block IP if available
    if (report.reporter_ip) {
      await addToBlacklist({
        identifier: report.reporter_ip,
        reason: `Spam IP from: ${report.reporter_phone} (by admin)`,
      });
    }

    // Delete the report
    await updateSchoolReportStatus(report.id, { status: 'actioned' });

    setUpdatingId(null);
    setSelectedReport(null);
    await loadReports();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Laporan Sekolah</h1>
          <p className="text-sm text-slate-500 mt-1">Kelola laporan kondisi sekolah dari masyarakat.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => loadReports()}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Laporan', value: summary.total, tone: 'text-slate-900', bg: 'bg-white border-slate-200' },
          { label: 'Pending', value: summary.pending, tone: 'text-amber-700', bg: 'bg-amber-50 border-amber-100' },
          { label: 'Verified', value: summary.verified, tone: 'text-sky-700', bg: 'bg-sky-50 border-sky-100' },
          { label: 'Actioned', value: summary.actioned, tone: 'text-zinc-950', bg: 'bg-zinc-100 border-zinc-200' },
        ].map((item) => (
          <div key={item.label} className={cn('p-5 rounded-2xl border shadow-sm', item.bg)}>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{item.label}</p>
            <p className={cn('mt-1.5 text-2xl font-bold', item.tone)}>{item.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Cari sekolah, lokasi, pelapor..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 outline-none transition-all placeholder:text-slate-400"
            />
          </div>

          <div className="flex bg-slate-100/50 p-1 rounded-xl overflow-x-auto">
            {[
              ['Semua', 'all'],
              ['Pending', 'pending'],
              ['Verified', 'verified'],
              ['Actioned', 'actioned'],
            ].map(([label, value]) => (
              <button
                key={value}
                type="button"
                onClick={() => setStatusFilter(value as 'all' | ReportStatus)}
                className={cn(
                  'px-4 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors whitespace-nowrap',
                  statusFilter === value
                    ? 'bg-white text-zinc-950 shadow-sm border border-slate-200/50'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {selectedIds.length > 0 && (
          <div className="mx-4 mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium text-slate-700">
              {selectedIds.length} laporan dipilih.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={toggleSelectAllVisible}
                disabled={bulkUpdating}
                className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                {allVisibleSelected ? 'Batal pilih halaman ini' : 'Pilih semua hasil filter'}
              </button>
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                disabled={bulkUpdating}
                className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Reset Pilihan
              </button>
              <button
                type="button"
                onClick={handleBulkDelete}
                disabled={bulkUpdating}
                className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-rose-700 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <Trash2 size={14} />
                Hapus Terpilih
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="m-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 flex items-start gap-3">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Gagal memuat laporan.</p>
              <p className="mt-1">{error}</p>
            </div>
          </div>
        )}

        {notice && (
          <div className="m-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 flex items-start gap-3">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Perubahan berhasil disimpan.</p>
              <p className="mt-1">{notice}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="px-6 py-12 text-center text-sm text-slate-500">Memuat laporan sekolah...</div>
        ) : filteredReports.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-slate-500">Belum ada laporan yang cocok dengan filter saat ini.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-xs font-semibold tracking-wider text-slate-500 uppercase">
                  <th className="px-6 py-4 w-12">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleSelectAllVisible}
                      disabled={filteredReports.length === 0 || bulkUpdating}
                      aria-label="Pilih semua laporan yang sedang tampil"
                      className="h-4 w-4 rounded border-slate-300 text-zinc-900 focus:ring-zinc-900"
                    />
                  </th>
                  <th className="px-6 py-4">Sekolah</th>
                  <th className="px-6 py-4">Pelapor</th>
                  <th className="px-6 py-4">Lokasi</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Diperbarui</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReports.map((report) => (
                  <tr key={report.id} className="group transition-colors hover:bg-slate-50/50">
                    <td className="px-6 py-4 align-top">
                      <input
                        type="checkbox"
                        checked={selectedIdSet.has(report.id)}
                        onChange={() => toggleReportSelection(report.id)}
                        disabled={bulkUpdating}
                        aria-label={`Pilih laporan ${report.school_name}`}
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-zinc-900 focus:ring-zinc-900"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-slate-900 truncate max-w-[200px]" title={report.school_name}>{report.school_name}</p>
                      <p className="mt-1 max-w-[200px] text-xs text-slate-500 truncate" title={report.description}>{report.description}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-slate-800">{report.reporter_name}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{report.reporter_phone}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-600 truncate max-w-[150px]">{report.location}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          'inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider',
                          report.status === 'pending'
                            ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/50'
                            : report.status === 'verified'
                              ? 'bg-sky-50 text-sky-700 ring-1 ring-sky-200/50'
                              : 'bg-zinc-100 text-zinc-950 ring-1 ring-zinc-200/50',
                        )}
                      >
                        {report.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">{formatAdminDate(report.updated_at, true)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => setSelectedReport(report)}
                          className="p-2 text-slate-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
                          title="Lihat detail"
                        >
                          <Eye size={16} />
                        </button>
                        {report.status !== 'verified' && report.status !== 'actioned' && (
                          <button
                            type="button"
                            onClick={() => updateStatus(report, 'verified')}
                            disabled={bulkUpdating || updatingId === report.id}
                            className="p-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Tandai verified"
                          >
                            <ShieldCheck size={16} />
                          </button>
                        )}
                        {report.status === 'verified' && (
                          <button
                            type="button"
                            onClick={() => updateStatus(report, 'actioned')}
                            disabled={bulkUpdating || updatingId === report.id}
                            className="p-2 text-slate-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors disabled:opacity-50"
                            title="Tandai actioned"
                          >
                            <CheckCircle2 size={16} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteReport(report)}
                          disabled={bulkUpdating || updatingId === report.id}
                          className="p-2 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Hapus laporan"
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
        open={selectedReport !== null}
        onClose={() => setSelectedReport(null)}
        title="Detail Laporan Sekolah"
        description="Informasi lengkap laporan yang dikirimkan oleh pelapor."
        widthClassName="max-w-3xl"
        footer={(
          selectedReport ? (
            <>
              {selectedReport.status !== 'verified' && selectedReport.status !== 'actioned' && (
                <button
                  type="button"
                  onClick={() => updateStatus(selectedReport, 'verified')}
                  disabled={bulkUpdating || updatingId === selectedReport.id}
                  className="px-4 py-2 text-sm font-medium text-sky-700 bg-sky-50 border border-sky-200 rounded-xl hover:bg-sky-100 transition-colors disabled:opacity-50"
                >
                  Verifikasi Laporan
                </button>
              )}
              {selectedReport.status === 'verified' && (
                <button
                  type="button"
                  onClick={() => updateStatus(selectedReport, 'actioned')}
                  disabled={bulkUpdating || updatingId === selectedReport.id}
                  className="px-4 py-2 text-sm font-medium text-white bg-zinc-900 rounded-xl hover:bg-zinc-950 transition-colors disabled:opacity-50"
                >
                  Tandai Selesai (Actioned)
                </button>
              )}
              <button
                type="button"
                onClick={() => blockSpammer(selectedReport)}
                disabled={bulkUpdating || updatingId === selectedReport.id}
                className="px-4 py-2 text-sm font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <Ban size={14} />
                Blokir Spammer
              </button>
              <button
                type="button"
                onClick={() => handleDeleteReport(selectedReport)}
                disabled={bulkUpdating || updatingId === selectedReport.id}
                className="px-4 py-2 text-sm font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <Trash2 size={14} />
                Hapus Laporan
              </button>
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
              >
                Tutup
              </button>
            </>
          ) : undefined
        )}
      >
        {selectedReport && (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              {[
                { label: 'Nama Sekolah', value: selectedReport.school_name, icon: School },
                { label: 'Nama Pelapor', value: selectedReport.reporter_name, icon: ShieldCheck },
                { label: 'Telepon Pelapor', value: selectedReport.reporter_phone, icon: Phone },
                { label: 'Lokasi', value: selectedReport.location, icon: MapPin },
              ].map((item) => (
                <div key={item.label} className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white text-slate-500 rounded-lg border border-slate-100 shadow-sm">
                      <item.icon size={16} />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{item.label}</p>
                      <p className="mt-0.5 text-sm font-semibold text-slate-900">{item.value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-xl">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Deskripsi Kondisi</p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700 leading-relaxed">{selectedReport.description}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Status</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{selectedReport.status}</p>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Dibuat Pada</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{formatAdminDate(selectedReport.created_at, true)}</p>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Terakhir Diperbarui</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{formatAdminDate(selectedReport.updated_at, true)}</p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Lampiran Foto</p>
              {getReportImageUrls(selectedReport.image_urls).length === 0 ? (
                <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl text-sm text-slate-500">
                  Tidak ada lampiran foto.
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-3">
                  {getReportImageUrls(selectedReport.image_urls).map((imageUrl) => (
                    <a
                      key={imageUrl}
                      href={imageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="block overflow-hidden rounded-xl border border-slate-200 shadow-sm transition-transform hover:-translate-y-0.5"
                    >
                      <img src={imageUrl} alt="Lampiran laporan" className="aspect-[4/3] w-full object-cover" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </AdminModal>
      {ConfirmDialogElement}
    </div>
  );
}
