# STA MVP Audit

Tanggal audit: 2026-04-27

Scope audit ini dibatasi pada pembacaan codebase saat ini secara read-only, tanpa menyimpulkan dari dokumen lama atau asumsi di luar repo. Fokus utamanya adalah menjawab tiga hal:

1. Project ini sebenarnya sudah sampai tahap apa.
2. MVP realistis dari codebase saat ini seperti apa.
3. Fitur apa yang sudah selesai, parsial, atau belum siap untuk launch.

## Ringkasan Eksekutif

Project `sekolah-tanah-air` saat ini sudah melampaui tahap prototype visual murni. Funnel campaign publik, form donasi, flow `Laporkan Sekolah`, login admin, dashboard admin, campaign manager, donors, transactions, content manager, dan settings manager sudah tersambung ke Supabase pada level frontend.

Namun project ini belum bisa disebut sebagai MVP produksi untuk platform donasi publik. Penyebab utamanya bukan lagi tampilan, melainkan:

- flow pembayaran belum terhubung ke payment gateway nyata
- publik masih bisa menulis donasi langsung dari client sebagai `success`
- proteksi anti-spam dan schema `Laporkan Sekolah` belum sinkron dengan SQL kanonis
- beberapa halaman publik dan CMS masih belum menggunakan source of truth yang sama
- `leaderboard` sudah ada di UI, tetapi kontrak databasenya belum terlihat lengkap di SQL utama repo

Kesimpulan praktis:

- layak disebut `MVP demo/internal`
- hampir layak disebut `MVP operasional untuk tim internal`
- belum layak disebut `MVP launch produksi`

## Definisi MVP Yang Realistis Dari Repo Saat Ini

Jika MVP didefinisikan berdasarkan state code yang ada sekarang, maka MVP project ini adalah:

- publik dapat melihat daftar campaign aktif
- publik dapat membuka detail campaign berdasarkan slug
- publik dapat mengirim data donasi melalui form publik
- publik dapat melaporkan kondisi sekolah dengan wizard 3 tahap, upload foto, dan handoff ke admin via WhatsApp
- admin dapat login
- admin dapat melihat ringkasan dashboard
- admin dapat membuat, mengedit, dan menghapus campaign
- admin dapat melihat donor dan transaksi
- admin dapat meninjau laporan sekolah
- admin dapat mengelola data program dan sebagian site content

Jika MVP didefinisikan sebagai MVP yang benar-benar siap untuk dibuka ke pengguna umum, maka scope minimal tambahan yang masih wajib ada adalah:

- payment gateway nyata dengan verifikasi server-side
- status pembayaran yang tidak bisa dipalsukan dari browser
- schema database yang sinkron penuh dengan code untuk anti-spam
- pembacaan content publik dari CMS, bukan sebagian static dan sebagian dynamic
- audit ulang policy RLS untuk semua endpoint public-write

## Metodologi Audit

Audit ini membaca area-area berikut:

- routing utama aplikasi
- halaman publik utama
- halaman admin utama
- source of truth data pada `src/lib`
- kontrak Supabase client
- SQL kanonis pada `supabase/migrations/20260426_full_supabase_sql_editor.sql`
- verifikasi type-check via `npm run lint` yang menjalankan `tsc --noEmit`

## Arsitektur Produk Saat Ini

Project ini terbagi menjadi dua domain besar:

1. Surface publik
2. Surface admin

### Surface Publik

Route publik saat ini:

- `/`
- `/campaigns`
- `/campaigns/:slug`
- `/programs/:slug`
- `/donate/:slug`
- `/payment/success`
- `/tentang-kami`
- `/faq`
- `/laporan`
- `/laporkan`
- `/kontak`
- `/leaderboard`

Rute-rute ini dibungkus `PublicLayout` dan menggunakan `Navbar` + `Footer` di `src/App.tsx`.

### Surface Admin

Route admin saat ini:

- `/admin/login`
- `/admin`
- `/admin/campaigns`
- `/admin/donors`
- `/admin/transactions`
- `/admin/school-reports`
- `/admin/content`
- `/admin/settings`

