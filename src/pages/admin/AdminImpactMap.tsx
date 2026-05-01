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
  Upload
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
        status: 'Berjalan',
        latitude: -2.5,
        longitude: 118.0,
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

  /**
   * Parse koordinat dari berbagai format URL Google Maps:
   * - https://www.google.com/maps/@-6.208,106.845,17z
   * - https://www.google.com/maps/place/.../@-6.208,106.845,17z/...
   * - https://www.google.com/maps?q=-6.208,106.845
   * - https://maps.google.com/?q=-6.208,106.845
   * - https://www.google.com/maps/...!3d-6.208!4d106.845...
   * - Koordinat langsung: -6.208,106.845 atau -6.208, 106.845
   */
  function parseGoogleMapsUrl(input: string): { lat: number; lng: number } | null {
    const trimmed = input.trim();
    if (!trimmed) return null;

    // 1. DMS Format: 8°10'44.4"S 115°09'08.9"E
    const dmsRegex = /(\d+)°\s*(\d+)'\s*(\d+(\.\d+)?)\"\s*([NSEW])/gi;
    const dmsMatches = [...trimmed.matchAll(dmsRegex)];
    if (dmsMatches.length === 2) {
      const convert = (m: RegExpMatchArray) => {
        const d = parseFloat(m[1]);
        const min = parseFloat(m[2]);
        const s = parseFloat(m[3]);
        const dir = m[5].toUpperCase();
        let dd = d + min/60 + s/3600;
        if (dir === 'S' || dir === 'W') dd = -dd;
        return dd;
      };
      return { lat: convert(dmsMatches[0]), lng: convert(dmsMatches[1]) };
    }

    // 2. Coba parse sebagai koordinat langsung: "-6.208, 106.845"
    const directMatch = trimmed.match(/^(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)$/);
    if (directMatch) {
      const lat = parseFloat(directMatch[1]);
      const lng = parseFloat(directMatch[2]);
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) return { lat, lng };
    }

    // 3. Format /@lat,lng
    const atMatch = trimmed.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (atMatch) {
      return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
    }

    // 4. Format q=lat,lng atau center=lat,lng atau ll=lat,lng
    const paramMatch = trimmed.match(/[?&](?:q|center|ll)=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (paramMatch) {
      return { lat: parseFloat(paramMatch[1]), lng: parseFloat(paramMatch[2]) };
    }

    // 5. Format !3dlat!4dlng (embed/directions URL)
    const embedMatch = trimmed.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
    if (embedMatch) {
      return { lat: parseFloat(embedMatch[1]), lng: parseFloat(embedMatch[2]) };
    }

    // 6. Format place/Nama+Tempat/lat,lng
    const placeMatch = trimmed.match(/place\/[^/]+\/(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (placeMatch) {
      return { lat: parseFloat(placeMatch[1]), lng: parseFloat(placeMatch[2]) };
    }

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
      setMapsLinkError('Gagal membaca koordinat. Pastikan link Google Maps lengkap (bukan short-link maps.app.goo.gl) atau gunakan format koordinat langsung.');
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
      setNotice(mode === 'edit' ? 'Lokasi berhasil diperbarui.' : 'Lokasi baru berhasil ditambahkan.');
      setMode(null);
      setEditingLocation(null);
    } catch (err: any) {
      logError('AdminImpactMap.save', err);
      setError(err.message || 'Gagal menyimpan data.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Hapus lokasi ini dari peta?')) return;

    setSaving(true);
    try {
      const nextLocations = locations.filter(l => l.id !== id);
      const { error: upsertError } = await upsertSiteContent([{
        key: 'impact_map',
        value: { locations: nextLocations }
      }]);

      if (upsertError) throw upsertError;

      setLocations(nextLocations);
      setNotice('Lokasi berhasil dihapus.');
    } catch (err: any) {
      logError('AdminImpactMap.delete', err);
      setError('Gagal menghapus lokasi.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Peta Dampak</h1>
          <p className="text-sm text-slate-500 mt-1">Kelola titik lokasi kegiatan dan aksi nyata di seluruh Indonesia.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => loadData()}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={() => setMode('create')}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-xl text-sm font-medium shadow-sm hover:bg-zinc-950 transition-colors"
          >
            <Plus size={16} />
            Tambah Lokasi
          </button>
        </div>
      </div>

      {notice && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-zinc-200 bg-zinc-100 text-sm text-zinc-950">
          <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
          <p>{notice}</p>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-rose-200 bg-rose-50 text-sm text-rose-700">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* List Section */}
        <div className="lg:col-span-1 space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
          {locations.length === 0 ? (
            <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50">
              <MapPin className="h-8 w-8 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">Belum ada lokasi.</p>
            </div>
          ) : (
            locations.map((loc) => (
              <div 
                key={loc.id}
                className={cn(
                  "group relative p-4 bg-white border rounded-2xl transition-all hover:shadow-md",
                  editingLocation?.id === loc.id ? "border-zinc-900 ring-1 ring-zinc-900" : "border-slate-200"
                )}
              >
                <div className="flex gap-4">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                    <img src={loc.imageUrl} alt={loc.title} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 truncate">{loc.title}</h3>
                    <p className="text-xs text-slate-500 truncate">{loc.locationLabel || 'Tanpa Label Lokasi'}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className={cn(
                        "px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider",
                        loc.status === 'Selesai' ? "bg-emerald-100 text-emerald-700" : 
                        loc.status === 'Berjalan' ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
                      )}>
                        {loc.status}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-end gap-1 border-t border-slate-50 pt-3">
                  <button
                    onClick={() => {
                      setEditingLocation(loc);
                      setMode('edit');
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-slate-400 hover:text-zinc-900 transition-colors uppercase tracking-wider"
                  >
                    <Edit2 size={12} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(loc.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-slate-300 hover:text-rose-600 transition-colors uppercase tracking-wider"
                  >
                    <Trash2 size={12} />
                    Hapus
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Map Preview Section */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative aspect-video rounded-3xl border border-slate-200 overflow-hidden bg-slate-100 shadow-sm">
            <InteractiveMap 
              locations={locations} 
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
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 px-4 py-2 bg-zinc-900/90 text-white text-xs font-medium rounded-full backdrop-blur-md border border-white/10 flex items-center gap-2">
                <Info size={14} className="text-blue-400" />
                Klik di peta untuk menentukan koordinat
              </div>
            )}
          </div>
          
          <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-3">
            <Info size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-800 leading-relaxed">
              <p className="font-bold mb-1">Tips Manajemen Peta:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Klik tombol <strong>Tambah Lokasi</strong> untuk membuat titik baru.</li>
                <li>Gunakan <strong>URL Gambar</strong> yang relevan untuk mempercantik popup informasi.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <AdminModal
        open={mode !== null}
        onClose={() => setMode(null)}
        title={mode === 'create' ? 'Tambah Lokasi Baru' : 'Edit Lokasi'}
        widthClassName="max-w-xl"
        footer={(
          <div className="flex w-full items-center justify-end gap-6">
            <button
              onClick={() => setMode(null)}
              className="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleSubmit(onSubmit as any)}
              disabled={saving || uploadingImage}
              className="bg-zinc-900 text-white px-10 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-zinc-900/10 disabled:opacity-50"
            >
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        )}
      >
        <form className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Judul Lokasi</label>
              <input
                type="text"
                {...register('title')}
                placeholder="Contoh: Renovasi SD Inpres"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-1 focus:ring-zinc-900 outline-none"
              />
              {errors.title && <p className="text-xs text-rose-500">{errors.title.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Wilayah / Label Lokasi</label>
              <input
                type="text"
                {...register('locationLabel')}
                placeholder="Contoh: Barru, Sulawesi Selatan"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-1 focus:ring-zinc-900 outline-none"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Periode Jejak</label>
              <input
                type="text"
                {...register('journeyPeriod')}
                placeholder="Contoh: Agustus 2024"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-1 focus:ring-zinc-900 outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Capaian / Progress</label>
              <input
                type="text"
                {...register('journeyProgress')}
                placeholder="Contoh: 100% Selesai"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-1 focus:ring-zinc-900 outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Deskripsi Singkat</label>
            <textarea
              rows={3}
              {...register('description')}
              placeholder="Jelaskan secara singkat dampak atau kegiatan di lokasi ini..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-1 focus:ring-zinc-900 outline-none"
            />
            {errors.description && <p className="text-xs text-rose-500">{errors.description.message}</p>}
          </div>

          {/* ── Lokasi & Koordinat Section ── */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-5">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Link2 size={14} className="text-slate-400" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Auto-fill dari Google Maps</p>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={mapsLinkInput}
                  onChange={(e) => {
                    setMapsLinkInput(e.target.value);
                    setMapsLinkError(null);
                    setMapsLinkSuccess(false);
                  }}
                  placeholder="Paste link Google Maps atau koordinat..."
                  className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-1 focus:ring-zinc-900 outline-none bg-white placeholder:text-slate-300"
                />
                <button
                  type="button"
                  onClick={handleParseMapsLink}
                  disabled={!mapsLinkInput.trim()}
                  className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap shadow-sm"
                >
                  Ambil Koordinat
                </button>
              </div>
              {mapsLinkError && (
                <p className="text-[10px] text-rose-500 flex items-start gap-1.5">
                  <AlertCircle size={12} className="shrink-0 mt-0.5" />
                  {mapsLinkError}
                </p>
              )}
              {mapsLinkSuccess && (
                <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1.5">
                  <CheckCircle2 size={12} />
                  Berhasil mengambil koordinat!
                </p>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500">Latitude</label>
                <input
                  type="number"
                  step="any"
                  {...register('latitude', { valueAsNumber: true })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-1 focus:ring-zinc-900 outline-none bg-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500">Longitude</label>
                <input
                  type="number"
                  step="any"
                  {...register('longitude', { valueAsNumber: true })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-1 focus:ring-zinc-900 outline-none bg-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500">Status</label>
                <select
                  {...register('status')}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-1 focus:ring-zinc-900 outline-none bg-white"
                >
                  <option value="Berjalan">Berjalan</option>
                  <option value="Selesai">Selesai</option>
                  <option value="Akan Datang">Akan Datang</option>
                </select>
              </div>
            </div>
            
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Gambar Lokasi (URL)</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  {...register('imageUrl')}
                  placeholder="URL gambar..."
                  className="w-full pl-10 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-1 focus:ring-zinc-900 outline-none"
                />
              </div>
              <label className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-200 transition-colors cursor-pointer border border-slate-200 flex items-center gap-2">
                {uploadingImage ? '...' : 'Upload'}
                <input type="file" accept="image/*" className="hidden" onChange={handleUploadImage} disabled={uploadingImage} />
              </label>
            </div>
            {errors.imageUrl && <p className="text-xs text-rose-500">{errors.imageUrl.message}</p>}
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              Galeri Foto Dokumentasi
              <span className="text-[10px] text-slate-400 font-normal uppercase tracking-wider">(Opsional)</span>
            </label>
            
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
              {galleryImages.map((url, idx) => (
                <div key={idx} className="group relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                  <img src={url} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeGalleryImage(url)}
                    className="absolute top-1 right-1 p-1 bg-rose-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
              <label className="flex aspect-square items-center justify-center rounded-xl border-2 border-dashed border-slate-200 hover:border-zinc-900 hover:bg-slate-50 transition-all cursor-pointer">
                {uploadingGallery ? (
                  <RefreshCw size={18} className="animate-spin text-slate-400" />
                ) : (
                  <Plus size={20} className="text-slate-400" />
                )}
                <input type="file" multiple accept="image/*" className="hidden" onChange={handleUploadGallery} disabled={uploadingGallery} />
              </label>
            </div>
          </div>

          <div className="space-y-1.5">
            <RichTextEditor
              label="Konten Detail Journey (Cerita Lengkap)"
              value={watch('fullContent')}
              onChange={(val) => setValue('fullContent', val, { shouldValidate: true })}
              error={errors.fullContent?.message}
              hint="Isi cerita lengkap yang akan muncul di halaman detail perjalanan. Mendukung baris baru, tebal, miring, dan list."
            />
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tautan Detail Journey (Opsional)</p>
              <div className="group relative">
                <Info size={14} className="text-slate-300 cursor-help" />
                <div className="absolute right-0 bottom-full mb-2 hidden w-48 rounded-lg bg-gray-900 p-2 text-[10px] text-white group-hover:block z-50 shadow-xl">
                  Jika dikosongkan, sistem akan mencoba mengarahkan ke halaman Journey secara otomatis.
                </div>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500">Label Tombol</label>
                <input
                  type="text"
                  {...register('actionLabel')}
                  placeholder="Contoh: Baca Cerita Lengkap"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-1 focus:ring-zinc-900 outline-none bg-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500">Custom Link Journey (ID/Slug)</label>
                <input
                  type="text"
                  {...register('actionHref')}
                  placeholder="Contoh: /journey/sdn-01-aceh"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-1 focus:ring-zinc-900 outline-none bg-white"
                />
              </div>
            </div>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}
