import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { formatAdminDate } from '../../lib/admin-helpers';
import { RefreshCw, History, ShieldAlert } from 'lucide-react';
import { logError } from '../../lib/error-logger';
import AdminModal from '../../components/admin/AdminModal';

interface AuditLog {
  id: string;
  user_id: string;
  user_email: string;
  action_type: 'INSERT' | 'UPDATE' | 'DELETE';
  entity_type: string;
  entity_id: string;
  old_values: any;
  new_values: any;
  created_at: string;
}

export default function AdminLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('audit_logs' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (fetchError) throw fetchError;
      setLogs(data as unknown as AuditLog[]);
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

  const getActionBadge = (action: string) => {
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
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Log Aktivitas Admin</h1>
          <p className="text-sm text-slate-500 mt-1">Riwayat perubahan data yang dilakukan oleh tim admin.</p>
        </div>
        <button
          onClick={fetchLogs}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh Data
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 text-sm text-rose-700 flex gap-3 items-start">
          <ShieldAlert size={18} className="shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="px-6 py-12 text-center text-sm text-slate-500">Memuat log aktivitas...</div>
        ) : logs.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-slate-500">
            Belum ada aktivitas yang dicatat. Pastikan Anda telah menjalankan migrasi database.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-xs font-semibold tracking-wider text-slate-500 uppercase">
                  <th className="px-6 py-4">Waktu</th>
                  <th className="px-6 py-4">Admin</th>
                  <th className="px-6 py-4">Aksi</th>
                  <th className="px-6 py-4">Tabel</th>
                  <th className="px-6 py-4">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {formatAdminDate(log.created_at, true)}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      {log.user_email || log.user_id || 'System/Anon'}
                    </td>
                    <td className="px-6 py-4">
                      {getActionBadge(log.action_type)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-mono">
                      {log.entity_type}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
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
        title="Detail Log Aktivitas"
        description="Perbandingan data sebelum dan sesudah perubahan."
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
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Informasi</p>
                <div className="space-y-1 text-sm">
                  <p><span className="text-slate-500">ID:</span> <span className="font-mono">{selectedLog.id}</span></p>
                  <p><span className="text-slate-500">Admin:</span> {selectedLog.user_email}</p>
                  <p><span className="text-slate-500">Waktu:</span> {formatAdminDate(selectedLog.created_at, true)}</p>
                </div>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Target</p>
                <div className="space-y-1 text-sm">
                  <p><span className="text-slate-500">Aksi:</span> {getActionBadge(selectedLog.action_type)}</p>
                  <p><span className="text-slate-500">Tabel:</span> <span className="font-mono">{selectedLog.entity_type}</span></p>
                  <p><span className="text-slate-500">Record ID:</span> <span className="font-mono">{selectedLog.entity_id}</span></p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {['UPDATE', 'DELETE'].includes(selectedLog.action_type) && (
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-slate-700">Data Lama (Old)</h4>
                  <pre className="p-4 bg-slate-900 text-slate-300 rounded-xl text-xs overflow-x-auto h-64 overflow-y-auto">
                    {JSON.stringify(selectedLog.old_values, null, 2)}
                  </pre>
                </div>
              )}
              {['INSERT', 'UPDATE'].includes(selectedLog.action_type) && (
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-slate-700">Data Baru (New)</h4>
                  <pre className="p-4 bg-slate-900 text-emerald-400 rounded-xl text-xs overflow-x-auto h-64 overflow-y-auto">
                    {JSON.stringify(selectedLog.new_values, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </AdminModal>
    </div>
  );
}