Route admin dibungkus `ProtectedRoute`, sehingga secara frontend memang sudah ada pengamanan berbasis session Supabase Auth.

## Audit Halaman Publik

### 1. Home

File utama: `src/pages/public/Home.tsx`

Status:

- parsial

Yang sudah live:

- section featured campaign mengambil data Supabase lewat `fetchPublicCampaigns({ featuredOnly: true, limit: 4 })`
- CTA ke campaign publik sudah real

Yang masih static:

- hero title
- hero description
- hero background image
- trust bar / daftar mitra
- kategori highlight
- FAQ home
- daftar program diambil dari konstanta lokal `PROGRAMS`

Implikasi:

- halaman depan sudah terlihat matang
- tetapi belum benar-benar mengikuti data admin settings dan admin content
- ada gap antara CMS admin dan homepage publik

### 2. Campaign Listing

File utama: `src/pages/public/Campaigns.tsx`

Status:

- selesai pada level MVP internal

Yang sudah bekerja:

- fetch daftar campaign dari Supabase
- loading state
- error state
- filter kategori berdasarkan data yang benar-benar tersedia
- search client-side terhadap hasil campaign

Catatan:

- page ini tidak lagi sekadar mock
- logic search/filter sudah nyata
- jika source data campaign benar, page ini sudah cukup siap untuk publik

### 3. Campaign Detail

File utama: `src/pages/public/CampaignDetail.tsx`

Status:

- selesai pada level MVP internal

Yang sudah bekerja:

- load detail berdasarkan `slug`
- load update campaign dari tabel `campaign_updates`
- load donasi publik dari view `public_campaign_donations`
- gallery image, share action, sticky CTA, dan donor tab

Nilai penting:

- route `slug` sudah benar-benar dinamis
- ini menutup gap lama ketika detail selalu menampilkan campaign yang sama

### 4. Donate

File utama: `src/pages/public/Donate.tsx`

Status:

- parsial

Yang sudah bekerja:

- ambil campaign target berdasarkan slug
- form validation dengan Zod
- insert data ke tabel `donations`
- redirect ke halaman sukses dengan state transaksi

Masalah kritis:

- client langsung menulis `payment_status: 'success'`
- belum ada payment gateway
- belum ada webhook
- belum ada verifikasi backend

Implikasi:

- secara UI dan data capture, flow ini hidup
- secara bisnis dan keamanan, flow ini belum valid untuk donasi produksi

Ini adalah blocker terbesar untuk menyebut project ini siap launch.

### 5. Payment Success

File utama: `src/pages/public/PaymentSuccess.tsx`

Status:

- parsial

Yang sudah baik:

- menerima state amount, payment method, dan transaction id dari route navigation

Yang belum:

- tidak merepresentasikan pembayaran nyata
- hanya menampilkan sukses setelah insert database dari browser

### 6. Program Detail

File utama: `src/pages/public/ProgramDetail.tsx`

Status:

- belum sinkron dengan CMS

Yang terjadi sekarang:

- page membaca `PROGRAMS` dari `src/lib/programs.ts`
- bukan dari tabel `programs`

Padahal:

- admin content sudah mengelola tabel `programs`

Implikasi:

- ada source of truth ganda
- admin bisa mengedit program di database, tetapi halaman publik program belum otomatis mengikuti

### 7. About

File utama: `src/pages/public/About.tsx`

Status:

- static editorial page

Yang masih static:

- team members
- gallery images
- impact stats
- narasi organisasi

Page ini rapi secara visual, tetapi belum menjadi bagian dari CMS.

### 8. FAQ

File utama: `src/pages/public/Faq.tsx`

Status:

- static

Tidak ada fetch ke Supabase. Semua item FAQ hardcoded di file.

### 9. Reports / Laporan Transparansi

File utama: `src/pages/public/Reports.tsx`

Status:

- static / placeholder konten

Yang masih static:

- metrik dampak
- daftar dokumen PDF
- tombol download belum terhubung ke file nyata

Ini berarti halaman transparansi masih lebih bersifat presentasional daripada operasional.

### 10. Contact

File utama: `src/pages/public/Contact.tsx`

Status:

- belum selesai

Yang masih kurang:

