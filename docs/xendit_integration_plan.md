# Dokumentasi Integrasi Xendit - Sekolah Tanah Air

Dokumen ini menjelaskan arsitektur dan langkah-langkah implementasi integrasi pembayaran Xendit menggunakan **Supabase Edge Functions**. Pendekatan ini dipilih untuk menjaga keamanan *Secret Key* tanpa harus membangun server backend terpisah.

## 1. Arsitektur Integrasi

Sistem menggunakan pola **Serverless Proxy**:

1.  **Frontend (Vite)** memanggil Edge Function `create-invoice`.
2.  **Edge Function** melakukan autentikasi ke Xendit (Server-to-Server) dan mengembalikan URL pembayaran.
3.  **User** melakukan pembayaran di halaman Xendit.
4.  **Xendit** mengirimkan Webhook ke Edge Function `xendit-webhook` saat pembayaran sukses.
5.  **Edge Function** mengupdate status tabel `donations` di database Supabase.

---

## 2. Struktur Folder & File

Pengembangan diarahkan pada folder `supabase/functions/`:

```text
supabase/
└── functions/
    ├── create-xendit-invoice/
    │   └── index.ts        # Logika pembuatan invoice & validasi nominal
    └── xendit-webhook/
        └── index.ts        # Handler notifikasi dari Xendit (Update DB)
```

---

## 3. Persiapan Keamanan (Environment Variables)

Variabel berikut harus diset di dashboard Supabase atau via CLI:

| Variabel | Sumber | Fungsi |
| :--- | :--- | :--- |
| `XENDIT_SECRET_KEY` | Xendit Dashboard | Autentikasi API ke Xendit |
| `XENDIT_WEBHOOK_TOKEN` | Xendit Dashboard | Verifikasi bahwa webhook benar dari Xendit |
| `SUPABASE_URL` | Supabase Dashboard | Koneksi internal database |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard | Izin untuk mengupdate tabel `donations` secara bypass RLS |

---

## 4. Konsep Kode (Vibe Coding Reference)

### A. Create Invoice Function (`create-xendit-invoice`)
Fungsi ini dipanggil oleh Frontend saat user klik "Donasi Sekarang".

**Tugas Utama:**
- Menerima `campaign_id`, `amount`, `donor_name`, dan `donor_email`.
- Membuat record awal di tabel `donations` dengan status `pending`.
- Memanggil API Xendit `POST https://api.xendit.co/v2/invoices`.
- Mengembalikan `invoice_url` ke user.

### B. Webhook Handler (`xendit-webhook`)
Fungsi ini bersifat pasif, menunggu "ketukan" dari server Xendit.

**Tugas Utama:**
- Memvalidasi header `x-callback-token` agar sesuai dengan rahasia sistem.
- Mengambil `external_id` (ID Donasi) dari payload Xendit.
- Melakukan SQL Update: `UPDATE donations SET status = 'success', paid_at = now() WHERE id = external_id`.

---

## 5. Langkah Implementasi (Metode Vibe Coder)

### Step 1: Inisialisasi Fungsi
Jalankan perintah berikut di terminal (jika sudah ada Supabase CLI):
```bash
supabase functions new create-xendit-invoice
supabase functions new xendit-webhook
```

### Step 2: Integrasi Frontend
Gunakan `supabase.functions.invoke()` pada komponen `Donate.tsx`:
```typescript
const { data, error } = await supabase.functions.invoke('create-xendit-invoice', {
  body: { campaignId, amount, donorEmail }
})
if (data?.invoice_url) window.location.href = data.invoice_url;
```

### Step 3: Pengaturan Webhook di Xendit
Masukkan URL fungsi webhook Anda ke Dashboard Xendit:
`https://[PROJECT_ID].supabase.co/functions/v1/xendit-webhook`

---

## 6. Checklist Pengujian
- [ ] Simulasi pembayaran di Xendit Sandbox.
- [ ] Cek tabel `donations` apakah status berubah otomatis.
- [ ] Cek progress bar di Beranda apakah sudah bertambah setelah pembayaran sukses.

---
**Catatan:** Dokumentasi ini bersifat hidup (*living document*) dan akan diperbarui seiring dengan iterasi kode.
