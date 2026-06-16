-- ============================================================
-- Sekolah Tanah Air - Professional Schema Alignment
-- ============================================================
-- Dipakai untuk DATABASE EXISTING yang sudah hidup.
-- File ini:
-- - menyelaraskan repo dengan schema live,
-- - menutup mismatch constraint/kolom utama,
-- - menjaga jalur publik tetap aman untuk skala produksi.
--
-- Untuk environment baru dari nol, gunakan:
-- supabase/migrations/20260615_full_database_setup.sql
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- 1. Column alignment
-- ============================================================

ALTER TABLE IF EXISTS public.campaigns
  ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.categories(id) ON UPDATE CASCADE ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS images text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS end_date date,
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS donor_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS collaborators jsonb DEFAULT '[]'::jsonb;

UPDATE public.campaigns
SET
  images = coalesce(images, '{}'::text[]),
  is_featured = coalesce(is_featured, false),
  donor_count = coalesce(donor_count, 0),
  collaborators = coalesce(collaborators, '[]'::jsonb)
WHERE
  images IS NULL
  OR is_featured IS NULL
  OR donor_count IS NULL
  OR collaborators IS NULL;

ALTER TABLE IF EXISTS public.campaigns
  ALTER COLUMN images SET DEFAULT '{}'::text[],
  ALTER COLUMN is_featured SET DEFAULT false,
  ALTER COLUMN donor_count SET DEFAULT 0,
  ALTER COLUMN collaborators SET DEFAULT '[]'::jsonb,
  ALTER COLUMN status SET DEFAULT 'draft';

DO $$
DECLARE
  constraint_name text;
BEGIN
  SELECT conname
  INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'public.campaigns'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) ILIKE '%status%';

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.campaigns DROP CONSTRAINT %I', constraint_name);
  END IF;

  ALTER TABLE public.campaigns
    ADD CONSTRAINT campaigns_status_check
    CHECK (status = ANY (ARRAY['draft'::text, 'active'::text, 'completed'::text, 'upcoming'::text]));
END $$;

ALTER TABLE IF EXISTS public.donations
  ADD COLUMN IF NOT EXISTS donor_phone text;

ALTER TABLE IF EXISTS public.school_reports
  ADD COLUMN IF NOT EXISTS reporter_ip text;

ALTER TABLE IF EXISTS public.volunteer_programs
  ADD COLUMN IF NOT EXISTS show_in_hero boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS external_link text,
  ADD COLUMN IF NOT EXISTS program_type text NOT NULL DEFAULT 'eduxplore',
  ADD COLUMN IF NOT EXISTS form_config jsonb NOT NULL DEFAULT '[{"id": "whatsapp_emergency", "type": "text", "label": "WA Darurat", "required": true}, {"id": "alamat", "type": "textarea", "label": "Alamat", "required": true}, {"id": "tanggal_lahir", "type": "date", "label": "Tanggal Lahir", "required": true}, {"id": "size_baju", "type": "select", "label": "Ukuran Baju", "options": ["XS", "S", "M", "L", "XL", "XXL", "XXXL"], "required": true}, {"id": "pendidikan", "type": "text", "label": "Latar Belakang Pendidikan", "required": true}, {"id": "bidang_diminati", "type": "select", "label": "Bidang yang Diminati", "options": ["Pengembangan Pemuda", "Pendidikan dan Pengajaran Siswa Guru", "Media dan Promosi serta Branding Desa", "Branding Budaya dan Lingkungan Lokal"], "required": true}, {"id": "riwayat_penyakit", "type": "textarea", "label": "Riwayat Penyakit", "required": false}, {"id": "bukti_dp", "type": "file", "label": "Bukti DP", "required": true}, {"id": "bukti_follow_ig", "type": "file", "label": "Bukti Follow IG", "required": true}, {"id": "foto_id_card", "type": "file", "label": "Pas Foto (untuk ID Card)", "required": true}]'::jsonb,
  ADD COLUMN IF NOT EXISTS short_description text;

