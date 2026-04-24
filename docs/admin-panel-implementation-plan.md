# Admin Panel Implementation Plan

## Status

Dokumen perencanaan. Belum diimplementasikan.

## Context

Prioritas produk saat ini adalah perbaikan tampilan publik dan funnel konversi:

1. `Campaign Detail`
2. `Donate`
3. `Home`
4. `Campaigns`
5. `About` dan `Contact`
6. Refinement `Laporkan Sekolah`

Admin panel tetap perlu direncanakan dari sekarang agar kebutuhan konten, trust, dan analytics untuk area publik tidak buntu di belakang. Dokumen ini menjadi acuan implementasi admin panel setelah kebutuhan paling kritis di sisi publik stabil.

## Goals

Admin panel harus menjadi alat operasional untuk:

1. Mengelola konten campaign dengan kualitas storytelling yang lebih kuat.
2. Mengelola struktur trust dan transparency yang tampil di halaman publik.
3. Mengelola update campaign, verifikasi, dan status operasional.
4. Menyediakan dashboard KPI yang relevan untuk evaluasi redesign publik.
5. Mengurangi pekerjaan manual admin yang saat ini berpotensi tersebar di chat, spreadsheet, dan copy dokumen.

## Non-Goals

Admin panel bukan tempat untuk:

1. Menentukan kebijakan bisnis dari nol.
2. Menggantikan proses approval internal lintas tim.
3. Menjadi sumber analytics utama sebelum event tracking publik tersedia.
4. Menjadi fokus sprint utama sebelum funnel publik selesai dibenahi.

## Guiding Principles

1. `Public-first`
   Semua modul admin harus mendukung kualitas halaman publik, bukan berdiri sendiri.

2. `CMS before automation`
   Isi data dan workflow inti harus benar dulu sebelum menambah otomasi lanjutan.

3. `Structured content`
   Campaign tidak cukup hanya punya judul, deskripsi, dan target. Admin perlu field terstruktur agar tampilan publik bisa konsisten dan kuat secara UX.

4. `Trust by design`
   Data trust harus bisa dikelola secara eksplisit, bukan ditulis manual di banyak tempat.

5. `Analytics-ready`
   Dashboard KPI admin baru bernilai jika event dari sisi publik sudah dirancang dan dikirim dengan benar.

## Existing Surfaces In Repo

Saat ini repo sudah memiliki placeholder admin berikut:

1. `Dashboard`
   [src/pages/AdminDashboard.tsx](/Users/ibnufajar/Documents/project/sekolah-tanah-air/src/pages/AdminDashboard.tsx)

2. `Campaign management`
   [src/pages/admin/AdminCampaigns.tsx](/Users/ibnufajar/Documents/project/sekolah-tanah-air/src/pages/admin/AdminCampaigns.tsx)

3. `Content management`
   [src/pages/admin/AdminContent.tsx](/Users/ibnufajar/Documents/project/sekolah-tanah-air/src/pages/admin/AdminContent.tsx)

4. `Settings`
   [src/pages/admin/AdminSettings.tsx](/Users/ibnufajar/Documents/project/sekolah-tanah-air/src/pages/admin/AdminSettings.tsx)

Ada juga route admin donor dan transaksi yang bisa dipakai sebagai titik pengembangan berikutnya:

1. [src/pages/admin/AdminDonors.tsx](/Users/ibnufajar/Documents/project/sekolah-tanah-air/src/pages/admin/AdminDonors.tsx)
2. [src/pages/admin/AdminTransactions.tsx](/Users/ibnufajar/Documents/project/sekolah-tanah-air/src/pages/admin/AdminTransactions.tsx)

## Scope Recommendation

Admin panel dibagi menjadi 5 domain utama.

### 1. Campaign CMS

Tujuan:
Mengelola semua data yang dibutuhkan halaman `Campaign Detail`, `Donate`, kartu campaign, dan bagian highlight di `Home`.

Field minimum per campaign:

1. `identity`
   ID campaign, slug, judul, kategori, status publikasi, tanggal mulai, deadline.

2. `story`
   Deskripsi singkat, cerita utama, ringkasan masalah, siapa yang dibantu, kenapa mendesak.

3. `impact`
   Target nominal, current amount, target beneficiary, satuan dampak, preset nominal ke dampak.

