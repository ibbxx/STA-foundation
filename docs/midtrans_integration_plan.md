# Dokumentasi Integrasi Midtrans - Sekolah Tanah Air

Dokumen ini menjelaskan rencana arsitektur integrasi pembayaran **Midtrans** pada project Sekolah Tanah Air, termasuk analisis kompatibilitas dengan **Vercel Tier Gratis** dan **Supabase Edge Functions**.

---

## 1. Analisis Kompatibilitas Vercel Tier Gratis

### Kesimpulan: ✅ Aman Digunakan

Vercel Tier Gratis (Hobby Plan) **tetap sangat aman dan mampu** untuk menangani integrasi pembayaran Midtrans.

### 1.1 Keamanan & Protokol (HTTPS)

Midtrans **wajib** menggunakan protokol HTTPS untuk pengiriman data transaksi dan Webhook.

- Di Vercel, semua domain (`.vercel.app` maupun domain kustom) secara otomatis mendapatkan **SSL gratis (HTTPS)** yang diperbarui otomatis.
- Ini memenuhi syarat keamanan penuh dari Midtrans tanpa biaya tambahan.

### 1.2 Batasan Serverless Timeout

| Aspek | Vercel Hobby | Kebutuhan Midtrans |
| :--- | :--- | :--- |
| Execution Timeout | 10 detik | ~0.5 – 1.5 detik |
| **Status** | **✅ Sangat Cukup** | — |

Proses meminta `snap_token` ke server Midtrans atau memproses webhook biasanya hanya memakan waktu **0.5 hingga 1.5 detik**.

### 1.3 Kuota Penggunaan

| Resource | Batas Gratis | Estimasi Penggunaan |
| :--- | :--- | :--- |
| Bandwidth | 100 GB/bulan | Sangat rendah untuk website yayasan |
| Serverless Invocations | 100.000/hari | Sangat longgar |
| **Status** | **✅ Sangat Longgar** | — |

### 1.4 Catatan Ketentuan Layanan (ToS)

- Vercel Hobby Tier ditujukan untuk proyek **non-komersial/personal**.
- Karena Sekolah Tanah Air adalah organisasi sosial/donasi (bukan toko online komersial), ini masih aman dalam kebijakan Vercel.
- Jika traffic melonjak tinggi, cukup upgrade ke **Vercel Pro** ($20/bulan) tanpa perlu mengubah kode.

---

## 2. Rekomendasi Arsitektur Terbaik

> [!TIP]
> **Rekomendasi Terbaik: Menggunakan Supabase Edge Functions (Pilihan 1)**
>
> Sangat disarankan untuk memilih **Pilihan 1 (Supabase Edge Functions)** untuk backend integrasi Midtrans, sedangkan Vercel difokuskan **hanya sebagai hosting frontend statis**.

### Mengapa ini adalah rekomendasi terbaik?

1. **Mengeliminasi Batasan Vercel Tier Gratis secara Total**
   Jika seluruh logika backend (pembuatan token & handling webhook) dipindahkan ke Supabase Edge Functions, maka Vercel Anda hanya bertugas menyajikan aset frontend statis (HTML, JS, CSS). 
   - Vercel tier gratis tidak perlu menjalankan *Serverless Execution* untuk pembayaran, sehingga Anda tidak perlu khawatir tentang batasan *Serverless Timeout* (10 detik) atau batas pemanggilan harian di Vercel.

2. **Konsistensi Arsitektur & Pola Kode**
   Project Anda saat ini sudah menggunakan Supabase Edge Functions (`create-pending-donation`) dan sebelumnya telah merancang skema pembayaran otomatis menggunakan pola ini (lihat `xendit_integration_plan.md`). Melanjutkan pola yang sama akan membuat kode Anda lebih rapi, konsisten, dan mudah dipelihara oleh developer lain.

3. **Latency Database yang Sangat Rendah**
   Saat webhook Midtrans mengirimkan notifikasi pembayaran sukses, sistem perlu memperbarui data di tabel `donations`. Karena Supabase Edge Functions berjalan langsung di infrastruktur Supabase, proses baca-tulis ke database dilakukan secara lokal dengan latency seminimal mungkin dan koneksi database yang lebih aman serta optimal.

4. **Kuota Gratis Supabase yang Sangat Besar**
   Supabase Hobby Tier memberikan kuota **500.000 eksekusi Edge Function per bulan** secara gratis. Ini lebih dari cukup untuk menangani puluhan ribu donasi setiap bulannya.

---

## 3. Pilihan Arsitektur Integrasi

