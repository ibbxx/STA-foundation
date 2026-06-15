-- ============================================================
-- Sekolah Tanah Air - Combined Full Database Setup Migration
-- ============================================================
-- Cara pakai:
-- 1. Buka Supabase Dashboard > SQL Editor.
-- 2. Paste seluruh isi file ini.
-- 3. Run sekali.
--
-- Script ini dibuat idempotent: aman dijalankan ulang karena memakai
-- CREATE TABLE IF NOT EXISTS, DROP POLICY IF EXISTS, dan ON CONFLICT.
-- ============================================================

-- ============================================================
-- 1. Extensions
-- ============================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- 2. Core Tables
-- ============================================================

-- Categories
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Programs
CREATE TABLE IF NOT EXISTS public.programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text NOT NULL,
  icon_name text,
  content text,
  image_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Campaigns
CREATE TABLE IF NOT EXISTS public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  category_id uuid REFERENCES public.categories(id) ON UPDATE CASCADE ON DELETE SET NULL,
  description text,
  image_url text,
  category text,
  status text NOT NULL DEFAULT 'draft' CHECK (status = ANY (ARRAY['draft', 'active', 'completed'])),
  start_date date,
  end_date date,
  is_featured boolean NOT NULL DEFAULT false,
  target_amount numeric(15, 2) NOT NULL DEFAULT 0 CHECK (target_amount >= 0),
  current_amount numeric(15, 2) NOT NULL DEFAULT 0 CHECK (current_amount >= 0),
  donor_count integer NOT NULL DEFAULT 0 CHECK (donor_count >= 0),
  images text[] NOT NULL DEFAULT '{}'::text[],
  collaborators jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Donations
CREATE TABLE IF NOT EXISTS public.donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON UPDATE CASCADE ON DELETE CASCADE,
  donor_name text NOT NULL,
  donor_email text,
  donor_phone text,
  amount numeric(15, 2) NOT NULL CHECK (amount > 0),
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status = ANY (ARRAY['pending', 'success', 'failed'])),
  payment_method text,
  message text,
  is_anonymous boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Campaign Updates
CREATE TABLE IF NOT EXISTS public.campaign_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON UPDATE CASCADE ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  image_url text,
  images text[],
  update_type text NOT NULL DEFAULT 'General' CHECK (update_type = ANY (ARRAY['General', 'Fundraising Progress', 'Distribution'])),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- School Reports
CREATE TABLE IF NOT EXISTS public.school_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_name text NOT NULL DEFAULT '',
  reporter_phone text NOT NULL DEFAULT '',
  reporter_ip text,
  school_name text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  image_urls jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status = ANY (ARRAY['pending', 'verified', 'actioned'])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Site Content
CREATE TABLE IF NOT EXISTS public.site_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Admin Users
CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Spammer Blacklist
CREATE TABLE IF NOT EXISTS public.spammer_blacklist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL UNIQUE,
  reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Volunteer Programs
CREATE TABLE IF NOT EXISTS public.volunteer_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  location text NOT NULL,
  image_url text,
  timeline jsonb NOT NULL DEFAULT '[]'::jsonb,
  requirements jsonb NOT NULL DEFAULT '[]'::jsonb,
  description text,
  short_description text,
  show_in_hero boolean NOT NULL DEFAULT false,
  external_link text,
  program_type text NOT NULL DEFAULT 'eduxplore' CHECK (program_type = ANY (ARRAY['jelajah', 'eduxplore', 'bangun-asa'])),
  status text NOT NULL DEFAULT 'open' CHECK (status = ANY (ARRAY['open', 'closed', 'ongoing'])),
  form_config jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Volunteer Registrations