4. `media`
   Thumbnail, hero image, galeri foto, caption bukti lapangan.

5. `trust`
   Status verifikasi, tanggal verifikasi, dokumen pendukung, catatan verifikator, label transparansi.

6. `publishing`
   Featured or not, urutan prioritas tampil, status untuk list campaign, CTA override bila perlu.

Kebutuhan UI admin:

1. List campaign dengan filter status, kategori, dan pencarian.
2. Wizard create/edit campaign.
3. Section khusus untuk impact mapping.
4. Section khusus untuk bukti dan trust.
5. Preview ringkas tampilan publik sebelum publish.

### 2. Campaign Updates And Proof

Tujuan:
Mengelola update penyaluran agar `Campaign Detail` memiliki proof architecture yang hidup.

Field minimum:

1. Campaign terkait.
2. Judul update.
3. Tanggal kejadian.
4. Ringkasan update.
5. Body lengkap.
6. Foto atau media bukti.
7. Jenis update: progress, milestone, penyaluran, kendala, penutupan.
8. Status publish.

Kebutuhan UI admin:

1. List update per campaign.
2. Editor update.
3. Lampiran media.
4. Preview urutan timeline publik.

Catatan:
Modul ini lebih tepat menjadi turunan dari `Campaign CMS` daripada berdiri sebagai tab berita generik.

### 3. Verification And Trust Operations

Tujuan:
Menyimpan status validasi yang nanti terlihat sebagai trust signal di halaman publik.

Status workflow yang direkomendasikan:

1. `draft`
2. `submitted`
3. `under_review`
4. `needs_revision`
5. `verified`
6. `published`
7. `rejected`
8. `closed`

Data minimum:

1. Sumber campaign.
2. Nama verifikator.
3. Tanggal submit.
4. Tanggal review.
5. Hasil review.
6. Catatan internal.
7. Catatan yang aman untuk ditampilkan publik.
8. Checklist bukti minimum.

Kebutuhan UI admin:

1. Queue review.
2. Detail review panel.
3. Tombol ubah status dengan audit trail ringan.
4. Ringkasan trust info yang akan muncul di publik.

### 4. Platform Content And Settings

Tujuan:
Mengelola informasi global yang memengaruhi trust dan konsistensi pengalaman publik.

Termasuk:

1. Kebijakan biaya platform.
2. Copy dan label secure checkout.
3. FAQ global.
4. Partner logos.
5. Contact information.
6. Copy trust di `Donate`, `About`, dan `Campaign Detail`.
7. Feature flags sederhana untuk elemen publik tertentu.

Catatan penting:
Nilai kebijakan bukan diciptakan admin panel. Kebijakan datang dari keputusan tim product atau ops, lalu admin panel menjadi tempat mengelolanya secara konsisten.

### 5. Analytics And Operations Dashboard

Tujuan:
Memberi visibilitas pada dampak redesign publik.

Dependencies:

Dashboard ini hanya layak diimplementasikan setelah event tracking di area publik tersedia.

KPI minimum:

1. `home_hero_cta_click`
2. `campaign_card_click`
3. `campaign_detail_donate_click`
4. `donate_amount_select`
5. `donate_payment_method_select`
6. `donate_submit_success`
7. `report_school_start`
8. `report_school_step_complete`
9. `report_school_submit_success`
10. Conversion rate mobile vs desktop

Visualisasi minimum:

1. Funnel campaign detail ke donate.
2. Funnel donate step ke submit.
3. Completion rate `Laporkan Sekolah`.
4. Top campaign by clicks vs donations.
5. Drop-off tertinggi per device.

## Ownership Model

Pembagian tanggung jawab yang direkomendasikan:

1. `Product`
   Menentukan field, workflow, KPI, dan definisi status.

2. `Operations`
   Mengisi data verifikasi, update penyaluran, dan menjaga kualitas data campaign.

3. `Content`
   Menulis narasi campaign, short description, dan update publik.

4. `Engineering`
   Mengimplementasikan panel, data model, permission, dan integrasi analytics.

Admin panel adalah alat bersama, bukan pemilik keputusan strategis.

## Data Readiness Needed Before Build

Sebelum admin panel benar-benar diimplementasikan, tim perlu mendefinisikan:

