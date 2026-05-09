# 🎯 Implementation Plan: Portal Karir — Sekolah Tanah Air

> **Tujuan:** Membangun Portal Karir terintegrasi yang memungkinkan STA memposting lowongan kerja, mengelola pelamar, dan mengintegrasikan alur kerja rekrutmen langsung dari Admin Panel yang sudah ada.

---

## 📊 Analisis Konteks Proyek

### Stack yang Ada
| Lapisan | Teknologi |
|---|---|
| Frontend | React + TypeScript + Vite |
| Routing | React Router v6 (lazy-loaded) |
| Database | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth (admin-only) |
| Storage | Supabase Storage buckets |
| Styling | Vanilla CSS + utility classes kustom |
| Form | React Hook Form + Zod |

### Pola Admin Panel yang Sudah Ada (Referensi Implementasi)
- **AdminEduxplore** → manajemen volunteer program + pendaftar (pola paling mirip)
- **AdminCampaigns** → CRUD kompleks dengan modal + image upload
- **AdminContent** → multi-section page dengan tab-like organization
- **RichTextEditor** → komponen teks kaya yang sudah ada & bisa dipakai ulang
- **AdminModal** → komponen modal standar yang sudah ada

---

## 🏗️ Arsitektur Fitur

```
Portal Karir
├── Public (/karir)
│   ├── Halaman Daftar Lowongan
│   ├── Halaman Detail Lowongan (/karir/:slug)
│   └── Form Lamaran (inline di halaman detail)
│
└── Admin (/admin/karir)
    ├── Manajemen Lowongan (CRUD)
    └── Manajemen Pelamar (review, status update, export)
```

---

## 🗄️ Fase 1: Database Schema

### 1.1 Tabel Baru: `job_postings`

```sql
create table if not exists public.job_postings (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  department text not null,           -- Misal: 'Teknologi', 'Program', 'Komunikasi'
  employment_type text not null,       -- 'full_time' | 'part_time' | 'contract' | 'internship' | 'volunteer'
  location text not null,             -- Misal: 'Jakarta', 'Remote', 'Hybrid'
  description text,                   -- Rich text (HTML dari RichTextEditor)
  requirements text,                  -- Rich text: syarat & kualifikasi
  benefits text,                      -- Rich text: keuntungan & fasilitas
  salary_range text,                  -- Opsional: misal "Rp 5jt - 8jt" atau null
  image_url text,                     -- Foto/banner lowongan (opsional)
  is_featured boolean not null default false,
  status text not null default 'draft', -- 'draft' | 'open' | 'closed'
  deadline date,                      -- Batas waktu lamaran
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint job_postings_status_check
    check (status in ('draft', 'open', 'closed')),
  constraint job_postings_employment_type_check
    check (employment_type in ('full_time', 'part_time', 'contract', 'internship', 'volunteer'))
);
```

### 1.2 Tabel Baru: `job_applications`

```sql
create table if not exists public.job_applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.job_postings(id)
    on update cascade on delete cascade,

  -- Data Pelamar
  nama_lengkap text not null,
  email text not null,
  whatsapp text not null,
  domisili text not null,
  pendidikan_terakhir text not null,  -- 'SMA/SMK' | 'D3' | 'S1' | 'S2' | 'S3' | 'Lainnya'
  pengalaman_kerja text,              -- Deskripsi singkat pengalaman
  motivasi text,                      -- Surat motivasi / cover letter singkat
  portfolio_url text,                 -- Link portfolio / LinkedIn (opsional)
  cv_url text,                        -- URL file CV di Supabase Storage
  
  -- Status Rekrutmen
  status text not null default 'pending',  -- 'pending' | 'reviewing' | 'shortlisted' | 'interview' | 'accepted' | 'rejected'
  admin_notes text,                   -- Catatan internal admin (tidak terlihat pelamar)

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint job_applications_status_check
    check (status in ('pending', 'reviewing', 'shortlisted', 'interview', 'accepted', 'rejected')),
  constraint job_applications_education_check
    check (pendidikan_terakhir in ('SMA/SMK', 'D3', 'S1', 'S2', 'S3', 'Lainnya'))
);
```

