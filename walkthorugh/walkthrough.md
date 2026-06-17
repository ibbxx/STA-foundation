# Walkthrough: Pendaftaran Relawan Kustom (Reguler & Beasiswa) & Otomatisasi Status Program

Dokumen ini mencatat perubahan skema database dan komponen frontend yang diimplementasikan untuk mendukung kustomisasi formulir relawan serta penjadwalan otomatisasi status program relawan.

---

## 🔍 Ringkasan Perubahan

Sistem pendaftaran relawan kini terbagi menjadi dua jalur utama: **Reguler** dan **Beasiswa**. Admin memiliki kendali penuh untuk mendesain kolom pertanyaan masing-masing jalur secara dinamis dan menjadwalkan status program agar otomatis aktif, berjalan, atau tutup berdasarkan waktu.

---

## 🛠️ Detail Implementasi

### 1. Migrasi Database (PostgreSQL)
Query migrasi berikut telah berhasil dijalankan pada database remote Supabase:
*   **Tabel `volunteer_registrations`:**
    *   Menambahkan kolom `registration_type` (`text` dengan check constraint `reguler` atau `beasiswa` dan default `'reguler'`).
    *   Membuat index pencarian `idx_volunteer_registrations_type_program` pada `(program_id, registration_type)` untuk optimasi filter kelompok jalur.
*   **Tabel `volunteer_programs`:**
    *   Menambahkan kolom `registration_start` (`timestamptz`).
    *   Menambahkan kolom `registration_end` (`timestamptz`).
    *   Menambahkan kolom `program_end` (`timestamptz`).

File Migrasi: [20260617134800_add_registration_type.sql](file:///Users/ibnufajar/Documents/project/sekolah-tanah-air/supabase/migrations/20260617134800_add_registration_type.sql)

### 2. Integrasi Tipe TypeScript
File Modifikasi: [types.ts](file:///Users/ibnufajar/Documents/project/sekolah-tanah-air/src/lib/supabase/types.ts)
*   Menyelaraskan properti `registration_type` di type `VolunteerRegistrationRow`, `Insert`, dan `Update`.
*   Menambahkan properti tanggal penjadwalan `registration_start`, `registration_end`, dan `program_end` ke type `VolunteerProgramRow`, `Insert`, dan `Update`.

### 3. Logika Otomatisasi Status & Helper
File Modifikasi: [eduxplore.ts](file:///Users/ibnufajar/Documents/project/sekolah-tanah-air/src/lib/eduxplore.ts)
*   Membuat fungsi helper `getVolunteerProgramStatus(program)` untuk menghitung status secara dinamis berdasarkan waktu saat ini:
    *   Sebelum `registration_start` -> `closed`
    *   Range `registration_start` s.d. `registration_end` -> `open`
    *   Range `registration_end` s.d. `program_end` -> `ongoing`
    *   Setelah `program_end` -> `closed`
    *   Jika salah satu tanggal kosong -> fallback ke kolom status manual (`program.status`).

### 4. Supabase Edge Function
File Modifikasi: [submit-volunteer-registration index.ts](file:///Users/ibnufajar/Documents/project/sekolah-tanah-air/supabase/functions/submit-volunteer-registration/index.ts)
*   Edge Function membaca `registration_type` dari payload FormData dan menyimpannya ke database.
*   Mendukung kalkulasi status buka pendaftaran secara real-time berbasis tanggal range.
*   Bypass validasi tipe file gambar jika file yang diunggah berupa dokumen PDF (seperti CV, Motivation Letter, atau Social Project Proposal untuk beasiswa) dengan batas ukuran maksimal 10MB.

### 5. Formulir Pendaftaran Publik
File Modifikasi: [EduxploreForm.tsx](file:///Users/ibnufajar/Documents/project/sekolah-tanah-air/src/components/public/eduxplore/EduxploreForm.tsx)
*   Menambahkan Tab Selector premium ("Jalur Reguler" vs "Jalur Beasiswa") untuk beralih jalur pendaftaran.
*   Merender field input kustom secara dinamis sesuai struktur template kustom jalur terpilih.
*   Mengimplementasikan teknik keying React (`key={registrationType}`) pada form body agar ketika pengguna berpindah tab jalur pendaftaran, seluruh modul form (Zod validator schema, React Hook Form registers, input values, dan error status) di-reset secara total untuk menghindari tabrakan validasi.

### 6. Desain Formulir Dinamis di Admin Panel
File Modifikasi: [AdminVolunteerPrograms.tsx](file:///Users/ibnufajar/Documents/project/sekolah-tanah-air/src/components/admin/AdminVolunteerPrograms.tsx)
*   Menambahkan input datetime-local untuk mempermudah admin menentukan tanggal pembukaan, penutupan pendaftaran, dan tanggal berakhirnya kegiatan relawan.
*   UI Form Builder dipisahkan menggunakan tab "Reguler" dan "Beasiswa", di mana admin bisa menyusun, menghapus, merelasikan, dan mengurutkan pertanyaan formulir kustom untuk masing-masing jalur secara terpisah.
*   Tabel daftar program relawan kini menampilkan status real-time hasil kalkulasi tanggal dengan label indikator `(Otomatis)`.

### 7. Review Data & Pengelompokan Pendaftar
File Modifikasi: [AdminEduxplore.tsx](file:///Users/ibnufajar/Documents/project/sekolah-tanah-air/src/pages/admin/AdminEduxplore.tsx)
*   **Filter Kategori Program (Program Type)**: Menambahkan dropdown filter baru untuk memisahkan data berdasarkan Kategori Program (Jelajah Tanah Air, EduXplore, Bangun 1000 Asa).
*   **Penyederhanaan UI Filter**: Dropdown pencarian "Program Spesifik" dihapus karena tidak terlalu sering digunakan. Layout filter disederhanakan menjadi satu baris flex horizontal yang memuat 3 filter utama (Kategori Program, Status, dan Jalur).
*   Menambahkan dropdown filter jalur ("Semua Jalur", "Reguler", "Beasiswa") pada daftar pendaftar.
*   Menampilkan badge pengenal visual jalur di samping nama pendaftar.
*   **Update Pengelompokan**: Kartu statistik di bagian atas (Total, Perlu Review, Diterima, Ditolak) kini menghitung angka secara dinamis berdasarkan kategori program dan filter jalur pendaftaran yang sedang aktif.
*   **Visual Badge Program**: Menampilkan label program kustom di bawah nama pendaftar pada daftar baris sebelah kiri agar pendaftar langsung dapat dikategorikan secara jelas saat filter aktif.
*   Panel detail sebelah kanan merender jawaban secara dinamis berdasarkan skema formulir jalur pendaftaran pendaftar tersebut, serta secara otomatis meminta signed URL untuk mendownload berkas kustom (seperti CV/Proposal PDF atau bukti transfer gambar).
*   Export CSV menggabungkan daftar kolom dari kedua jalur pendaftaran untuk menghasilkan file laporan yang seragam.

---

## 🚀 Status Uji Coba & Kompilasi
*   **Database Migration Status:** Sukses dijalankan di remote PostgreSQL.
*   **Edge Function Deployment:** Sukses di-deploy ke remote Supabase project.
*   **TypeScript Verification:** Menjalankan pengecekan tipe statis dan linting proyek untuk memastikan kepatuhan 100% bebas dari compile errors.