Sistem menggunakan pola **Serverless Proxy** dengan dua opsi backend yang bisa dipilih:

### Pilihan 1: Supabase Edge Functions (⭐ Direkomendasikan)

Konsisten dengan arsitektur yang sudah direncanakan sebelumnya (lihat `xendit_integration_plan.md`).

**Flow:**

1. **Frontend (Vite di Vercel)** memanggil Supabase Edge Function `create-midtrans-token` via `supabase.functions.invoke()`.
2. **Edge Function (Deno)** memanggil API Midtrans Snap untuk membuat transaksi dan menghasilkan `snap_token` menggunakan Server Key yang disimpan di Supabase Env.
3. **Frontend** membuka modal Midtrans Snap menggunakan Snap JS.
4. **Midtrans** mengirimkan HTTP POST (Webhook) ke Edge Function `midtrans-webhook`.
5. **Edge Function** memverifikasi signature transaksi, lalu mengupdate status donasi di database Supabase menggunakan `SUPABASE_SERVICE_ROLE_KEY` (bypass RLS).

**Kelebihan:**

- Konsisten dengan kode donasi yang sudah ada (`create-pending-donation`).
- Serverless functions berjalan dekat dengan database Supabase → latency rendah.
- Vercel hanya fokus menyajikan file frontend statis (ringan, hemat kuota).
- Supabase Tier Gratis memberikan **500.000 panggilan Edge Function/bulan**.

### Pilihan 2: Vercel Serverless Functions (API Routes)

Menaruh logika backend Midtrans di folder `/api` Vercel (sudah ada `api/keepalive.js` sebagai contoh).

**Flow:**

1. Buat file `api/midtrans-token.js` dan `api/midtrans-webhook.js`.
2. Frontend memanggil `/api/midtrans-token` via `fetch()`.
3. Webhook Midtrans diarahkan ke `https://domain.com/api/midtrans-webhook`.
4. Endpoint webhook mengupdate database Supabase via client SDK.

**Kelebihan:**

- Bisa menggunakan SDK Node.js resmi (`midtrans-client`) secara native.
- Deploy frontend + backend tersinkronisasi dalam satu kali git push.
- Tidak perlu Supabase CLI untuk deploy backend.

### Perbandingan Arsitektur

| Aspek | Supabase Edge Functions | Vercel Serverless Functions |
| :--- | :--- | :--- |
| **Runtime** | Deno (TypeScript) | Node.js (JS/TS) |
| **SDK Midtrans** | Raw HTTP fetch / ESM import | NPM package (`midtrans-client`) |
| **Penyimpanan Key** | Dashboard Supabase | Dashboard Vercel |
| **Lokasi Code** | `/supabase/functions/` | `/api/` |
| **Deploy** | `supabase functions deploy` | Otomatis via git push |
| **Kuota Gratis** | 500K invocations/bulan | 100K invocations/hari |

---

## 4. Struktur Folder & File

### Pilihan 1 — Supabase Edge Functions

```text
supabase/
└── functions/
    ├── _shared/
    │   ├── http.ts             # Helper CORS & JSON response (sudah ada)
    │   └── turnstile.ts        # Verifikasi Cloudflare Turnstile (sudah ada)
    ├── create-pending-donation/ # Edge Function donasi yang sudah ada
    │   └── index.ts
    ├── create-midtrans-token/   # [BARU] Membuat snap_token Midtrans
    │   └── index.ts
    └── midtrans-webhook/        # [BARU] Handler notifikasi dari Midtrans
        └── index.ts
```

### Pilihan 2 — Vercel Serverless Functions

```text
api/
├── keepalive.js                 # Cron job yang sudah ada
├── midtrans-token.js            # [BARU] Membuat snap_token Midtrans
└── midtrans-webhook.js          # [BARU] Handler notifikasi dari Midtrans
```

---

## 5. Persiapan Keamanan (Environment Variables)

| Variabel | Sumber | Fungsi |
| :--- | :--- | :--- |
| `MIDTRANS_SERVER_KEY` | Midtrans Dashboard | Autentikasi Server-to-Server ke API Midtrans |
| `MIDTRANS_CLIENT_KEY` | Midtrans Dashboard | Digunakan di Frontend untuk Snap JS |
| `MIDTRANS_IS_PRODUCTION` | Konfigurasi | Toggle antara Sandbox dan Production |
| `SUPABASE_URL` | Supabase Dashboard | Koneksi ke database |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard | Update tabel `donations` (bypass RLS) |

### URL API Midtrans

