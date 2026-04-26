# Implementasi Plan: Optimasi Hero Section (Home.tsx)

## 1. Analisis Masalah Saat Ini
*   **Text Terlalu Besar:** Ukuran font H1 saat ini mencapai `text-[3.5rem]` di layar desktop, yang membuatnya sangat mendominasi layar.
*   **Posisi Menutupi Subjek:** Kontainer saat ini menggunakan `items-center` (berada tepat di tengah layar secara vertikal) dan lebar `max-w-3xl` yang memanjang ke tengah, sehingga menutupi detail penting dari foto hero (wajah subjek atau aksi di dalam foto).
*   **Ruang Kosong (White Space):** Penempatan di tengah menyisakan ruang kosong yang canggung di bagian bawah atau pinggir.

## 2. Rencana Perbaikan (Tanpa Mengubah Struktur Fungsional)

### A. Reposisi Layout (Geser ke Bawah Kiri)
Kita akan memindahkan blok teks agar menepi ke bagian **Kiri Bawah** (Bottom-Left).
*   Ubah `items-center` menjadi `items-end` atau atur *padding-top* yang lebih besar agar teks "jatuh" ke area bawah gambar yang biasanya lebih gelap (karena ada gradient `bg-gradient-to-t`).
*   Ini akan membiarkan 2/3 layar bagian atas dan tengah benar-benar bersih agar keindahan foto hero bisa dinikmati secara penuh.

### B. Penyusutan Skala Tipografi
Kita akan mengecilkan ukuran teks agar lebih proporsional, elegan, dan terlihat lebih *NGO-Premium*.
*   **H1 (Judul):** Turunkan dari `lg:text-[3.5rem]` menjadi maksimal `lg:text-4xl` atau `lg:text-[2.75rem]`.
*   **P (Deskripsi):** Kurangi `max-w-xl` menjadi `max-w-lg`. Perkecil font dari `md:text-lg` menjadi konstan di `text-sm` atau `text-base` dengan `leading-relaxed`.

### C. Refactor Class Tailwind (Contoh Bayangan)
*   *Sebelum:* `<div className="relative z-10 mx-auto flex min-h-[100svh] max-w-7xl items-center...">`
*   *Sesudah:* `<div className="relative z-10 mx-auto flex min-h-[100svh] max-w-7xl items-end pb-32...">`
*   *Teks H1:* `<h1 className="text-2xl font-black sm:text-3xl lg:text-4xl max-w-2xl">...</h1>`

## 3. Langkah Eksekusi Berikutnya
1. Modifikasi `src/pages/public/Home.tsx` di bagian Hero (Baris ~120).
2. Mengecilkan elemen kontainer teks ke `max-w-2xl`.
3. Mengubah perataan vertikal agar condong ke bawah.
4. Menyesuaikan tombol CTA agar ukurannya sepadan dengan teks yang baru.
