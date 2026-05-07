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
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all');
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
    const matchesStatus = selectedStatus === 'all' || r.status === selectedStatus;
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      (r.nama_lengkap || '').toLowerCase().includes(searchLower) ||
      (r.whatsapp || '').includes(searchLower) ||
      (r.email || '').toLowerCase().includes(searchLower);
    
    return matchesProgram && matchesStatus && matchesSearch;
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
        {/* Status Tabs */}
        <div className="flex overflow-x-auto no-scrollbar border-b border-slate-100">
          {(['all', 'pending', 'verified', 'rejected'] as const).map(tab => {
            const count = registrations.filter(r => tab === 'all' ? true : r.status === tab).length;
            return (
              <button
                key={tab}
                onClick={() => setSelectedStatus(tab)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  selectedStatus === tab
                    ? 'border-emerald-600 text-emerald-700 bg-emerald-50/30'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                {tab === 'all' ? 'Semua Status' : 
                 tab === 'pending' ? 'Perlu Direview' : 
                 tab === 'verified' ? 'Diterima' : 'Ditolak'}
                 <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                   selectedStatus === tab ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                 }`}>
                   {count}
                 </span>
              </button>
            );
          })}
        </div>

        {/* Search & Program Filter */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4 bg-slate-50/50">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Cari nama, email, atau WA..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-1 focus:ring-zinc-900 outline-none shadow-sm"
            />
          </div>
          <select 
            value={selectedProgram}
            onChange={(e) => setSelectedProgram(e.target.value)}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none min-w-[200px] shadow-sm"
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
                  <th className="px-6 py-4">Kontak & Alamat</th>
                  <th className="px-6 py-4">Info Personal</th>
                  <th className="px-6 py-4">Dokumen</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredRegistrations.map(reg => {
                  const programName = programs.find(p => p.id === reg.program_id)?.title || 'Program Unknown';
                  return (
                    <tr key={reg.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900 text-sm">{reg.nama_lengkap}</p>
                        <p className="text-xs text-slate-500 mt-1">{formatAdminDate(reg.created_at)}</p>
                        <span className="inline-block mt-2 px-2 py-1 bg-emerald-50 text-emerald-700 text-[10px] rounded border border-emerald-100 font-medium">{programName}</span>
                      </td>
                      <td className="px-6 py-4 max-w-[200px]">
                        <p className="text-slate-900 text-sm truncate" title={reg.email}>{reg.email}</p>
                        <div className="flex flex-col gap-0.5 mt-1.5">
                          <p className="text-slate-500 text-xs">WA: <span className="font-medium text-slate-700">{reg.whatsapp}</span></p>
                          <p className="text-slate-500 text-xs">Darurat: <span className="font-medium text-slate-700">{reg.whatsapp_emergency}</span></p>
                        </div>
                        <p className="text-slate-500 text-[11px] mt-2 leading-relaxed line-clamp-2" title={reg.alamat}>📍 {reg.alamat}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-xs text-slate-500">Baju:</span>
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs font-bold rounded">{reg.size_baju}</span>
                        </div>
                         <p className="text-slate-600 text-xs">Lahir: {reg.tanggal_lahir}</p>
                        <div className="mt-2 space-y-1">
                          <p className="text-[11px] text-slate-500 font-medium leading-tight">
                            🎓 {reg.pendidikan || <span className="text-slate-300 italic">Belum diisi</span>}
                          </p>
                          <p className="text-[11px] text-emerald-600 font-bold leading-tight">
                            🎯 {reg.bidang_diminati || <span className="text-slate-300 italic font-normal">Belum diisi</span>}
                          </p>
                        </div>
                        {reg.riwayat_penyakit && (
                          <div className="mt-2 text-[11px] bg-rose-50 border border-rose-100 text-rose-700 px-2 py-1.5 rounded-lg flex gap-1">
                            <span className="font-bold shrink-0">Sakit:</span>
                            <span className="line-clamp-2" title={reg.riwayat_penyakit}>{reg.riwayat_penyakit}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-2 items-start">
                          {reg.bukti_dp_url && (
                            <a href={reg.bukti_dp_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[11px] font-medium transition-colors border border-blue-100 w-full sm:w-auto">
                              <ExternalLink size={12} className="shrink-0" /> Bukti DP
                            </a>
                          )}
                          {reg.bukti_follow_url && (
                            <a href={reg.bukti_follow_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[11px] font-medium transition-colors border border-indigo-100 w-full sm:w-auto">
                              <ExternalLink size={12} className="shrink-0" /> Follow IG
                            </a>
                          )}
                          {reg.foto_id_url && (
                            <a href={reg.foto_id_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-[11px] font-medium transition-colors border border-purple-100 w-full sm:w-auto">
                              <ExternalLink size={12} className="shrink-0" /> Pas Foto (ID Card)
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-xl border ${
                          reg.status === 'verified' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          reg.status === 'rejected' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                          'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {reg.status === 'pending' ? 'PENDING' : 
                           reg.status === 'verified' ? 'DITERIMA' : 'DITOLAK'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col sm:flex-row items-end justify-end gap-2">
                          {reg.status !== 'verified' && (
                            <button onClick={() => handleUpdateStatus(reg.id, 'verified')} className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-500 transition-colors shadow-sm w-full sm:w-auto">
                              <CheckCircle2 size={14} /> Terima
                            </button>
                          )}
                          {reg.status !== 'rejected' && (
                            <button onClick={() => handleUpdateStatus(reg.id, 'rejected')} className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white border border-rose-200 text-rose-600 rounded-lg text-xs font-medium hover:bg-rose-50 transition-colors w-full sm:w-auto">
                              <XCircle size={14} /> Tolak
                            </button>
                          )}
                        </div>
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