### 1.3 Indexes, Triggers & RLS

```sql
-- Indexes
create index if not exists idx_job_postings_slug on public.job_postings(slug);
create index if not exists idx_job_postings_status on public.job_postings(status, created_at desc);
create index if not exists idx_job_applications_job_id on public.job_applications(job_id, created_at desc);
create index if not exists idx_job_applications_status on public.job_applications(status, created_at desc);
create index if not exists idx_job_applications_email on public.job_applications(email);

-- Auto-update updated_at trigger
create trigger trg_job_postings_set_updated_at
before update on public.job_postings
for each row execute function public.set_updated_at();

create trigger trg_job_applications_set_updated_at
before update on public.job_applications
for each row execute function public.set_updated_at();

-- RLS
alter table public.job_postings enable row level security;
alter table public.job_applications enable row level security;

-- Publik hanya bisa baca posting yang 'open'
create policy "job_postings_public_select" on public.job_postings
  for select using (status = 'open');

-- Admin bisa semua
create policy "job_postings_authenticated_all" on public.job_postings
  for all to authenticated using (true) with check (true);

-- Anonim bisa submit lamaran
create policy "job_applications_anon_insert" on public.job_applications
  for insert to anon with check (true);

-- Admin bisa semua
create policy "job_applications_authenticated_all" on public.job_applications
  for all to authenticated using (true) with check (true);

-- Grants
grant select on public.job_postings to anon;
grant insert on public.job_applications to anon;
grant select, insert, update, delete on public.job_postings to authenticated;
grant select, insert, update, delete on public.job_applications to authenticated;
```

### 1.4 Storage Bucket

```sql
insert into storage.buckets (id, name, public)
values ('careers', 'careers', true)
on conflict (id) do nothing;

-- Policy: siapapun bisa upload CV
create policy "careers_anon_upload" on storage.objects
  for insert to anon
  with check (bucket_id = 'careers');

create policy "careers_public_read" on storage.objects
  for select using (bucket_id = 'careers');

create policy "careers_authenticated_all" on storage.objects
  for all to authenticated
  using (bucket_id = 'careers') with check (bucket_id = 'careers');
```

---

## 📝 Fase 2: TypeScript Types

**File:** `src/lib/supabase/types.ts` — tambahkan tipe baru:

```typescript
// Tabel job_postings
job_postings: {
  Row: {
    id: string;
    slug: string;
    title: string;
    department: string;
    employment_type: 'full_time' | 'part_time' | 'contract' | 'internship' | 'volunteer';
    location: string;
    description: string | null;
    requirements: string | null;
    benefits: string | null;
    salary_range: string | null;
    image_url: string | null;
    is_featured: boolean;
    status: 'draft' | 'open' | 'closed';
    deadline: string | null;
    created_at: string;
    updated_at: string;
  };
  Insert: { /* semua optional kecuali slug, title, department, employment_type, location */ };
  Update: { /* semua optional */ };
};

// Tabel job_applications
job_applications: {
  Row: {
    id: string;
    job_id: string;
    nama_lengkap: string;
    email: string;
    whatsapp: string;
    domisili: string;
    pendidikan_terakhir: string;
    pengalaman_kerja: string | null;
    motivasi: string | null;
    portfolio_url: string | null;
    cv_url: string | null;
    status: 'pending' | 'reviewing' | 'shortlisted' | 'interview' | 'accepted' | 'rejected';
    admin_notes: string | null;
    created_at: string;
    updated_at: string;
  };
  // Insert & Update serupa
};

// Type aliases
export type JobPostingRow = Database['public']['Tables']['job_postings']['Row'];
export type JobPostingInsert = Database['public']['Tables']['job_postings']['Insert'];
export type JobApplicationRow = Database['public']['Tables']['job_applications']['Row'];
export type JobApplicationInsert = Database['public']['Tables']['job_applications']['Insert'];
```

