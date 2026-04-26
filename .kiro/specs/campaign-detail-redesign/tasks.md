# Implementation Plan: Campaign Detail Redesign

## Overview

Redesign halaman `CampaignDetail.tsx` secara incremental — mulai dari fondasi visual (background, typography, brand colors), lalu memperbaiki setiap section secara berurutan (carousel, donation card, tabs, trust banner, sticky bar), dan diakhiri dengan property-based tests untuk fungsi utility. Semua perubahan dilakukan inline dalam satu file tanpa membuat komponen terpisah.

## Tasks

- [x] 1. Terapkan brand colors dan background halaman
  - Ganti `bg-gray-50` pada container utama menjadi `bg-brand-cream`
  - Pastikan `pb-36 lg:pb-24` tetap ada untuk ruang sticky bottom bar
  - Verifikasi class `font-display` sudah dipakai pada elemen `<h1>` judul campaign
  - Pastikan ukuran judul menggunakan `text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight`
  - _Requirements: 1.1, 1.2, 9.1, 9.2_

- [x] 2. Perbaiki Image Carousel
  - [x] 2.1 Tambahkan `role="region"` dan `aria-label="Galeri foto campaign"` pada container carousel
    - Pastikan setiap `<OptimizedImage>` memiliki `alt` yang deskriptif: `${campaign.title} - Foto ${idx + 1}`
    - _Requirements: 2.1, 9.3, 9.5_

  - [x] 2.2 Perbaiki ukuran tombol navigasi prev/next agar memenuhi touch target minimal 44×44px
    - Ubah class tombol menjadi `h-11 w-11` (44px) di semua breakpoint
    - Pastikan `aria-label="Foto sebelumnya"` dan `aria-label="Foto berikutnya"` sudah ada
    - _Requirements: 2.2, 7.5, 9.3_

  - [x] 2.3 Pastikan dot indicator tersembunyi saat hanya ada satu gambar
    - Kondisi `hasMultipleImages` sudah ada — verifikasi logika `bannerImages.length > 1` benar
    - Dot aktif: `w-6 bg-white`, dot inaktif: `w-2 bg-white/60`
    - _Requirements: 2.2, 2.3_

  - [ ]* 2.4 Tulis property test untuk visibilitas navigasi carousel (Property 6)
    - **Property 6: Visibilitas navigasi carousel ditentukan oleh jumlah gambar**
    - **Validates: Requirements 2.2, 2.3**
    - Gunakan fast-check untuk generate array gambar dengan panjang 1 dan > 1
    - Tag: `// Feature: campaign-detail-redesign, Property 6: carousel navigation visibility`

  - [ ]* 2.5 Tulis property test untuk alt text gambar carousel (Property 7)
    - **Property 7: Setiap gambar carousel memiliki alt text yang tidak kosong**
    - **Validates: Requirements 9.5**
    - Tag: `// Feature: campaign-detail-redesign, Property 7: carousel image alt text`

- [x] 3. Perbaiki Donation Sidebar dan Mobile Donation Card
  - [x] 3.1 Update progress bar menggunakan brand colors
    - Track: `h-2.5 rounded-full bg-gray-100`
    - Fill: `h-full rounded-full bg-brand-green transition-all duration-700`
    - Terapkan pada sidebar desktop dan mobile card
    - _Requirements: 3.3, 9.1_

  - [x] 3.2 Update teks jumlah terkumpul menggunakan `text-brand-green` dan `font-display`
    - Sidebar desktop: `text-4xl font-bold text-brand-green font-display`
    - Mobile card: `text-3xl font-bold text-brand-green`
    - _Requirements: 3.1, 3.9, 9.1, 9.2_

  - [x] 3.3 Perbaiki teks "Menyusul" menjadi "Jadwal menyusul" saat `daysLeft === null`
    - Terapkan pada sidebar desktop dan mobile card
    - _Requirements: 3.5_

  - [x] 3.4 Update CTA button menggunakan `bg-brand-green hover:bg-[#0d4d38]`
    - Terapkan pada sidebar desktop, mobile card, dan sticky bottom bar
    - Pastikan `transition-all duration-200` ada pada tombol
    - _Requirements: 3.6, 9.1_

  - [ ]* 3.5 Tulis property test untuk `calculateProgress` (Property 1)
    - **Property 1: Progress selalu dalam rentang valid [0, 100]**
    - **Validates: Requirements 3.3**
    - Tag: `// Feature: campaign-detail-redesign, Property 1: progress range`

  - [ ]* 3.6 Tulis property test untuk `calculateProgress` saat current ≥ target (Property 2)
    - **Property 2: Progress mencapai maksimum saat current ≥ target**
    - **Validates: Requirements 3.3**
    - Tag: `// Feature: campaign-detail-redesign, Property 2: progress maximum`

  - [ ]* 3.7 Tulis property test untuk `formatCurrency` (Property 3)
    - **Property 3: Format mata uang selalu menghasilkan string IDR valid**
    - **Validates: Requirements 3.1, 3.2**
    - Tag: `// Feature: campaign-detail-redesign, Property 3: currency format`

