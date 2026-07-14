# 🔍 Analisis Mendalam & Daftar Perbaikan Keamanan (Akan Kita Perbaiki)

Berikut adalah daftar temuan bug dan celah keamanan pada project Sekolah Tanah Air yang telah diidentifikasi dan perlu diperbaiki.

---

## 1. 🚨 Temuan CRITICAL (Harus Diperbaiki Segera)

### A. Kebocoran `TURNSTILE_SECRET_KEY` di `.env` lokal
*   **Lokasi File:** `.env` (Baris 6)
*   **Masalah:** Meskipun variabel ini tidak memiliki prefix `VITE_` (sehingga tidak di-bundle oleh Vite ke client), menyimpan Turnstile Secret Key di file `.env` root sangat berisiko. Jika developer tidak sengaja menambahkan prefix `VITE_`, key rahasia ini akan langsung bocor ke client.
*   **Solusi:** Hapus `TURNSTILE_SECRET_KEY` dari file `.env` lokal. Pastikan secret ini hanya diset secara aman di environment Supabase Edge Functions menggunakan perintah:
    ```bash
    supabase secrets set TURNSTILE_SECRET_KEY="your-secret-key"
    ```

### B. Referensi ke Fungsi yang Sudah Di-Drop (`public.is_admin()`) pada Migration Terbaru
*   **Lokasi File:** `supabase/migrations/20260714090000_manual_donation_payment_settings.sql` (Baris 19, 26, 33, 41)
*   **Masalah:** Migration sebelumnya (`20260705070000_secure_is_admin_function.sql`) telah men-drop fungsi `public.is_admin()` dan memindahkannya ke private schema sebagai `private.is_admin()` demi alasan keamanan. Namun, migration terbaru (`20260714090000`) masih menggunakan schema lama `public.is_admin()` pada policy bucket `donation-proofs`. Ini akan menyebabkan error saat migration dijalankan di database bersih.
*   **Solusi:** Ubah seluruh instansi `public.is_admin()` pada file migration `20260714090000` menjadi `private.is_admin()`.

### C. Duplikasi & Inkonsistensi Fungsi `is_admin`
*   **Masalah:** Terdapat fungsi `public.is_admin()` yang didefinisikan kembali di file consolidated schema sebagai `SECURITY INVOKER` (yang kurang aman karena diekspos melalui REST API). Sementara migration `070000` mendefinisikannya di `private.is_admin()` sebagai `SECURITY DEFINER`.
*   **Solusi:** Konsisten menggunakan `private.is_admin()`.

---

## 2. ⚠️ Temuan HIGH (Risiko Signifikan)

### A. Validasi File Upload pada Registrasi Relawan Kurang Ketat
*   **Lokasi File:** `supabase/functions/submit-volunteer-registration/index.ts`
*   **Masalah:** Proses upload file loop melalui form data tanpa melakukan whitelist terhadap key name/field name yang valid. Penyerang dapat mengupload file dengan key arbitrer (seperti `../../configs`) untuk memanipulasi folder tujuan di storage. Selain itu, belum ada pengecekan magic bytes (tipe konten asli file) di sisi server untuk mendeteksi file berbahaya (malware disguised as PDF/JPG).
*   **Solusi:** 
    *   Lakukan whitelist terhadap field upload yang sah (`bukti_dp`, `bukti_follow_ig`, `foto_id_card`).
    *   Batasi jumlah maksimum file yang dapat diterima dalam satu request.

### B. CORS Origin Bersifat Statis & Memblokir Jika Env Tidak Ada
*   **Lokasi File:** `supabase/functions/_shared/http.ts`
*   **Masalah:** Variabel `corsHeaders` dievaluasi langsung saat module dimuat. Jika variabel environment `ALLOWED_ORIGIN` lupa dikonfigurasi di production, seluruh Edge Function akan mengalami error HTTP 500 secara global.
*   **Solusi:** Buat evaluasi CORS secara dinamis per request, mencocokkan asal request (`Origin` header) dengan daftar whitelist domain yang diizinkan.

### C. Tidak Ada Rate Limiting di Sisi Frontend
*   **Masalah:** Meskipun database dan Edge Functions memiliki limitasi internal, frontend tidak membatasi seberapa sering user dapat menekan tombol submit. Penyerang dapat memicu Turnstile check dan upload file secara terus-menerus sebelum diblokir oleh DB, menghabiskan kuota Turnstile dan bandwidth storage.
*   **Solusi:** Implementasikan debouncing/throttling pada tombol submit form di frontend dan simpan timestamp submit terakhir di `localStorage`.

---

