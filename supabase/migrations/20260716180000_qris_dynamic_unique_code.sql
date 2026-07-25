-- ============================================================
-- Migration: QRIS Dinamis + Kode Unik
-- Deskripsi: Menambahkan kolom pendukung QRIS dinamis pada tabel donations
--            dan fungsi-fungsi SQL untuk generate kode unik.
-- ============================================================

-- 1. Tambah kolom untuk QRIS Dinamis dan Kode Unik
ALTER TABLE public.donations
  ADD COLUMN IF NOT EXISTS unique_code smallint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS final_amount bigint,
  ADD COLUMN IF NOT EXISTS unique_code_expires_at timestamptz;

-- 2. Index untuk pencarian kode unik aktif (yang belum expire dan masih pending)
CREATE INDEX IF NOT EXISTS idx_donations_unique_code_active
  ON public.donations (amount, unique_code, unique_code_expires_at)
  WHERE payment_status = 'pending'
    AND unique_code > 0;

COMMENT ON COLUMN public.donations.unique_code IS 'Kode unik 3 digit (1-999) untuk identifikasi transaksi QRIS';
COMMENT ON COLUMN public.donations.final_amount IS 'Nominal akhir = amount + unique_code (yang dibayar donatur)';
COMMENT ON COLUMN public.donations.unique_code_expires_at IS 'Waktu expire kode unik, setelah ini kode bisa dipakai ulang';

-- 3. Fungsi untuk menghasilkan kode unik yang belum digunakan
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

-- 4. Fungsi create pending donation untuk QRIS dinamis
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
  -- Validasi dasar
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

COMMENT ON FUNCTION public.create_pending_donation_dynamic IS
  'Membuat donasi pending dengan kode unik untuk QRIS dinamis';
