import React, { useEffect, useState } from 'react';
import { fetchAllVolunteerRegistrations, fetchVolunteerPrograms, updateVolunteerRegistrationStatus } from '../../lib/admin/repository';
import type { VolunteerRegistrationRow, VolunteerProgramRow } from '../../lib/supabase/types';
import { formatAdminDate } from '../../lib/admin/helpers';
import { Loader2, RefreshCw, CheckCircle2, XCircle, Search, ExternalLink } from 'lucide-react';
import { logError } from '../../lib/error-logger';

export default function AdminEduxplore() {
  const [registrations, setRegistrations] = useState<VolunteerRegistrationRow[]>([]);
  const [programs, setPrograms] = useState<VolunteerProgramRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProgram, setSelectedProgram] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  async function loadData() {
    setLoading(true);
    try {
      const [regRes, progRes] = await Promise.all([
        fetchAllVolunteerRegistrations(),
        fetchVolunteerPrograms()
      ]);
      
      if (regRes.data) setRegistrations(regRes.data);
      if (progRes.data) setPrograms(progRes.data);
    } catch (err) {
      logError('AdminEduxplore.loadData', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleUpdateStatus(id: string, newStatus: 'verified' | 'rejected' | 'pending') {
    try {
      const { error } = await updateVolunteerRegistrationStatus(id, { status: newStatus });
      if (error) throw error;
      
      // Update local state
      setRegistrations(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
    } catch (err) {
      alert('Gagal mengupdate status pendaftar.');
    }
  }

  const filteredRegistrations = registrations.filter(r => {
    const matchesProgram = selectedProgram === 'all' || r.program_id === selectedProgram;
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      r.nama_lengkap.toLowerCase().includes(searchLower) ||
      r.whatsapp.includes(searchLower) ||
      r.email.toLowerCase().includes(searchLower);
    
    return matchesProgram && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Pendaftar EduXplore</h1>
          <p className="text-sm text-slate-500 mt-1">Kelola data volunteer dan verifikasi pendaftaran.</p>
        </div>
        <button onClick={loadData} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors">
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Cari nama, email, atau WA..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-1 focus:ring-zinc-900 outline-none"
            />
          </div>
          <select 
            value={selectedProgram}
            onChange={(e) => setSelectedProgram(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-xl text-sm outline-none bg-white min-w-[200px]"
          >
            <option value="all">Semua Program</option>
            {programs.map(p => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
        ) : filteredRegistrations.length === 0 ? (
          <div className="p-12 text-center text-slate-500">Belum ada pendaftar yang cocok.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Pendaftar</th>
                  <th className="px-6 py-4">Kontak</th>
                  <th className="px-6 py-4">Detail</th>
                  <th className="px-6 py-4">Bukti Upload</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredRegistrations.map(reg => {
                  const programName = programs.find(p => p.id === reg.program_id)?.title || 'Program Unknown';
                  return (
                    <tr key={reg.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900">{reg.nama_lengkap}</p>
                        <p className="text-xs text-slate-500 mt-1">{formatAdminDate(reg.created_at)}</p>
                        <span className="inline-block mt-2 px-2 py-1 bg-emerald-50 text-emerald-700 text-[10px] rounded border border-emerald-100">{programName}</span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-slate-900">{reg.email}</p>
                        <p className="text-slate-500 text-xs mt-1">WA: {reg.whatsapp}</p>
                        <p className="text-slate-500 text-xs">Darurat: {reg.whatsapp_emergency}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-slate-900 text-xs">Size: <strong>{reg.size_baju}</strong></p>
                        <p className="text-slate-900 text-xs mt-1">TTL: {reg.tanggal_lahir}</p>
                        {reg.riwayat_penyakit && (
                          <div className="mt-2 text-[10px] bg-rose-50 text-rose-700 p-1 rounded">Sakit: {reg.riwayat_penyakit}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 space-y-2">
                        {reg.bukti_dp_url && (
                          <a href={reg.bukti_dp_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                            <ExternalLink size={12} /> Bukti DP
                          </a>
                        )}
                        {reg.bukti_follow_url && (
                          <a href={reg.bukti_follow_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                            <ExternalLink size={12} /> Bukti Follow
                          </a>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full ${
                          reg.status === 'verified' ? 'bg-emerald-100 text-emerald-700' :
                          reg.status === 'rejected' ? 'bg-rose-100 text-rose-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {reg.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {reg.status !== 'verified' && (
                          <button onClick={() => handleUpdateStatus(reg.id, 'verified')} className="p-1.5 bg-emerald-50 text-emerald-600 rounded hover:bg-emerald-100" title="Verifikasi">
                            <CheckCircle2 size={16} />
                          </button>
                        )}
                        {reg.status !== 'rejected' && (
                          <button onClick={() => handleUpdateStatus(reg.id, 'rejected')} className="p-1.5 bg-rose-50 text-rose-600 rounded hover:bg-rose-100" title="Tolak">
                            <XCircle size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