CREATE TABLE IF NOT EXISTS public.volunteer_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES public.volunteer_programs(id) ON DELETE CASCADE,
  nama_lengkap text NOT NULL,
  email text NOT NULL,
  whatsapp text NOT NULL,
  whatsapp_emergency text,
  alamat text,
  tanggal_lahir date,
  size_baju text,
  riwayat_penyakit text,
  pendidikan text,
  bidang_diminati text,
  bukti_dp_url text,
  bukti_follow_url text,
  foto_id_url text,
  status text NOT NULL DEFAULT 'pending' CHECK (status = ANY (ARRAY['pending', 'verified', 'rejected'])),
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  user_email text,
  action_type text NOT NULL CHECK (action_type = ANY (ARRAY['INSERT', 'UPDATE', 'DELETE'])),
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  old_values jsonb,
  new_values jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. Enabling Row Level Security (RLS)
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
-- 4. Shared Functions & Triggers
-- ============================================================

-- Function: Set Updated At
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Trigger: programs set_updated_at
DROP TRIGGER IF EXISTS trg_programs_set_updated_at ON public.programs;
CREATE TRIGGER trg_programs_set_updated_at
BEFORE UPDATE ON public.programs
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Trigger: campaigns set_updated_at
DROP TRIGGER IF EXISTS trg_campaigns_set_updated_at ON public.campaigns;
CREATE TRIGGER trg_campaigns_set_updated_at
BEFORE UPDATE ON public.campaigns
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Trigger: school_reports set_updated_at
DROP TRIGGER IF EXISTS trg_school_reports_set_updated_at ON public.school_reports;
CREATE TRIGGER trg_school_reports_set_updated_at
BEFORE UPDATE ON public.school_reports
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Trigger: site_content set_updated_at
DROP TRIGGER IF EXISTS trg_site_content_set_updated_at ON public.site_content;
CREATE TRIGGER trg_site_content_set_updated_at
BEFORE UPDATE ON public.site_content
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Trigger: volunteer_programs set_updated_at
DROP TRIGGER IF EXISTS trg_volunteer_programs_set_updated_at ON public.volunteer_programs;
CREATE TRIGGER trg_volunteer_programs_set_updated_at
BEFORE UPDATE ON public.volunteer_programs
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Function: Sync Campaign Category Name
CREATE OR REPLACE FUNCTION public.sync_campaign_category_name()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.category_id IS NOT NULL THEN
    SELECT name INTO NEW.category
    from public.categories
    WHERE id = NEW.category_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger: sync_campaign_category_name
DROP TRIGGER IF EXISTS trg_sync_campaign_category_name ON public.campaigns;
CREATE TRIGGER trg_sync_campaign_category_name
BEFORE INSERT OR UPDATE ON public.campaigns
FOR EACH ROW
EXECUTE FUNCTION public.sync_campaign_category_name();

-- Function: Apply Campaign Donation Delta
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

-- Function: Sync Campaign Amount After Donation
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

-- Trigger: sync_campaign_amount_after_donation
DROP TRIGGER IF EXISTS trg_sync_campaign_amount_after_donation ON public.donations;
CREATE TRIGGER trg_sync_campaign_amount_after_donation
AFTER INSERT OR UPDATE OR DELETE ON public.donations
FOR EACH ROW
EXECUTE FUNCTION public.sync_campaign_amount_after_donation();

-- Function: Record Audit Log
CREATE OR REPLACE FUNCTION public.record_audit_log()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id uuid;
  v_user_email text;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NOT NULL THEN
    SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;
  END IF;

  IF (TG_OP = 'INSERT') THEN
    INSERT INTO public.audit_logs (user_id, user_email, action_type, entity_type, entity_id, new_values)
    VALUES (v_user_id, v_user_email, 'INSERT', TG_TABLE_NAME, NEW.id::text, row_to_json(NEW)::jsonb);
    RETURN NEW;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO public.audit_logs (user_id, user_email, action_type, entity_type, entity_id, old_values, new_values)
    VALUES (v_user_id, v_user_email, 'UPDATE', TG_TABLE_NAME, NEW.id::text, row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    INSERT INTO public.audit_logs (user_id, user_email, action_type, entity_type, entity_id, old_values)
    VALUES (v_user_id, v_user_email, 'DELETE', TG_TABLE_NAME, OLD.id::text, row_to_json(OLD)::jsonb);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

-- Triggers for Audit Logging
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

-- Function: Is Admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()
  );
