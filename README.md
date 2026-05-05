# Sekolah Tanah Air (STA) Platform

Sekolah Tanah Air merupakan sebuah platform digital penggalangan dana (crowdfunding) dan pergerakan kolaboratif yang bertujuan untuk meningkatkan kualitas pendidikan di daerah terpencil Indonesia. Platform ini memfasilitasi donasi untuk pembangunan fisik, pelatihan guru, hingga pemerataan akses pendidikan berbasis kearifan lokal.

Lebih dari sekadar portal donasi, STA mengintegrasikan sistem pelaporan berbasis lapangan bagi relawan dan panel manajemen konten yang komprehensif bagi administrator.

---

## 🚀 Teknologi Utama

Aplikasi ini dibangun dengan standar modern untuk performa tinggi dan pengalaman pengguna yang premium:

- **Frontend Core**: [React 19](https://react.dev/) & [Vite 6](https://vitejs.dev/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) (dengan dukungan native CSS variables & performa build lebih cepat)
- **Bahasa**: [TypeScript](https://www.typescriptlang.org/) (Strict mode)
- **Backend as a Service**: [Supabase](https://supabase.com/) (PostgreSQL, Auth, & Storage)
- **Pemetaan**: [MapLibre GL](https://maplibre.org/) & [React Map GL](https://visgl.github.io/react-map-gl/)
- **Animasi**: [Framer Motion](https://www.framer.com/motion/)
- **Manajemen Form**: React Hook Form & [Zod](https://zod.dev/)
- **Rich Text Editor**: [Tiptap](https://tiptap.dev/) (digunakan pada Admin Panel)
- **Keamanan**: Cloudflare Turnstile

---

## ✨ Fitur Utama

### 1. Ekosistem Publik
- **Crowdfunding & Journey**: Penelusuran kampanye pendidikan yang transparan. Fitur **"Journey"** memungkinkan donatur melihat dampak nyata melalui peta interaktif.
- **Laporkan Sekolah (3-Step Wizard)**: Alur pelaporan sekolah yang intuitif bagi relawan, dilengkapi dengan validasi lokasi dan kebutuhan (Fisik/Non-Fisik).
- **Leaderboard & Donasi**: Sistem apresiasi bagi donatur dan kemudahan pembayaran (terintegrasi dengan sistem WhatsApp/Manual confirmation).
- **Interactive Impact Map**: Visualisasi persebaran sekolah yang telah dibantu dan yang sedang membutuhkan bantuan di seluruh Indonesia.

### 2. Admin Panel (Manajemen Konten)
- **Dashboard**: Ringkasan statistik donasi, jumlah laporan, dan kampanye aktif.
- **Content Manager**: Manajemen Hero Section (Banner), program utama, FAQ, dan event secara dinamis.
- **Campaign & Transaction**: Verifikasi transaksi donasi dan pengelolaan detail kampanye.
- **School Report Review**: Manajemen data sekolah yang dilaporkan oleh relawan untuk divalidasi menjadi kampanye aktif.
- **Asset Management**: Pengelolaan file gambar dan media dengan optimasi kompresi otomatis.

---

## 🌊 Alur Kerja Sistem

Platform ini beroperasi melalui tiga alur utama yang saling terintegrasi:

### 1. Alur Pelaporan (Relawan)
Relawan mengidentifikasi sekolah yang membutuhkan bantuan melalui **3-Step Wizard**. Data yang disubmit akan masuk ke database dan memicu pembuatan pesan konfirmasi otomatis ke WhatsApp Admin untuk validasi cepat.

### 2. Alur Manajemen (Admin)
Admin meninjau laporan masuk di **Admin Panel**. Laporan yang valid dikonversi menjadi kampanye aktif. Admin juga memiliki kontrol penuh untuk memperbarui konten situs (Hero banner, statistik, FAQ) secara dinamis.

### 3. Alur Donasi & Dampak (Donatur)
Donatur memilih kampanye dan melakukan donasi. Setelah verifikasi admin, progres dana kampanye akan diperbarui secara real-time. Donatur dapat melihat dampak dari kontribusi mereka melalui **Journey Detail** dan **Peta Interaktif**.

---

## 📁 Struktur Proyek

```text
src/
├── components/
│   ├── admin/      # Komponen khusus panel admin
│   ├── public/     # Komponen UI publik (Navbar, Footer, Hero, dll)
│   └── shared/     # Komponen umum (Button, Input, Modal)
├── pages/
│   ├── admin/      # Halaman manajemen (Dashboard, Content, Reports)
│   └── public/     # Halaman utama (Home, About, Journey, Campaigns)
├── lib/
│   ├── admin/      # Logika bisnis & repository admin
│   ├── public/     # Logika bisnis & repository publik
│   ├── supabase/   # Konfigurasi & client Supabase
│   └── utils/      # Helper functions & constants
└── types/          # Definisi tipe data TypeScript
```

---

## 🛠️ Panduan Instalasi

### Prasyarat
- Node.js (Versi 20.x atau lebih tinggi sangat disarankan)
- NPM atau PNPM

### Langkah-langkah
1. **Clone repositori**:
   ```bash
   git clone [url-repo]
   cd sekolah-tanah-air
   ```

2. **Instal dependensi**:
   ```bash
   npm install
   ```

3. **Konfigurasi Environment**:
   Salin `.env.example` menjadi `.env` dan isi variabel yang diperlukan:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_TURNSTILE_SITE_KEY=your_cloudflare_turnstile_key
   ```

4. **Jalankan aplikasi**:
   ```bash
   npm run dev
   ```
   Aplikasi akan berjalan di `http://localhost:3000`.

---

## 🤝 Kontribusi

Kami menerima kontribusi dalam bentuk pelaporan bug, saran fitur, atau pull request. Pastikan untuk mengikuti standar penulisan kode TypeScript dan melakukan linting sebelum melakukan submit.

---

**Sekolah Tanah Air** - *Membangun Harapan dari Setiap Sudut Negeri.*

