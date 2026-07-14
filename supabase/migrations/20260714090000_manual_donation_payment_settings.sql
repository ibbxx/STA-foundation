-- Manual donation payment settings and private payment proof storage.

CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_admin() TO anon, authenticated, service_role;

ALTER TABLE public.donations
  ADD COLUMN IF NOT EXISTS payment_proof_path text;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('donation-proofs', 'donation-proofs', false, 1048576, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "donation_proofs_admin_select" ON storage.objects;
CREATE POLICY "donation_proofs_admin_select"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'donation-proofs' AND (SELECT private.is_admin()));

DROP POLICY IF EXISTS "donation_proofs_admin_insert" ON storage.objects;
CREATE POLICY "donation_proofs_admin_insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'donation-proofs' AND (SELECT private.is_admin()));

DROP POLICY IF EXISTS "donation_proofs_admin_update" ON storage.objects;
CREATE POLICY "donation_proofs_admin_update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'donation-proofs' AND (SELECT private.is_admin()))
WITH CHECK (bucket_id = 'donation-proofs' AND (SELECT private.is_admin()));

DROP POLICY IF EXISTS "donation_proofs_admin_delete" ON storage.objects;
CREATE POLICY "donation_proofs_admin_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'donation-proofs' AND (SELECT private.is_admin()));

INSERT INTO public.site_content (key, value)
VALUES (
  'payment_settings',
  jsonb_build_object(
    'manual_enabled', true,
    'gateway_enabled', false,
    'active_gateway', null,
    'qris_image_url', '/images/qris-payment.jpeg',
    'bank_accounts', '[]'::jsonb,
    'manual_instructions', 'Unggah bukti pembayaran setelah transfer agar admin dapat memverifikasi donasi Anda.'
  )
)
ON CONFLICT (key) DO UPDATE SET
  value = jsonb_set(
    EXCLUDED.value || coalesce(public.site_content.value, '{}'::jsonb),
    '{qris_image_url}',
    to_jsonb(
      CASE
        WHEN nullif(coalesce(public.site_content.value->>'qris_image_url', ''), '') IS NULL
          THEN '/images/qris-payment.jpeg'
        ELSE public.site_content.value->>'qris_image_url'
      END
    ),
    true
  );

CREATE OR REPLACE FUNCTION public.create_pending_donation(
  p_campaign_id uuid,
  p_donor_name text,
  p_donor_email text,
  p_donor_phone text,
  p_amount numeric,
  p_payment_method text,
  p_message text,
  p_is_anonymous boolean
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_id uuid;
BEGIN
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

  IF (
    SELECT count(*)
    FROM public.donations
    WHERE donor_phone = trim(p_donor_phone)
      AND created_at >= now() - interval '1 hour'
  ) >= 5 THEN
    RAISE EXCEPTION 'Terlalu banyak permintaan donasi. Silakan coba lagi dalam 1 jam.';
  END IF;

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

  INSERT INTO public.donations (
    campaign_id,
    donor_name,
    donor_email,
    donor_phone,
    amount,
    payment_status,
    payment_method,
    message,
    is_anonymous
  )
  VALUES (
    p_campaign_id,
    trim(p_donor_name),
    nullif(trim(coalesce(p_donor_email, '')), ''),
    nullif(trim(coalesce(p_donor_phone, '')), ''),
    p_amount,
    'pending',
    nullif(trim(coalesce(p_payment_method, '')), ''),
    nullif(trim(coalesce(p_message, '')), ''),
    coalesce(p_is_anonymous, false)
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;