$$;

-- ============================================================
-- 5. RPC Functions (API endpoints)
-- ============================================================

-- RPC: Create Pending Donation
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

-- RPC: Submit School Report
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

-- RPC: Submit Volunteer Registration
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

-- ============================================================
-- 6. Views
-- ============================================================

-- View: Public Campaign Donations
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

-- View: Public Campaign Stats
CREATE OR REPLACE VIEW public.public_campaign_stats
WITH (security_invoker = true) AS
SELECT
  id as campaign_id,
  current_amount,
  donor_count,
  updated_at
FROM public.campaigns
WHERE status <> 'draft';

-- View: Leaderboard
CREATE OR REPLACE VIEW public.leaderboard
WITH (security_invoker = false) AS
SELECT
  md5(coalesce(nullif(lower(donor_email), ''), nullif(lower(donor_name), ''), id::text)) AS identifier,
  max(coalesce(nullif(donor_name, ''), 'Tanpa nama')) AS display_name,
  sum(amount) AS total_amount,
  count(*)::integer as donation_count
FROM public.donations
WHERE payment_status = 'success'
  AND NOT is_anonymous
GROUP BY md5(coalesce(nullif(lower(donor_email), ''), nullif(lower(donor_name), ''), id::text));

-- ============================================================
-- 7. Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_slug_unique ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_name ON public.categories(name, id);

CREATE INDEX IF NOT EXISTS idx_programs_slug ON public.programs(slug);
CREATE UNIQUE INDEX IF NOT EXISTS idx_programs_slug_unique ON public.programs(slug);
CREATE INDEX IF NOT EXISTS idx_programs_updated_at_desc ON public.programs(updated_at DESC, id);