UPDATE public.volunteer_programs
SET
  show_in_hero = coalesce(show_in_hero, false),
  form_config = coalesce(form_config, '[{"id": "whatsapp_emergency", "type": "text", "label": "WA Darurat", "required": true}, {"id": "alamat", "type": "textarea", "label": "Alamat", "required": true}, {"id": "tanggal_lahir", "type": "date", "label": "Tanggal Lahir", "required": true}, {"id": "size_baju", "type": "select", "label": "Ukuran Baju", "options": ["XS", "S", "M", "L", "XL", "XXL", "XXXL"], "required": true}, {"id": "pendidikan", "type": "text", "label": "Latar Belakang Pendidikan", "required": true}, {"id": "bidang_diminati", "type": "select", "label": "Bidang yang Diminati", "options": ["Pengembangan Pemuda", "Pendidikan dan Pengajaran Siswa Guru", "Media dan Promosi serta Branding Desa", "Branding Budaya dan Lingkungan Lokal"], "required": true}, {"id": "riwayat_penyakit", "type": "textarea", "label": "Riwayat Penyakit", "required": false}, {"id": "bukti_dp", "type": "file", "label": "Bukti DP", "required": true}, {"id": "bukti_follow_ig", "type": "file", "label": "Bukti Follow IG", "required": true}, {"id": "foto_id_card", "type": "file", "label": "Pas Foto (untuk ID Card)", "required": true}]'::jsonb)
WHERE show_in_hero IS NULL OR form_config IS NULL;

ALTER TABLE IF EXISTS public.volunteer_programs
  ALTER COLUMN show_in_hero SET DEFAULT false,
  ALTER COLUMN program_type SET DEFAULT 'eduxplore',
  ALTER COLUMN form_config SET DEFAULT '[{"id": "whatsapp_emergency", "type": "text", "label": "WA Darurat", "required": true}, {"id": "alamat", "type": "textarea", "label": "Alamat", "required": true}, {"id": "tanggal_lahir", "type": "date", "label": "Tanggal Lahir", "required": true}, {"id": "size_baju", "type": "select", "label": "Ukuran Baju", "options": ["XS", "S", "M", "L", "XL", "XXL", "XXXL"], "required": true}, {"id": "pendidikan", "type": "text", "label": "Latar Belakang Pendidikan", "required": true}, {"id": "bidang_diminati", "type": "select", "label": "Bidang yang Diminati", "options": ["Pengembangan Pemuda", "Pendidikan dan Pengajaran Siswa Guru", "Media dan Promosi serta Branding Desa", "Branding Budaya dan Lingkungan Lokal"], "required": true}, {"id": "riwayat_penyakit", "type": "textarea", "label": "Riwayat Penyakit", "required": false}, {"id": "bukti_dp", "type": "file", "label": "Bukti DP", "required": true}, {"id": "bukti_follow_ig", "type": "file", "label": "Bukti Follow IG", "required": true}, {"id": "foto_id_card", "type": "file", "label": "Pas Foto (untuk ID Card)", "required": true}]'::jsonb;

DO $$
DECLARE
  constraint_name text;
BEGIN
  SELECT conname
  INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'public.volunteer_programs'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) ILIKE '%program_type%';

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.volunteer_programs DROP CONSTRAINT %I', constraint_name);
  END IF;

  ALTER TABLE public.volunteer_programs
    ADD CONSTRAINT volunteer_programs_program_type_check
    CHECK (program_type = ANY (ARRAY['jelajah'::text, 'eduxplore'::text, 'bangun-asa'::text]));
END $$;

ALTER TABLE IF EXISTS public.volunteer_registrations
  ADD COLUMN IF NOT EXISTS foto_id_url text,
  ADD COLUMN IF NOT EXISTS pendidikan text,
  ADD COLUMN IF NOT EXISTS bidang_diminati text,
  ADD COLUMN IF NOT EXISTS answers jsonb NOT NULL DEFAULT '{}'::jsonb;

