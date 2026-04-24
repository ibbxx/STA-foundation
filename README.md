# Sekolah Tanah Air (STA) Platform

Sekolah Tanah Air merupakan sebuah platform digital penggalangan dana (crowdfunding) dan pergerakan kolaboratif. Fokus utama dari platform ini adalah memfasilitasi donasi untuk pembangunan sarana pendidikan, pemenuhan kebutuhan non-fisik (seperti pelatihan guru dan buku bacaan), serta menginisiasi pemerataan pendidikan berbasis kearifan lokal di berbagai daerah di wilayah Indonesia.

Lebih dari sekadar portal donatur, platform ini menghadirkan sistem pelaporan bagi relawan di daerah agar dapat memetakan sekolah-sekolah yang tertinggal dan memfasilitasi komunikasi langsung dengan administrator lewat sistem WhatsApp otomatis.

## Arsitektur Teknis dan Teknologi Pendukung

Aplikasi ini dikembangkan dengan pendekatan modern "Mobile-first", berfokus pada pengalaman pengguna yang ringan, mulus, dan responsif pada setiap perangkat.

- Framework Utama: React 18 menggunakan ekosistem Vite.
- Bahasa Pemrograman: TypeScript (Strict mode enabled) guna menjamin keamanan pengetikan data pada form dan state management.
- Styling: Tailwind CSS (Utility-first framework) dengan styling spesifik pada lapisan global (global.css).
- Manajemen State & Rekayasa Formulir: React Hook Form. Digunakan pada setiap halaman berbasis input, memungkinkan re-rendering minimal.
- Validasi Skema Data: Zod. Menyediakan proteksi data yang akurat (seperti mencegah pengguna melampaui batas centang opsi atau memasukkan format kontak yang salah).
- Backend as a Service (BaaS): Supabase. Dimanfaatkan untuk layanan autentikasi (jika diperlukan kedepannya) dan PostgreSQL database untuk penyimpanan data formulir serta manajemen konten aplikasi.
- Transisi dan Micro-Interactions: Framer Motion.
- Ikonografi: Lucide React.

## Anatomi Fitur Inti

1. Halaman Campaign (Crowdfunding Module)
   Sistem penjelahan kampanye yang aktif dikurasi. Pengguna bisa memantau progres pendanaan, target dana, dan detail narasi sekolah yang bersangkutan. UI diformat dengan Sticky Action Bar untuk merampingkan alur interaksi menuju proses pembayaran/donasi, khususnya saat diakses menggunakan smartphone.

2. Modul Laporkan Sekolah (3-Step Wizard)
   Fitur esensial yang memungkinkan siapapun berkontribusi sebagai pemberi informasi lapangan. Modul ini dirombak menjadi 3 tahap berurutan guna menekan risiko information overload bagi pengisi formulir:
   - Tahap 1 (Pelapor): Fokus pada integrasi identitas relawan dan pengecekan apakah mereka bertindak sebagai fasilitator langsung. Jika tidak, aplikasi menyajikan logika percabangan untuk meminta kontak penanggung jawab alternatif.
   - Tahap 2 (Sekolah): Penjaringan informasi dasar profil sekolah, jumlah murid, hingga spesifikasi titik koordinat atau Google Maps.
   - Tahap 3 (Kebutuhan): Pelapor mengalokasikan prioritas kebutuhan darurat (Maksimal 3 untuk Fisik & Non-Fisik) serta fitur lampiran foto lapangan.

3. Sistem Draft Lokal
   Sistem pelaporan sekolah otomatis disinkronkan ke dalam `localStorage`. Apabila perangkat pelapor terputus koneksi atau tak sengaja menutup browser, isi field sebelumnya tidak akan terhapus. Saat berhasil disubmit, skrip akan membersihkan draft tersebut dan menyulap data menjadi text-encoded WhatsApp URL menuju kontak admin STA.

4. Halaman Tentang Kami (Visi & Misi)
   Halaman yang memuat informasi komprehensif organisasi, yang terdiri dari nilai-nilai inti, deretan mitra/partner penggerak, serta filosofi desain pergerakan Sekolah Tanah Air.

## Layout dan Struktur Direktori Codebase

- `/src/components`: Berisi komponen-komponen re-usable seperti Navbar, Footer, Logo, hingga modul spesifik `CampaignCard`.
- `/src/components/report-school`: Merupakan komponen-komponen mandiri yang membentuk 3 langkah form "Laporkan Sekolah" (`Step1Reporter`, `Step2School`, `Step3Needs`, beserta komponen navigasinya).
- `/src/pages`: Komponen setingkat-halaman (Home, About, Campaigns, LaporkanSekolah) yang disusun pada routing.
- `/src/lib`: Menyimpan fungsi logika terpusat (`report-school.ts`). Ekstensinya menampung skema validasi Zod, data enum konstan, dan helper formatter.

## Panduan Instalasi Lokal

Spesifikasi environment: Disarankan menggunakan Node.js (versi 18.x atau yang lebih tinggi).

1. Kloning dan Masuk ke Direktori Proyek
   Tempatkan source code ke dalam mesin lokal Anda, lalu masuk ke direktori utama aplikasi.

2. Proses Instalasi Dependensi
   Jalankan perintah instalasi paket modul.
   ```bash
   npm install
   ```

3. Registrasi Konfigurasi Environment (Supabase dll)
   Duplikasi atau buat file lokal bernama `.env` di direktori teratas (root) berdasarkan pola parameter di `.env.example`.
   Contoh parameter krusial:
   `VITE_SUPABASE_URL=...`
   `VITE_SUPABASE_ANON_KEY=...`

4. Jalankan Server Development
   Setelah dependensi dan environment dipasang utuh, jalankan Vite di environment lokal:
   ```bash
   npm run dev
   ```
   Aplikasi standar pengembangan akan berjalan dan memonitor perubahan file secara real-time pada `http://localhost:5173/`.
