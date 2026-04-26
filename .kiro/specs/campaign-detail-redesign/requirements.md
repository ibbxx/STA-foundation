# Requirements Document

## Introduction

Fitur ini adalah redesign halaman Campaign Detail (`/campaigns/:slug`) pada aplikasi donasi Sekolah Tanah Air. Halaman ini merupakan titik konversi utama — tempat pengunjung memutuskan untuk berdonasi atau tidak. Redesign bertujuan meningkatkan kepercayaan pengguna, memperjelas informasi donasi, dan memperkuat identitas visual brand (earthy green, cream, gold) yang sudah ditetapkan di design system.

Halaman saat ini sudah memiliki struktur yang baik (carousel gambar, tab konten, sidebar donasi, sticky bottom bar mobile), namun perlu ditingkatkan dari sisi visual hierarchy, keterbacaan, dan konsistensi brand.

## Glossary

- **Campaign_Detail_Page**: Halaman publik yang menampilkan detail lengkap sebuah campaign donasi, dapat diakses melalui URL `/campaigns/:slug`.
- **Donation_Sidebar**: Panel kanan (desktop) atau card (mobile) yang menampilkan ringkasan donasi, progress bar, dan tombol aksi donasi.
- **Image_Carousel**: Komponen galeri gambar campaign yang mendukung navigasi antar foto.
- **Content_Tab**: Komponen tab yang memuat tiga panel: Deskripsi, Update, dan Donatur.
- **Sticky_Bottom_Bar**: Bar aksi yang muncul di bagian bawah layar pada perangkat mobile.
- **Trust_Banner**: Elemen yang menampilkan komitmen transparansi dan verifikasi penggalang dana.
- **Progress_Bar**: Indikator visual persentase dana yang telah terkumpul dari target.
- **Breadcrumb**: Navigasi hierarki halaman (Beranda > Campaign > Judul Campaign).
- **Brand_Colors**: Palet warna utama aplikasi — `brand-green` (#115E45), `brand-teal` (#2D7C79), `brand-gold` (#D4AF37), `brand-cream` (#FBFAF8).

---

## Requirements

### Requirement 1: Visual Hierarchy dan Layout Halaman

**User Story:** Sebagai pengunjung, saya ingin melihat informasi campaign yang tersusun dengan jelas dan menarik, sehingga saya dapat dengan cepat memahami tujuan campaign dan termotivasi untuk berdonasi.

#### Acceptance Criteria

1. THE Campaign_Detail_Page SHALL menggunakan background `brand-cream` (#FBFAF8) sebagai warna dasar halaman, konsisten dengan design system aplikasi.
2. WHEN Campaign_Detail_Page dimuat, THE Campaign_Detail_Page SHALL menampilkan judul campaign menggunakan font `Plus Jakarta Sans` (font-display) dengan ukuran minimal `text-3xl` di mobile dan `text-4xl` di desktop.
3. THE Campaign_Detail_Page SHALL menerapkan layout dua kolom pada layar `lg` ke atas: kolom konten (7/12 atau 8/12) di kiri dan Donation_Sidebar (5/12 atau 4/12) di kanan.
4. THE Campaign_Detail_Page SHALL menerapkan layout satu kolom pada layar di bawah `lg`, dengan Donation_Sidebar ditampilkan sebagai card di antara Image_Carousel dan Content_Tab.
5. WHEN Campaign_Detail_Page dimuat, THE Campaign_Detail_Page SHALL menampilkan badge kategori campaign dengan warna `brand-green` atau `emerald` yang konsisten dengan palet brand.

---

### Requirement 2: Image Carousel

**User Story:** Sebagai pengunjung, saya ingin melihat foto-foto campaign dengan tampilan yang menarik dan mudah dinavigasi, sehingga saya mendapat gambaran visual yang jelas tentang campaign tersebut.

#### Acceptance Criteria

1. THE Image_Carousel SHALL menampilkan gambar campaign dengan rasio aspek `16:9` pada semua ukuran layar.
2. WHEN campaign memiliki lebih dari satu gambar, THE Image_Carousel SHALL menampilkan tombol navigasi (prev/next) dan dot indicator.
3. WHEN campaign hanya memiliki satu gambar, THE Image_Carousel SHALL menyembunyikan tombol navigasi dan dot indicator.
4. WHEN pengguna mengklik gambar pada Image_Carousel, THE Image_Carousel SHALL membuka ImageLightbox untuk melihat gambar dalam ukuran penuh.
5. THE Image_Carousel SHALL menampilkan overlay zoom hint saat pengguna mengarahkan kursor ke gambar (hover state) pada perangkat desktop.
6. THE Image_Carousel SHALL menggunakan sudut membulat (`rounded-2xl` atau lebih) yang konsisten dengan design system.

---

### Requirement 3: Donation Sidebar dan Progress Informasi

**User Story:** Sebagai pengunjung, saya ingin melihat informasi donasi yang jelas dan meyakinkan, sehingga saya tahu seberapa jauh campaign ini dari target dan merasa yakin untuk berdonasi.

#### Acceptance Criteria

1. THE Donation_Sidebar SHALL menampilkan jumlah dana terkumpul (`current_amount`) dengan format mata uang Rupiah (IDR) menggunakan `formatCurrency`.
2. THE Donation_Sidebar SHALL menampilkan jumlah target donasi (`target_amount`) dengan format mata uang Rupiah (IDR).
3. THE Donation_Sidebar SHALL menampilkan Progress_Bar yang merepresentasikan persentase `current_amount` terhadap `target_amount`, dengan nilai maksimum 100%.
4. THE Donation_Sidebar SHALL menampilkan jumlah donatur (`donor_count`) dan sisa hari campaign (`daysLeft`).
5. WHEN `end_date` campaign bernilai null, THE Donation_Sidebar SHALL menampilkan teks "Jadwal menyusul" sebagai pengganti sisa hari.
6. THE Donation_Sidebar SHALL menampilkan tombol "Donasi Sekarang" yang mengarahkan ke halaman `/donate/:slug`.
7. THE Donation_Sidebar SHALL menampilkan tombol berbagi melalui salin link dan WhatsApp.
8. WHEN Campaign_Detail_Page ditampilkan pada layar `lg` ke atas, THE Donation_Sidebar SHALL menggunakan posisi `sticky` agar tetap terlihat saat pengguna scroll.
9. THE Donation_Sidebar SHALL menggunakan warna `brand-green` atau `emerald-600` untuk elemen aksen (progress bar, teks jumlah terkumpul, tombol CTA).

---

### Requirement 4: Content Tab (Deskripsi, Update, Donatur)

**User Story:** Sebagai pengunjung, saya ingin membaca deskripsi lengkap, update terbaru, dan daftar donatur campaign, sehingga saya mendapat informasi yang komprehensif sebelum memutuskan berdonasi.

#### Acceptance Criteria

1. THE Content_Tab SHALL menampilkan tiga tab: "Deskripsi", "Update", dan "Donatur".
2. WHEN pengguna mengklik tab, THE Content_Tab SHALL menampilkan konten tab yang dipilih dan memberikan indikator visual aktif (underline atau highlight) pada tab tersebut.
3. WHEN tab "Deskripsi" aktif, THE Content_Tab SHALL merender konten HTML `full_description` campaign menggunakan class `prose` yang sudah didefinisikan di design system.
4. WHEN tab "Update" aktif dan terdapat data update, THE Content_Tab SHALL menampilkan daftar update dalam format timeline dengan indikator titik berwarna `emerald`.
5. WHEN tab "Update" aktif dan tidak ada data update, THE Content_Tab SHALL menampilkan pesan "Belum ada update untuk campaign ini."
6. WHEN tab "Donatur" aktif dan terdapat data donatur, THE Content_Tab SHALL menampilkan daftar donatur dengan nama, jumlah donasi, tanggal, dan pesan (jika ada).
7. WHEN tab "Donatur" aktif dan tidak ada data donatur, THE Content_Tab SHALL menampilkan pesan "Belum ada donatur. Jadilah yang pertama!"
8. THE Content_Tab SHALL menggunakan label tab dalam Bahasa Indonesia: "Deskripsi", "Update", "Donatur".

---

### Requirement 5: Trust dan Kredibilitas

**User Story:** Sebagai pengunjung, saya ingin melihat elemen yang membangun kepercayaan terhadap campaign, sehingga saya merasa aman dan yakin untuk berdonasi.

#### Acceptance Criteria

1. THE Campaign_Detail_Page SHALL menampilkan Trust_Banner yang memuat informasi komitmen transparansi penggalang dana.
2. THE Campaign_Detail_Page SHALL menampilkan informasi penggalang dana ("Yayasan Sekolah Tanah Air") beserta badge verifikasi.
3. THE Trust_Banner SHALL menggunakan warna latar `emerald-50` atau `brand-green` dengan teks yang kontras dan mudah dibaca.
4. THE Campaign_Detail_Page SHALL menampilkan ikon `ShieldCheck` atau ikon kepercayaan lainnya pada Trust_Banner.

---

### Requirement 6: Navigasi dan Breadcrumb

**User Story:** Sebagai pengunjung, saya ingin dapat dengan mudah kembali ke halaman sebelumnya atau bernavigasi ke halaman lain, sehingga pengalaman browsing saya tidak terganggu.

#### Acceptance Criteria

1. WHEN Campaign_Detail_Page ditampilkan pada layar `sm` ke atas, THE Campaign_Detail_Page SHALL menampilkan Breadcrumb dengan urutan: Beranda > Campaign > Judul Campaign.
2. WHEN Campaign_Detail_Page ditampilkan pada layar di bawah `sm`, THE Campaign_Detail_Page SHALL menampilkan tombol "Kembali ke campaign" dengan ikon panah kiri sebagai pengganti Breadcrumb.
3. THE Breadcrumb SHALL menggunakan link yang dapat diklik untuk "Beranda" dan "Campaign", serta teks non-link untuk judul campaign aktif.

---

### Requirement 7: Mobile Experience

**User Story:** Sebagai pengguna mobile, saya ingin pengalaman yang nyaman dan mudah digunakan di layar kecil, sehingga saya dapat berdonasi tanpa hambatan dari perangkat apapun.

#### Acceptance Criteria

1. THE Sticky_Bottom_Bar SHALL ditampilkan pada layar di bawah `lg` dan disembunyikan pada layar `lg` ke atas.
2. THE Sticky_Bottom_Bar SHALL menampilkan persentase progress dan jumlah dana terkumpul di sisi kiri, serta tombol "Donasi Sekarang" di sisi kanan.
3. THE Sticky_Bottom_Bar SHALL menggunakan `safe-pb` padding untuk mengakomodasi safe area pada perangkat iOS.
4. THE Campaign_Detail_Page SHALL memastikan tidak ada elemen konten yang tertutup oleh Sticky_Bottom_Bar dengan memberikan padding bawah yang cukup (`pb-36` atau setara) pada container utama.
5. WHEN Campaign_Detail_Page dimuat pada layar mobile, THE Image_Carousel SHALL dapat dioperasikan dengan sentuhan (swipe) atau tombol navigasi yang berukuran minimal 44x44px untuk kemudahan tap.

---

### Requirement 8: State Loading dan Error

**User Story:** Sebagai pengunjung, saya ingin mendapat umpan balik yang jelas saat halaman sedang dimuat atau terjadi kesalahan, sehingga saya tidak bingung dengan kondisi halaman yang kosong.

#### Acceptance Criteria

1. WHEN Campaign_Detail_Page sedang memuat data, THE Campaign_Detail_Page SHALL menampilkan indikator loading dengan teks "Memuat detail campaign...".
2. WHEN terjadi error saat memuat data campaign, THE Campaign_Detail_Page SHALL menampilkan pesan error yang deskriptif kepada pengguna.
3. WHEN campaign dengan slug yang diminta tidak ditemukan, THE Campaign_Detail_Page SHALL menampilkan pesan "Campaign tidak ditemukan" beserta link untuk kembali ke daftar campaign.
4. WHEN Campaign_Detail_Page menampilkan state loading atau error, THE Campaign_Detail_Page SHALL tetap mempertahankan layout dasar halaman (background, padding) agar tidak terlihat rusak.

---

### Requirement 9: Konsistensi Brand dan Aksesibilitas

**User Story:** Sebagai pengguna, saya ingin halaman campaign terlihat konsisten dengan identitas visual Sekolah Tanah Air dan mudah diakses, sehingga pengalaman saya terasa profesional dan inklusif.

#### Acceptance Criteria

1. THE Campaign_Detail_Page SHALL menggunakan Brand_Colors secara konsisten: `brand-green` (#115E45) atau `emerald-600` untuk elemen aksi utama, `brand-cream` (#FBFAF8) untuk background.
2. THE Campaign_Detail_Page SHALL menggunakan font `Plus Jakarta Sans` (font-display) untuk heading dan `Inter` (font-sans) untuk body text, sesuai design system.
3. THE Campaign_Detail_Page SHALL memastikan semua tombol interaktif memiliki atribut `aria-label` yang deskriptif.
4. THE Campaign_Detail_Page SHALL memastikan rasio kontras warna teks terhadap background memenuhi standar WCAG AA (minimal 4.5:1 untuk teks normal).
5. THE Image_Carousel SHALL menyertakan atribut `alt` yang deskriptif pada setiap gambar.
6. THE Campaign_Detail_Page SHALL memastikan semua elemen interaktif dapat diakses melalui keyboard (tab navigation).