- [x] 4. Checkpoint — Pastikan semua tes lulus
  - Pastikan semua tes lulus, tanyakan kepada user jika ada pertanyaan.

- [x] 5. Perbaiki Content Tabs
  - [x] 5.1 Update tab active indicator menggunakan `bg-brand-green`
    - Ganti `bg-emerald-600` menjadi `bg-brand-green` pada underline tab aktif
    - Pastikan teks tab aktif menggunakan `text-brand-green`
    - Label tab dalam Bahasa Indonesia: "Deskripsi", "Update", "Donatur"
    - _Requirements: 4.1, 4.2, 4.8_

  - [x] 5.2 Update timeline dot pada Update panel menggunakan `bg-brand-green`
    - Ganti `bg-emerald-500` menjadi `bg-brand-green` pada dot timeline
    - Pastikan teks `update_type` menggunakan `text-brand-teal` (bukan `text-emerald-700`)
    - _Requirements: 4.4_

  - [x] 5.3 Update avatar donatur dan warna aksen pada Donatur panel
    - Avatar: `bg-emerald-50 text-brand-green` untuk initial letter
    - Teks jumlah donasi: `text-brand-green` (bukan `text-emerald-600`)
    - _Requirements: 4.6_

  - [ ]* 5.4 Tulis property test untuk tab switching (Property 8)
    - **Property 8: Setiap tab yang diklik menjadi aktif dan menampilkan kontennya**
    - **Validates: Requirements 4.2**
    - Tag: `// Feature: campaign-detail-redesign, Property 8: tab switching`

  - [ ]* 5.5 Tulis property test untuk kelengkapan data donatur (Property 9)
    - **Property 9: Setiap donatur dalam daftar menampilkan semua field wajib**
    - **Validates: Requirements 4.6**
    - Tag: `// Feature: campaign-detail-redesign, Property 9: donor list fields`

- [x] 6. Perbaiki Trust Banner dan Organizer Card
  - [x] 6.1 Update Trust Banner menggunakan brand colors yang konsisten
    - Background: `bg-emerald-50 border border-emerald-100`
    - Icon `ShieldCheck`: `text-brand-green`
    - Heading: `text-emerald-900`, body: `text-emerald-800`
    - _Requirements: 5.1, 5.3, 5.4_

  - [x] 6.2 Update Organizer Card dengan badge verifikasi menggunakan `brand-teal`
    - Badge "Terverifikasi": `text-brand-teal` (bukan `text-emerald-600`)
    - Icon `CheckCircle2`: `text-brand-teal`
    - _Requirements: 5.2_

- [x] 7. Perbaiki Sticky Bottom Bar dan navigasi
  - [x] 7.1 Update Sticky Bottom Bar dengan `backdrop-blur-sm` dan brand colors
    - Background: `bg-white/95 backdrop-blur-sm border-t border-gray-200`
    - Pastikan `safe-pb` padding sudah ada
    - CTA button: `bg-brand-green hover:bg-[#0d4d38]`
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 7.2 Verifikasi padding bawah container utama cukup untuk sticky bar
    - Container utama harus memiliki `pb-36 lg:pb-24`
    - _Requirements: 7.4_

  - [x] 7.3 Verifikasi breadcrumb dan back button sudah benar
    - Desktop (`sm:flex`): Beranda > Campaign > Judul Campaign dengan link yang bisa diklik
    - Mobile (`sm:hidden`): tombol "Kembali ke campaign" dengan ikon `ArrowLeft`
    - _Requirements: 6.1, 6.2, 6.3_

- [x] 8. Tulis property tests untuk fungsi utility `getDaysLeft`
  - [ ]* 8.1 Tulis property test untuk `getDaysLeft` dengan input null/undefined (Property 4)
    - **Property 4: getDaysLeft mengembalikan null untuk input null**
    - **Validates: Requirements 3.5**
    - Tag: `// Feature: campaign-detail-redesign, Property 4: getDaysLeft null input`

  - [ ]* 8.2 Tulis property test untuk `getDaysLeft` dengan tanggal masa depan (Property 5)
    - **Property 5: getDaysLeft mengembalikan nilai non-negatif untuk tanggal masa depan**
    - **Validates: Requirements 3.4**
    - Tag: `// Feature: campaign-detail-redesign, Property 5: getDaysLeft future date`

- [x] 9. Final checkpoint — Pastikan semua tes lulus
  - Pastikan semua tes lulus, tanyakan kepada user jika ada pertanyaan.

## Notes

- Tasks bertanda `*` bersifat opsional dan dapat dilewati untuk MVP yang lebih cepat
- Semua perubahan dilakukan inline dalam `src/pages/public/CampaignDetail.tsx`
- Property tests menggunakan library **fast-check** dengan minimum 100 iterasi per property
- Fungsi utility yang diuji (`calculateProgress`, `formatCurrency`, `getDaysLeft`) berada di `src/lib/utils.ts` dan `src/lib/public-campaigns.ts`
- Setiap task mereferensikan requirements spesifik untuk traceability
- Checkpoint memastikan validasi incremental sebelum melanjutkan ke section berikutnya