- form tidak punya submit handler
- data kontak static
- belum ada integrasi email, WhatsApp flow, atau insert ke database

### 11. Laporkan Sekolah

File utama: `src/pages/public/LaporkanSekolah.tsx`

Status:

- salah satu flow paling matang

Yang sudah bekerja:

- form wizard bertahap
- validasi schema
- draft lokal
- upload foto ke storage
- insert laporan ke `school_reports`
- anti-spam di sisi frontend
- handoff ke WhatsApp admin
- Turnstile widget

Masalah kritis:

- verifikasi Turnstile masih hanya di client
- code menggunakan `reporter_ip`
- code menggunakan tabel `spammer_blacklist`
- kedua kontrak itu belum terlihat ada di SQL utama repo

Implikasi:

- UX flow kuat
- implementasi data hidup
- tetapi kontrak anti-spam belum sinkron penuh

### 12. Leaderboard

File utama:

- `src/pages/public/Leaderboard.tsx`
- `src/lib/leaderboard.ts`

Status:

- parsial dan berisiko error data kosong

Yang terjadi:

- halaman query ke view `leaderboard`
- repo SQL utama tidak menunjukkan definisi view `leaderboard`

Implikasi:

- UI page ada
- kontrak databasenya belum terverifikasi lengkap dari repo
- feature ini belum bisa dianggap selesai

## Audit Area Admin

### 1. Auth Guard

File utama:

- `src/components/shared/ProtectedRoute.tsx`
- `src/components/shared/GuestRoute.tsx`
- `src/pages/admin/AdminLogin.tsx`

Status:

- selesai pada level session auth dasar

Yang sudah bekerja:

- login menggunakan `supabase.auth.signInWithPassword`
- protected route mengecek session
- redirect ke login jika belum authenticated

Yang belum terlihat:

- role-based admin authorization
- pembatasan per user role

Implikasi:

- auth dasar ada
- model otorisasi admin belum matang

### 2. Admin Dashboard

File utama: `src/pages/admin/AdminDashboard.tsx`

Status:

- selesai pada level MVP internal

Yang sudah bekerja:

- membaca campaigns, donations, school_reports dari Supabase
- menghitung KPI
- membangun chart data
- membangun recent transactions table

Catatan:

- dashboard ini bukan lagi mock
- kualitasnya bergantung langsung pada kualitas data tabel

### 3. Admin Campaigns

File utama: `src/pages/admin/AdminCampaigns.tsx`

Status:

- cukup matang

Yang sudah bekerja:

- load campaigns + categories
- create / update / delete campaign
- upload image ke storage
- manage collaborators
- manage campaign updates
- cek donasi terkait campaign

Catatan:

- ini adalah salah satu modul admin paling dekat ke kondisi operasional

### 4. Admin Donors

File utama: `src/pages/admin/AdminDonors.tsx`

Status:

- selesai untuk kebutuhan internal dasar

Yang sudah bekerja:

- load data donasi
- derive donor summary
- search donor
- export CSV
- modal detail donor

### 5. Admin Transactions

File utama: `src/pages/admin/AdminTransactions.tsx`

Status:

- selesai untuk kebutuhan internal dasar

Yang sudah bekerja:

- load donations + campaign titles
- filter status
- search transaksi
- export CSV
- modal detail transaksi

Catatan:

- page ini operasional sebagai audit log internal
- tetapi validitas bisnisnya tetap bergantung pada flow payment yang saat ini masih client-driven

### 6. Admin School Reports

File utama: `src/pages/admin/AdminSchoolReports.tsx`

Status:

- parsial menuju operasional

Yang sudah bekerja:

- load laporan sekolah
- search
- filter status
- update status
- detail modal
- block spammer dari admin panel

Masalah:

- logic blacklist tergantung `spammer_blacklist`
- field `reporter_ip` juga dipakai
- SQL utama repo belum menunjukkan keduanya

### 7. Admin Content

File utama: `src/pages/admin/AdminContent.tsx`

Status:

- selesai untuk CRUD program

Yang sudah bekerja:

- load program rows dari database
- create / edit / delete
- search
- statistik ringkas

