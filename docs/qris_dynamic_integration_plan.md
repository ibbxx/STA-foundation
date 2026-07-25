# Dokumentasi Integrasi QRIS Dinamis + Nominal Unik — Sekolah Tanah Air

Dokumen ini menjelaskan rencana arsitektur dan implementasi detail untuk mengubah QRIS **statis** menjadi **dinamis** dengan mekanisme **Kode Unik (Nominal Unik)** pada project donasi Sekolah Tanah Air. Dokumen bersifat *living document* dan akan diperbarui seiring iterasi pengembangan.

---

## Daftar Isi

1. [Latar Belakang & Masalah](#1-latar-belakang--masalah)
2. [Konsep Solusi](#2-konsep-solusi)
3. [Arsitektur Sistem](#3-arsitektur-sistem)
4. [Spesifikasi Teknis QRIS EMV TLV](#4-spesifikasi-teknis-qris-emv-tlv)
5. [Database Migration](#5-database-migration)
6. [Edge Function: generate-qris-dynamic](#6-edge-function-generate-qris-dynamic)
7. [Edge Function: create-pending-donation (Modifikasi)](#7-edge-function-create-pending-donation-modifikasi)
8. [Frontend — Library QRIS](#8-frontend--library-qris)
9. [Frontend — Halaman Donasi (Donate.tsx)](#9-frontend--halaman-donasi-donatetsx)
10. [Frontend — Admin Transactions](#10-frontend--admin-transactions)
11. [Frontend — Payment Success](#11-frontend--payment-success)
12. [Payment Settings Update](#12-payment-settings-update)
13. [Keamanan & Validasi](#13-keamanan--validasi)
14. [Langkah Implementasi (Step-by-Step)](#14-langkah-implementasi-step-by-step)
15. [Checklist Pengujian](#15-checklist-pengujian)
16. [Roadmap: Otomasi Verifikasi Pembayaran](#16-roadmap-otomasi-verifikasi-pembayaran)
17. [Referensi](#17-referensi)

---

## 1. Latar Belakang & Masalah

### Kondisi Saat Ini

Project Sekolah Tanah Air saat ini menggunakan sistem donasi **manual** dengan dua metode: QRIS dan Transfer Bank.

| Aspek | Kondisi Saat Ini |
| :--- | :--- |
| QRIS | Gambar statis (`qris_image_url`) ditampilkan ke donatur |
| Verifikasi | Donatur upload bukti pembayaran → Admin verifikasi manual |
| Callback/Webhook | Tidak ada — DANA tidak mengirim notifikasi ke server |
| Pencocokan Transaksi | Manual oleh admin berdasarkan bukti screenshot |

### Masalah Utama

1. **QRIS statis tidak membawa informasi nominal** → donatur bisa bayar berapapun.
2. **Tidak ada cara otomatis** untuk mencocokkan pembayaran masuk dengan donasi di database.
3. **Admin harus verifikasi manual** setiap transaksi berdasarkan screenshot — rawan human error.
4. **Donasi dengan nominal sama** (misalnya 3 orang donate Rp 50.000) tidak bisa dibedakan.

---

## 2. Konsep Solusi

### QRIS Dinamis + Kode Unik

Solusi ini terdiri dari dua komponen utama:

#### A. QRIS Dinamis (Injeksi Nominal)

Mengubah QRIS statis merchant menjadi QRIS dinamis dengan cara:
1. Membaca string QRIS statis dalam format **EMV TLV**.
2. Mengubah **Point of Initiation** dari `11` (statis) menjadi `12` (dinamis).
3. Menyisipkan **Transaction Amount** (Tag 54) dengan nominal donasi.
4. Menghitung ulang **CRC-16/CCITT-FALSE** (Tag 63).
5. Me-render string QRIS baru menjadi QR Code yang bisa di-scan.

#### B. Kode Unik (Nominal Unik)

Menambahkan 3 digit unik di belakang nominal untuk mengidentifikasi setiap transaksi:

```
Nominal Donasi  : Rp 50.000
Kode Unik       : + Rp 12
─────────────────────────────
Nominal Final   : Rp 50.012  ← Yang dibayar donatur
```

**Kenapa ini penting?**
- Ketika ada 3 orang donate Rp 50.000 dalam waktu bersamaan, masing-masing akan membayar: Rp 50.012, Rp 50.347, Rp 50.891.
- Sistem (atau admin) bisa mencocokkan **nominal persis** di mutasi rekening/e-wallet dengan transaksi di database.

### Perbandingan Sebelum & Sesudah

| Aspek | Sebelum | Sesudah |
| :--- | :--- | :--- |
| QRIS | Gambar statis | QR code dinamis (di-render real-time) |
| Nominal di QR | Kosong (donatur input sendiri) | Sudah ter-inject (fix nominal) |
| Upload Bukti | Wajib | Tidak perlu (untuk QRIS) |
| Pencocokan | Manual by screenshot | By nominal unik (semi-otomatis) |
| UX Donatur | 5 langkah | 3 langkah |

---

## 3. Arsitektur Sistem

### Sequence Diagram

```
Donatur (Browser)        Frontend (React)        Edge Function         Supabase DB
      │                        │                       │                    │
      │  Isi form & pilih QRIS │                       │                    │
      │───────────────────────>│                       │                    │
      │                        │  POST /generate-      │                    │
      │                        │  qris-dynamic         │                    │
      │                        │──────────────────────>│                    │
      │                        │                       │ 1. Verify Turnstile│
      │                        │                       │ 2. Generate kode   │
      │                        │                       │    unik (1-999)    │
      │                        │                       │ 3. Parse QRIS TLV  │
      │                        │                       │ 4. Inject nominal  │
      │                        │                       │    (Tag 54)        │
      │                        │                       │ 5. Recalculate CRC │
      │                        │                       │    (Tag 63)        │
      │                        │                       │ 6. INSERT donation │
      │                        │                       │───────────────────>│
      │                        │                       │   donation_id      │
      │                        │                       │<───────────────────│
      │                        │  { qris_string,       │                    │
      │                        │    final_amount,       │                    │
      │                        │    unique_code,        │                    │
      │                        │    donation_id,        │                    │
      │                        │    expires_at }        │                    │
      │                        │<──────────────────────│                    │
      │  QR Code + Nominal     │                       │                    │
      │  Final + Countdown     │                       │                    │
      │<───────────────────────│                       │                    │
      │                        │                       │                    │
      │  Scan & Bayar via      │                       │                    │
      │  DANA/GoPay/Bank       │                       │                    │
      │ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─>│  (Pembayaran terjadi di luar sistem)      │
      │                        │                       │                    │
      │  Redirect ke           │                       │                    │
      │  /payment/success      │                       │                    │
      │<───────────────────────│                       │                    │
      │                        │                       │                    │
 ── ── ── ── ── ── ── ── ── ── ── ── ── ── ── ── ── ── ── ── ── ── ── ──
      │                        │                       │                    │
      │  [Sisi Admin / Mutasi Reader]                  │                    │
      │                        │  Admin cek mutasi     │                    │
      │                        │  DANA → cocokkan      │                    │
      │                        │  nominal unik         │                    │
      │                        │  → UPDATE payment_    │                    │
      │                        │    status = 'success'  │                    │
      │                        │──────────────────────────────────────────>│
```

### Struktur Folder & File Baru

```text
sekolah-tanah-air/
├── supabase/
│   ├── migrations/
│   │   └── 20260716180000_qris_dynamic_unique_code.sql    [NEW]
│   └── functions/
│       ├── _shared/
│       │   ├── http.ts
│       │   ├── turnstile.ts
│       │   └── qris-parser.ts                             [NEW]
│       ├── create-pending-donation/
│       │   └── index.ts                                   [MODIFY]
│       └── generate-qris-dynamic/
│           └── index.ts                                   [NEW]
├── src/
│   ├── lib/
│   │   ├── payment-settings.ts                            [MODIFY]
│   │   └── qris.ts                                        [NEW]
│   └── pages/
│       ├── public/
│       │   ├── Donate.tsx                                 [MODIFY]
│       │   └── PaymentSuccess.tsx                         [MODIFY]
│       └── admin/
│           └── AdminTransactions.tsx                      [MODIFY]
└── package.json                                           [MODIFY]
```

---

## 4. Spesifikasi Teknis QRIS EMV TLV

### Format Data QRIS

QRIS mengikuti standar **EMV QR Code Specification for Payment Systems (Merchant-Presented Mode)**. Data disimpan dalam format **TLV (Tag-Length-Value)**:

```
[Tag 2 digit][Length 2 digit][Value N karakter]
```

**Contoh:**
```
00 02 01   →  Tag=00, Length=02, Value="01" (Payload Format Indicator v01)
01 02 11   →  Tag=01, Length=02, Value="11" (Static QR)
```

### Tag-Tag Penting untuk Manipulasi

| Tag | Nama | Deskripsi | Aksi |
| :--- | :--- | :--- | :--- |
| `00` | Payload Format Indicator | Selalu "01" | Biarkan |
| `01` | Point of Initiation Method | "11" = statis, "12" = dinamis | **Ubah ke "12"** |
| `26`-`51` | Merchant Account Information | Info merchant (NMID, dll) | Biarkan |
| `52` | Merchant Category Code | Kode kategori merchant | Biarkan |
| `53` | Transaction Currency | "360" = IDR | Biarkan |
| `54` | Transaction Amount | Nominal transaksi | **Inject nominal** |
| `55` | Tip or Convenience Indicator | — | Biarkan/Hapus jika ada |
| `58` | Country Code | "ID" | Biarkan |
| `59` | Merchant Name | Nama merchant | Biarkan |
| `60` | Merchant City | Kota merchant | Biarkan |
| `61` | Postal Code | Kode pos | Biarkan |
| `62` | Additional Data | Data tambahan (reference, terminal) | Biarkan |
| `63` | CRC | CRC-16/CCITT-FALSE checksum | **Hitung ulang** |

### Algoritma Parsing & Injeksi

```
FUNGSI parseQrisTlv(qrisString):
    index = 0
    tags = {}
    
    SELAMA index < panjang(qrisString) - 4:   // -4 untuk CRC di akhir
        tag    = qrisString[index : index+2]
        length = parseInt(qrisString[index+2 : index+4])
        value  = qrisString[index+4 : index+4+length]
        tags[tag] = value
        index = index + 4 + length
    
    RETURN tags

FUNGSI buildDynamicQris(tags, finalAmount):
    // 1. Ubah Point of Initiation ke "12" (dinamis)
    tags["01"] = "12"
    
    // 2. Set Transaction Amount
    amountStr = finalAmount.toString()
    tags["54"] = amountStr
    
    // 3. Rebuild string TANPA tag 63 (CRC)
    result = ""
    UNTUK setiap tag KECUALI "63":
        tagLength = panjang(tags[tag]).toString().padStart(2, "0")
        result += tag + tagLength + tags[tag]
    
    // 4. Append placeholder CRC
    result += "6304"
    
    // 5. Hitung CRC-16/CCITT-FALSE
    crc = calculateCRC16(result)
    result += crc.toUpperCase()
    
    RETURN result
```

### CRC-16/CCITT-FALSE

Spesifikasi:
- **Polynomial**: `0x1021`
- **Initial Value**: `0xFFFF`
- **Final XOR**: `0x0000`
- **Input Reflected**: No
- **Output Reflected**: No

```typescript
function crc16CcittFalse(data: string): string {
  let crc = 0xFFFF;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
      crc &= 0xFFFF;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}
```

---

## 5. Database Migration

### File: `supabase/migrations/20260716180000_qris_dynamic_unique_code.sql`

#### 5.1. Kolom Baru pada Tabel `donations`

```sql
-- Tambah kolom untuk QRIS Dinamis dan Kode Unik
ALTER TABLE public.donations
  ADD COLUMN IF NOT EXISTS unique_code smallint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS final_amount bigint,
  ADD COLUMN IF NOT EXISTS unique_code_expires_at timestamptz;

-- Index untuk pencarian kode unik aktif (yang belum expire dan masih pending)
CREATE INDEX IF NOT EXISTS idx_donations_unique_code_active
  ON public.donations (amount, unique_code, unique_code_expires_at)
  WHERE payment_status = 'pending'
    AND unique_code > 0;

COMMENT ON COLUMN public.donations.unique_code IS 'Kode unik 3 digit (1-999) untuk identifikasi transaksi QRIS';
COMMENT ON COLUMN public.donations.final_amount IS 'Nominal akhir = amount + unique_code (yang dibayar donatur)';
COMMENT ON COLUMN public.donations.unique_code_expires_at IS 'Waktu expire kode unik, setelah ini kode bisa dipakai ulang';
```

**Penjelasan kolom baru:**

| Kolom | Tipe | Default | Deskripsi |
| :--- | :--- | :--- | :--- |
| `unique_code` | `smallint` | `0` | Kode unik 3 digit (1-999). Nilai 0 berarti tidak menggunakan QRIS dinamis (misalnya bank transfer). |
| `final_amount` | `bigint` | `NULL` | Nominal akhir yang dibayar donatur (`amount + unique_code`). NULL untuk transaksi tanpa kode unik. |
| `unique_code_expires_at` | `timestamptz` | `NULL` | Timestamp kapan kode unik ini expire. Setelah expire, kode bisa di-recycle untuk transaksi baru. |

#### 5.2. Fungsi Generate Kode Unik

```sql
-- Fungsi untuk menghasilkan kode unik yang belum digunakan
-- oleh transaksi pending lain dengan nominal yang sama
CREATE OR REPLACE FUNCTION public.generate_unique_code(p_amount bigint)
RETURNS smallint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_code smallint;
  v_attempts int := 0;
  v_max_attempts int := 50;
BEGIN
  LOOP
    -- Generate random code antara 1-999
    v_code := (floor(random() * 999) + 1)::smallint;
    v_attempts := v_attempts + 1;

    -- Cek apakah kode ini sudah dipakai oleh transaksi pending
    -- dengan nominal yang sama dan belum expire
    IF NOT EXISTS (
      SELECT 1
      FROM public.donations
      WHERE amount = p_amount
        AND unique_code = v_code
        AND payment_status = 'pending'
        AND unique_code_expires_at > now()
    ) THEN
      RETURN v_code;
    END IF;

    -- Safety valve: jika terlalu banyak percobaan, raise exception
    IF v_attempts >= v_max_attempts THEN
      RAISE EXCEPTION 'Tidak dapat menghasilkan kode unik. Terlalu banyak transaksi aktif dengan nominal yang sama.';
    END IF;
  END LOOP;
END;
$$;

COMMENT ON FUNCTION public.generate_unique_code(bigint) IS
  'Generate kode unik 1-999 yang belum dipakai oleh transaksi pending dengan nominal sama';
```

#### 5.3. Fungsi Create Pending Donation (Update)

```sql
-- Update fungsi create_pending_donation untuk mendukung kode unik
CREATE OR REPLACE FUNCTION public.create_pending_donation_dynamic(
  p_campaign_id uuid,
  p_donor_name text,
  p_donor_email text,
  p_donor_phone text,
  p_amount numeric,
  p_payment_method text,
  p_message text,
  p_is_anonymous boolean,
  p_unique_code smallint DEFAULT 0,
  p_expiry_minutes int DEFAULT 30
)
RETURNS TABLE(donation_id uuid, unique_code smallint, final_amount bigint, expires_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_id uuid;
  v_final_amount bigint;
  v_expires_at timestamptz;
BEGIN
  -- Validasi dasar (sama seperti create_pending_donation yang sudah ada)
  IF p_amount < 10000 OR p_amount > 1000000000 THEN
    RAISE EXCEPTION 'Nominal donasi tidak valid.';
  END IF;

  IF length(trim(coalesce(p_donor_name, ''))) < 2
    OR length(trim(coalesce(p_donor_name, ''))) > 120
    OR length(trim(coalesce(p_donor_email, ''))) < 3
    OR length(trim(coalesce(p_donor_email, ''))) > 254
    OR length(trim(coalesce(p_donor_phone, ''))) < 8
    OR length(trim(coalesce(p_donor_phone, ''))) > 30
    OR length(trim(coalesce(p_message, ''))) > 1000 THEN
    RAISE EXCEPTION 'Data donatur tidak valid.';
  END IF;

  IF p_payment_method IS NULL
    OR p_payment_method NOT IN ('qris', 'bank_transfer', 'va_bca', 'va_mandiri', 'gopay', 'shopeepay') THEN
    RAISE EXCEPTION 'Metode pembayaran tidak valid.';
  END IF;

  -- Rate limiting
  IF (
    SELECT count(*)
    FROM public.donations
    WHERE donor_phone = trim(p_donor_phone)
      AND created_at >= now() - interval '1 hour'
  ) >= 5 THEN
    RAISE EXCEPTION 'Terlalu banyak permintaan donasi. Silakan coba lagi dalam 1 jam.';
  END IF;

  -- Validasi campaign aktif
  IF NOT EXISTS (
    SELECT 1
    FROM public.campaigns
    WHERE id = p_campaign_id
      AND status = 'active'
      AND (start_date IS NULL OR start_date <= current_date)
      AND (end_date IS NULL OR end_date >= current_date)
  ) THEN
    RAISE EXCEPTION 'Campaign tidak menerima donasi.';
  END IF;

  -- Hitung final amount
  v_final_amount := p_amount::bigint + p_unique_code;
  v_expires_at := now() + (p_expiry_minutes || ' minutes')::interval;

  -- Insert donasi
  INSERT INTO public.donations (
    campaign_id, donor_name, donor_email, donor_phone,
    amount, payment_status, payment_method, message, is_anonymous,
    unique_code, final_amount, unique_code_expires_at
  )
  VALUES (
    p_campaign_id,
    trim(p_donor_name),
    nullif(trim(coalesce(p_donor_email, '')), ''),
    nullif(trim(coalesce(p_donor_phone, '')), ''),
    p_amount::bigint,
    'pending',
    nullif(trim(coalesce(p_payment_method, '')), ''),
    nullif(trim(coalesce(p_message, '')), ''),
    coalesce(p_is_anonymous, false),
    p_unique_code,
    v_final_amount,
    v_expires_at
  )
  RETURNING id INTO v_id;

  RETURN QUERY SELECT v_id, p_unique_code, v_final_amount, v_expires_at;
END;
$$;
```

---

## 6. Edge Function: generate-qris-dynamic

### File: `supabase/functions/generate-qris-dynamic/index.ts`

Edge function baru yang menangani seluruh proses pembuatan QRIS dinamis.

### Input (Request Body — JSON)

```typescript
interface GenerateQrisRequest {
  turnstile_token: string;     // Token verifikasi anti-bot
  campaign_id: string;         // UUID campaign
  amount: number;              // Nominal donasi (dalam Rupiah)
  donor_name: string;          // Nama donatur
  donor_email: string;         // Email donatur
  donor_phone: string;         // Nomor WhatsApp
  message?: string;            // Pesan/doa (opsional)
  is_anonymous: boolean;       // Donasi anonim?
}
```

### Output (Response — JSON)

```typescript
interface GenerateQrisResponse {
  donation_id: string;         // UUID donasi yang dibuat
  qris_string: string;         // String QRIS dinamis (siap di-render jadi QR)
  final_amount: number;        // Nominal akhir (amount + unique_code)
  unique_code: number;         // Kode unik (1-999)
  expires_at: string;          // ISO timestamp kapan QRIS expire
}
```

### Alur Proses Internal

```
1. Validasi request method (POST only)
2. Parse body JSON
3. Verifikasi Turnstile token
4. Buat Supabase client (service role)
5. Ambil payment_settings dari site_content
   └─ Pastikan manual_enabled = true
   └─ Pastikan qris_raw_string ada dan valid
6. Panggil DB function: generate_unique_code(amount)
   └─ Dapat kode unik (misal: 12)
7. Hitung final_amount = amount + unique_code
   └─ Contoh: 50000 + 12 = 50012
8. Parse QRIS raw string (TLV format):
   └─ Baca semua tag
   └─ Ubah tag 01: "11" → "12" (statis → dinamis)
   └─ Sisipkan/ganti tag 54: "50012" (transaction amount)
   └─ Hapus tag 63 lama
   └─ Rebuild string
   └─ Append "6304" (placeholder CRC)
   └─ Hitung CRC-16/CCITT-FALSE
   └─ Append CRC
9. Panggil DB function: create_pending_donation_dynamic(...)
   └─ Simpan donasi dengan unique_code, final_amount, unique_code_expires_at
10. Return response
```

### Konsep Kode

```typescript
// supabase/functions/generate-qris-dynamic/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { jsonResponse, corsHeaders } from '../_shared/http.ts';
import { verifyTurnstile } from '../_shared/turnstile.ts';
import { parseQrisTlv, buildDynamicQris } from '../_shared/qris-parser.ts';

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(request) });
  }
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405, request);
  }

  try {
    const payload = await request.json();

    // 1. Verify Turnstile
    const remoteIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const isHuman = await verifyTurnstile(String(payload.turnstile_token ?? ''), remoteIp);
    if (!isHuman) {
      return jsonResponse({ error: 'Verifikasi keamanan gagal.' }, 403, request);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // 2. Ambil payment settings
    const { data: settingsRow } = await supabase
      .from('site_content')
      .select('value')
      .eq('key', 'payment_settings')
      .maybeSingle();

    const settings = settingsRow?.value;
    if (!settings?.manual_enabled) {
      return jsonResponse({ error: 'Metode QRIS tidak tersedia.' }, 400, request);
    }

    const qrisRawString = settings.qris_raw_string;
    if (!qrisRawString || typeof qrisRawString !== 'string') {
      return jsonResponse({ error: 'QRIS belum dikonfigurasi.' }, 400, request);
    }

    const amount = Number(payload.amount);
    if (!amount || amount < 10000 || amount > 1000000000) {
      return jsonResponse({ error: 'Nominal donasi tidak valid.' }, 400, request);
    }

    // 3. Generate kode unik
    const { data: uniqueCode, error: codeError } = await supabase
      .rpc('generate_unique_code', { p_amount: amount });
    if (codeError) throw codeError;

    const finalAmount = amount + uniqueCode;

    // 4. Parse dan build QRIS dinamis
    const tags = parseQrisTlv(qrisRawString);
    const dynamicQris = buildDynamicQris(tags, finalAmount);

    // 5. Simpan donasi ke database
    const { data: donationResult, error: donationError } = await supabase
      .rpc('create_pending_donation_dynamic', {
        p_campaign_id: payload.campaign_id,
        p_donor_name: payload.donor_name,
        p_donor_email: payload.donor_email,
        p_donor_phone: payload.donor_phone,
        p_amount: amount,
        p_payment_method: 'qris',
        p_message: payload.message || '',
        p_is_anonymous: payload.is_anonymous || false,
        p_unique_code: uniqueCode,
        p_expiry_minutes: 30,
      });
    if (donationError) throw donationError;

    const row = donationResult[0];

    return jsonResponse({
      donation_id: row.donation_id,
      qris_string: dynamicQris,
      final_amount: row.final_amount,
      unique_code: row.unique_code,
      expires_at: row.expires_at,
    }, 201, request);

  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Gagal membuat QRIS dinamis.' },
      400,
      request,
    );
  }
});
```

---

## 7. Edge Function: create-pending-donation (Modifikasi)

### File: `supabase/functions/create-pending-donation/index.ts`

Fungsi ini **tetap digunakan** untuk metode pembayaran yang memerlukan upload bukti (bank transfer). Modifikasi minimal:

| Perubahan | Detail |
| :--- | :--- |
| Routing QRIS | Jika `payment_method === 'qris'`, return error "Gunakan endpoint generate-qris-dynamic" |
| Bank Transfer | Flow tetap sama (upload bukti wajib) |

Dengan pemisahan ini:
- **QRIS** → `generate-qris-dynamic` (QR dinamis, tanpa upload bukti)
- **Bank Transfer** → `create-pending-donation` (upload bukti wajib)

---

## 8. Frontend — Library QRIS

### File Baru: `src/lib/qris.ts`

Utilitas frontend untuk rendering dan formatting QRIS.

```typescript
// src/lib/qris.ts

/** Response dari edge function generate-qris-dynamic */
export interface QrisDynamicData {
  donation_id: string;
  qris_string: string;
  final_amount: number;
  unique_code: number;
  expires_at: string;
}

/**
 * Render QRIS string menjadi QR code data URL (PNG base64).
 * Menggunakan library 'qrcode' yang ditambahkan ke dependencies.
 */
export async function generateQrisDataUrl(qrisString: string): Promise<string> {
  const QRCode = (await import('qrcode')).default;
  return QRCode.toDataURL(qrisString, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 400,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
  });
}

/**
 * Format nominal unik untuk ditampilkan ke donatur.
 * Contoh: formatUniqueAmount(50000, 12) → "Rp 50.000 + Rp 12 = Rp 50.012"
 */
export function formatUniqueAmount(
  amount: number,
  uniqueCode: number,
  formatter: (n: number) => string,
): string {
  return `${formatter(amount)} + ${formatter(uniqueCode)} = ${formatter(amount + uniqueCode)}`;
}

/**
 * Hitung sisa waktu dalam detik dari sekarang ke expires_at.
 */
export function getRemainingSeconds(expiresAt: string): number {
  const diff = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.floor(diff / 1000));
}

/**
 * Format detik menjadi MM:SS.
 */
export function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}
```

### Dependency Baru

Tambahkan ke `package.json`:

```json
{
  "dependencies": {
    "qrcode": "^1.5.4"
  },
  "devDependencies": {
    "@types/qrcode": "^1.5.5"
  }
}
```

---

## 9. Frontend — Halaman Donasi (Donate.tsx)

### File: `src/pages/public/Donate.tsx`

Perubahan paling besar ada di halaman ini. Flow QRIS berubah signifikan:

### Flow Baru (QRIS)

```
┌─ Step 1: Form ────────────────────────────────────────────────┐
│  Donatur mengisi:                                             │
│  • Nominal donasi (quick amounts / input manual)              │
│  • Nama, Email, WhatsApp                                      │
│  • Pesan (opsional)                                           │
│  • Pilih metode: QRIS ✓                                       │
│  • Turnstile verification                                     │
│                                                               │
│  [Klik tombol "Generate QRIS"]                                │
└───────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─ Step 2: QRIS Panel ─────────────────────────────────────────┐
│                                                               │
│  ┌────────────────────────────┐                               │
│  │                            │                               │
│  │    [QR CODE DINAMIS]       │   Nominal Donasi : Rp 50.000  │
│  │    (di-render dari string) │   Kode Unik      : + Rp 12    │
│  │                            │   ─────────────────────────    │
│  └────────────────────────────┘   Total Bayar    : Rp 50.012  │
│                                                               │
│  ⏱ Berlaku: 28:45 (countdown)                                │
│                                                               │
│  "Scan QR di atas menggunakan                                 │
│   aplikasi e-wallet atau                                      │
│   mobile banking Anda"                                        │
│                                                               │
│  [Saya Sudah Membayar] → redirect ke /payment/success         │
│  [Batal] → kembali ke form                                    │
└───────────────────────────────────────────────────────────────┘
```

### State Baru

```typescript
// State tambahan di Donate.tsx
const [qrisData, setQrisData] = useState<QrisDynamicData | null>(null);
const [qrisImageUrl, setQrisImageUrl] = useState<string>('');
const [qrisLoading, setQrisLoading] = useState(false);
const [qrisCountdown, setQrisCountdown] = useState(0);
```

### Perubahan Logika

1. **Tombol submit berubah** berdasarkan metode:
   - QRIS: "Generate QRIS" → panggil `generate-qris-dynamic`
   - Bank Transfer: "Donasi {nominal}" → panggil `create-pending-donation` (seperti sekarang)

2. **Setelah generate QRIS berhasil**:
   - Render QR code dari `qris_string` menggunakan `generateQrisDataUrl()`
   - Tampilkan panel info: nominal, kode unik, total bayar
   - Jalankan countdown timer dari `expires_at`
   - **Tidak perlu upload bukti pembayaran**

3. **Upload bukti hanya untuk Bank Transfer**:
   - Logic existing tetap dipertahankan
   - Hanya ditampilkan ketika `selectedPayment === 'bank_transfer'`

4. **Countdown expired**:
   - Tampilkan pesan "QRIS sudah kadaluwarsa"
   - Tombol "Generate Ulang" untuk membuat QRIS baru

---

## 10. Frontend — Admin Transactions

### File: `src/pages/admin/AdminTransactions.tsx`

### Perubahan pada Payment Settings Section

Tambah input field baru di bawah upload gambar QRIS:

```
┌─ Payment Settings ──────────────────────────────────────────┐
│                                                              │
│  Manual Donasi: [Toggle ON/OFF]                              │
│                                                              │
│  QRIS Manual (Gambar)        QRIS Raw String                 │
│  ┌──────────────────┐       ┌──────────────────────────┐     │
│  │  [Gambar QRIS]   │       │ 00020101021126570016...  │     │
│  │                  │       │ (textarea input)          │     │
│  │  [Upload]        │       │                          │     │
│  └──────────────────┘       │  ✓ Format valid          │     │
│                              └──────────────────────────┘     │
│                                                              │
│  Rekening Bank:                                              │
│  ...                                                         │
└──────────────────────────────────────────────────────────────┘
```

### Perubahan pada Tabel Transaksi

Tambah kolom baru di tabel donasi:

| Kolom Baru | Deskripsi |
| :--- | :--- |
| Kode Unik | Menampilkan kode unik (jika ada, mis: `+12`) |
| Nominal Final | Nominal akhir yang dibayar donatur |
| Status | Badge warna: hijau (success), kuning (pending), merah (failed/expired) |

### Validasi QRIS Raw String

Saat admin paste QRIS string, lakukan validasi dasar:

```typescript
function validateQrisRawString(str: string): { valid: boolean; error?: string } {
  if (!str || str.length < 20) {
    return { valid: false, error: 'String QRIS terlalu pendek.' };
  }
  if (!str.startsWith('0002')) {
    return { valid: false, error: 'String QRIS harus diawali dengan "0002".' };
  }
  // Validasi CRC di 4 karakter terakhir
  const payload = str.slice(0, -4);
  const expectedCrc = str.slice(-4);
  const calculatedCrc = crc16CcittFalse(payload);
  if (calculatedCrc !== expectedCrc.toUpperCase()) {
    return { valid: false, error: 'CRC tidak valid. Pastikan string QRIS lengkap dan benar.' };
  }
  return { valid: true };
}
```

---

## 11. Frontend — Payment Success

### File: `src/pages/public/PaymentSuccess.tsx`

### Perubahan

Halaman Payment Success sekarang menerima data tambahan melalui `location.state`:

```typescript
interface PaymentState {
  amount: number;
  paymentMethod: string;
  transactionId: string | null;
  // Field baru:
  uniqueCode?: number;
  finalAmount?: number;
}
```

### Tampilan Berbeda per Metode

**QRIS:**
```
┌─────────────────────────────────────────────┐
│           ⏳ Donasi Tercatat                 │
│                                             │
│  Nominal Donasi    : Rp 50.000              │
│  Kode Unik         : + Rp 12               │
│  Total Dibayar      : Rp 50.012             │
│  Metode             : QRIS                  │
│  ID Transaksi       : abc-123-...           │
│                                             │
│  "Pembayaran Anda sedang menunggu           │
│   verifikasi oleh admin berdasarkan         │
│   nominal unik Anda."                       │
│                                             │
│  [Lihat Campaign Lainnya]                   │
│  [Bagikan Kebaikan Ini]                     │
└─────────────────────────────────────────────┘
```

**Bank Transfer** (tetap sama seperti sekarang).

---

## 12. Payment Settings Update

### File: `src/lib/payment-settings.ts`

#### Perubahan Interface

```typescript
export interface PaymentSettings {
  manual_enabled: boolean;
  gateway_enabled: boolean;
  active_gateway: string | null;
  qris_image_url: string;
  qris_raw_string: string;     // ← BARU: Raw QRIS string dari merchant
  bank_accounts: BankAccountSetting[];
  manual_instructions: string;
}

export const DEFAULT_PAYMENT_SETTINGS: PaymentSettings = {
  manual_enabled: true,
  gateway_enabled: false,
  active_gateway: null,
  qris_image_url: DEFAULT_QRIS_IMAGE_URL,
  qris_raw_string: '',          // ← BARU
  bank_accounts: [],
  manual_instructions: '...',
};
```

#### Update normalizePaymentSettings

Tambah normalisasi `qris_raw_string`:

```typescript
export function normalizePaymentSettings(value: Json | PaymentSettings | null | undefined): PaymentSettings {
  // ... existing code ...
  return {
    // ... existing fields ...
    qris_raw_string: typeof raw.qris_raw_string === 'string' ? raw.qris_raw_string.trim() : '',
  };
}
```

#### Update hasManualPaymentDetails

```typescript
export function hasManualPaymentDetails(settings: PaymentSettings, method: ManualPaymentMethod): boolean {
  if (method === 'qris') {
    // QRIS tersedia jika ada gambar ATAU raw string
    return Boolean(settings.qris_image_url.trim()) || Boolean(settings.qris_raw_string.trim());
  }
  return settings.bank_accounts.some(/* ... existing logic ... */);
}
```

---

## 13. Keamanan & Validasi

### Backend (Edge Function)

| Layer | Validasi |
| :--- | :--- |
| Anti-bot | Cloudflare Turnstile verification |
| Input | Validasi tipe, panjang, dan range semua field |
| Rate limit | Maks 5 donasi per nomor HP per jam (DB function) |
| Campaign | Validasi campaign aktif dan dalam periode donasi |
| QRIS | Validasi format TLV dan CRC-16 |
| Unique code | Generate di server-side, tidak bisa dimanipulasi client |

### Frontend

| Layer | Validasi |
| :--- | :--- |
| Form | Zod schema validation (minimal amount, required fields) |
| QRIS string (admin) | Validasi format dan CRC sebelum submit |
| Countdown | Disable "Sudah Membayar" jika countdown habis |

### Perlindungan QRIS String

- `qris_raw_string` **hanya disimpan di server** (dalam `site_content`).
- Frontend **tidak pernah menerima raw string** — hanya menerima QRIS string yang sudah dimodifikasi (dengan nominal).
- QRIS string asli merchant tidak pernah ter-expose ke browser.

---

## 14. Langkah Implementasi (Step-by-Step)

### Step 1: Database Migration

```bash
# Buat file migration baru
# File: supabase/migrations/20260716180000_qris_dynamic_unique_code.sql
# Berisi: ALTER TABLE, CREATE FUNCTION generate_unique_code, CREATE FUNCTION create_pending_donation_dynamic
```

Jalankan migration di Supabase Dashboard → SQL Editor.

### Step 2: Shared QRIS Parser

```bash
# Buat file baru
# File: supabase/functions/_shared/qris-parser.ts
# Berisi: parseQrisTlv(), buildDynamicQris(), crc16CcittFalse()
```

### Step 3: Edge Function Baru

```bash
# Buat folder dan file baru
mkdir -p supabase/functions/generate-qris-dynamic
# File: supabase/functions/generate-qris-dynamic/index.ts
```

### Step 4: Modifikasi create-pending-donation

```bash
# File: supabase/functions/create-pending-donation/index.ts
# Tambahkan guard: jika payment_method === 'qris', return error
```

### Step 5: Install Dependency Frontend

```bash
npm install qrcode
npm install -D @types/qrcode
```

### Step 6: Library QRIS Frontend

```bash
# Buat file baru
# File: src/lib/qris.ts
```

### Step 7: Update Payment Settings

```bash
# Modifikasi: src/lib/payment-settings.ts
# Tambah qris_raw_string ke interface dan normalisasi
```

### Step 8: Update Donate.tsx

```bash
# Modifikasi: src/pages/public/Donate.tsx
# Perubahan terbesar — flow QRIS dinamis
```

### Step 9: Update AdminTransactions.tsx

```bash
# Modifikasi: src/pages/admin/AdminTransactions.tsx
# Tambah input QRIS raw string + kolom tabel baru
```

### Step 10: Update PaymentSuccess.tsx

```bash
# Modifikasi: src/pages/public/PaymentSuccess.tsx
# Tampilkan info kode unik
```

### Step 11: Build & Test

```bash
npm run lint     # Pastikan TypeScript valid
npm run build    # Build production bundle
```

---

## 15. Checklist Pengujian

### Pengujian Otomatis

- [ ] `npm run lint` — Tidak ada TypeScript error
- [ ] `npm run build` — Build berhasil tanpa error

### Pengujian Manual — Admin

- [ ] Buka Admin Transactions → Payment Settings
- [ ] Paste raw QRIS string → validasi muncul "Format valid" / error
- [ ] Simpan → verifikasi tersimpan di database (`site_content`)
- [ ] Verifikasi kolom baru (Kode Unik, Nominal Final) muncul di tabel transaksi

### Pengujian Manual — Donatur (QRIS Flow)

- [ ] Buka halaman donasi campaign
- [ ] Isi form: nama, email, WhatsApp, nominal
- [ ] Pilih metode QRIS → klik "Generate QRIS"
- [ ] Verifikasi:
  - [ ] QR code ter-render dengan benar
  - [ ] Nominal final = nominal + kode unik (mis: Rp 50.012)
  - [ ] Countdown timer berjalan
- [ ] Scan QR code dengan aplikasi DANA/GoPay/BCA Mobile:
  - [ ] Nominal yang muncul di aplikasi = `final_amount`
  - [ ] Merchant name sesuai
- [ ] Klik "Saya Sudah Membayar" → redirect ke Payment Success
- [ ] Verifikasi halaman sukses menampilkan info kode unik

### Pengujian Manual — Bank Transfer Flow

- [ ] Flow existing tetap berjalan normal (upload bukti, submit)
- [ ] Tidak ada regresi

### Pengujian Edge Case

- [ ] 3+ donasi dengan nominal sama dalam waktu bersamaan → kode unik harus berbeda
- [ ] Countdown habis → QRIS expired → bisa generate ulang
- [ ] QRIS raw string kosong → QRIS dinamis tidak tersedia, fallback ke gambar statis
- [ ] Nominal < Rp 10.000 → validasi error
- [ ] Nominal > Rp 1.000.000.000 → validasi error

---

## 16. Roadmap: Otomasi Verifikasi Pembayaran

Implementasi saat ini bersifat **semi-otomatis** — admin masih mencocokkan nominal unik secara manual. Berikut roadmap untuk otomasi penuh di masa depan:

### Phase 1: Semi-Otomatis (Implementasi Saat Ini) ✅

- QRIS dinamis + kode unik
- Admin manual verifikasi via mutasi DANA
- Admin klik "Approve" di panel admin

### Phase 2: Notifikasi Reader (Opsional)

Menggunakan service pihak ketiga untuk membaca notifikasi masuk dari DANA:

| Service | Cara Kerja | Estimasi Biaya |
| :--- | :--- | :--- |
| [Jasa Mutasi e-Wallet](https://projects.co.id/public/browse_services/view/739012/mutasi-e-wallet-dana) | Bot Android baca notifikasi DANA → kirim webhook ke server | Rp 100rb-500rb/bulan |
| Custom Android Bot | Automate DANA notification reader di device sendiri | Gratis (perlu HP dedicated) |

**Alur Phase 2:**
```
DANA Notifikasi → Bot Android → Webhook ke Edge Function → 
Cocokkan nominal unik di DB → Auto-update status ke "success"
```

### Phase 3: API Payment Gateway Resmi

Migrasi ke payment gateway resmi (Midtrans/Xendit) yang menyediakan callback webhook:
- Lihat: `docs/midtrans_integration_plan.md`
- Lihat: `docs/xendit_integration_plan.md`

---

## 17. Referensi

| # | Topik | URL |
| :--- | :--- | :--- |
| 1 | Cara Integrasi QRIS di Website | [gdcpay.id](https://gdcpay.id/cara-integrasi-qris-di-website/) |
| 2 | QRIS Interactive Open API | [qris.interactive.co.id](https://qris.interactive.co.id/Homepage/open-api/) |
| 3 | Jasa Mutasi DANA via Notifikasi | [projects.co.id (notif)](https://projects.co.id/public/browse_services/view/2dca12/mutasi-dana-via-notif) |
| 4 | Jasa Mutasi e-Wallet DANA | [projects.co.id (e-wallet)](https://projects.co.id/public/browse_services/view/739012/mutasi-e-wallet-dana) |
| 5 | Diskusi QRIS Webhook | [Threads @iksanarisandii](https://www.threads.com/@iksanarisandii/post/DSBejc5AbRE/) |
| 6 | Pengaturan Notifikasi WA | [pro.jurnale.id](https://pro.jurnale.id/panduan/?p=pengaturan-notifikasi-wa) |
| 7 | EMV QR Code Specification | [EMVCo](https://www.emvco.com/emv-technologies/qrcodes/) |
| 8 | Xendit Integration Plan (internal) | `docs/xendit_integration_plan.md` |
| 9 | Midtrans Integration Plan (internal) | `docs/midtrans_integration_plan.md` |

---

**Catatan:** Dokumentasi ini bersifat hidup (*living document*) dan akan diperbarui seiring dengan iterasi kode. Silakan buka *issue* atau diskusi internal jika ada pertanyaan atau saran perbaikan.