UPDATE public.volunteer_registrations
SET answers = coalesce(answers, '{}'::jsonb)
WHERE answers IS NULL;

ALTER TABLE IF EXISTS public.volunteer_registrations
  ALTER COLUMN answers SET DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  user_email text,
  action_type text NOT NULL CHECK (action_type = ANY (ARRAY['INSERT'::text, 'UPDATE'::text, 'DELETE'::text])),
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  old_values jsonb,
  new_values jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. Row Level Security
-- ============================================================

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spammer_blacklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteer_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteer_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 3. Shared Functions & Triggers
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_campaign_category_name()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.category_id IS NOT NULL THEN
    SELECT name INTO NEW.category
    FROM public.categories
    WHERE id = NEW.category_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.apply_campaign_donation_delta(
  target_campaign_id uuid,
  amount_delta numeric,
  count_delta integer
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF target_campaign_id IS NULL THEN
    RETURN;
  END IF;

  UPDATE public.campaigns
  SET
    current_amount = greatest(0, current_amount + amount_delta),
    donor_count = greatest(0, donor_count + count_delta)
  WHERE id = target_campaign_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_campaign_amount_after_donation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  old_amount numeric := 0;
  new_amount numeric := 0;
  old_count integer := 0;
  new_count integer := 0;
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.payment_status = 'success' THEN
      PERFORM public.apply_campaign_donation_delta(OLD.campaign_id, -OLD.amount, -1);
    END IF;
    RETURN OLD;
  END IF;

  IF NEW.payment_status = 'success' THEN
    new_amount := NEW.amount;
    new_count := 1;
  END IF;

  IF TG_OP = 'INSERT' THEN
    PERFORM public.apply_campaign_donation_delta(NEW.campaign_id, new_amount, new_count);
    RETURN NEW;
  END IF;

  IF OLD.payment_status = 'success' THEN
    old_amount := OLD.amount;
    old_count := 1;
  END IF;

  IF OLD.campaign_id IS DISTINCT FROM NEW.campaign_id THEN
    PERFORM public.apply_campaign_donation_delta(OLD.campaign_id, -old_amount, -old_count);
    PERFORM public.apply_campaign_donation_delta(NEW.campaign_id, new_amount, new_count);
  ELSE
    PERFORM public.apply_campaign_donation_delta(
      NEW.campaign_id,
      new_amount - old_amount,
      new_count - old_count
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_audit_log()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id uuid;
  v_user_email text;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NOT NULL THEN
    SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;
  END IF;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (user_id, user_email, action_type, entity_type, entity_id, new_values)
    VALUES (v_user_id, v_user_email, 'INSERT', TG_TABLE_NAME, NEW.id::text, row_to_json(NEW)::jsonb);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (user_id, user_email, action_type, entity_type, entity_id, old_values, new_values)
    VALUES (v_user_id, v_user_email, 'UPDATE', TG_TABLE_NAME, NEW.id::text, row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (user_id, user_email, action_type, entity_type, entity_id, old_values)
    VALUES (v_user_id, v_user_email, 'DELETE', TG_TABLE_NAME, OLD.id::text, row_to_json(OLD)::jsonb);
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public, auth
AS $$
DECLARE
  v_is_admin boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()
  ) INTO v_is_admin;
  RETURN v_is_admin;
END;
$$;

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
SET search_path = public
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
    OR p_payment_method NOT IN ('qris', 'va_bca', 'va_mandiri', 'gopay', 'shopeepay') THEN
    RAISE EXCEPTION 'Metode pembayaran tidak valid.';
  END IF;

  IF (
    SELECT count(*) FROM public.donations
    WHERE donor_phone = trim(p_donor_phone)
      AND created_at >= now() - interval '1 hour'
  ) >= 5 THEN
    RAISE EXCEPTION 'Terlalu banyak permintaan donasi. Silakan coba lagi dalam 1 jam.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.campaigns
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

CREATE OR REPLACE FUNCTION public.submit_school_report(
  p_reporter_name text,
  p_reporter_phone text,
  p_reporter_ip text,
  p_school_name text,
  p_location text,
  p_description text,
  p_image_urls jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF length(trim(p_reporter_name)) < 2
    OR length(trim(p_reporter_name)) > 120
    OR length(trim(p_reporter_phone)) < 8
    OR length(trim(p_reporter_phone)) > 30
    OR length(trim(p_school_name)) < 2
    OR length(trim(p_school_name)) > 200
    OR length(trim(p_location)) > 1000
    OR length(trim(p_description)) > 10000 THEN
    RAISE EXCEPTION 'Data laporan tidak valid.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.spammer_blacklist
    WHERE identifier IN (trim(p_reporter_phone), trim(coalesce(p_reporter_ip, '')))
  ) THEN
    RAISE EXCEPTION 'Akses dibatasi oleh sistem keamanan.';
  END IF;

  IF p_reporter_ip IS NOT NULL
    AND p_reporter_ip <> ''
    AND p_reporter_ip <> 'unknown'
    AND (
      SELECT count(*) FROM public.school_reports
      WHERE reporter_ip = p_reporter_ip
        AND created_at >= now() - interval '1 hour'
    ) >= 5 THEN
    RAISE EXCEPTION 'Terlalu banyak laporan. Silakan coba lagi dalam 1 jam.';
  END IF;

  INSERT INTO public.school_reports (
    reporter_name,
    reporter_phone,
    reporter_ip,
    school_name,
    location,
    description,
    image_urls,
    status
  )
  VALUES (
    trim(p_reporter_name),
    trim(p_reporter_phone),
    nullif(trim(coalesce(p_reporter_ip, '')), ''),
    trim(p_school_name),
    trim(p_location),
    trim(p_description),
    coalesce(p_image_urls, '[]'::jsonb),
    'pending'
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_volunteer_registration(
  p_program_id uuid,
  p_nama_lengkap text,
  p_email text,
  p_whatsapp text,
  p_whatsapp_emergency text,
  p_alamat text,
  p_tanggal_lahir date,
  p_size_baju text,
  p_pendidikan text,
  p_bidang_diminati text,
  p_riwayat_penyakit text,
  p_bukti_dp_url text,
  p_bukti_follow_url text,
  p_foto_id_url text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.volunteer_programs
    WHERE id = p_program_id AND status = 'open'
  ) THEN
    RAISE EXCEPTION 'Pendaftaran program sedang ditutup.';
  END IF;

  IF length(trim(p_nama_lengkap)) < 2
    OR length(trim(p_nama_lengkap)) > 120
    OR length(trim(p_email)) > 254
    OR length(trim(p_whatsapp)) > 30
    OR length(trim(p_whatsapp_emergency)) > 30
    OR length(trim(p_alamat)) > 2000 THEN
    RAISE EXCEPTION 'Data pendaftaran tidak valid.';
  END IF;

  INSERT INTO public.volunteer_registrations (
    program_id,
    nama_lengkap,
    email,
    whatsapp,
    whatsapp_emergency,
    alamat,
    tanggal_lahir,
    size_baju,
    pendidikan,
    bidang_diminati,
    riwayat_penyakit,
    bukti_dp_url,
    bukti_follow_url,
    foto_id_url,
    status
  )
  VALUES (
    p_program_id,
    trim(p_nama_lengkap),
    trim(p_email),
    trim(p_whatsapp),
    trim(p_whatsapp_emergency),
    trim(p_alamat),
    p_tanggal_lahir,
    trim(p_size_baju),
    nullif(trim(coalesce(p_pendidikan, '')), ''),
    nullif(trim(coalesce(p_bidang_diminati, '')), ''),
    nullif(trim(coalesce(p_riwayat_penyakit, '')), ''),
    p_bukti_dp_url,
    p_bukti_follow_url,
    p_foto_id_url,
    'pending'
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

DROP TRIGGER IF EXISTS trg_programs_set_updated_at ON public.programs;
CREATE TRIGGER trg_programs_set_updated_at
BEFORE UPDATE ON public.programs
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_campaigns_set_updated_at ON public.campaigns;
CREATE TRIGGER trg_campaigns_set_updated_at
BEFORE UPDATE ON public.campaigns
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_school_reports_set_updated_at ON public.school_reports;
CREATE TRIGGER trg_school_reports_set_updated_at
BEFORE UPDATE ON public.school_reports
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_site_content_set_updated_at ON public.site_content;
CREATE TRIGGER trg_site_content_set_updated_at
BEFORE UPDATE ON public.site_content
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_volunteer_programs_set_updated_at ON public.volunteer_programs;
CREATE TRIGGER trg_volunteer_programs_set_updated_at
BEFORE UPDATE ON public.volunteer_programs
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_sync_campaign_category_name ON public.campaigns;
CREATE TRIGGER trg_sync_campaign_category_name
BEFORE INSERT OR UPDATE ON public.campaigns
FOR EACH ROW
EXECUTE FUNCTION public.sync_campaign_category_name();

DROP TRIGGER IF EXISTS trg_sync_campaign_amount_after_donation ON public.donations;
CREATE TRIGGER trg_sync_campaign_amount_after_donation
AFTER INSERT OR UPDATE OR DELETE ON public.donations
FOR EACH ROW
EXECUTE FUNCTION public.sync_campaign_amount_after_donation();

DROP TRIGGER IF EXISTS audit_campaigns_trigger ON public.campaigns;
CREATE TRIGGER audit_campaigns_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.campaigns
FOR EACH ROW EXECUTE FUNCTION public.record_audit_log();

DROP TRIGGER IF EXISTS audit_site_content_trigger ON public.site_content;
CREATE TRIGGER audit_site_content_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.site_content
FOR EACH ROW EXECUTE FUNCTION public.record_audit_log();

DROP TRIGGER IF EXISTS audit_programs_trigger ON public.programs;
CREATE TRIGGER audit_programs_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.programs
FOR EACH ROW EXECUTE FUNCTION public.record_audit_log();

-- ============================================================
-- 4. Views
-- ============================================================

CREATE OR REPLACE VIEW public.public_campaign_donations
WITH (security_invoker = false) AS
SELECT
  id,
  campaign_id,
  CASE
    WHEN is_anonymous THEN 'Orang Baik'
    ELSE coalesce(nullif(donor_name, ''), 'Tanpa nama')
  END AS donor_name_display,
  amount,
  message,
  created_at,
  is_anonymous
FROM public.donations
WHERE payment_status = 'success';

CREATE OR REPLACE VIEW public.public_campaign_stats
WITH (security_invoker = true) AS
SELECT
  id AS campaign_id,
  current_amount,
  donor_count,
  updated_at
FROM public.campaigns
WHERE status <> 'draft';

CREATE OR REPLACE VIEW public.leaderboard
WITH (security_invoker = false) AS
SELECT
  md5(coalesce(nullif(lower(donor_email), ''), nullif(lower(donor_name), ''), id::text)) AS identifier,
  max(coalesce(nullif(donor_name, ''), 'Tanpa nama')) AS display_name,
  sum(amount) AS total_amount,
  count(*)::integer AS donation_count
FROM public.donations
WHERE payment_status = 'success'
  AND NOT is_anonymous
GROUP BY md5(coalesce(nullif(lower(donor_email), ''), nullif(lower(donor_name), ''), id::text));

-- ============================================================
-- 5. Indexes
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_programs_updated_at_desc ON public.programs(updated_at DESC, id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status_created_at_desc ON public.campaigns(status, created_at DESC, id);
CREATE INDEX IF NOT EXISTS idx_campaigns_category_created_at_desc ON public.campaigns(category_id, created_at DESC, id);
CREATE INDEX IF NOT EXISTS idx_campaigns_public_list ON public.campaigns(created_at DESC, id) WHERE status <> 'draft';
CREATE INDEX IF NOT EXISTS idx_campaigns_active_list ON public.campaigns(created_at DESC, id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_campaigns_featured_public_list ON public.campaigns(created_at DESC, id) WHERE status <> 'draft' AND is_featured = true;
CREATE INDEX IF NOT EXISTS idx_donations_status_created_at_desc ON public.donations(payment_status, created_at DESC, id);
CREATE INDEX IF NOT EXISTS idx_donations_success_campaign_created_at_desc ON public.donations(campaign_id, created_at DESC, id) WHERE payment_status = 'success';
CREATE INDEX IF NOT EXISTS idx_school_reports_status_updated_at_desc ON public.school_reports(status, updated_at DESC, id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at_desc ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_volunteer_registrations_program ON public.volunteer_registrations(program_id);

-- ============================================================
-- 6. Policies
-- ============================================================

DROP POLICY IF EXISTS "categories_public_select" ON public.categories;
CREATE POLICY "categories_public_select" ON public.categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "categories_admin_all" ON public.categories;
CREATE POLICY "categories_admin_all" ON public.categories FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "programs_public_select" ON public.programs;
CREATE POLICY "programs_public_select" ON public.programs FOR SELECT USING (true);
DROP POLICY IF EXISTS "programs_admin_all" ON public.programs;
CREATE POLICY "programs_admin_all" ON public.programs FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "campaigns_public_select" ON public.campaigns;
CREATE POLICY "campaigns_public_select" ON public.campaigns FOR SELECT USING (status <> 'draft');
DROP POLICY IF EXISTS "campaigns_admin_all" ON public.campaigns;
CREATE POLICY "campaigns_admin_all" ON public.campaigns FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "donations_admin_all" ON public.donations;
CREATE POLICY "donations_admin_all" ON public.donations FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "campaign_updates_public_select" ON public.campaign_updates;
CREATE POLICY "campaign_updates_public_select" ON public.campaign_updates FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.campaigns
    WHERE campaigns.id = campaign_updates.campaign_id
      AND campaigns.status <> 'draft'
  )
);
DROP POLICY IF EXISTS "campaign_updates_admin_all" ON public.campaign_updates;
CREATE POLICY "campaign_updates_admin_all" ON public.campaign_updates FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "school_reports_admin_all" ON public.school_reports;
CREATE POLICY "school_reports_admin_all" ON public.school_reports FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "site_content_public_select" ON public.site_content;
CREATE POLICY "site_content_public_select" ON public.site_content FOR SELECT USING (true);
DROP POLICY IF EXISTS "site_content_admin_all" ON public.site_content;
CREATE POLICY "site_content_admin_all" ON public.site_content FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_users_admin_select" ON public.admin_users;
CREATE POLICY "admin_users_admin_select" ON public.admin_users FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "spammer_blacklist_admin_all" ON public.spammer_blacklist;
CREATE POLICY "spammer_blacklist_admin_all" ON public.spammer_blacklist FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Allow public read volunteer_programs" ON public.volunteer_programs;
CREATE POLICY "Allow public read volunteer_programs" ON public.volunteer_programs FOR SELECT USING (true);
DROP POLICY IF EXISTS "volunteer_programs_admin_all" ON public.volunteer_programs;
CREATE POLICY "volunteer_programs_admin_all" ON public.volunteer_programs FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "volunteer_registrations_admin_all" ON public.volunteer_registrations;
CREATE POLICY "volunteer_registrations_admin_all" ON public.volunteer_registrations FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "audit_logs_admin_select" ON public.audit_logs;
CREATE POLICY "audit_logs_admin_select" ON public.audit_logs FOR SELECT TO authenticated USING (public.is_admin());

-- ============================================================
-- 7. Storage Buckets & Policies
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('campaign-assets', 'campaign-assets', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('site-media', 'site-media', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4']),
  ('volunteer-assets', 'volunteer-assets', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "volunteer_assets_admin_select" ON storage.objects;
CREATE POLICY "volunteer_assets_admin_select" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'volunteer-assets' AND public.is_admin());

DROP POLICY IF EXISTS "volunteer_assets_admin_delete" ON storage.objects;
CREATE POLICY "volunteer_assets_admin_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'volunteer-assets' AND public.is_admin());

DROP POLICY IF EXISTS "campaign_assets_admin_insert" ON storage.objects;
CREATE POLICY "campaign_assets_admin_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'campaign-assets' AND public.is_admin());

DROP POLICY IF EXISTS "campaign_assets_admin_update" ON storage.objects;
CREATE POLICY "campaign_assets_admin_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'campaign-assets' AND public.is_admin()) WITH CHECK (bucket_id = 'campaign-assets' AND public.is_admin());

DROP POLICY IF EXISTS "campaign_assets_admin_delete" ON storage.objects;
CREATE POLICY "campaign_assets_admin_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'campaign-assets' AND public.is_admin());

DROP POLICY IF EXISTS "site_media_admin_insert" ON storage.objects;
CREATE POLICY "site_media_admin_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'site-media' AND public.is_admin());

DROP POLICY IF EXISTS "site_media_admin_update" ON storage.objects;
CREATE POLICY "site_media_admin_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'site-media' AND public.is_admin()) WITH CHECK (bucket_id = 'site-media' AND public.is_admin());

DROP POLICY IF EXISTS "site_media_admin_delete" ON storage.objects;
CREATE POLICY "site_media_admin_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'site-media' AND public.is_admin());

DROP POLICY IF EXISTS "public_campaign_assets_read" ON storage.objects;
CREATE POLICY "public_campaign_assets_read" ON storage.objects FOR SELECT USING (bucket_id = 'campaign-assets');

DROP POLICY IF EXISTS "public_site_media_read" ON storage.objects;
CREATE POLICY "public_site_media_read" ON storage.objects FOR SELECT USING (bucket_id = 'site-media');

-- ============================================================
-- 8. Grants
-- ============================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT ON public.categories TO anon;
GRANT SELECT ON public.programs TO anon;
GRANT SELECT ON public.campaigns TO anon;
GRANT SELECT ON public.campaign_updates TO anon;
GRANT SELECT ON public.site_content TO anon;
GRANT SELECT ON public.volunteer_programs TO anon;
GRANT SELECT ON public.public_campaign_donations TO anon;
GRANT SELECT ON public.public_campaign_stats TO anon;
GRANT SELECT ON public.leaderboard TO anon;

GRANT SELECT ON public.admin_users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.programs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaigns TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.donations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaign_updates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.school_reports TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_content TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.spammer_blacklist TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.volunteer_programs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.volunteer_registrations TO authenticated;
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT SELECT ON public.public_campaign_donations TO authenticated;
GRANT SELECT ON public.public_campaign_stats TO authenticated;
GRANT SELECT ON public.leaderboard TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.programs TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaigns TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.donations TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaign_updates TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.school_reports TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_content TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.spammer_blacklist TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.volunteer_programs TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.volunteer_registrations TO service_role;
GRANT SELECT ON public.audit_logs TO service_role;
GRANT SELECT ON public.public_campaign_donations TO service_role;
GRANT SELECT ON public.public_campaign_stats TO service_role;
GRANT SELECT ON public.leaderboard TO service_role;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.create_pending_donation(uuid, text, text, text, numeric, text, text, boolean) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.submit_school_report(text, text, text, text, text, text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.submit_volunteer_registration(uuid, text, text, text, text, text, date, text, text, text, text, text, text, text) TO service_role;
