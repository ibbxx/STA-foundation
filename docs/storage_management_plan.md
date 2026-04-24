# Implementation Plan: Adaptive Storage Management

> **Tujuan**: Menghemat kapasitas Storage Supabase Free Tier (1GB) dengan menerapkan kompresi gambar otomatis sebelum upload dan penghapusan file otomatis saat data dihapus dari database.

---

## Audit Kondisi Saat Ini

### Tabel yang Menyimpan URL Gambar di Database
| Tabel | Kolom | Tipe | Bucket Target |
|---|---|---|---|
| `campaigns` | `image_url` | `string \| null` | `campaign-assets` |
| `campaigns` | `images` | `string[] \| null` | `campaign-assets` |
| `campaign_updates` | `image_url` | `string \| null` | `campaign-assets` |
| `school_reports` | `image_urls` | `Json (string[])` | `site-media` |

### Fungsi Delete yang Sudah Ada (Tanpa Storage Cleanup)
| File | Fungsi | Menghapus dari Tabel |
|---|---|---|
| `AdminCampaigns.tsx` | `handleDeleteCampaign()` | `campaigns` (+ cek donasi dulu) |
| `AdminContent.tsx` | `handleDelete(program)` | `programs` (tidak ada gambar) |
| `AdminSettings.tsx` | `handleDelete(entry)` | `site_content` (tidak ada gambar) |

### Masalah
1. `handleDeleteCampaign()` menghapus data dari DB tapi **tidak menghapus** file gambar dari bucket `campaign-assets`.
2. Tidak ada kompresi gambar — foto HP 5MB langsung masuk ke bucket, menghabiskan jatah 1GB dengan cepat.
3. Tidak ada validasi tipe file — user bisa upload `.png`, `.bmp`, atau file lain yang boros kapasitas.

---

## Fase 1: Kompresi & Validasi Gambar Sebelum Upload

### 1.1 Install Dependency
```bash
npm install browser-image-compression
```

### 1.2 Modifikasi `supabase-storage.ts`
Tambahkan fungsi helper `compressImage()` dan integrasikan ke `uploadFileToStorage()`.

**Logika:**
```
1. Terima File dari input/dropzone
2. Validasi tipe file (hanya .jpg, .jpeg, .webp — tolak .png dan lainnya)
3. Validasi ukuran mentah (tolak jika > 5MB sebelum kompresi)
4. Kompres menggunakan browser-image-compression:
   - maxSizeMB: 0.4 (400KB target)
   - maxWidthOrHeight: 1920 (resolusi cukup untuk web)
   - useWebWorker: true (tidak freeze UI)
   - fileType: 'image/webp' (konversi otomatis ke webp)
5. Upload file hasil kompresi ke Supabase Storage
6. Return public URL
```

**File yang diubah:**
- `src/lib/supabase-storage.ts` — Tambah `compressImage()`, ubah `uploadFileToStorage()` agar memamggil kompresi dulu.

**Estimasi dampak:**
- Foto 4MB → ~300KB (penghematan ~92%)
- Kapasitas efektif: dari ~200 foto menjadi ~3.000+ foto dalam 1GB

### 1.3 Konstanta Validasi
Tambahkan ke `supabase-storage.ts`:
```typescript
const ALLOWED_TYPES = ['image/jpeg', 'image/webp'];
const MAX_RAW_SIZE_MB = 5;
const COMPRESS_TARGET_MB = 0.4;
const MAX_DIMENSION = 1920;
```

---

## Fase 2: Utility Hapus File dari Storage

### 2.1 Tambah Fungsi `deleteFilesFromStorage()` di `supabase-storage.ts`

**Logika:**
```
1. Terima array of public URLs
2. Untuk setiap URL:
   a. Parse URL untuk mendapatkan bucket name dan file path
      Contoh URL: https://xxx.supabase.co/storage/v1/object/public/campaign-assets/campaigns/123-abc.webp
      → bucket: "campaign-assets"
      → path: "campaigns/123-abc.webp"
   b. Panggil supabase.storage.from(bucket).remove([path])
3. Return { deleted: number, failed: number }
```

**Fungsi baru:**
```typescript
export function parseStorageUrl(publicUrl: string): { bucket: string; path: string } | null
export async function deleteFilesFromStorage(urls: string[]): Promise<{ deleted: number; failed: number }>
```

---

## Fase 3: Integrasikan Penghapusan File ke Delete Handlers

### 3.1 `AdminCampaigns.tsx` → `handleDeleteCampaign()`

Saat ini alurnya:
```
1. Konfirmasi user
2. Cek apakah ada donasi terkait
3. DELETE dari tabel campaigns
4. Refresh UI
```