Masalah:

- halaman publik program belum memakai data ini

### 8. Admin Settings

File utama: `src/pages/admin/AdminSettings.tsx`

Status:

- parsial

Yang sudah bekerja:

- load `site_content`
- update hero-related entries
- create / edit / delete generic site content
- cek bucket storage

Masalah:

- homepage publik masih belum membaca `site_content`
- artinya admin settings belum menjadi source of truth publik yang utuh

## Audit Data Layer Dan Supabase

### Kontrak Client

File utama: `src/lib/supabase.ts`

Kondisi:

- type untuk `programs`, `campaigns`, `donations`, `categories`, `campaign_updates`, `school_reports`, `spammer_blacklist`, dan `site_content` sudah ditulis
- ada fallback placeholder URL/key agar app tidak blank screen saat env kosong

Nilai positif:

- developer experience sudah lebih aman
- codebase sekarang memang dirancang untuk data nyata, bukan lagi UI-only

### Shared Query Layer

File penting:

- `src/lib/public-campaigns.ts`
- `src/lib/admin-repository.ts`

Kondisi:

- query publik dan query admin sudah mulai dipisah ke layer reusable
- ini menandakan arsitektur membaik

### SQL KANONIS

File utama:

- `supabase/migrations/20260426_full_supabase_sql_editor.sql`

Yang sudah dicakup SQL:

- core table `categories`
- core table `programs`
- core table `campaigns`
- core table `donations`
- core table `campaign_updates`
- core table `school_reports`
- core table `site_content`
- compatibility backfills untuk schema lama
- triggers untuk `updated_at`
- trigger sinkronisasi nominal dan donor count campaign
- view `public_campaign_donations`
- view `public_campaign_stats`
- RLS dan grants public/authenticated
- storage bucket dasar

Yang penting dan baik:

- ada trigger `sync_campaign_amount_after_donation`
- berarti `current_amount` dan `donor_count` campaign bisa tetap sinkron jika `donations` berubah

### Gap Kontrak Yang Terdeteksi

#### 1. `spammer_blacklist` belum terlihat di SQL utama

Code menganggap tabel ini ada, tetapi SQL kanonis repo tidak menunjukkan definisinya.

Dampak:

- anti-spam admin/public tidak bisa dianggap stabil sampai schema ini benar-benar ada di SQL kanonis

#### 2. `reporter_ip` belum terlihat di SQL utama `school_reports`

Code memakai field ini, tetapi SQL utama yang terbaca masih mendefinisikan `school_reports` tanpa `reporter_ip`.

Dampak:

- rate limiting per IP di code dapat gagal atau tidak sinkron dengan database nyata

#### 3. view `leaderboard` belum terlihat di SQL utama

Code query ke `leaderboard`, tetapi SQL utama repo belum menunjukkan definisi view itu.

Dampak:

- leaderboard belum bisa dianggap selesai

## Status Fitur: Selesai vs Belum

### Selesai

- routing publik dan admin
- lazy-loading dan suspense route
- auth login admin dasar
- protected route berbasis session
- list campaign publik
- detail campaign publik berdasarkan slug
- tabs deskripsi / update / donatur
- insert donasi ke Supabase
- sinkron nominal campaign via trigger SQL
- flow `Laporkan Sekolah` end-to-end pada sisi frontend
- dashboard admin
- campaign manager admin
- donor manager admin
- transactions admin
- CRUD program admin
- CRUD site content admin

### Selesai Tetapi Belum Aman Untuk Produksi

- donasi publik
- payment success page
- laporan sekolah dengan anti-spam
- school report moderation
- leaderboard

Alasannya:

- kontrak bisnis atau security-nya belum final

### Parsial

- homepage
- settings sebagai CMS publik
- content/program sinkronisasi ke halaman publik
- transparency reports
- contact
- about
- faq

### Belum Siap Launch

- payment gateway nyata
- webhook pembayaran
- validasi server-side untuk transaksi
- role-based admin authorization
- anti-spam schema sinkron penuh
- public CMS yang benar-benar menjadi source of truth tunggal

## Penilaian MVP Per Domain

### Domain Campaign Crowdfunding

