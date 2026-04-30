import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ImagePlus,
  Loader2,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';
import {
  createEmptyHomeProgram,
  fetchHomeProgramsContent,
  saveHomeProgramsContent,
  type HomeProgramSlide,
} from '../../lib/admin-home-programs';
import { uploadAdminImage } from '../../lib/supabase-storage';
import { logError } from '../../lib/error-logger';

function ProgramSlideCard({
  slide,
  index,
  total,
  uploading,
  onUpdate,
  onDelete,
  onUploadImage,
}: {
  slide: HomeProgramSlide;
  index: number;
  total: number;
  uploading: boolean;
  onUpdate: (id: string, field: keyof HomeProgramSlide, value: string) => void;
  onDelete: (id: string) => void;
  onUploadImage: (id: string, file: File, targetField?: keyof HomeProgramSlide) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col md:flex-row group">
      {/* Gambar - Ukuran diperkecil */}
      <div className="relative w-full md:w-48 lg:w-60 shrink-0 aspect-video md:aspect-auto bg-slate-50 border-b md:border-b-0 md:border-r border-slate-100">
        {slide.imageUrl ? (
          <img src={slide.imageUrl} alt={slide.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-slate-300 p-4">
            <ImagePlus size={24} />
            <span className="text-[10px] font-medium uppercase tracking-wider text-center">No Image</span>
          </div>
        )}

        {/* Upload overlay */}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-[2px]">
            <Loader2 size={20} className="animate-spin text-zinc-900" />
          </div>
        )}

        {/* Tombol aksi gambar - Floating overlay on hover or mobile */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="p-2 rounded-full bg-white text-zinc-900 hover:bg-zinc-100 transition-colors shadow-lg"
            title="Ganti Foto"
          >
            <ImagePlus size={16} />
          </button>
          {total > 1 && (
            <button
              type="button"
              onClick={() => onDelete(slide.id)}
              className="p-2 rounded-full bg-rose-500 text-white hover:bg-rose-600 transition-colors shadow-lg"
              title="Hapus"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>

        {/* Badge nomor slide */}
        <div className="absolute top-2 left-2 rounded-md bg-zinc-900/80 px-2 py-0.5 text-[9px] font-bold text-white backdrop-blur-sm uppercase tracking-wider">
          Slide {index + 1}
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onUploadImage(slide.id, f, 'imageUrl');
            e.target.value = '';
          }}
        />
      </div>

      {/* Form fields - Lebih Compact */}
      <div className="flex-1 p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-3 sm:col-span-1">
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Judul Program
            </label>
            <input
              type="text"
              value={slide.title}
              onChange={(e) => onUpdate(slide.id, 'title', e.target.value)}
              placeholder="Jelajah Tanah Air"
              className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-900 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Slug (URL)
            </label>
            <input
              type="text"
              value={slide.slug || ''}
              onChange={(e) => onUpdate(slide.id, 'slug', e.target.value)}
              placeholder="jelajah-tanah-air"
              className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
            />
          </div>
        </div>
        
        <div className="sm:col-span-1 space-y-3">
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Deskripsi Singkat (Beranda)
            </label>
            <textarea
              rows={2}
              value={slide.short_description}
              onChange={(e) => onUpdate(slide.id, 'short_description', e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 resize-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Hero Image (Halaman Detail)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={slide.heroImageUrl || ''}
                className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-[10px] text-slate-400 bg-slate-50 outline-none"
                placeholder="Belum ada gambar hero detail..."
              />
              <button
                type="button"
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.onchange = (e) => {
                    const f = (e.target as HTMLInputElement).files?.[0];
                    if (f) onUploadImage(slide.id, f, 'heroImageUrl');
                  };
                  input.click();
                }}
                className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
              >
                <ImagePlus size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


export default function AdminHomeProgramsManager() {
  const [slides, setSlides] = useState<HomeProgramSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const loadPrograms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const content = await fetchHomeProgramsContent();
      setSlides(content.slides);
    } catch (err) {
      logError('AdminHomeProgramsManager.load', err);
      setError('Gagal memuat data Program Beranda.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPrograms();
  }, [loadPrograms]);

  function updateSlide(id: string, field: keyof HomeProgramSlide, value: string) {
    setSlides((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  }

  function addSlide() {
    setSlides((prev) => [...prev, createEmptyHomeProgram()]);
  }

  function deleteSlide(id: string) {
    if (slides.length <= 1) {
      setError('Minimal 1 program harus ada.');
      return;
    }
    if (!window.confirm('Yakin hapus program ini?')) return;
    
    const slide = slides.find((s) => s.id === id);
    if (slide) {
      const urlsToDelete = [slide.imageUrl, slide.heroImageUrl].filter(Boolean) as string[];
      if (urlsToDelete.length > 0) {
        import('../../lib/supabase-storage').then((m) => {
          m.deleteFilesFromStorage(urlsToDelete).catch(err => logError('AdminHomeProgramsManager.deleteStorage', err));
        });
      }
    }

    setSlides((prev) => prev.filter((s) => s.id !== id));
  }

  async function handleUploadImage(slideId: string, file: File, targetField: keyof HomeProgramSlide = 'imageUrl') {
    setUploadingId(slideId);
    setError(null);
    try {
      const slide = slides.find((s) => s.id === slideId);
      const oldUrl = slide?.[targetField] as string | undefined;

      const url = await uploadAdminImage(file, 'programs');
      updateSlide(slideId, targetField, url);

      if (oldUrl) {
        import('../../lib/supabase-storage').then((m) => {
          m.deleteFilesFromStorage([oldUrl]).catch(err => logError('AdminHomeProgramsManager.deleteOldStorage', err));
        });
      }
    } catch (err) {
      logError('AdminHomeProgramsManager.upload', err);
      setError(err instanceof Error ? err.message : 'Gagal upload gambar.');
    } finally {
      setUploadingId(null);
    }
  }

  async function handleSave() {
    setNotice(null);
    setError(null);

    const invalid = slides.find((s) => !s.title.trim() || !s.imageUrl.trim());
    if (invalid) {
      setError('Setiap program harus punya judul dan gambar.');
      return;
    }

    setSaving(true);
    try {
      const { error: saveErr } = await saveHomeProgramsContent({ slides });
      if (saveErr) throw saveErr;
      setNotice('Program Beranda berhasil disimpan!');
    } catch (err) {
      logError('AdminHomeProgramsManager.save', err);
      setError('Gagal menyimpan. Coba lagi.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm mt-6">
        <Loader2 className="mx-auto h-5 w-5 animate-spin text-slate-400" />
        <p className="mt-2 text-sm text-slate-500">Memuat Program Beranda...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-6 border-t border-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Program Beranda (Sticky Scroll)</h2>
          <p className="text-xs text-slate-500">Kelola gambar dan narasi singkat yang muncul pada animasi scroll di halaman utama.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={addSlide}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Plus size={14} /> Tambah Program
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-zinc-950 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Simpan Perubahan
          </button>
        </div>
      </div>

      {/* Notices */}
      {notice && (
        <div className="flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 size={18} className="shrink-0" />
          {notice}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-3 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">
          <AlertCircle size={18} className="shrink-0" />
          {error}
        </div>
      )}

      {/* Slide Cards */}
      <div className="grid grid-cols-1 gap-4">
        {slides.map((slide, i) => (
          <ProgramSlideCard
            key={slide.id}
            slide={slide}
            index={i}
            total={slides.length}
            uploading={uploadingId === slide.id}
            onUpdate={updateSlide}
            onDelete={deleteSlide}
            onUploadImage={handleUploadImage}
          />
        ))}
      </div>
    </div>
  );
}