1. Template narasi campaign berbasis manusia.
2. Skema mapping nominal ke dampak.
3. Definisi biaya platform dan cara tampilnya.
4. Template update penyaluran.
5. Definisi status verifikasi dan siapa yang boleh mengubahnya.
6. Daftar KPI yang ingin dipantau setelah redesign publik.

Tanpa ini, panel akan selesai secara UI tetapi tetap tidak usable secara operasional.

## Recommended Rollout

### Phase A

Fokus:
Menyelesaikan redesign publik dulu.

Output:

1. Struktur field yang dibutuhkan publik tervalidasi.
2. Event tracking plan siap.
3. Kebutuhan admin panel final lebih stabil.

### Phase B

Fokus:
`Campaign CMS` dan `Updates`.

Output:

1. Admin bisa membuat dan mengedit campaign terstruktur.
2. Admin bisa mengisi impact mapping.
3. Admin bisa menulis update penyaluran.

### Phase C

Fokus:
`Verification` dan `Global Settings`.

Output:

1. Trust workflow berjalan.
2. Fee policy dan global trust copy bisa dikelola.
3. Partner, FAQ, dan info kontak lebih konsisten.

### Phase D

Fokus:
`Analytics dashboard`.

Output:

1. KPI publik bisa dibaca dari admin.
2. Redesign bisa dievaluasi dengan data, bukan asumsi.

## Suggested Backlog

### Epic 1. Campaign CMS Foundation

1. Buat skema field campaign terstruktur.
2. Ubah form campaign menjadi wizard berbasis section.
3. Tambah field impact presets.
4. Tambah field trust dan verification summary.
5. Tambah preview card dan preview detail ringkas.

### Epic 2. Campaign Update Management

1. Buat CRUD update per campaign.
2. Tambah upload media untuk proof.
3. Tambah timeline ordering.
4. Tambah publish and unpublish status.

### Epic 3. Verification Workflow

1. Definisikan state machine status campaign.
2. Buat queue review.
3. Buat detail review panel.
4. Simpan audit info dasar.

### Epic 4. Platform Settings

1. Kelola kebijakan biaya platform.
2. Kelola FAQ trust.
3. Kelola partner data.
4. Kelola contact information.
5. Kelola copy transparency global.

### Epic 5. Analytics Dashboard

1. Definisikan event taxonomy.
2. Kirim event dari halaman publik.
3. Simpan agregasi KPI.
4. Buat chart funnel dan trend.

## Acceptance Criteria Per Phase

### Phase B accepted if:

1. Admin dapat membuat campaign tanpa menulis semua konten dalam satu textarea panjang.
2. Public UI dapat mengambil data impact dan trust dari struktur yang konsisten.
3. Update penyaluran bisa tampil dalam format timeline.

### Phase C accepted if:

1. Status campaign bisa dibedakan jelas antara internal review dan public publish.
2. Copy trust global tidak lagi hardcoded di banyak tempat.
3. Fee policy dan contact info dapat diperbarui tanpa edit kode.

### Phase D accepted if:

1. Tim dapat membandingkan baseline sebelum dan sesudah redesign publik.
2. Funnel drop-off dapat diidentifikasi per halaman dan per device.
3. Dashboard menunjukkan metrik yang dapat ditindaklanjuti, bukan vanity metrics.

## Implementation Notes For This Repo

Berdasarkan struktur repo saat ini, arah pengembangan yang paling masuk akal:

1. `AdminCampaigns` menjadi pusat `Campaign CMS`, bukan sekadar daftar dan modal statis.
2. `AdminContent` dipersempit ke konten global dan partner, bukan semua hal.
3. `AdminDashboard` ditahan sebagai layer visual sampai event tracking publik siap.
4. `AdminSettings` dipakai untuk konfigurasi global yang benar-benar reusable.

## Recommended Sequence After Public UI Work

1. Finalisasi field requirement dari hasil redesign publik.
2. Rapikan model data campaign dan update.
3. Implementasi `Campaign CMS`.
4. Implementasi `Verification` dan `Settings`.
5. Implementasi analytics ingestion dan dashboard.

## Summary

Admin panel memang diperlukan untuk menampung dependency non-code seperti narasi campaign, impact mapping, update penyaluran, trust status, dan KPI. Tetapi implementasinya harus diposisikan sebagai fase setelah public UI cukup matang, supaya panel yang dibangun benar-benar melayani kebutuhan produk yang sudah tervalidasi.
