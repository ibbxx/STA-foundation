import { useEffect, useState } from 'react';
import { ImagePlus, Loader2, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import { fetchSiteContentRows, upsertSiteContent } from '../../lib/admin-repository';
import { uploadAdminImage } from '../../lib/supabase-storage';
import { logError } from '../../lib/error-logger';

const PAGES_CONFIG = [
  { key: 'hero_tentang_kami', label: 'Tentang Kami', description: 'Hero halaman profil yayasan.' },
  { key: 'hero_events', label: 'Events', description: 'Hero halaman daftar kegiatan.' },
  { key: 'hero_laporkan', label: 'Laporkan Sekolah', description: 'Hero halaman formulir pelaporan.' },
  { key: 'hero_kontak', label: 'Hubungi Kami', description: 'Hero halaman informasi kontak.' },
  { key: 'modal_lapor_sekolah', label: 'Banner Modal Lapor', description: 'Gambar samping pada modal pelaporan.' },
];

export default function AdminOtherPagesHero() {
  const [data, setData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const { data: rows } = await fetchSiteContentRows();
        if (rows) {
          const mapped: Record<string, string> = {};
          PAGES_CONFIG.forEach(config => {
            const row = rows.find((r: any) => r.key === config.key);
            if (row && (row as any).value) {
              try {
                const val = (row as any).value;
                const parsed = typeof val === 'string' ? JSON.parse(val) : val;
                mapped[config.key] = parsed.imageUrl || '';
              } catch (e) {
                mapped[config.key] = '';
              }
            }
          });
          setData(mapped);
        }
      } catch (err) {
        logError('AdminOtherPagesHero.load', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  async function handleUpload(key: string, file: File) {
    setUploadingKey(key);
    setError(null);
    setNotice(null);
    try {
      const oldUrl = data[key];
      const url = await uploadAdminImage(file, 'hero');
      setData(prev => ({ ...prev, [key]: url }));

      if (oldUrl) {
        import('../../lib/supabase-storage').then((m) => {
          m.deleteFilesFromStorage([oldUrl]).catch(err => logError('AdminOtherPagesHero.deleteOldStorage', err));
        });
      }
    } catch (err) {
      logError('AdminOtherPagesHero.upload', err);
      setError('Gagal mengunggah gambar.');
    } finally {
      setUploadingKey(null);
    }
  }

  async function handleSave() {
    setSaving(true);
    setNotice(null);
    setError(null);
    try {
      const payloads = PAGES_CONFIG.map(config => ({
        key: config.key,
        value: { imageUrl: data[config.key] || '' }
      }));
      
      const { error: upsertError } = await upsertSiteContent(payloads);
      if (upsertError) throw upsertError;
      
      setNotice('Hero halaman berhasil disimpan.');
    } catch (err) {
      logError('AdminOtherPagesHero.save', err);
      setError('Gagal menyimpan perubahan.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center p-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 mt-6">
      <Loader2 size={20} className="animate-spin text-slate-400 mr-2" />
      <span className="text-sm text-slate-500 font-medium">Memuat Hero Halaman...</span>
    </div>
  );

  return (
    <div className="space-y-6 pt-6 border-t border-slate-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-md font-bold text-slate-900">Hero Halaman Lain</h3>
          <p className="text-xs text-slate-500">Sesuaikan gambar latar belakang untuk halaman-halaman statis.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-zinc-950 transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Simpan Semua Hero
        </button>
      </div>

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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {PAGES_CONFIG.map((config) => (
          <div key={config.key} className="rounded-2xl border border-slate-200 bg-white overflow-hidden flex flex-col group hover:border-slate-300 transition-colors">
            <div className="relative aspect-[16/9] bg-slate-100 overflow-hidden">
              {data[config.key] ? (
                <img src={data[config.key]} alt={config.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-slate-300">
                  <ImagePlus size={24} />
                </div>
              )}
              
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <label className="cursor-pointer px-3 py-1.5 bg-white rounded-lg text-[11px] font-bold text-slate-900 shadow-sm hover:bg-slate-50 transition-colors">
                  {uploadingKey === config.key ? 'Mengunggah...' : 'Ganti Gambar'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={!!uploadingKey}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleUpload(config.key, f);
                      e.target.value = '';
                    }}
                  />
                </label>
              </div>

              {uploadingKey === config.key && (
                <div className="absolute inset-0 bg-white/60 flex items-center justify-center backdrop-blur-[1px]">
                  <Loader2 size={20} className="animate-spin text-zinc-900" />
                </div>
              )}
            </div>
            <div className="p-3 bg-white">
              <p className="text-xs font-bold text-slate-900">{config.label}</p>
              <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{config.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
