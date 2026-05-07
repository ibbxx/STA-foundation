import React, { useEffect, useState } from 'react';
import { fetchAllVolunteerRegistrations, fetchVolunteerPrograms, updateVolunteerRegistrationStatus } from '../../lib/admin/repository';
import type { VolunteerRegistrationRow, VolunteerProgramRow } from '../../lib/supabase/types';
import { formatAdminDate } from '../../lib/admin/helpers';
import {
  Loader2, RefreshCw, CheckCircle2, XCircle, Search, ExternalLink,
  Download, MessageCircle, UserCheck, Clock, Users, ChevronRight,
  X, MapPin, Phone, Mail, Cake, Shirt, BookOpen, Target, AlertCircle,
  FileImage, Filter, FileSpreadsheet
} from 'lucide-react';
import { logError } from '../../lib/error-logger';
import * as XLSX from 'xlsx';

type StatusFilter = 'all' | 'pending' | 'verified' | 'rejected';

export default function AdminEduxplore() {
  const [registrations, setRegistrations] = useState<VolunteerRegistrationRow[]>([]);
  const [programs, setPrograms] = useState<VolunteerProgramRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProgram, setSelectedProgram] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selected, setSelected] = useState<VolunteerRegistrationRow | null>(null);
  const [updating, setUpdating] = useState(false);

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
    try {
      const { error } = await updateVolunteerRegistrationStatus(id, { status: newStatus });
      if (error) throw error;
      setRegistrations(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
      if (selected?.id === id) setSelected(prev => prev ? { ...prev, status: newStatus } : null);
    } catch (err) {
      alert('Gagal mengupdate status.');
    } finally {
      setUpdating(false);
    }
  }

  const filtered = registrations.filter(r => {
    if (selectedProgram !== 'all' && r.program_id !== selectedProgram) return false;
    if (selectedStatus !== 'all' && r.status !== selectedStatus) return false;
    const q = searchQuery.toLowerCase();
    return (
      (r.nama_lengkap || '').toLowerCase().includes(q) ||
      (r.email || '').toLowerCase().includes(q) ||
      (r.whatsapp || '').includes(q)
    );
  });

  const stats = {
    total: registrations.length,
    pending: registrations.filter(r => r.status === 'pending').length,
    verified: registrations.filter(r => r.status === 'verified').length,
    rejected: registrations.filter(r => r.status === 'rejected').length,
  };

  const exportExcel = () => {
    // Siapkan data untuk Excel
    const excelData = filtered.map(r => ({
      'Nama Lengkap': r.nama_lengkap,
      'Email': r.email,
      'WhatsApp': r.whatsapp, // SheetJS automatically handles strings well, but to be absolutely safe with leading 0s, we ensure it's a string.
      'Kontak Darurat': r.whatsapp_emergency,
      'Alamat': r.alamat,
      'Tanggal Lahir': r.tanggal_lahir,
      'Ukuran Baju': r.size_baju,
      'Latar Belakang Pendidikan': r.pendidikan || '-',
      'Bidang Diminati': r.bidang_diminati || '-',
      'Riwayat Penyakit': r.riwayat_penyakit || '-',
      'Program EduXplore': programs.find(p => p.id === r.program_id)?.title || '-',
      'Status Pendaftaran': r.status === 'verified' ? 'Diterima' : r.status === 'rejected' ? 'Ditolak' : 'Perlu Review',
      'Tanggal Daftar': formatAdminDate(r.created_at)
    }));

    // Buat worksheet dan workbook
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    
    // Set column widths agar rapi
    worksheet['!cols'] = [
      { wch: 25 }, // Nama Lengkap
      { wch: 25 }, // Email
      { wch: 15 }, // WhatsApp
      { wch: 15 }, // Darurat
      { wch: 40 }, // Alamat
      { wch: 15 }, // Tgl Lahir
      { wch: 12 }, // Baju
      { wch: 30 }, // Pendidikan
      { wch: 30 }, // Bidang
      { wch: 20 }, // Penyakit
      { wch: 25 }, // Program
      { wch: 18 }, // Status
      { wch: 20 }, // Tgl Daftar
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Volunteer');

    // Generate dan download file Excel
    XLSX.writeFile(workbook, `Data_Volunteer_EduXplore_${new Date().toISOString().split('T')[0]}.xlsx`);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Pendaftar EduXplore</h1>
          <p className="text-sm text-slate-500 mt-0.5">Tinjau dan verifikasi setiap pendaftar volunteer.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportExcel}
            disabled={filtered.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 transition-colors text-sm font-semibold shadow-sm disabled:opacity-40"
          >
            <FileSpreadsheet size={15} /> Export Excel
          </button>
          <button onClick={loadData} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors text-sm">

            <RefreshCw size={15} /> Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
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
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <select
                  value={selectedProgram}
                  onChange={e => setSelectedProgram(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none appearance-none"
                >
                  <option value="all">Semua Program</option>
                  {programs.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
              </div>
              <select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value as StatusFilter)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none"
              >
                <option value="all">Semua Status</option>
                <option value="pending">Perlu Review</option>
                <option value="verified">Diterima</option>
                <option value="rejected">Ditolak</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 bg-white">
            <span className="text-xs font-semibold text-slate-500">{filtered.length} Pendaftar</span>
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
                <button
                  key={reg.id}
                  onClick={() => setSelected(reg)}
                  className={`w-full text-left px-4 py-4 flex items-center gap-3 hover:bg-slate-50 transition-colors ${selected?.id === reg.id ? 'bg-emerald-50/50 border-l-2 border-emerald-500' : ''}`}
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {(reg.nama_lengkap || '?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900 truncate">{reg.nama_lengkap}</p>
                      <span className={`inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${statusBadge(reg.status)}`}>
                        {statusLabel(reg.status)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{reg.bidang_diminati || reg.email}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{formatAdminDate(reg.created_at)}</p>
                  </div>
                  <ChevronRight size={14} className="text-slate-300 flex-shrink-0" />
                </button>
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
                  <p className="font-bold text-slate-900">{selected.nama_lengkap}</p>
                  <p className="text-xs text-slate-500">{getProgramName(selected.program_id)}</p>
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
                {/* Personal Info */}
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Informasi Pribadi</h3>
                  <div className="space-y-3">
                    {[
                      { icon: Mail, label: 'Email', value: selected.email },
                      { icon: Phone, label: 'WhatsApp', value: selected.whatsapp },
                      { icon: Phone, label: 'Kontak Darurat', value: selected.whatsapp_emergency },
                      { icon: MapPin, label: 'Alamat', value: selected.alamat },
                      { icon: Cake, label: 'Tanggal Lahir', value: selected.tanggal_lahir },
                      { icon: Shirt, label: 'Ukuran Baju', value: selected.size_baju },
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

                {/* Background */}
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Latar Belakang</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <BookOpen size={14} className="text-blue-500" />
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-400 font-medium">Pendidikan</p>
                        <p className="text-sm text-slate-800 font-medium">{selected.pendidikan || <span className="italic text-slate-300">Belum diisi</span>}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Target size={14} className="text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-400 font-medium">Bidang yang Diminati</p>
                        <p className="text-sm text-emerald-700 font-bold">{selected.bidang_diminati || <span className="italic text-slate-300 font-normal">Belum diisi</span>}</p>
                      </div>
                    </div>
                    {selected.riwayat_penyakit && (
                      <div className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <AlertCircle size={14} className="text-rose-500" />
                        </div>
                        <div>
                          <p className="text-[11px] text-slate-400 font-medium">Riwayat Penyakit</p>
                          <p className="text-sm text-rose-700 font-medium">{selected.riwayat_penyakit}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Documents */}
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Dokumen Pendaftaran</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { label: 'Bukti Pembayaran DP', url: selected.bukti_dp_url, color: 'bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100' },
                      { label: 'Bukti Follow Instagram', url: selected.bukti_follow_url, color: 'bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100' },
                      { label: 'Pas Foto (untuk ID Card)', url: selected.foto_id_url, color: 'bg-violet-50 text-violet-700 border-violet-100 hover:bg-violet-100' },
                    ].map(({ label, url, color }) => url ? (
                      <a key={label} href={url} target="_blank" rel="noreferrer"
                        className={`flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${color}`}
                      >
                        <div className="flex items-center gap-2.5">
                          <FileImage size={16} />
                          <span>{label}</span>
                        </div>
                        <ExternalLink size={14} className="opacity-60" />
                      </a>
                    ) : (
                      <div key={label} className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-dashed border-slate-200 text-sm text-slate-400">
                        <FileImage size={16} /> <span>{label}</span>
                        <span className="ml-auto text-[11px]">Tidak diunggah</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Footer */}
            <div className="border-t border-slate-100 px-6 py-4 bg-slate-50/60 space-y-3">
              {/* WhatsApp */}
              <a
                href={`https://wa.me/${(selected.whatsapp || '').replace(/\D/g, '')}?text=${encodeURIComponent(`Halo ${selected.nama_lengkap}, kami ingin menginformasikan mengenai pendaftaran EduXplore Anda.`)}`}
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