| Environment | Snap API | Dashboard |
| :--- | :--- | :--- |
| **Sandbox** | `https://app.sandbox.midtrans.com/snap/v1/transactions` | `https://dashboard.sandbox.midtrans.com` |
| **Production** | `https://app.midtrans.com/snap/v1/transactions` | `https://dashboard.midtrans.com` |

---

## 6. Konsep Kode

### A. Frontend — Load Snap JS

Tambahkan di `index.html`:

```html
<!-- Sandbox -->
<script
  type="text/javascript"
  src="https://app.sandbox.midtrans.com/snap/snap.js"
  data-client-key="SB-Mid-client-XXXXXXX">
</script>
```

### B. Create Token Function (`create-midtrans-token`)

Fungsi ini dipanggil oleh Frontend saat user klik "Donasi Sekarang".

**Tugas Utama:**

- Menerima `campaign_id`, `amount`, `donor_name`, `donor_email`, `donor_phone`.
- Membuat record awal di tabel `donations` dengan `payment_status = 'pending'`.
- Memanggil API Midtrans Snap `POST /snap/v1/transactions`.
- Mengembalikan `snap_token` ke frontend.

**Contoh kode (Supabase Edge Function — Deno):**

```typescript
// create-midtrans-token/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { jsonResponse, corsHeaders } from '../_shared/http.ts';

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { campaign_id, amount, donor_name, donor_email, donor_phone, message, is_anonymous } =
      await request.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // 1. Buat record donasi pending
    const { data: donation, error: dbError } = await supabase
      .from('donations')
      .insert({
        campaign_id,
        donor_name,
        donor_email,
        donor_phone,
        amount,
        message,
        is_anonymous,
        payment_status: 'pending',
      })
      .select('id')
      .single();

    if (dbError) throw dbError;

    // 2. Minta snap_token ke Midtrans
    const serverKey = Deno.env.get('MIDTRANS_SERVER_KEY') ?? '';
    const isProduction = Deno.env.get('MIDTRANS_IS_PRODUCTION') === 'true';
    const baseUrl = isProduction
      ? 'https://app.midtrans.com/snap/v1/transactions'
      : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

    const midtransResponse = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(serverKey + ':')}`,
      },
      body: JSON.stringify({
        transaction_details: {
          order_id: donation.id,
          gross_amount: amount,
        },
        credit_card: { secure: true },
        customer_details: {
          first_name: donor_name,
          email: donor_email,
          phone: donor_phone,
        },
      }),
    });

    const midtransData = await midtransResponse.json();

    if (!midtransResponse.ok) {
      throw new Error(midtransData.error_messages?.join(', ') || 'Midtrans error');
    }

    return jsonResponse({
      token: midtransData.token,
      redirect_url: midtransData.redirect_url,
      donation_id: donation.id,
    });
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Gagal membuat transaksi.' },
      400,
    );
  }
});
```

### C. Webhook Handler (`midtrans-webhook`)

Fungsi ini bersifat pasif, menerima notifikasi dari server Midtrans.

**Tugas Utama:**

- Memvalidasi signature key agar memastikan webhook benar dari Midtrans.
- Mengambil `order_id` (ID Donasi) dari payload.
- Mengupdate `payment_status` sesuai status transaksi.

**Rumus Validasi Signature Key:**

```
SHA512(order_id + status_code + gross_amount + ServerKey)
```

**Contoh kode (Supabase Edge Function — Deno):**

```typescript
// midtrans-webhook/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { jsonResponse } from '../_shared/http.ts';