## 3. 🟡 Temuan MEDIUM (Bug & Peningkatan Sistem)

### A. Bucket `donation-proofs` Tidak Memiliki Policy Upload untuk User Anonim
*   **Lokasi File:** `supabase/migrations/20260714090000_manual_donation_payment_settings.sql`
*   **Masalah:** Seluruh RLS policy pada bucket `donation-proofs` memerlukan status `authenticated` dan status admin (`is_admin()`). Akibatnya, user/donatur biasa yang bertindak secara anonim atau belum login tidak akan bisa mengupload bukti transfer pembayaran mereka.
*   **Solusi:** Buat policy insert khusus untuk bucket `donation-proofs` yang mengizinkan operasi `INSERT` (upload) oleh anonim dengan batasan ukuran file yang ketat.

### B. Foto Laporan Sekolah Disimpan di Bucket Publik
*   **Lokasi File:** `supabase/functions/submit-school-report/index.ts` (menggunakan bucket `site-media`)
*   **Masalah:** Foto laporan kondisi sekolah disimpan di bucket `site-media` yang bersifat publik. Siapa saja yang memiliki URL file tersebut dapat mengaksesnya secara langsung tanpa autentikasi. Laporan sekolah bisa saja mengandung informasi sensitif atau foto anak-anak.
*   **Solusi:** Pindahkan ke bucket privat (misalnya `school-reports-private`) dan gunakan signed URL berdurasi singkat jika admin ingin melihat foto tersebut di dashboard admin.

### C. Penggunaan MD5 Hash pada Leaderboard
*   **Masalah:** Leaderboard menggunakan query MD5 dari email/nama sebagai identifier unik. MD5 mudah di-brute force menggunakan rainbow tables untuk menemukan email asli donatur.
*   **Solusi:** Gunakan hash SHA-256 yang lebih kuat atau buat kolom identifier acak (UUID) pada tabel donasi/donatur.

### D. Fallback Key pada Vercel Keepalive API
*   **Lokasi File:** `api/keepalive.js`
*   **Masalah:** Jika `SUPABASE_SERVICE_ROLE_KEY` tidak dikonfigurasi di Vercel, API akan fallback menggunakan `VITE_SUPABASE_ANON_KEY`. Anon key tidak memiliki izin untuk mengeksekusi fungsi `refresh_leaderboard()`, sehingga proses refresh leaderboard akan gagal tanpa memunculkan error yang jelas.
*   **Solusi:** Pastikan runtime memverifikasi keberadaan service role key sebelum menjalankan rpc refresh leaderboard.

### E. Penggunaan `@ts-nocheck` di Seluruh Edge Functions
*   **Masalah:** Menghilangkan fitur pengecekan tipe data TypeScript sehingga bug tipe data hanya akan terdeteksi saat runtime di production.
*   **Solusi:** Hapus `@ts-nocheck` secara bertahap dan definisikan interface/tipe data yang sesuai untuk payload request dan response.

---

## 4. 🟢 Temuan LOW & Praktik Terbaik

### A. CSP `'unsafe-inline'` pada Script Vercel
*   **Lokasi File:** `vercel.json`
*   **Masalah:** Menggunakan `'unsafe-inline'` di dalam CSP `script-src` mengurangi efektivitas CSP dalam mencegah serangan Cross-Site Scripting (XSS).
*   **Solusi:** Gunakan hash-based atau nonce-based CSP untuk script eksternal.

---

## 📊 Matriks Skala Prioritas Perbaikan

| Prioritas | Masalah | Dampak Keamanan | Estimasi Waktu Kerja |
|---|---|---|---|
| 🔴 **1** | Hapus `TURNSTILE_SECRET_KEY` dari `.env` lokal | Kebocoran key rahasia jika bundle bocor | 5 Menit |
| 🔴 **2** | Perbaiki `public.is_admin()` -> `private.is_admin()` di migration `20260714` | Broken migrations & database | 10 Menit |
| 🔴 **3** | Rapikan fungsi `is_admin` di database | Inkonsistensi otorisasi admin | 30 Menit |
| 🟠 **4** | Whitelist key file upload di Edge Function relawan | Upload file ilegal / bypass storage folder | 1 Jam |
| 🟠 **5** | Implementasikan dynamic CORS origin check | HTTP 500 jika env production tidak diset | 30 Menit |
| 🟡 **6** | Pindahkan foto sekolah (`school_reports`) ke bucket privat | Kebocoran data sensitif masyarakat | 1 Jam |
| 🟡 **7** | Tambahkan policy upload anonim untuk bukti donasi | Donatur tidak bisa upload bukti transfer | 45 Menit |