Alur baru:
```
1. Konfirmasi user
2. Cek apakah ada donasi terkait
3. Kumpulkan semua URL gambar:
   - selectedCampaign.images (array)
   - selectedCampaign.image_url (single)
4. Ambil semua campaign_updates yang punya image_url:
   SELECT image_url FROM campaign_updates WHERE campaign_id = X AND image_url IS NOT NULL
5. Gabung semua URL menjadi satu array
6. DELETE dari tabel campaigns (CASCADE akan menghapus campaign_updates)
7. Panggil deleteFilesFromStorage(allUrls)
8. Refresh UI
```

**Catatan penting:** Penghapusan file dilakukan **SETELAH** database berhasil dihapus, karena:
- Jika DB gagal dihapus → file tetap aman, tidak ada data yatim.
- Jika file gagal dihapus → data sudah bersih, file yatim bisa dibersihkan nanti (lebih aman).

### 3.2 Pergantian Gambar saat Edit Campaign

Saat admin mengedit campaign dan **mengganti** gambar lama dengan gambar baru:
```
1. Simpan daftar URL gambar SEBELUM edit (dari selectedCampaign.images)
2. Setelah submit berhasil, bandingkan URL lama vs URL baru
3. URL yang ada di "lama" tapi tidak ada di "baru" = file yang harus dihapus
4. Panggil deleteFilesFromStorage(removedUrls)
```

---

## Fase 4: Storage Policy di Supabase (SQL)

### 4.1 Buat Bucket (Jika Belum Ada)
Jalankan query berikut di **Supabase SQL Editor**:

```sql
-- ============================================
-- STORAGE BUCKET SETUP
-- Jalankan di Supabase SQL Editor
-- ============================================

-- 1. Buat bucket "campaign-assets" (public, untuk gambar campaign)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'campaign-assets',
  'campaign-assets',
  true,
  2097152,  -- 2MB limit per file (sudah dikompres di frontend)
  ARRAY['image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/jpeg', 'image/webp'];

-- 2. Buat bucket "site-media" (public, untuk gambar hero, program, laporan)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'site-media',
  'site-media',
  true,
  2097152,
  ARRAY['image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/jpeg', 'image/webp'];
```

### 4.2 RLS Policy untuk Storage
```sql
-- ============================================
-- STORAGE RLS POLICIES
-- ============================================

-- Campaign Assets: Publik bisa lihat, Admin bisa upload & hapus
CREATE POLICY "Public can view campaign assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'campaign-assets');

CREATE POLICY "Authenticated users can upload campaign assets"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'campaign-assets'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Authenticated users can update campaign assets"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'campaign-assets'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Authenticated users can delete campaign assets"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'campaign-assets'
    AND auth.role() = 'authenticated'
  );

-- Site Media: Sama — publik lihat, admin kelola
CREATE POLICY "Public can view site media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'site-media');

CREATE POLICY "Authenticated users can upload site media"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'site-media'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Authenticated users can update site media"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'site-media'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Authenticated users can delete site media"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'site-media'
    AND auth.role() = 'authenticated'
  );

-- Laporan Sekolah: Publik bisa upload foto bukti (tanpa login)
CREATE POLICY "Anyone can upload school report photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'site-media'
    AND (storage.foldername(name))[1] = 'school-reports'
  );
```

---

## Fase 5: Storage Status Monitor di Admin Panel

Sudah diimplementasikan di `AdminSettings.tsx` — menampilkan status bucket `site-media` dan `campaign-assets` secara real-time dengan indikator **Active** / **Missing**.

---

## Ringkasan File yang Dimodifikasi

| # | File | Perubahan |
|---|---|---|
| 1 | `package.json` | Tambah dependency `browser-image-compression` |
| 2 | `src/lib/supabase-storage.ts` | Tambah `compressImage()`, `parseStorageUrl()`, `deleteFilesFromStorage()`, validasi tipe file |
| 3 | `src/pages/admin/AdminCampaigns.tsx` | Integrasikan `deleteFilesFromStorage()` ke `handleDeleteCampaign()` dan logika "replaced images" saat edit |

---

## Urutan Eksekusi

1. **Jalankan SQL** dari Fase 4 (buat bucket + RLS) di Supabase Dashboard terlebih dahulu.
2. **Install dependency** `browser-image-compression`.
3. **Modifikasi** `supabase-storage.ts` (kompresi + delete utility).
4. **Modifikasi** `AdminCampaigns.tsx` (hapus file saat delete/edit campaign).
5. **Tes** upload gambar baru → pastikan terkompresi → pastikan muncul di web.
6. **Tes** hapus campaign → pastikan file juga hilang dari bucket Supabase.