async function sha512(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-512', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const payload = await request.json();
    const serverKey = Deno.env.get('MIDTRANS_SERVER_KEY') ?? '';

    // 1. Validasi signature key
    const expectedSignature = await sha512(
      payload.order_id + payload.status_code + payload.gross_amount + serverKey,
    );

    if (expectedSignature !== payload.signature_key) {
      return jsonResponse({ error: 'Invalid signature' }, 403);
    }

    // 2. Mapping status transaksi Midtrans ke status donasi
    const { transaction_status, fraud_status, order_id } = payload;
    let paymentStatus = 'pending';

    if (transaction_status === 'capture') {
      paymentStatus = fraud_status === 'accept' ? 'success' : 'pending';
    } else if (transaction_status === 'settlement') {
      paymentStatus = 'success';
    } else if (['cancel', 'deny', 'expire'].includes(transaction_status)) {
      paymentStatus = 'failed';
    } else if (transaction_status === 'refund' || transaction_status === 'partial_refund') {
      paymentStatus = 'refunded';
    }

    // 3. Update database
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { error: updateError } = await supabase
      .from('donations')
      .update({
        payment_status: paymentStatus,
        midtrans_transaction_id: payload.transaction_id,
        payment_type: payload.payment_type,
        paid_at: paymentStatus === 'success' ? new Date().toISOString() : null,
      })
      .eq('id', order_id);

    if (updateError) throw updateError;

    return jsonResponse({ ok: true });
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Webhook processing failed' },
      500,
    );
  }
});
```

### D. Integrasi Frontend (`Donate.tsx`)

Ganti alur saat ini yang memakai `create-pending-donation`, menjadi flow Midtrans Snap:

```typescript
// Di Donate.tsx
const { data, error } = await supabase.functions.invoke<{
  token: string;
  redirect_url: string;
  donation_id: string;
}>('create-midtrans-token', {
  body: {
    campaign_id: campaign.id,
    amount: data.amount,
    donor_name: data.name.trim(),
    donor_email: data.email.trim(),
    donor_phone: data.whatsapp.trim(),
    message: data.message?.trim() || '',
    is_anonymous: data.isAnonymous,
  },
});

if (data?.token) {
  // Buka popup pembayaran Midtrans Snap
  window.snap.pay(data.token, {
    onSuccess: (result) => {
      navigate('/payment/success', { state: { transactionId: result.order_id } });
    },
    onPending: (result) => {
      navigate('/payment/pending', { state: { transactionId: result.order_id } });
    },
    onError: (result) => {
      setPageError('Pembayaran gagal. Silakan coba lagi.');
    },
    onClose: () => {
      // User menutup popup tanpa menyelesaikan pembayaran
    },
  });
}
```

---

## 7. Langkah Implementasi

### Step 1: Daftar & Konfigurasi Midtrans

1. Daftar di [Midtrans Dashboard](https://dashboard.midtrans.com).
2. Ambil **Server Key** dan **Client Key** dari menu Settings → Access Keys.
3. Set environment variables di Supabase Dashboard atau CLI.

### Step 2: Inisialisasi Edge Functions

```bash
supabase functions new create-midtrans-token
supabase functions new midtrans-webhook
```

### Step 3: Set Environment Variables

```bash
supabase secrets set MIDTRANS_SERVER_KEY="SB-Mid-server-XXXXXXX"
supabase secrets set MIDTRANS_IS_PRODUCTION="false"
```

### Step 4: Pengaturan Webhook di Midtrans Dashboard

Masukkan URL Edge Function webhook ke Midtrans Dashboard → Settings → Configuration → Notification URL:

```
https://[PROJECT_ID].supabase.co/functions/v1/midtrans-webhook
```

### Step 5: Integrasi Frontend

1. Tambahkan Snap JS script di `index.html`.
2. Update komponen `Donate.tsx` untuk memanggil `create-midtrans-token` dan membuka Snap popup.

### Step 6: Deploy

```bash
supabase functions deploy create-midtrans-token
supabase functions deploy midtrans-webhook
```

---

## 8. Checklist Pengujian

- [ ] Set environment variables di Supabase (MIDTRANS_SERVER_KEY, dll).
- [ ] Simulasi pembayaran di Midtrans Sandbox.
- [ ] Cek tabel `donations` apakah `payment_status` berubah otomatis dari `pending` ke `success`.
- [ ] Cek validasi signature key pada webhook berhasil menolak request palsu.
- [ ] Cek progress bar donasi di Beranda apakah bertambah setelah pembayaran sukses.
- [ ] Test semua metode pembayaran (VA, E-Wallet, QRIS, Credit Card).
- [ ] Test skenario gagal: pembayaran expired, dibatalkan, ditolak.

---

## 9. Skema Database (Kolom Tambahan)

Kolom berikut mungkin perlu ditambahkan ke tabel `donations` untuk mendukung integrasi Midtrans:

| Kolom | Tipe | Deskripsi |
| :--- | :--- | :--- |
| `midtrans_transaction_id` | `TEXT` | ID transaksi dari Midtrans |
| `payment_type` | `TEXT` | Metode pembayaran (bank_transfer, gopay, dll) |
| `paid_at` | `TIMESTAMPTZ` | Waktu pembayaran berhasil |

```sql
ALTER TABLE public.donations
  ADD COLUMN IF NOT EXISTS midtrans_transaction_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_type TEXT,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
```

---

**Catatan:** Dokumentasi ini bersifat hidup (*living document*) dan akan diperbarui seiring dengan iterasi kode.
