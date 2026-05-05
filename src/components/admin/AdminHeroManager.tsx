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
  createEmptySlide,
  fetchHeroContent,
  saveHeroContent,
  type HeroSlide,
} from '../../lib/admin-hero';
import { uploadAdminImage } from '../../lib/supabase/storage';
import { logError } from '../../lib/error-logger';

/* ─────────── Single Slide Card (Inline Edit) ─────────── */

function SlideCard({
  slide,
  index,
  total,
  uploading,
  onUpdate,
  onDelete,
  onUploadImage,
}: {
  key?: string | number;
  slide: HeroSlide;
  index: number;
  total: number;
  uploading: boolean;
  onUpdate: (id: string, field: keyof HeroSlide, value: string) => void;
  onDelete: (id: string) => void;
  onUploadImage: (id: string, file: File) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Gambar */}
      <div className="relative aspect-[21/9] bg-slate-100">
        {slide.imageUrl ? (
          <img src={slide.imageUrl} alt={slide.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-slate-300">
            <ImagePlus size={32} />
            <span className="text-xs">Belum ada gambar</span>
          </div>
        )}

        {/* Upload overlay */}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Loader2 size={28} className="animate-spin text-white" />
          </div>
        )}

        {/* Tombol ganti/upload gambar */}
        <div className="absolute bottom-3 right-3 flex gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="rounded-lg bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur-sm hover:bg-white transition-colors disabled:opacity-50"
          >
            <ImagePlus size={14} className="inline mr-1" />
            {slide.imageUrl ? 'Ganti Foto' : 'Upload Foto'}
          </button>
          {total > 1 && (
            <button
              type="button"
              onClick={() => onDelete(slide.id)}
              className="rounded-lg bg-rose-500/90 px-3 py-1.5 text-xs font-semibold text-white shadow-sm backdrop-blur-sm hover:bg-rose-600 transition-colors"
            >
              <Trash2 size={14} className="inline mr-1" />
              Hapus
            </button>
          )}
        </div>

        {/* Badge nomor slide */}
        <div className="absolute top-3 left-3 rounded-md bg-black/60 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-sm">
          Slide {index + 1} / {total}
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/mp4,video/quicktime"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onUploadImage(slide.id, f);
            e.target.value = '';
          }}
        />
      </div>

      {/* Form fields — langsung edit di bawah gambar */}
      <div className="space-y-3 p-4">
        <div>
          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Judul
          </label>
          <input
            type="text"
            value={slide.title}
            onChange={(e) => onUpdate(slide.id, 'title', e.target.value)}
            placeholder="Contoh: GOTONG ROYONG BENERIN 1000 SEKOLAH"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-300 placeholder:font-normal focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Deskripsi
          </label>
          <textarea
            rows={2}
            value={slide.subtitle}
            onChange={(e) => onUpdate(slide.id, 'subtitle', e.target.value)}
            placeholder="Contoh: Membangun harapan dan masa depan anak Indonesia..."
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 outline-none placeholder:text-slate-300 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Video URL (Supabase/External)
          </label>
          <input
            type="text"
            value={slide.videoUrl || ''}
            onChange={(e) => onUpdate(slide.id, 'videoUrl', e.target.value)}
            placeholder="Contoh: https://.../hero.mp4"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-300 placeholder:font-normal focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
          />
        </div>
      </div>
    </div>
  );
}

/* ─────────── Main Manager ─────────── */

export default function AdminHeroManager() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const loadHero = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const content = await fetchHeroContent();
      setSlides(content.slides);
    } catch (err) {
      logError('AdminHeroManager.load', err);
      setError('Gagal memuat data Hero.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHero();
  }, [loadHero]);

  function updateSlide(id: string, field: keyof HeroSlide, value: string) {
    setSlides((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  }

  function addSlide() {
    setSlides((prev) => [...prev, createEmptySlide()]);
  }

  function deleteSlide(id: string) {
    if (slides.length <= 1) {
      setError('Minimal 1 slide harus ada.');
      return;
    }
    if (!window.confirm('Yakin hapus slide ini?')) return;
    
    // Delete from storage
    const slide = slides.find((s) => s.id === id);
    if (slide && slide.imageUrl) {
      import('../../lib/supabase/storage').then((m) => {
        m.deleteFilesFromStorage([slide.imageUrl]).catch(err => logError('AdminHeroManager.deleteStorage', err));
      });
    }

    setSlides((prev) => prev.filter((s) => s.id !== id));
  }

  async function handleUploadImage(slideId: string, file: File) {
    setUploadingId(slideId);
    setError(null);
    try {
      const slide = slides.find((s) => s.id === slideId);
      const oldUrl = slide?.imageUrl;

      const url = await uploadAdminImage(file, 'hero');
      updateSlide(slideId, 'imageUrl', url);

      // Delete old image from storage
      if (oldUrl) {
        import('../../lib/supabase/storage').then((m) => {
          m.deleteFilesFromStorage([oldUrl]).catch(err => logError('AdminHeroManager.deleteOldStorage', err));
        });
      }
    } catch (err) {
      logError('AdminHeroManager.upload', err);
      setError(err instanceof Error ? err.message : 'Gagal upload gambar.');
    } finally {
      setUploadingId(null);
    }
  }

  async function handleSave() {
    setNotice(null);
    setError(null);

    // Validasi
    const invalid = slides.find((s) => !s.title.trim() || (!s.imageUrl.trim() && !s.videoUrl?.trim()));
    if (invalid) {
      setError('Setiap slide harus punya judul dan setidaknya satu media (gambar atau video).');
      return;
    }

    setSaving(true);
    try {
      const { error: saveErr } = await saveHeroContent({ slides });
      if (saveErr) throw saveErr;
      setNotice('Hero berhasil disimpan! Perubahan langsung tampil di Beranda.');
    } catch (err) {
      logError('AdminHeroManager.save', err);
      setError('Gagal menyimpan. Coba lagi.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <Loader2 className="mx-auto h-5 w-5 animate-spin text-slate-400" />
        <p className="mt-2 text-sm text-slate-500">Memuat Hero...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Hero Beranda</h2>
          <p className="text-sm text-slate-500">Gambar & teks yang muncul pertama kali saat pengunjung membuka website.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={addSlide}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Plus size={16} /> Tambah
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-zinc-950 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Simpan
          </button>
        </div>
      </div>

      {/* Info EduXplore */}
      <div className="flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800">
        <span className="text-lg">💡</span>
        <p>Program EduXplore yang dicentang <strong>"Tampilkan di Hero Beranda"</strong> akan otomatis muncul di slide paling depan. Kelola di seksi <strong>Program EduXplore</strong> di bawah.</p>
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

      {/* Slide Cards — Inline Editing */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {slides.map((slide, i) => (
          <SlideCard
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

      {slides.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 py-10 text-center">
          <ImagePlus size={28} className="mx-auto text-slate-300" />
          <p className="mt-2 text-sm text-slate-500">Belum ada slide. Klik "Tambah" di atas.</p>
        </div>
      )}
    </div>
  );
}