CREATE INDEX IF NOT EXISTS idx_campaigns_slug ON public.campaigns(slug);
CREATE UNIQUE INDEX IF NOT EXISTS idx_campaigns_slug_unique ON public.campaigns(slug);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at_desc ON public.campaigns(created_at DESC, id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status_created_at_desc ON public.campaigns(status, created_at DESC, id);
CREATE INDEX IF NOT EXISTS idx_campaigns_category_created_at_desc ON public.campaigns(category_id, created_at DESC, id);
CREATE INDEX IF NOT EXISTS idx_campaigns_public_list ON public.campaigns(created_at DESC, id) WHERE status <> 'draft';
CREATE INDEX IF NOT EXISTS idx_campaigns_active_list ON public.campaigns(created_at DESC, id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_campaigns_featured_public_list ON public.campaigns(created_at DESC, id) WHERE status <> 'draft' AND is_featured = true;

CREATE INDEX IF NOT EXISTS idx_donations_created_at_desc ON public.donations(created_at DESC, id);
CREATE INDEX IF NOT EXISTS idx_donations_status_created_at_desc ON public.donations(payment_status, created_at DESC, id);
CREATE INDEX IF NOT EXISTS idx_donations_campaign_created_at_desc ON public.donations(campaign_id, created_at DESC, id);
CREATE INDEX IF NOT EXISTS idx_donations_success_campaign_created_at_desc ON public.donations(campaign_id, created_at DESC, id) WHERE payment_status = 'success';

CREATE INDEX IF NOT EXISTS idx_campaign_updates_campaign_created_at_desc ON public.campaign_updates(campaign_id, created_at DESC, id);
CREATE INDEX IF NOT EXISTS idx_campaign_updates_type_created_at_desc ON public.campaign_updates(update_type, created_at DESC, id);

CREATE INDEX IF NOT EXISTS idx_school_reports_updated_at_desc ON public.school_reports(updated_at DESC, id);
CREATE INDEX IF NOT EXISTS idx_school_reports_status_updated_at_desc ON public.school_reports(status, updated_at DESC, id);

CREATE INDEX IF NOT EXISTS idx_site_content_key ON public.site_content(key);
CREATE UNIQUE INDEX IF NOT EXISTS idx_site_content_key_unique ON public.site_content(key);
CREATE INDEX IF NOT EXISTS idx_site_content_updated_at_desc ON public.site_content(updated_at DESC, id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at_desc ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON public.audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_volunteer_programs_slug ON public.volunteer_programs(slug);
CREATE UNIQUE INDEX IF NOT EXISTS idx_volunteer_programs_slug_unique ON public.volunteer_programs(slug);
CREATE INDEX IF NOT EXISTS idx_volunteer_registrations_program ON public.volunteer_registrations(program_id);

-- ============================================================
-- 8. Row Level Security Policies
-- ============================================================

-- categories
DROP POLICY IF EXISTS "categories_public_select" ON public.categories;
CREATE POLICY "categories_public_select" ON public.categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "categories_admin_all" ON public.categories;
CREATE POLICY "categories_admin_all" ON public.categories FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- programs
DROP POLICY IF EXISTS "programs_public_select" ON public.programs;
CREATE POLICY "programs_public_select" ON public.programs FOR SELECT USING (true);
DROP POLICY IF EXISTS "programs_admin_all" ON public.programs;
CREATE POLICY "programs_admin_all" ON public.programs FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- campaigns
DROP POLICY IF EXISTS "campaigns_public_select" ON public.campaigns;
CREATE POLICY "campaigns_public_select" ON public.campaigns FOR SELECT USING (status <> 'draft');
DROP POLICY IF EXISTS "campaigns_admin_all" ON public.campaigns;
CREATE POLICY "campaigns_admin_all" ON public.campaigns FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- donations
DROP POLICY IF EXISTS "donations_admin_all" ON public.donations;
CREATE POLICY "donations_admin_all" ON public.donations FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- campaign_updates
DROP POLICY IF EXISTS "campaign_updates_public_select" ON public.campaign_updates;
CREATE POLICY "campaign_updates_public_select" ON public.campaign_updates FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.campaigns
    WHERE campaigns.id = campaign_updates.campaign_id AND campaigns.status <> 'draft'
  )
);
DROP POLICY IF EXISTS "campaign_updates_admin_all" ON public.campaign_updates;
CREATE POLICY "campaign_updates_admin_all" ON public.campaign_updates FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- school_reports
DROP POLICY IF EXISTS "school_reports_admin_all" ON public.school_reports;
CREATE POLICY "school_reports_admin_all" ON public.school_reports FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- site_content
DROP POLICY IF EXISTS "site_content_public_select" ON public.site_content;
CREATE POLICY "site_content_public_select" ON public.site_content FOR SELECT USING (true);
DROP POLICY IF EXISTS "site_content_admin_all" ON public.site_content;
CREATE POLICY "site_content_admin_all" ON public.site_content FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- admin_users
DROP POLICY IF EXISTS "admin_users_admin_select" ON public.admin_users;
CREATE POLICY "admin_users_admin_select" ON public.admin_users FOR SELECT TO authenticated USING (public.is_admin());

-- spammer_blacklist
DROP POLICY IF EXISTS "spammer_blacklist_admin_all" ON public.spammer_blacklist;
CREATE POLICY "spammer_blacklist_admin_all" ON public.spammer_blacklist FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- volunteer_programs
DROP POLICY IF EXISTS "Allow public read volunteer_programs" ON public.volunteer_programs;
CREATE POLICY "Allow public read volunteer_programs" ON public.volunteer_programs FOR SELECT USING (true);
DROP POLICY IF EXISTS "volunteer_programs_admin_all" ON public.volunteer_programs;
CREATE POLICY "volunteer_programs_admin_all" ON public.volunteer_programs FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- volunteer_registrations
DROP POLICY IF EXISTS "volunteer_registrations_admin_all" ON public.volunteer_registrations;
CREATE POLICY "volunteer_registrations_admin_all" ON public.volunteer_registrations FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- audit_logs
DROP POLICY IF EXISTS "audit_logs_admin_select" ON public.audit_logs;
CREATE POLICY "audit_logs_admin_select" ON public.audit_logs FOR SELECT TO authenticated USING (public.is_admin());

-- ============================================================
-- 9. Storage Buckets & Storage Policies
-- ============================================================

-- Insert Buckets (Idempotent)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('campaign-assets', 'campaign-assets', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('site-media', 'site-media', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4']),
  ('volunteer-assets', 'volunteer-assets', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage RLS Policies
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

-- General read access policies for public buckets
DROP POLICY IF EXISTS "public_campaign_assets_read" ON storage.objects;
CREATE POLICY "public_campaign_assets_read" ON storage.objects FOR SELECT USING (bucket_id = 'campaign-assets');

DROP POLICY IF EXISTS "public_site_media_read" ON storage.objects;
CREATE POLICY "public_site_media_read" ON storage.objects FOR SELECT USING (bucket_id = 'site-media');

-- ============================================================
-- 10. Role Privileges & Grants
-- ============================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Anon grants
GRANT SELECT ON public.categories TO anon;
GRANT SELECT ON public.programs TO anon;
GRANT SELECT ON public.campaigns TO anon;
GRANT SELECT ON public.campaign_updates TO anon;
GRANT SELECT ON public.site_content TO anon;
GRANT SELECT ON public.volunteer_programs TO anon;
GRANT SELECT ON public.public_campaign_donations TO anon;
GRANT SELECT ON public.public_campaign_stats TO anon;
GRANT SELECT ON public.leaderboard TO anon;

-- Authenticated (Admin) grants
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

-- Execute permissions for Functions/RPCs
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.create_pending_donation(uuid, text, text, text, numeric, text, text, boolean) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.submit_school_report(text, text, text, text, text, text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.submit_volunteer_registration(uuid, text, text, text, text, text, date, text, text, text, text, text, text, text) TO service_role;

-- ============================================================
-- 11. Initial Seed Data
-- ============================================================

-- Seed Categories
INSERT INTO public.categories (name, slug)
VALUES 
  ('Pendidikan', 'pendidikan'),
  ('Infrastruktur', 'infrastruktur'),
  ('Sosial', 'sosial')
ON CONFLICT (name) DO NOTHING;

-- Seed Programs
INSERT INTO public.programs (slug, title, description, icon_name, content)
VALUES 
  ('jelajah-tanah-air', 'Jelajah Tanah Air', 'Eksplorasi kondisi pendidikan di daerah 3T.', 'search', 'Detail program Jelajah Tanah Air.'),
  ('eduxplore', 'EduXplore', 'Mengajar anak-anak di daerah pedalaman.', 'graduation-cap', 'Detail program EduXplore.'),
  ('bangun-asa', 'Bangun 1000 Asa', 'Membangun infrastruktur sekolah rusak.', 'hammer', 'Detail program Bangun 1000 Asa.')
ON CONFLICT (slug) DO NOTHING;

-- Seed Volunteer Programs
INSERT INTO public.volunteer_programs (slug, title, location, description, short_description, timeline, requirements, status, program_type)
VALUES (
  'pujananting-2026',
  'EduXplore Pujananting',
  'Barru, Pujananting — Sulawesi Selatan',
  'Jadilah bagian dari gerakan pendidikan di daerah terpencil. Program EduXplore mengajak relawan untuk terjun langsung memberikan edukasi, kegiatan lapangan, dan dampak sosial bagi anak-anak di pedalaman Pujananting.',
  'Jelajahi dan bantu pendidikan anak-anak di pedalaman Pujananting bersama Sekolah Tanah Air.',
  '[
    {"date": "7–11 Mei 2026", "label": "Registrasi"},
    {"date": "12 Mei 2026", "label": "Briefing"},
    {"date": "13–14 Mei 2026", "label": "Persiapan"},
    {"date": "15 Mei 2026", "label": "Onboarding"},
    {"date": "16–20 Mei 2026", "label": "Program Berlangsung"}
  ]'::jsonb,
  '["Follow Instagram @sekolah.tanah.air", "Membayar DP pendaftaran", "Sehat jasmani dan rohani"]'::jsonb,
  'open',
  'eduxplore'
) ON CONFLICT (slug) DO NOTHING;