---

## 🌐 Fase 3: Halaman Publik

### 3.1 Halaman Daftar Lowongan — `/karir`

**File:** `src/pages/public/Karir.tsx`

**Fitur & Layout:**
- **Hero Section** — judul "Bergabung Bersama Kami", subtext misi STA, gambar/ilustrasi
- **Filter Bar** — filter berdasarkan:
  - Departemen (dropdown)
  - Tipe pekerjaan (tabs/chips: Semua, Full-time, Part-time, Internship, Volunteer)
  - Lokasi (dropdown)
- **Grid Kartu Lowongan** — setiap kartu menampilkan:
  - Badge tipe (warna berbeda: Full-time=biru, Internship=hijau, Volunteer=ungu)
  - Judul posisi (bold, besar)
  - Departemen & lokasi (dengan icon 📍)
  - Deadline (dengan warna merah jika < 7 hari)
  - Tombol "Lihat Detail →"
- **Empty State** — jika tidak ada lowongan: ilustrasi + teks ramah
- **CTA Section** — "Tidak menemukan posisi yang sesuai? Kirim CV Terbaikmu" → link ke form spontan

**UI Reference:** Mirip halaman `/events` yang sudah ada, tapi dengan filter yang lebih kaya.

---

### 3.2 Halaman Detail Lowongan — `/karir/:slug`

**File:** `src/pages/public/KarirDetail.tsx`

**Layout (2 kolom di desktop):**

**Kolom Kiri (2/3 lebar) — Konten Lowongan:**
- Breadcrumb: Beranda → Karir → [Judul]
- Header: Judul besar, badge departemen, badge tipe, badge lokasi
- Tabs navigasi: "Deskripsi" | "Kualifikasi" | "Keuntungan"
- Konten rich-text (dari RichTextEditor, render HTML)
- Bagian timeline/deadline

**Kolom Kanan (1/3 lebar) — Sticky Card Info:**
- Ringkasan: Tipe, Lokasi, Departemen, Deadline
- Salary range (jika ada)
- Tombol "Lamar Sekarang" → scroll ke form

**Form Lamaran (di bawah, full-width):**
- Nama lengkap, Email, WhatsApp, Domisili
- Pendidikan terakhir (select)
- Upload CV (PDF, max 5MB) → Supabase Storage `careers/`
- Pengalaman kerja (textarea)
- Motivasi/surat lamaran (textarea, rich)
- Portfolio URL (opsional)
- Submit → notifikasi sukses + konfirmasi via email jika ada

---

## 🔧 Fase 4: Admin Panel

### 4.1 Halaman Admin Karir — `/admin/karir`

**File:** `src/pages/admin/AdminKarir.tsx`

**Struktur halaman (ikuti pola AdminEduxplore):**

**Tab 1: Manajemen Lowongan**
- Header dengan tombol "Tambah Lowongan" + Refresh + filter status
- Stats cards: Total Lowongan, Lowongan Aktif (open), Total Pelamar, Perlu Review
- Tabel lowongan dengan kolom:
  - Posisi + Departemen
  - Tipe + Lokasi
  - Status (badge warna: draft=abu, open=hijau, closed=merah)
  - Deadline
  - Jumlah Pelamar
  - Aksi (Edit, Tutup/Buka, Hapus)

**Tab 2: Manajemen Pelamar**
- Filter: berdasarkan lowongan (dropdown), status pelamar, pencarian nama/email
- Tabel pelamar dengan kolom:
  - Nama + Email + WhatsApp
  - Posisi dilamar
  - Pendidikan
  - Status (badge: pending=abu, reviewing=biru, shortlisted=kuning, interview=oranye, accepted=hijau, rejected=merah)
  - Tanggal Lamar
  - Aksi (Lihat Detail, Ubah Status)
