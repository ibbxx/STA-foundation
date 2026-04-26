# Design Document: Campaign Detail Redesign

## Overview

Halaman Campaign Detail (`/campaigns/:slug`) adalah titik konversi utama pada platform donasi Sekolah Tanah Air. Redesign ini bertujuan meningkatkan kepercayaan pengguna, memperjelas hierarki informasi donasi, dan memperkuat identitas visual brand melalui pendekatan desain yang clean, modern, dan minimal — sesuai karakter platform crowdfunding pendidikan.

Pendekatan desain mengutamakan:
- **Clarity over decoration** — setiap elemen harus memiliki tujuan fungsional yang jelas
- **Trust-first layout** — informasi kepercayaan (verifikasi, transparansi) ditempatkan strategis
- **Conversion-optimized** — CTA donasi selalu terlihat di semua breakpoint
- **Brand consistency** — palet warna earthy green + cream + gold diterapkan secara konsisten

### Keputusan Desain Utama

| Keputusan | Pilihan | Alasan |
|---|---|---|
| Background halaman | `brand-cream` (#FBFAF8) | Konsisten dengan design system, terasa hangat dan premium |
| Warna aksen utama | `brand-green` (#115E45) | Identitas brand, kontras baik di atas cream |
| Warna aksen sekunder | `brand-teal` (#2D7C79) | Untuk elemen trust dan informasi |
| Highlight premium | `brand-gold` (#D4AF37) | Untuk badge featured/milestone donasi |
| Font heading | Plus Jakarta Sans (`font-display`) | Sudah terdefinisi di design system |
| Font body | Inter (`font-sans`) | Sudah terdefinisi di design system |
| Layout desktop | 8/12 + 4/12 grid | Memberikan ruang konten lebih luas, sidebar tetap proporsional |
| Sidebar | `sticky top-24` | Selalu terlihat saat scroll, meningkatkan konversi |

---

## Architecture

### Component Tree

```
CampaignDetail (page)
├── BreadcrumbNav (desktop) / BackButton (mobile)
├── [Main Grid: lg:grid-cols-12]
│   ├── [Left Column: lg:col-span-8]
│   │   ├── CampaignHeader
│   │   │   ├── CategoryBadge
│   │   │   └── CampaignTitle
│   │   ├── ImageCarousel
│   │   │   ├── OptimizedImage (×N)
│   │   │   ├── CarouselNavigation (prev/next arrows)
│   │   │   ├── DotIndicators
│   │   │   └── ZoomHintOverlay
│   │   ├── MobileDonationCard (hidden lg:hidden)
│   │   │   ├── ProgressSection
│   │   │   ├── StatsRow (donors + days)
│   │   │   └── ActionButtons (donate + share)
│   │   ├── ContentTabs
│   │   │   ├── TabBar (Deskripsi | Update | Donatur)
│   │   │   ├── DescriptionPanel
│   │   │   ├── UpdatesPanel
│   │   │   │   └── UpdateTimelineItem (×N)
│   │   │   └── DonorsPanel
│   │   │       └── DonorListItem (×N)
│   │   └── TrustBanner
│   └── [Right Column: lg:col-span-4]
│       └── DonationSidebar (sticky)
│           ├── ProgressSection
│           ├── StatsRow
│           ├── ActionButtons
│           └── OrganizerCard
└── StickyBottomBar (mobile only, fixed)
└── ImageLightbox (portal/overlay)
```

### Data Flow

```
useParams(slug)
    ↓
fetchPublicCampaignDetail(slug)   [async, useEffect]
    ↓
State: { campaign, updates, donations, loading, error }
    ↓
Derived: progress = calculateProgress(current, target)
         daysLeft = getDaysLeft(end_date)
         bannerImages = campaign.images || [primaryImage]
    ↓
Render tree (conditional on loading/error/null/data states)
```

---

## Components and Interfaces

### 1. CampaignDetail (Page Component)

File: `src/pages/public/CampaignDetail.tsx`

**State:**
```typescript
const [activeTab, setActiveTab] = useState<'deskripsi' | 'update' | 'donatur'>('deskripsi');
const [campaign, setCampaign] = useState<Campaign | null>(null);
const [updates, setUpdates] = useState<CampaignUpdateRow[]>([]);
const [donations, setDonations] = useState<CampaignDonationSummary[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [activeSlide, setActiveSlide] = useState(0);
const [isLightboxOpen, setIsLightboxOpen] = useState(false);
```

**Derived values:**
```typescript
const progress = useMemo(
  () => calculateProgress(campaign?.current_amount ?? 0, campaign?.target_amount ?? 0),
  [campaign]
);
const daysLeft = getDaysLeft(campaign?.end_date ?? campaign?.deadline);
const bannerImages: string[] = campaign.images?.length > 0
  ? campaign.images
  : [campaign.banner_url || getCampaignPrimaryImage(campaign)];
```

### 2. ImageCarousel

**Props interface (inline dalam CampaignDetail):**
```typescript
interface CarouselProps {
  images: string[];          // Array URL gambar
  activeSlide: number;       // Index slide aktif
  campaignTitle: string;     // Untuk alt text
  onSlideChange: (index: number) => void;
  onOpenLightbox: () => void;
}
```

**Behavior:**
- Aspect ratio `aspect-video` (16:9) selalu dipertahankan
- Transisi antar slide: `opacity` fade dengan `duration-500`
- Tombol prev/next: `h-11 w-11` (≥44px) untuk touch target
- Dot indicators: pill shape, aktif = lebar `w-6`, inaktif = `w-2`
- Hover overlay: `ZoomIn` icon muncul dengan transisi smooth

### 3. DonationSidebar / MobileDonationCard

**Shared data:**
```typescript
interface DonationDisplayProps {
  currentAmount: number;
  targetAmount: number;
  progress: number;          // 0–100, sudah dihitung
  donorCount: number;
  daysLeft: number | null;
  campaignSlug: string;
  campaignTitle: string;
  campaignUrl: string;
}
```

**Progress Bar:**
- Track: `h-2.5 rounded-full bg-gray-100`
- Fill: `h-full rounded-full bg-brand-green transition-all duration-700`
- Width: `style={{ width: \`${progress}%\` }}`

**CTA Button:**
- Primary: `bg-brand-green hover:bg-[#0d4d38] text-white rounded-xl py-4 font-bold`
- Transisi: `transition-all duration-200`

### 4. ContentTabs

**Tab configuration:**
```typescript
const TABS = [
  { id: 'deskripsi', label: 'Deskripsi' },
  { id: 'update',    label: 'Update' },
  { id: 'donatur',   label: 'Donatur' },
] as const;
```

**Active indicator:** underline `h-0.5 bg-brand-green` di bawah tab aktif, dengan `rounded-t-full`

**Tab bar:** `sticky top-0 z-10 bg-white border-b border-gray-100`

### 5. TrustBanner

**Visual spec:**
- Background: `bg-emerald-50 border border-emerald-100`
- Icon: `ShieldCheck` dari lucide-react, `text-brand-green`
- Layout: flex row (desktop) / flex col (mobile)

### 6. StickyBottomBar (Mobile)

**Visual spec:**
- Position: `fixed inset-x-0 bottom-0 z-40`
- Background: `bg-white/95 backdrop-blur-sm border-t border-gray-200`
- Safe area: `safe-pb` padding
- Content: progress info (kiri) + CTA button (kanan)

### 7. OrganizerCard

**Visual spec:**
- Menampilkan nama "Yayasan Sekolah Tanah Air"
- Badge verifikasi: `CheckCircle2` icon + teks "Terverifikasi" dengan warna `brand-teal`
- Background: `bg-white border border-gray-100 rounded-2xl`

---

## Data Models

### Campaign (dari `src/lib/supabase.ts`)

```typescript
interface Campaign {
  id: string;
  title: string;
  slug: string;
  short_description: string;
  full_description: string;       // HTML string, dirender dengan dangerouslySetInnerHTML
  target_amount: number;
  current_amount: number;
  thumbnail_url: string;
  banner_url: string;
  category_id: string;
  category_name: string;
  status: string;
  deadline: string;
  is_featured: boolean;
  created_at: string;
  donor_count: number;
  start_date?: string;
  end_date?: string;
  images: string[];               // Array URL gambar untuk carousel
}
```

### CampaignUpdateRow

```typescript
interface CampaignUpdateRow {
  id: string;
  campaign_id: string;
  title: string;
  content: string;                // HTML string
  update_type: string;
  image_url: string | null;
  created_at: string;
}
```

### CampaignDonationSummary

```typescript
type CampaignDonationSummary = {
  donor_name_display: string;
  amount: number;
  message: string | null;
  created_at: string;
  is_anonymous: boolean;
}
```

### Computed Values

```typescript
// Progress: 0–100, capped
calculateProgress(current: number, target: number): number

// Days remaining: null jika end_date tidak ada, 0 jika sudah lewat
getDaysLeft(endDate?: string | null): number | null

// Currency: format IDR tanpa desimal
formatCurrency(amount: number): string  // → "Rp 1.500.000"
```

---

## Layout & Visual Hierarchy

### Desktop Layout (lg+)

```
┌─────────────────────────────────────────────────────────────┐
│  [brand-cream background]                                    │
│  ┌─ Breadcrumb ──────────────────────────────────────────┐  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌─ 8 cols ──────────────────────┐ ┌─ 4 cols (sticky) ──┐  │
│  │  CategoryBadge                │ │  Dana Terkumpul     │  │
│  │  H1 Title (text-4xl/5xl)      │ │  Rp X.XXX.XXX      │  │
│  │                               │ │  ████████░░ 72%     │  │
│  │  ┌─ ImageCarousel ──────────┐ │ │  👥 42  ⏱ 14 hari  │  │
│  │  │  [16:9 aspect ratio]     │ │ │  ─────────────────  │  │
│  │  │  ← prev    next →        │ │ │  [Donasi Sekarang]  │  │
│  │  │  ● ○ ○ (dots)            │ │ │  [Salin] [WA]       │  │
│  │  └──────────────────────────┘ │ │                     │  │
│  │                               │ │  ─────────────────  │  │
│  │  ┌─ ContentTabs ────────────┐ │ │  Penggalang Dana    │  │
│  │  │  Deskripsi Update Donatur│ │ │  Yayasan STA ✓      │  │
│  │  │  ─────────────────────── │ │ └─────────────────────┘  │
│  │  │  [Tab content area]      │ │                          │
│  │  └──────────────────────────┘ │                          │
│  │                               │                          │
│  │  ┌─ TrustBanner ────────────┐ │                          │
│  │  │  🛡 Komitmen Transparansi │ │                          │
│  │  └──────────────────────────┘ │                          │
│  └───────────────────────────────┘                          │
└─────────────────────────────────────────────────────────────┘
```

### Mobile Layout (<lg)

```
┌─────────────────────────┐
│  ← Kembali ke campaign  │
│                         │
│  CategoryBadge          │
│  H1 Title (text-3xl)    │
│                         │
│  ┌─ ImageCarousel ────┐ │
│  │  [16:9]            │ │
│  └────────────────────┘ │
│                         │
│  ┌─ MobileDonationCard┐ │
│  │  Rp X.XXX.XXX      │ │
│  │  ████████░░ 72%    │ │
│  │  👥 42  ⏱ 14 hari  │ │
│  │  [Donasi Sekarang] │ │
│  │  [Salin] [WA]      │ │
│  └────────────────────┘ │
│                         │
│  ┌─ ContentTabs ──────┐ │
│  │  Deskripsi Update  │ │
│  │  Donatur           │ │
│  │  ─────────────     │ │
│  │  [Tab content]     │ │
│  └────────────────────┘ │
│                         │
│  ┌─ TrustBanner ──────┐ │
│  │  🛡 Transparansi   │ │
│  └────────────────────┘ │
│                         │
│  [pb-36 spacer]         │
├─────────────────────────┤
│  STICKY BOTTOM BAR      │
│  72% · Rp X.XXX [Donasi]│
└─────────────────────────┘
```

---

## Color System & Typography

### Color Tokens

| Token | Hex | Penggunaan |
|---|---|---|
| `brand-cream` | #FBFAF8 | Background halaman utama |
| `brand-green` | #115E45 | CTA button, progress bar fill, tab active indicator, badge |
| `brand-teal` | #2D7C79 | Verifikasi badge, link hover, secondary accent |
| `brand-gold` | #D4AF37 | Featured badge, milestone highlight (opsional) |
| `gray-900` | #111827 | Judul, teks utama |
| `gray-600` | #4B5563 | Teks sekunder, label |
| `gray-400` | #9CA3AF | Ikon dekoratif, placeholder |
| `gray-100` | #F3F4F6 | Progress bar track, divider |
| `emerald-50` | #ECFDF5 | Trust banner background |
| `white` | #FFFFFF | Card background, sidebar |

### Typography Scale

| Elemen | Class | Keterangan |
|---|---|---|
| Page title (desktop) | `font-display text-4xl lg:text-5xl font-extrabold` | Plus Jakarta Sans |
| Page title (mobile) | `font-display text-3xl font-extrabold` | Plus Jakarta Sans |
| Section heading | `font-display text-lg font-bold` | Plus Jakarta Sans |
| Amount large | `font-display text-4xl font-bold text-brand-green` | Plus Jakarta Sans |
| Body text | `font-sans text-base text-gray-700 leading-relaxed` | Inter |
| Label/caption | `font-sans text-sm font-semibold text-gray-500` | Inter |
| Badge | `font-sans text-xs font-bold uppercase tracking-widest` | Inter |

---

## Component Detail Specifications

### Image Carousel

```
Visual States:
  - Loading: OptimizedImage menampilkan blur-up placeholder (built-in)
  - Single image: arrows + dots hidden, zoom hint tetap aktif
  - Multiple images: arrows + dots visible
  - Hover (desktop): ZoomIn icon fade-in di tengah gambar

Interaction:
  - Click gambar → buka ImageLightbox
  - Click prev/next → ganti slide (circular)
  - Click dot → langsung ke slide tersebut
  - Keyboard (dalam lightbox): ← → untuk navigasi, Esc untuk tutup

Accessibility:
  - Setiap gambar: alt="${campaign.title} - Foto ${idx + 1}"
  - Tombol prev: aria-label="Foto sebelumnya"
  - Tombol next: aria-label="Foto berikutnya"
  - Dot buttons: aria-label="Foto ${idx + 1}"
  - Container: role="region" aria-label="Galeri foto campaign"
```

### Donation Sidebar (Desktop)

```
Layout (sticky top-24):
  ┌─────────────────────────┐
  │  Dana Terkumpul         │  ← label: text-sm text-gray-500
  │  Rp 1.500.000           │  ← text-4xl font-bold text-brand-green
  │  dari Rp 2.000.000      │  ← text-sm text-gray-500
  │                         │
  │  ████████████░░░░ 75%   │  ← h-2.5 progress bar
  │                         │
  │  👥 42 Donatur  ⏱ 14hr  │  ← stats row
  │  ─────────────────────  │
  │  [  Donasi Sekarang  ]  │  ← bg-brand-green, full width
  │  [Salin Link] [WA Share]│  ← secondary actions
  └─────────────────────────┘
  ┌─────────────────────────┐
  │  Penggalang Dana        │  ← label
  │  Yayasan Sekolah        │  ← font-bold
  │  Tanah Air              │
  │  ✓ Terverifikasi        │  ← text-brand-teal
  └─────────────────────────┘
```

### Content Tabs

```
Tab Bar (sticky):
  [Deskripsi] [Update] [Donatur]
       ▔▔▔▔▔▔▔▔▔
  (active tab: brand-green underline)

Deskripsi Panel:
  - prose class untuk HTML rendering
  - min-height: 400px untuk konsistensi layout

Update Panel (timeline):
  ┌─ border-l-2 border-gray-100 ──────────────────┐
  │ ● (dot: bg-brand-green)                        │
  │   12 Januari 2025 · Laporan                    │
  │   Judul Update                                 │
  │   [HTML content]                               │
  │   [image jika ada]                             │
  └────────────────────────────────────────────────┘

Donatur Panel:
  ┌─ flex items-start gap-4 ──────────────────────┐
  │ [A]  Anonim / Nama Donatur                     │
  │      Berdonasi Rp 100.000                      │
  │      12 Januari 2025                           │
  │      "Pesan donatur jika ada"                  │
  └────────────────────────────────────────────────┘
```

### Trust Banner

```
┌─ bg-emerald-50 border border-emerald-100 rounded-2xl ─────┐
│  🛡  Komitmen Transparansi                                  │
│      100% donasi disalurkan sesuai target. Setiap          │
│      perkembangan lapangan akan dipublikasikan secara      │
│      terbuka melalui tab update.                           │
└────────────────────────────────────────────────────────────┘
```

### Sticky Bottom Bar (Mobile)

```
┌─ fixed bottom-0 bg-white/95 backdrop-blur-sm ─────────────┐
│  Terkumpul 75%          [  Donasi Sekarang  ]              │
│  Rp 1.500.000                                              │
│  [safe-area padding]                                       │
└────────────────────────────────────────────────────────────┘
```

---

## Responsive Design

### Breakpoint Strategy

| Breakpoint | Layout | Perubahan Utama |
|---|---|---|
| `< sm` (< 640px) | 1 kolom | Back button, font lebih kecil, padding minimal |
| `sm` (640px+) | 1 kolom | Breadcrumb muncul, padding lebih besar |
| `lg` (1024px+) | 2 kolom | Sidebar muncul, MobileDonationCard hilang, StickyBottomBar hilang |
| `xl` (1280px+) | 2 kolom | Spacing lebih lega |

### Responsive Class Mapping

```typescript
// Container utama
"min-h-screen bg-brand-cream pb-36 lg:pb-24"

// Grid
"grid gap-8 lg:grid-cols-12 lg:gap-12"

// Left column
"space-y-8 lg:col-span-8 lg:space-y-12"

// Right column (sidebar)
"hidden lg:block lg:col-span-4"

// Title
"font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-gray-900"

// Mobile donation card
"lg:hidden"  // visible only below lg

// Sticky bottom bar
"fixed inset-x-0 bottom-0 z-40 lg:hidden"
```

---

## State Management

### Loading States

```typescript
// 1. Loading
if (loading) → render LoadingState component
  - Background + padding dipertahankan
  - Skeleton atau teks "Memuat detail campaign..."

// 2. Error
if (error) → render ErrorState component
  - Pesan error deskriptif
  - Layout dasar dipertahankan

// 3. Not Found
if (!campaign) → render NotFoundState component
  - "Campaign tidak ditemukan"
  - Link kembali ke /campaigns

// 4. Success
render full CampaignDetail layout
```

### Carousel State

```typescript
// activeSlide: index gambar yang sedang ditampilkan
// Circular navigation: prev dari 0 → length-1, next dari length-1 → 0
// Sync dengan ImageLightbox melalui shared activeSlide state
```

### Tab State

```typescript
// activeTab: 'deskripsi' | 'update' | 'donatur'
// Default: 'deskripsi'
// Tidak perlu persist ke URL untuk simplisitas
```

---

## Error Handling

### Data Fetching Errors

```typescript
try {
  const detail = await fetchPublicCampaignDetail(slug);
  // handle success
} catch (loadError) {
  setError(loadError instanceof Error ? loadError.message : 'Gagal memuat detail campaign.');
}
```

### Image Errors

- `OptimizedImage` menangani error gambar secara internal dengan menampilkan placeholder SVG
- Fallback image: `getCampaignPrimaryImage` menggunakan `picsum.photos` sebagai last resort

### Null/Undefined Guards

```typescript
// Semua optional chaining untuk data campaign
campaign?.current_amount ?? 0
campaign?.donor_count ?? 0
campaign?.end_date ?? campaign?.deadline
campaign?.images ?? []
```

### Share API Fallback

```typescript
// Clipboard API mungkin tidak tersedia di semua browser
if (typeof navigator !== 'undefined' && navigator.clipboard) {
  void navigator.clipboard.writeText(window.location.href);
}
```

---

## Testing Strategy

### Dual Testing Approach

Strategi pengujian menggunakan dua lapisan komplementer:

1. **Unit/Example Tests** — memverifikasi perilaku spesifik dengan contoh konkret
2. **Property-Based Tests** — memverifikasi properti universal yang berlaku untuk semua input valid

### Unit Tests (Example-Based)

Fokus pada:
- Rendering state: loading, error, not-found, success
- Conditional rendering: navigation buttons (single vs multiple images), empty states
- Tab switching: klik tab mengubah konten yang ditampilkan
- Accessibility attributes: aria-label pada tombol interaktif
- Link correctness: CTA mengarah ke `/donate/:slug`
- Responsive classes: sticky bottom bar tersembunyi di desktop

### Property-Based Tests

Library yang digunakan: **fast-check** (TypeScript/JavaScript)

Konfigurasi: minimum **100 iterasi** per property test.

Tag format: `// Feature: campaign-detail-redesign, Property N: <property_text>`

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Progress selalu dalam rentang valid

*For any* nilai `current_amount` ≥ 0 dan `target_amount` > 0, fungsi `calculateProgress(current, target)` SHALL mengembalikan nilai integer dalam rentang [0, 100].

**Validates: Requirements 3.3**

### Property 2: Progress mencapai maksimum saat current ≥ target

*For any* nilai `current_amount` ≥ `target_amount` > 0, fungsi `calculateProgress(current, target)` SHALL mengembalikan tepat 100.

**Validates: Requirements 3.3**

### Property 3: Format mata uang selalu menghasilkan string IDR valid

*For any* bilangan bulat non-negatif `amount`, fungsi `formatCurrency(amount)` SHALL mengembalikan string yang diawali dengan "Rp" dan merepresentasikan nilai numerik yang benar dalam format Rupiah Indonesia.

**Validates: Requirements 3.1, 3.2**

### Property 4: getDaysLeft mengembalikan null untuk input null

*For any* pemanggilan `getDaysLeft(null)` atau `getDaysLeft(undefined)`, fungsi SHALL mengembalikan `null`.

**Validates: Requirements 3.5**

### Property 5: getDaysLeft mengembalikan nilai non-negatif untuk tanggal masa depan

*For any* string tanggal yang merepresentasikan hari di masa depan (setelah hari ini), fungsi `getDaysLeft(dateString)` SHALL mengembalikan bilangan bulat > 0.

**Validates: Requirements 3.4**

### Property 6: Visibilitas navigasi carousel ditentukan oleh jumlah gambar

*For any* array gambar dengan panjang > 1, komponen ImageCarousel SHALL merender tombol navigasi (prev/next) dan dot indicators. *For any* array gambar dengan panjang = 1, komponen SHALL tidak merender elemen navigasi tersebut.

**Validates: Requirements 2.2, 2.3**

### Property 7: Setiap gambar carousel memiliki alt text yang tidak kosong

*For any* campaign dengan N gambar (N ≥ 1), semua N elemen `<img>` yang dirender dalam ImageCarousel SHALL memiliki atribut `alt` yang tidak kosong dan deskriptif.

**Validates: Requirements 9.5**

### Property 8: Setiap tab yang diklik menjadi aktif dan menampilkan kontennya

*For any* tab dalam himpunan {deskripsi, update, donatur}, setelah pengguna mengklik tab tersebut, tab SHALL ditandai sebagai aktif (memiliki indikator visual) dan konten panel yang sesuai SHALL ditampilkan.

**Validates: Requirements 4.2**

### Property 9: Setiap donatur dalam daftar menampilkan semua field wajib

*For any* daftar donatur dengan N entri (N ≥ 1), setiap entri yang dirender SHALL menampilkan: nama donatur, jumlah donasi yang diformat sebagai IDR, dan tanggal donasi.

**Validates: Requirements 4.6**

