import React, { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Plus, 
  MapPin, 
  Edit2, 
  Trash2, 
  Save, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Image as ImageIcon,
  ExternalLink,
  Info,
  Link2,
  X,
  Upload,
  Globe,
  Search,
  Compass
} from 'lucide-react';
import { adminMapLocationSchema, type AdminMapLocationValues } from '../../lib/admin/schemas';
import { fetchSiteContentRows, upsertSiteContent } from '../../lib/admin/repository';
import { uploadAdminImage } from '../../lib/supabase/storage';
import { logError } from '../../lib/error-logger';
import AdminModal from '../../components/admin/AdminModal';
import RichTextEditor from '../../components/admin/campaigns/RichTextEditor';
import InteractiveMap from '../../components/shared/InteractiveMap';
import type { EventMapLocation } from '../../lib/public/events';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

export default function AdminImpactMap() {
  const [locations, setLocations] = useState<EventMapLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [mode, setMode] = useState<'create' | 'edit' | null>(null);
  const [editingLocation, setEditingLocation] = useState<EventMapLocation | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mapsLinkInput, setMapsLinkInput] = useState('');
  const [mapsLinkError, setMapsLinkError] = useState<string | null>(null);
  const [mapsLinkSuccess, setMapsLinkSuccess] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [activeTab, setActiveTab] = useState<'map' | 'list'>('map');
  const [searchQuery, setSearchQuery] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AdminMapLocationValues>({
    resolver: zodResolver(adminMapLocationSchema),
    defaultValues: {
      title: '',
      description: '',
      imageUrl: '',
      status: 'Berjalan',
      latitude: -2.5,
      longitude: 118.0,
      locationLabel: '',
      actionHref: '',
      actionLabel: '',
      images: [],
      fullContent: '',
      journeyPeriod: '',
      journeyProgress: '',
    },
  });

  const galleryImages = watch('images') || [];

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const { data } = await fetchSiteContentRows();
      if (data) {
        const mapRow = (data as any[]).find(r => r.key === 'impact_map');
        if (mapRow && mapRow.value) {
          const parsed = typeof mapRow.value === 'string' ? JSON.parse(mapRow.value) : mapRow.value;
          if (Array.isArray(parsed.locations)) {
            setLocations(parsed.locations);
          }
        }
      }
    } catch (err: any) {
      logError('AdminImpactMap.loadData', err);
      setError('Gagal memuat data peta dampak.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (mode === 'edit' && editingLocation) {
      reset({
        id: editingLocation.id,
        title: editingLocation.title,
        description: editingLocation.description,
        imageUrl: editingLocation.imageUrl,
        latitude: editingLocation.latitude,
        longitude: editingLocation.longitude,
        status: editingLocation.status,
        locationLabel: editingLocation.locationLabel || '',
        actionHref: editingLocation.actionHref || '',
        actionLabel: editingLocation.actionLabel || '',
        images: editingLocation.images || [],
        fullContent: editingLocation.fullContent || '',
        journeyPeriod: editingLocation.journeyPeriod || '',
        journeyProgress: editingLocation.journeyProgress || '',
      });
    } else if (mode === 'create') {
      reset({
        title: '',
        description: '',
        imageUrl: '',
        status: 'Berjalan',
        latitude: -2.5,
        longitude: 118.0,
        locationLabel: '',
        actionHref: '',
        actionLabel: '',
        images: [],
        fullContent: '',
        journeyPeriod: '',
        journeyProgress: '',
      });
    }
  }, [mode, editingLocation, reset]);

  const handleMapClick = (e: any) => {
    if (mode === 'create' || mode === 'edit') {
      const { lng, lat } = e.lngLat;
      setValue('longitude', parseFloat(lng.toFixed(6)));
      setValue('latitude', parseFloat(lat.toFixed(6)));
    }
  };

  const filteredLocations = locations.filter(loc => 
    loc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (loc.locationLabel || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: locations.length,
    active: locations.filter(l => l.status === 'Berjalan').length,
    completed: locations.filter(l => l.status === 'Selesai').length,
    provinces: new Set(locations.map(l => l.locationLabel?.split(',').pop()?.trim())).size
  };

  // Re-use existing utility functions (parseGoogleMapsUrl, etc.) from original code
  function parseGoogleMapsUrl(input: string): { lat: number; lng: number } | null {
    const trimmed = input.trim();
    if (!trimmed) return null;
    const directMatch = trimmed.match(/^(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)$/);
    if (directMatch) return { lat: parseFloat(directMatch[1]), lng: parseFloat(directMatch[2]) };
    const atMatch = trimmed.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (atMatch) return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
    const embedMatch = trimmed.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
    if (embedMatch) return { lat: parseFloat(embedMatch[1]), lng: parseFloat(embedMatch[2]) };
    return null;
  }

  const handleParseMapsLink = () => {
    setMapsLinkError(null);
    setMapsLinkSuccess(false);
    const result = parseGoogleMapsUrl(mapsLinkInput);
    if (result) {
      setValue('latitude', parseFloat(result.lat.toFixed(6)));
      setValue('longitude', parseFloat(result.lng.toFixed(6)));
      setMapsLinkSuccess(true);
      setTimeout(() => setMapsLinkSuccess(false), 3000);
    } else {
      setMapsLinkError('Gagal membaca koordinat. Gunakan format -6.123, 106.123');
    }
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingImage(true);
      const url = await uploadAdminImage(file, 'general');
      setValue('imageUrl', url, { shouldDirty: true, shouldValidate: true });
    } catch (err) {
      alert('Gagal mengunggah gambar.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleUploadGallery = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    try {
      setUploadingGallery(true);
      const uploadPromises = files.map(file => uploadAdminImage(file as File, 'general'));
      const urls = await Promise.all(uploadPromises);
      setValue('images', [...galleryImages, ...urls], { shouldDirty: true, shouldValidate: true });
    } catch (err) {
      alert('Gagal mengunggah beberapa gambar.');
    } finally {
      setUploadingGallery(false);
    }
  };

  const removeGalleryImage = (urlToRemove: string) => {
    setValue('images', galleryImages.filter(url => url !== urlToRemove), { shouldDirty: true });
  };

  const onSubmit: SubmitHandler<AdminMapLocationValues> = async (values) => {
    setSaving(true);
    setNotice(null);
    setError(null);
    try {
      let nextLocations = [...locations];
      const newLoc: EventMapLocation = {
        ...values,
        id: values.id || `loc-${Date.now()}`,
      } as EventMapLocation;
      if (mode === 'edit' && editingLocation) {
        nextLocations = nextLocations.map(l => l.id === editingLocation.id ? newLoc : l);
      } else {
        nextLocations.push(newLoc);
      }
      const { error: upsertError } = await upsertSiteContent([{
        key: 'impact_map',
        value: { locations: nextLocations }
      }]);
      if (upsertError) throw upsertError;
      setLocations(nextLocations);
      setNotice(mode === 'edit' ? 'Lokasi diperbarui.' : 'Lokasi ditambahkan.');
      setMode(null);
      setEditingLocation(null);
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Hapus lokasi ini?')) return;
    setSaving(true);
    try {
      const nextLocations = locations.filter(l => l.id !== id);
      const { error: upsertError } = await upsertSiteContent([{
        key: 'impact_map',
        value: { locations: nextLocations }
      }]);
      if (upsertError) throw upsertError;
      setLocations(nextLocations);
      setNotice('Lokasi dihapus.');
    } catch (err: any) {
      setError('Gagal menghapus.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── HEADER & ACTIONS ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <MapPin className="text-emerald-600" />
            Peta Dampak Nusantara
          </h1>
          <p className="text-sm text-slate-500 mt-1">Sistem manajemen titik lokasi dan dokumentasi jejak kebaikan.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => loadData()}
            className="p-2.5 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 transition-colors border border-slate-200"
            title="Refresh Data"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setMode('create')}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all hover:scale-105"
          >
            <Plus size={18} />
            Tambah Lokasi Baru
          </button>
        </div>
      </div>

      {/* ── QUICK STATS ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Lokasi', value: stats.total, icon: MapPin, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Proyek Selesai', value: stats.completed, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Sedang Berjalan', value: stats.active, icon: RefreshCw, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Provinsi', value: stats.provinces, icon: Globe, color: 'text-purple-600', bg: 'bg-purple-50' }
        ].map((s, i) => (
          <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center gap-4">
            <div className={cn("p-3 rounded-xl", s.bg)}>
              <s.icon size={20} className={s.color} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">{s.label}</p>
              <p className="text-xl font-black text-slate-900 leading-none">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── MESSAGES ── */}
      {(notice || error) && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className={cn(
          "p-4 rounded-2xl border flex items-center gap-3 text-sm font-medium",
          notice ? "bg-emerald-50 border-emerald-100 text-emerald-800" : "bg-rose-50 border-rose-100 text-rose-800"
        )}>
          {notice ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <p>{notice || error}</p>
        </motion.div>
      )}

      {/* ── MAIN CONTENT AREA ── */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        {/* Tabs & Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between border-b border-slate-50 p-4 gap-4">
          <div className="flex bg-slate-50 p-1 rounded-xl w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('map')}
              className={cn(
                "flex-1 sm:flex-none px-6 py-2 text-xs font-bold rounded-lg transition-all",
                activeTab === 'map' ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              Visual Peta
            </button>
            <button
              onClick={() => setActiveTab('list')}
              className={cn(
                "flex-1 sm:flex-none px-6 py-2 text-xs font-bold rounded-lg transition-all",
                activeTab === 'list' ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              Daftar Lokasi
            </button>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Cari lokasi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="p-4">
          {activeTab === 'map' ? (
            <div className="relative aspect-video sm:aspect-[2.5/1] rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
              <InteractiveMap 
                locations={filteredLocations} 
                height="100%" 
                useFallbackLocations={false}
                viewportMode="fit-indonesia"
                onClick={handleMapClick}
                onLocationSelect={(loc) => {
                  setEditingLocation(loc);
                  setMode('edit');
                }}
              />
              {(mode === 'create' || mode === 'edit') && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 px-4 py-2 bg-zinc-900/90 text-white text-[10px] font-bold uppercase tracking-widest rounded-full backdrop-blur-md border border-white/10 shadow-2xl">
                  Klik di peta untuk menentukan koordinat
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                    <th className="px-4 py-2">Info Lokasi</th>
                    <th className="px-4 py-2">Wilayah</th>
                    <th className="px-4 py-2">Koordinat</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLocations.map((loc) => (
                    <tr key={loc.id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 bg-white border-y border-l border-slate-50 first:rounded-l-2xl">
                        <div className="flex items-center gap-3">
                          <img src={loc.imageUrl} className="h-10 w-10 rounded-lg object-cover" />
                          <div>
                            <p className="text-sm font-bold text-slate-900">{loc.title}</p>
                            <p className="text-[10px] text-slate-400 truncate max-w-[200px]">{loc.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 bg-white border-y border-slate-50 text-xs font-medium text-slate-600">
                        {loc.locationLabel || '-'}
                      </td>
                      <td className="px-4 py-3 bg-white border-y border-slate-50 text-[10px] font-mono text-slate-400">
                        {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
                      </td>
                      <td className="px-4 py-3 bg-white border-y border-slate-50">
                        <span className={cn(
                          "px-2.5 py-1 text-[9px] font-black rounded-lg uppercase tracking-wider",
                          loc.status === 'Selesai' ? "bg-emerald-100 text-emerald-700" : 
                          loc.status === 'Berjalan' ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                        )}>
                          {loc.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 bg-white border-y border-r border-slate-50 last:rounded-r-2xl text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => { setEditingLocation(loc); setMode('edit'); }}
                            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(loc.id)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
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
      </div>

      <AdminModal
        open={mode !== null}
        onClose={() => setMode(null)}
        title={mode === 'create' ? 'Tambah Lokasi Baru' : 'Edit Lokasi'}
        widthClassName="max-w-2xl"
        footer={(
          <div className="flex w-full items-center justify-end gap-6">
            <button onClick={() => setMode(null)} className="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600">Batal</button>
            <button
              onClick={handleSubmit(onSubmit as any)}
              disabled={saving || uploadingImage}
              className="bg-emerald-600 text-white px-10 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 disabled:opacity-50"
            >
              {saving ? 'Menyimpan...' : 'Simpan Data'}
            </button>
          </div>
        )}
      >
        <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Informasi Dasar</label>
              <input type="text" {...register('title')} placeholder="Nama Proyek/Lokasi" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none" />
              <input type="text" {...register('locationLabel')} placeholder="Provinsi / Kabupaten" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none" />
              <textarea rows={3} {...register('description')} placeholder="Deskripsi singkat..." className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Koordinat & Status</label>
              <div className="flex gap-2">
                <input type="text" value={mapsLinkInput} onChange={(e) => setMapsLinkInput(e.target.value)} placeholder="Google Maps URL..." className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs outline-none" />
                <button type="button" onClick={handleParseMapsLink} className="p-2.5 bg-white border border-slate-200 rounded-xl text-emerald-600 hover:bg-emerald-50 transition-colors"><Compass size={18} /></button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="number" step="any" {...register('latitude', { valueAsNumber: true })} placeholder="Lat" className="px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs outline-none" />
                <input type="number" step="any" {...register('longitude', { valueAsNumber: true })} placeholder="Lng" className="px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs outline-none" />
              </div>
              <select {...register('status')} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none">
                <option value="Berjalan">Berjalan</option>
                <option value="Selesai">Selesai</option>
                <option value="Akan Datang">Akan Datang</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Visual & Dokumentasi</label>
              <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-100 border border-slate-200 group">
                <img src={watch('imageUrl') || 'https://via.placeholder.com/400x225?text=Preview+Gambar'} className="w-full h-full object-cover" />
                <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Upload className="text-white" size={24} />
                  <input type="file" accept="image/*" className="hidden" onChange={handleUploadImage} />
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Galeri Tambahan</label>
              <div className="grid grid-cols-4 gap-2">
                {galleryImages.map((url, idx) => (
                  <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-slate-100">
                    <img src={url} className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeGalleryImage(url)} className="absolute top-0.5 right-0.5 p-0.5 bg-rose-500 text-white rounded-full"><X size={8} /></button>
                  </div>
                ))}
                <label className="flex aspect-square items-center justify-center rounded-lg border border-dashed border-slate-300 hover:border-emerald-500 cursor-pointer">
                  <Plus size={16} className="text-slate-400" />
                  <input type="file" multiple accept="image/*" className="hidden" onChange={handleUploadGallery} />
                </label>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 pt-4 border-t border-slate-100">
            <RichTextEditor
              label="Cerita Lengkap (Journey)"
              value={watch('fullContent')}
              onChange={(val) => setValue('fullContent', val)}
            />
          </div>
        </form>
      </AdminModal>
    </div>
  );
}