Status:

- UI: matang
- data listing/detail: hidup
- transaksi: belum layak produksi

Verdict:

- domain ini siap demo
- belum siap menerima donasi publik nyata

### Domain Laporkan Sekolah

Status:

- UX flow: matang
- data capture: hidup
- moderation admin: hidup
- security/schema: belum sinkron penuh

Verdict:

- domain ini dekat ke MVP operasional
- perlu penutupan gap schema/security sebelum launch publik

### Domain Admin Operasional

Status:

- cukup kuat untuk tim internal

Verdict:

- panel admin sudah bisa dipakai internal untuk operasional terbatas
- tetapi model role/permission masih perlu diperdalam

### Domain CMS Publik

Status:

- belum selesai

Verdict:

- admin sudah bisa mengubah sebagian data
- frontend publik belum konsisten memakai hasil perubahan itu

## Risiko Produk Utama

### Risiko P0

- donasi palsu bisa tercatat sebagai sukses dari browser
- anti-spam flow tidak sinkron penuh dengan schema SQL
- leaderboard belum punya kontrak SQL yang jelas di repo

### Risiko P1

- CMS admin memberi kesan data dinamis, tetapi banyak halaman publik masih static
- data settings dan content belum menjadi source of truth tunggal

### Risiko P2

- dokumentasi lama dapat menyesatkan jika dipakai tanpa verifikasi codebase sekarang

## Prioritas Rekomendasi

### P0

- ganti flow donasi dari client-write `success` menjadi flow payment nyata
- tambahkan server-side payment verification
- sinkronkan SQL utama dengan `reporter_ip` dan `spammer_blacklist`
- putuskan apakah `leaderboard` memang fitur inti; jika ya, tambahkan view SQL resmi

### P1

- sambungkan homepage ke `site_content`
- sambungkan halaman program publik ke tabel `programs`
- ubah `About`, `FAQ`, `Reports`, dan `Contact` menjadi minimal semi-dynamic

### P2

- tambah role admin
- audit ulang seluruh RLS public-write
- rapikan dokumen lama agar tidak bertentangan dengan codebase sekarang

## Putusan Akhir

Kalimat paling jujur untuk status project saat ini adalah:

`Sekolah Tanah Air` sudah memiliki fondasi produk dan admin yang nyata, bukan lagi landing page demo. Namun project ini masih berada di fase transisi dari `MVP demo/internal` menuju `MVP produksi`, dengan blocker terbesar ada pada pembayaran, keamanan write publik, dan sinkronisasi CMS publik.

Jika target berikutnya adalah launch terbatas, maka fokus tidak lagi pada mempercantik UI, tetapi pada:

- integrity transaksi
- sinkronisasi schema
- penutupan source of truth ganda
- audit keamanan public insert

## Lampiran Referensi Kode Utama

Referensi file yang paling relevan untuk audit ini:

- `src/App.tsx`
- `src/pages/public/Home.tsx`
- `src/pages/public/Campaigns.tsx`
- `src/pages/public/CampaignDetail.tsx`
- `src/pages/public/Donate.tsx`
- `src/pages/public/PaymentSuccess.tsx`
- `src/pages/public/LaporkanSekolah.tsx`
- `src/pages/public/ProgramDetail.tsx`
- `src/pages/public/About.tsx`
- `src/pages/public/Faq.tsx`
- `src/pages/public/Reports.tsx`
- `src/pages/public/Contact.tsx`
- `src/pages/public/Leaderboard.tsx`
- `src/pages/admin/AdminLogin.tsx`
- `src/pages/admin/AdminDashboard.tsx`
- `src/pages/admin/AdminCampaigns.tsx`
- `src/pages/admin/AdminDonors.tsx`
- `src/pages/admin/AdminTransactions.tsx`
- `src/pages/admin/AdminSchoolReports.tsx`
- `src/pages/admin/AdminContent.tsx`
- `src/pages/admin/AdminSettings.tsx`
- `src/lib/public-campaigns.ts`
- `src/lib/admin-repository.ts`
- `src/lib/supabase.ts`
- `supabase/migrations/20260426_full_supabase_sql_editor.sql`