- Export CSV (nama, email, WA, posisi)

---

### 4.2 Modal Kelola Lowongan

**Bagian form (ikuti pola AdminContent dengan seksi berwarna):**

**Seksi 1 — Identitas Posisi** (hijau)
- Judul Posisi, Slug (auto-generate dari judul)
- Departemen (select: Program, Teknologi, Komunikasi, Keuangan, SDM, Umum)
- Tipe Pekerjaan (select)
- Lokasi (text + saran: Remote, Hybrid, Jakarta, dll)
- Status (Draft/Open/Closed)

**Seksi 2 — Waktu & Kompensasi** (biru)
- Deadline (date picker)
- Salary Range (text, opsional)
- Is Featured (toggle)

**Seksi 3 — Konten Lowongan** (kuning)
- Deskripsi Pekerjaan (RichTextEditor)
- Kualifikasi & Persyaratan (RichTextEditor)
- Keuntungan & Fasilitas (RichTextEditor)

**Seksi 4 — Media** (ungu)
- Upload Banner/Gambar (opsional)

---

### 4.3 Modal Detail Pelamar

- Info lengkap pelamar (semua field)
- Link unduh CV (buka Supabase Storage URL)
- Link portfolio (jika ada)
- Dropdown ubah status rekrutmen
- Textarea catatan admin (admin_notes)
- Tombol: Simpan Catatan, Tutup

---

### 4.4 Integrasi Sidebar Admin

**File:** `src/components/layout/AdminLayout.tsx` — tambahkan item menu:

```tsx
{ path: '/admin/karir', label: 'Portal Karir', icon: Briefcase }
```

---

## 📁 Fase 5: Struktur File Lengkap

```
src/
├── pages/
│   ├── public/
│   │   ├── Karir.tsx              # Halaman daftar lowongan
│   │   └── KarirDetail.tsx        # Detail + form lamaran
│   └── admin/
│       └── AdminKarir.tsx         # Admin: lowongan + pelamar
│
├── components/
│   ├── public/
│   │   ├── JobCard.tsx            # Kartu lowongan di daftar
│   │   └── JobApplicationForm.tsx # Form lamaran yang bisa dipakai ulang
│   └── admin/
│       ├── AdminJobPostingModal.tsx  # Modal CRUD lowongan
│       └── AdminApplicantModal.tsx   # Modal detail pelamar
│
├── lib/
│   ├── admin/
│   │   └── career-repository.ts   # Query Supabase untuk karir
│   └── supabase/
│       └── types.ts               # + tambahkan JobPosting & JobApplication types
│
└── App.tsx                         # + tambahkan 2 rute publik + 1 rute admin
```

---

## 🔗 Fase 6: Routing

**File:** `src/App.tsx` — tambahkan:

```tsx
// Public
const Karir = lazy(() => import('./pages/public/Karir'));
const KarirDetail = lazy(() => import('./pages/public/KarirDetail'));

// Admin
const AdminKarir = lazy(() => import('./pages/admin/AdminKarir'));

// Rute Publik
<Route path="/karir" element={renderWithSuspense(<PublicLayout><Karir /></PublicLayout>)} />
<Route path="/karir/:slug" element={renderWithSuspense(<PublicLayout><KarirDetail /></PublicLayout>)} />

// Rute Admin (di dalam nested route /admin)
<Route path="karir" element={renderWithSuspense(<AdminKarir />)} />
```

---

## 🎨 Fase 7: Design System Portal Karir

### Warna Status Badge
| Status | Warna |
|---|---|
| `draft` | Abu-abu (`bg-slate-100 text-slate-600`) |
| `open` | Hijau (`bg-emerald-50 text-emerald-700`) |
| `closed` | Merah muda (`bg-rose-50 text-rose-600`) |

### Warna Tipe Pekerjaan
| Tipe | Warna |
|---|---|
| `full_time` | Biru (`bg-blue-50 text-blue-700`) |
| `part_time` | Indigo (`bg-indigo-50 text-indigo-700`) |
| `contract` | Oranye (`bg-orange-50 text-orange-700`) |
| `internship` | Hijau teal (`bg-teal-50 text-teal-700`) |
| `volunteer` | Ungu (`bg-purple-50 text-purple-700`) |

### Warna Status Pelamar
| Status | Warna |
|---|---|
| `pending` | Abu (`bg-slate-100 text-slate-600`) |
| `reviewing` | Biru (`bg-blue-50 text-blue-700`) |
| `shortlisted` | Kuning (`bg-amber-50 text-amber-700`) |
| `interview` | Oranye (`bg-orange-50 text-orange-700`) |
| `accepted` | Hijau (`bg-emerald-50 text-emerald-700`) |
| `rejected` | Merah (`bg-rose-50 text-rose-600`) |

---

## ✅ Checklist Implementasi

### Fase 1 — Database (Supabase)
- [ ] Jalankan migration SQL: tabel `job_postings`
- [ ] Jalankan migration SQL: tabel `job_applications`
- [ ] Buat storage bucket `careers`
- [ ] Verifikasi RLS policies berfungsi

### Fase 2 — Types & Repository
- [ ] Update `src/lib/supabase/types.ts`
- [ ] Buat `src/lib/admin/career-repository.ts`
- [ ] Buat Zod schema untuk form admin

### Fase 3 — Public Pages
- [ ] `src/pages/public/Karir.tsx` — halaman daftar
- [ ] `src/pages/public/KarirDetail.tsx` — detail + form
- [ ] `src/components/public/JobCard.tsx`
- [ ] `src/components/public/JobApplicationForm.tsx`

### Fase 4 — Admin Panel
- [ ] `src/pages/admin/AdminKarir.tsx`
- [ ] `src/components/admin/AdminJobPostingModal.tsx`
- [ ] `src/components/admin/AdminApplicantModal.tsx`
- [ ] Tambahkan menu di `AdminLayout.tsx` (sidebar)
- [ ] Tambahkan stats karir di `AdminDashboard.tsx`

### Fase 5 — Routing & Integrasi
- [ ] Update `src/App.tsx` dengan 3 rute baru
- [ ] Tambahkan link "Karir" di `Navbar.tsx`
- [ ] Tambahkan link "Karir" di `Footer.tsx`
- [ ] SEO: meta title/description di tiap halaman

### Fase 6 — Polish & QA
- [ ] Responsive mobile di semua halaman baru
- [ ] Loading skeleton saat data fetch
- [ ] Empty state yang informatif
- [ ] Validasi form (client-side via Zod)
- [ ] Notifikasi sukses/error yang konsisten

---

## 🚀 Urutan Pengerjaan yang Disarankan

```
1. SQL Migration → 2. TypeScript Types → 3. career-repository.ts
        ↓
4. AdminKarir.tsx (tab Lowongan) → 5. AdminJobPostingModal.tsx
        ↓
6. Karir.tsx (publik, daftar) → 7. KarirDetail.tsx (publik, detail)
        ↓
8. JobApplicationForm.tsx → 9. AdminKarir.tsx (tab Pelamar)
        ↓
10. AdminApplicantModal.tsx → 11. Update Navbar + Footer + Dashboard
```

> [!IMPORTANT]
> Mulai dari Admin Panel dulu (langkah 4-5) agar bisa input data lowongan test, sebelum membangun halaman publik yang bergantung pada data nyata dari database.

> [!TIP]
> Gunakan kembali komponen `RichTextEditor`, `AdminModal`, dan pola `useForm` + `zodResolver` yang sudah ada di `AdminContent.tsx` dan `AdminCampaigns.tsx` untuk konsistensi dan efisiensi pengembangan.
