-- ============================================================
-- Sekolah Tanah Air - Consolidated Schema
-- ============================================================
-- Canonical, idempotent schema migration for both:
-- - fresh environments
-- - existing environments that need alignment / hardening
--
-- Repository rule:
-- - schema SQL lives only in supabase/migrations
-- - no duplicate SQL schema files outside this folder
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- 1. Core Tables
-- ============================================================

CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text NOT NULL,
  icon_name text,
  content text,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  category_id uuid REFERENCES public.categories(id) ON UPDATE CASCADE ON DELETE SET NULL,
  description text NOT NULL,
  image_url text,
  category text,
  status text NOT NULL DEFAULT 'draft' CHECK (status = ANY (ARRAY['draft', 'active', 'completed', 'upcoming'])),
  start_date date,
  end_date date,
  is_featured boolean NOT NULL DEFAULT false,
  target_amount bigint NOT NULL DEFAULT 0 CHECK (target_amount >= 0),
  current_amount bigint NOT NULL DEFAULT 0 CHECK (current_amount >= 0),
  donor_count integer NOT NULL DEFAULT 0 CHECK (donor_count >= 0),
  images text[] NOT NULL DEFAULT '{}'::text[],
  collaborators jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON UPDATE CASCADE ON DELETE CASCADE,
  donor_name text NOT NULL,
  donor_email text,
  donor_phone text,
  amount bigint NOT NULL CHECK (amount > 0),
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status = ANY (ARRAY['pending', 'success', 'failed'])),
  payment_method text,
  message text,
  is_anonymous boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.campaign_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON UPDATE CASCADE ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  image_url text,
  images text[],
  update_type text NOT NULL DEFAULT 'General' CHECK (update_type = ANY (ARRAY['General', 'Fundraising Progress', 'Distribution'])),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.school_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_name text NOT NULL,
  reporter_phone text NOT NULL,
  reporter_ip text,
  school_name text NOT NULL,
  location text NOT NULL,
  description text NOT NULL,
  image_urls jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status = ANY (ARRAY['pending', 'verified', 'actioned'])),
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.site_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.spammer_blacklist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text UNIQUE,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

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
  form_config jsonb NOT NULL DEFAULT '[{"id": "whatsapp_emergency", "type": "text", "label": "WA Darurat", "required": true}, {"id": "alamat", "type": "textarea", "label": "Alamat", "required": true}, {"id": "tanggal_lahir", "type": "date", "label": "Tanggal Lahir", "required": true}, {"id": "size_baju", "type": "select", "label": "Ukuran Baju", "options": ["XS", "S", "M", "L", "XL", "XXL", "XXXL"], "required": true}, {"id": "pendidikan", "type": "text", "label": "Latar Belakang Pendidikan", "required": true}, {"id": "bidang_diminati", "type": "select", "label": "Bidang yang Diminati", "options": ["Pengembangan Pemuda", "Pendidikan dan Pengajaran Siswa Guru", "Media dan Promosi serta Branding Desa", "Branding Budaya dan Lingkungan Lokal"], "required": true}, {"id": "riwayat_penyakit", "type": "textarea", "label": "Riwayat Penyakit", "required": false}, {"id": "bukti_dp", "type": "file", "label": "Bukti DP", "required": true}, {"id": "bukti_follow_ig", "type": "file", "label": "Bukti Follow IG", "required": true}, {"id": "foto_id_card", "type": "file", "label": "Pas Foto (untuk ID Card)", "required": true}]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

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
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  user_email text,
  action_type text NOT NULL CHECK (action_type = ANY (ARRAY['INSERT', 'UPDATE', 'DELETE'])),
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  old_values jsonb,
  new_values jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. Existing Database Alignment
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
  collaborators = coalesce(collaborators, '[]'::jsonb),
  status = coalesce(status, 'draft')
WHERE
  images IS NULL
  OR is_featured IS NULL
  OR donor_count IS NULL
  OR collaborators IS NULL
  OR status IS NULL;

ALTER TABLE IF EXISTS public.campaigns
  ALTER COLUMN images SET DEFAULT '{}'::text[],
  ALTER COLUMN is_featured SET DEFAULT false,
  ALTER COLUMN donor_count SET DEFAULT 0,
  ALTER COLUMN collaborators SET DEFAULT '[]'::jsonb,
  ALTER COLUMN target_amount SET DEFAULT 0,
  ALTER COLUMN current_amount SET DEFAULT 0,
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
  program_type = coalesce(program_type, 'eduxplore'),
  form_config = coalesce(form_config, '[{"id": "whatsapp_emergency", "type": "text", "label": "WA Darurat", "required": true}, {"id": "alamat", "type": "textarea", "label": "Alamat", "required": true}, {"id": "tanggal_lahir", "type": "date", "label": "Tanggal Lahir", "required": true}, {"id": "size_baju", "type": "select", "label": "Ukuran Baju", "options": ["XS", "S", "M", "L", "XL", "XXL", "XXXL"], "required": true}, {"id": "pendidikan", "type": "text", "label": "Latar Belakang Pendidikan", "required": true}, {"id": "bidang_diminati", "type": "select", "label": "Bidang yang Diminati", "options": ["Pengembangan Pemuda", "Pendidikan dan Pengajaran Siswa Guru", "Media dan Promosi serta Branding Desa", "Branding Budaya dan Lingkungan Lokal"], "required": true}, {"id": "riwayat_penyakit", "type": "textarea", "label": "Riwayat Penyakit", "required": false}, {"id": "bukti_dp", "type": "file", "label": "Bukti DP", "required": true}, {"id": "bukti_follow_ig", "type": "file", "label": "Bukti Follow IG", "required": true}, {"id": "foto_id_card", "type": "file", "label": "Pas Foto (untuk ID Card)", "required": true}]'::jsonb)
WHERE show_in_hero IS NULL OR program_type IS NULL OR form_config IS NULL;

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

-- ============================================================
-- 3. RLS Enablement
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
-- 4. Cleanup of Legacy Functions / Views / Policies / Indexes
-- ============================================================

-- Legacy auto-RLS helpers sometimes install a global event trigger that blocks
-- function cleanup on existing databases.
DROP EVENT TRIGGER IF EXISTS ensure_rls;

-- Legacy donation-sync trigger names can still reference old helper functions.
DROP TRIGGER IF EXISTS trg_sync_campaign_current_amount ON public.donations;

DO $$
DECLARE
  fn_signature regprocedure;
BEGIN
  FOR fn_signature IN
    SELECT p.oid::regprocedure
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = ANY (ARRAY[
        'get_public_campaign_donations',
        'get_public_leaderboard',
        'refresh_campaign_current_amount',
        'sync_campaign_current_amount',
        'rls_auto_enable'
      ])
  LOOP
    EXECUTE format('DROP FUNCTION IF EXISTS %s', fn_signature);
  END LOOP;
END $$;

DROP VIEW IF EXISTS public.public_campaign_donations;
DROP VIEW IF EXISTS public.public_campaign_stats;
DROP VIEW IF EXISTS public.leaderboard;

DO $$
DECLARE
  policy_row record;
  keep_public_policies text[] := ARRAY[
    'categories_public_select',
    'categories_admin_all',
    'programs_public_select',
    'programs_admin_all',
    'campaigns_public_select',
    'campaigns_admin_all',
    'donations_admin_all',
    'campaign_updates_public_select',
    'campaign_updates_admin_all',
    'school_reports_admin_all',
    'site_content_public_select',
    'site_content_admin_all',
    'admin_users_self_select',
    'spammer_blacklist_admin_all',
    'volunteer_programs_public_select',
    'volunteer_programs_admin_all',
    'volunteer_registrations_admin_all',
    'audit_logs_admin_select'
  ];
BEGIN
  FOR policy_row IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = ANY (ARRAY[
        'categories',
        'programs',
        'campaigns',
        'donations',
        'campaign_updates',
        'school_reports',
        'site_content',
        'admin_users',
        'spammer_blacklist',
        'volunteer_programs',
        'volunteer_registrations',
        'audit_logs'
      ])
      AND NOT (policyname = ANY (keep_public_policies))
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', policy_row.policyname, policy_row.schemaname, policy_row.tablename);
  END LOOP;
END $$;

DO $$
DECLARE
  policy_row record;
  keep_storage_policies text[] := ARRAY[
    'volunteer_assets_admin_select',
    'volunteer_assets_admin_insert',
    'volunteer_assets_admin_update',
    'volunteer_assets_admin_delete',
    'campaign_assets_admin_select',
    'campaign_assets_admin_insert',
    'campaign_assets_admin_update',
    'campaign_assets_admin_delete',
    'site_media_admin_select',
    'site_media_admin_insert',
    'site_media_admin_update',
    'site_media_admin_delete'
  ];
BEGIN
  FOR policy_row IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND NOT (policyname = ANY (keep_storage_policies))
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', policy_row.policyname, policy_row.schemaname, policy_row.tablename);
  END LOOP;
END $$;

DO $$
DECLARE
  index_row record;
  keep_indexes text[] := ARRAY[
    'idx_programs_updated_at_desc',
    'idx_campaigns_status_created_at_desc',
    'idx_campaigns_category_created_at_desc',
    'idx_campaigns_public_list',
    'idx_campaigns_active_list',
    'idx_campaigns_featured_public_list',
    'idx_donations_status_created_at_desc',
    'idx_donations_success_campaign_created_at_desc',
    'idx_donations_phone_created_at_desc',
    'idx_school_reports_status_updated_at_desc',
    'idx_school_reports_reporter_ip_created_at_desc',
    'idx_audit_logs_created_at_desc',
    'idx_volunteer_programs_status_created_at_desc',
    'idx_volunteer_registrations_program'
  ];
BEGIN
  FOR index_row IN
    SELECT n.nspname AS schema_name, i.relname AS index_name
    FROM pg_class t
    JOIN pg_namespace n ON n.oid = t.relnamespace
    JOIN pg_index ix ON ix.indrelid = t.oid
    JOIN pg_class i ON i.oid = ix.indexrelid
    LEFT JOIN pg_constraint c ON c.conindid = ix.indexrelid
    WHERE n.nspname = 'public'
      AND t.relname = ANY (ARRAY[
        'programs',
        'campaigns',
        'school_reports',
        'site_content',
        'donations',
        'campaign_updates',
        'volunteer_registrations',
        'audit_logs',
        'categories',
        'volunteer_programs'
      ])
      AND c.oid IS NULL
      AND NOT (i.relname = ANY (keep_indexes))
  LOOP
    EXECUTE format('DROP INDEX IF EXISTS %I.%I', index_row.schema_name, index_row.index_name);
  END LOOP;
END $$;

-- ============================================================
-- 5. Shared Functions & Triggers
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_campaign_category_name()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF NEW.category_id IS NOT NULL THEN
    SELECT c.name
    INTO NEW.category
    FROM public.categories AS c
    WHERE c.id = NEW.category_id;
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
SET search_path = pg_catalog, public
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
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
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
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_user_id uuid;
  v_user_email text;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NOT NULL THEN
    SELECT u.email
    INTO v_user_email
    FROM auth.users AS u
    WHERE u.id = v_user_id;
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
LANGUAGE sql
SECURITY INVOKER
STABLE
SET search_path = pg_catalog, public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE user_id = (SELECT auth.uid())
  );
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
    OR p_payment_method NOT IN ('qris', 'va_bca', 'va_mandiri', 'gopay', 'shopeepay') THEN
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
SET search_path = pg_catalog, public
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
    SELECT 1
    FROM public.spammer_blacklist
    WHERE identifier IN (trim(p_reporter_phone), trim(coalesce(p_reporter_ip, '')))
  ) THEN
    RAISE EXCEPTION 'Akses dibatasi oleh sistem keamanan.';
  END IF;

  IF p_reporter_ip IS NOT NULL
    AND p_reporter_ip <> ''
    AND p_reporter_ip <> 'unknown'
    AND (
      SELECT count(*)
      FROM public.school_reports
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
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.volunteer_programs
    WHERE id = p_program_id
      AND status = 'open'
  ) THEN
    RAISE EXCEPTION 'Pendaftaran program sedang ditutup.';
  END IF;

  IF length(trim(p_nama_lengkap)) < 2
    OR length(trim(p_nama_lengkap)) > 120
    OR length(trim(p_email)) > 254
    OR length(trim(p_whatsapp)) > 30
    OR length(trim(coalesce(p_whatsapp_emergency, ''))) > 30
    OR length(trim(coalesce(p_alamat, ''))) > 2000 THEN
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
    nullif(trim(coalesce(p_whatsapp_emergency, '')), ''),
    nullif(trim(coalesce(p_alamat, '')), ''),
    p_tanggal_lahir,
    nullif(trim(coalesce(p_size_baju, '')), ''),
    nullif(trim(coalesce(p_pendidikan, '')), ''),
    nullif(trim(coalesce(p_bidang_diminati, '')), ''),
    nullif(trim(coalesce(p_riwayat_penyakit, '')), ''),
    nullif(trim(coalesce(p_bukti_dp_url, '')), ''),
    nullif(trim(coalesce(p_bukti_follow_url, '')), ''),
    nullif(trim(coalesce(p_foto_id_url, '')), ''),
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
FOR EACH ROW
EXECUTE FUNCTION public.record_audit_log();

DROP TRIGGER IF EXISTS audit_site_content_trigger ON public.site_content;
CREATE TRIGGER audit_site_content_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.site_content
FOR EACH ROW
EXECUTE FUNCTION public.record_audit_log();

DROP TRIGGER IF EXISTS audit_programs_trigger ON public.programs;
CREATE TRIGGER audit_programs_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.programs
FOR EACH ROW
EXECUTE FUNCTION public.record_audit_log();

-- ============================================================
-- 6. Views
-- ============================================================

CREATE OR REPLACE VIEW public.public_campaign_donations
WITH (security_invoker = true) AS
SELECT
  d.id,
  d.campaign_id,
  CASE
    WHEN d.is_anonymous THEN 'Orang Baik'
    ELSE coalesce(nullif(d.donor_name, ''), 'Tanpa nama')
  END AS donor_name_display,
  d.amount,
  d.message,
  d.created_at,
  d.is_anonymous
FROM public.donations AS d
WHERE d.payment_status = 'success';

CREATE OR REPLACE VIEW public.public_campaign_stats
WITH (security_invoker = true) AS
SELECT
  c.id AS campaign_id,
  c.current_amount,
  c.donor_count,
  c.updated_at
FROM public.campaigns AS c
WHERE c.status <> 'draft';

CREATE OR REPLACE VIEW public.leaderboard
WITH (security_invoker = true) AS
SELECT
  md5(coalesce(nullif(lower(d.donor_email), ''), nullif(lower(d.donor_name), ''), d.id::text)) AS identifier,
  max(coalesce(nullif(d.donor_name, ''), 'Tanpa nama')) AS display_name,
  sum(d.amount) AS total_amount,
  count(*)::integer AS donation_count
FROM public.donations AS d
WHERE d.payment_status = 'success'
  AND NOT d.is_anonymous
GROUP BY md5(coalesce(nullif(lower(d.donor_email), ''), nullif(lower(d.donor_name), ''), d.id::text));

-- ============================================================
-- 7. Canonical Indexes
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_programs_updated_at_desc
  ON public.programs(updated_at DESC, id);

CREATE INDEX IF NOT EXISTS idx_campaigns_status_created_at_desc
  ON public.campaigns(status, created_at DESC, id);

CREATE INDEX IF NOT EXISTS idx_campaigns_category_created_at_desc
  ON public.campaigns(category_id, created_at DESC, id);

CREATE INDEX IF NOT EXISTS idx_campaigns_public_list
  ON public.campaigns(created_at DESC, id)
  WHERE status <> 'draft';

CREATE INDEX IF NOT EXISTS idx_campaigns_active_list
  ON public.campaigns(created_at DESC, id)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_campaigns_featured_public_list
  ON public.campaigns(created_at DESC, id)
  WHERE status <> 'draft' AND is_featured = true;

CREATE INDEX IF NOT EXISTS idx_donations_status_created_at_desc
  ON public.donations(payment_status, created_at DESC, id);

CREATE INDEX IF NOT EXISTS idx_donations_success_campaign_created_at_desc
  ON public.donations(campaign_id, created_at DESC, id)
  WHERE payment_status = 'success';

CREATE INDEX IF NOT EXISTS idx_donations_phone_created_at_desc
  ON public.donations(donor_phone, created_at DESC, id)
  WHERE donor_phone IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_school_reports_status_updated_at_desc
  ON public.school_reports(status, updated_at DESC, id);

CREATE INDEX IF NOT EXISTS idx_school_reports_reporter_ip_created_at_desc
  ON public.school_reports(reporter_ip, created_at DESC, id)
  WHERE reporter_ip IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at_desc
  ON public.audit_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_volunteer_programs_status_created_at_desc
  ON public.volunteer_programs(status, created_at DESC, id);

CREATE INDEX IF NOT EXISTS idx_volunteer_registrations_program
  ON public.volunteer_registrations(program_id);

-- ============================================================
-- 8. Canonical RLS Policies
-- ============================================================

DROP POLICY IF EXISTS "categories_public_select" ON public.categories;
CREATE POLICY "categories_public_select"
ON public.categories
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "categories_admin_all" ON public.categories;
CREATE POLICY "categories_admin_all"
ON public.categories
FOR ALL
TO authenticated
USING ((SELECT public.is_admin()))
WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "programs_public_select" ON public.programs;
CREATE POLICY "programs_public_select"
ON public.programs
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "programs_admin_all" ON public.programs;
CREATE POLICY "programs_admin_all"
ON public.programs
FOR ALL
TO authenticated
USING ((SELECT public.is_admin()))
WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "campaigns_public_select" ON public.campaigns;
CREATE POLICY "campaigns_public_select"
ON public.campaigns
FOR SELECT
TO anon, authenticated
USING (status <> 'draft');

DROP POLICY IF EXISTS "campaigns_admin_all" ON public.campaigns;
CREATE POLICY "campaigns_admin_all"
ON public.campaigns
FOR ALL
TO authenticated
USING ((SELECT public.is_admin()))
WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "donations_admin_all" ON public.donations;
CREATE POLICY "donations_admin_all"
ON public.donations
FOR ALL
TO authenticated
USING ((SELECT public.is_admin()))
WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "campaign_updates_public_select" ON public.campaign_updates;
CREATE POLICY "campaign_updates_public_select"
ON public.campaign_updates
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.campaigns AS c
    WHERE c.id = campaign_updates.campaign_id
      AND c.status <> 'draft'
  )
);

DROP POLICY IF EXISTS "campaign_updates_admin_all" ON public.campaign_updates;
CREATE POLICY "campaign_updates_admin_all"
ON public.campaign_updates
FOR ALL
TO authenticated
USING ((SELECT public.is_admin()))
WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "school_reports_admin_all" ON public.school_reports;
CREATE POLICY "school_reports_admin_all"
ON public.school_reports
FOR ALL
TO authenticated
USING ((SELECT public.is_admin()))
WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "site_content_public_select" ON public.site_content;
CREATE POLICY "site_content_public_select"
ON public.site_content
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "site_content_admin_all" ON public.site_content;
CREATE POLICY "site_content_admin_all"
ON public.site_content
FOR ALL
TO authenticated
USING ((SELECT public.is_admin()))
WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "admin_users_self_select" ON public.admin_users;
CREATE POLICY "admin_users_self_select"
ON public.admin_users
FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "spammer_blacklist_admin_all" ON public.spammer_blacklist;
CREATE POLICY "spammer_blacklist_admin_all"
ON public.spammer_blacklist
FOR ALL
TO authenticated
USING ((SELECT public.is_admin()))
WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "volunteer_programs_public_select" ON public.volunteer_programs;
CREATE POLICY "volunteer_programs_public_select"
ON public.volunteer_programs
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "volunteer_programs_admin_all" ON public.volunteer_programs;
CREATE POLICY "volunteer_programs_admin_all"
ON public.volunteer_programs
FOR ALL
TO authenticated
USING ((SELECT public.is_admin()))
WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "volunteer_registrations_admin_all" ON public.volunteer_registrations;
CREATE POLICY "volunteer_registrations_admin_all"
ON public.volunteer_registrations
FOR ALL
TO authenticated
USING ((SELECT public.is_admin()))
WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "audit_logs_admin_select" ON public.audit_logs;
CREATE POLICY "audit_logs_admin_select"
ON public.audit_logs
FOR SELECT
TO authenticated
USING ((SELECT public.is_admin()));

-- ============================================================
-- 9. Storage Buckets & Policies
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
CREATE POLICY "volunteer_assets_admin_select"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'volunteer-assets' AND (SELECT public.is_admin()));

DROP POLICY IF EXISTS "volunteer_assets_admin_insert" ON storage.objects;
CREATE POLICY "volunteer_assets_admin_insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'volunteer-assets' AND (SELECT public.is_admin()));

DROP POLICY IF EXISTS "volunteer_assets_admin_update" ON storage.objects;
CREATE POLICY "volunteer_assets_admin_update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'volunteer-assets' AND (SELECT public.is_admin()))
WITH CHECK (bucket_id = 'volunteer-assets' AND (SELECT public.is_admin()));

DROP POLICY IF EXISTS "volunteer_assets_admin_delete" ON storage.objects;
CREATE POLICY "volunteer_assets_admin_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'volunteer-assets' AND (SELECT public.is_admin()));

DROP POLICY IF EXISTS "campaign_assets_admin_select" ON storage.objects;
CREATE POLICY "campaign_assets_admin_select"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'campaign-assets' AND (SELECT public.is_admin()));

DROP POLICY IF EXISTS "campaign_assets_admin_insert" ON storage.objects;
CREATE POLICY "campaign_assets_admin_insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'campaign-assets' AND (SELECT public.is_admin()));

DROP POLICY IF EXISTS "campaign_assets_admin_update" ON storage.objects;
CREATE POLICY "campaign_assets_admin_update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'campaign-assets' AND (SELECT public.is_admin()))
WITH CHECK (bucket_id = 'campaign-assets' AND (SELECT public.is_admin()));

DROP POLICY IF EXISTS "campaign_assets_admin_delete" ON storage.objects;
CREATE POLICY "campaign_assets_admin_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'campaign-assets' AND (SELECT public.is_admin()));

DROP POLICY IF EXISTS "site_media_admin_select" ON storage.objects;
CREATE POLICY "site_media_admin_select"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'site-media' AND (SELECT public.is_admin()));

DROP POLICY IF EXISTS "site_media_admin_insert" ON storage.objects;
CREATE POLICY "site_media_admin_insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'site-media' AND (SELECT public.is_admin()));

DROP POLICY IF EXISTS "site_media_admin_update" ON storage.objects;
CREATE POLICY "site_media_admin_update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'site-media' AND (SELECT public.is_admin()))
WITH CHECK (bucket_id = 'site-media' AND (SELECT public.is_admin()));

DROP POLICY IF EXISTS "site_media_admin_delete" ON storage.objects;
CREATE POLICY "site_media_admin_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'site-media' AND (SELECT public.is_admin()));

-- No public SELECT policy on storage.objects for public buckets.
-- Files stay publicly retrievable via bucket public URLs, but directory-style
-- listing through storage.objects is blocked for anon/authenticated users.

-- ============================================================
-- 10. Grants
-- ============================================================

REVOKE CREATE ON SCHEMA public FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC, anon, authenticated;

GRANT SELECT ON public.categories TO anon, authenticated;
GRANT SELECT ON public.programs TO anon, authenticated;
GRANT SELECT ON public.campaigns TO anon, authenticated;
GRANT SELECT ON public.campaign_updates TO anon, authenticated;
GRANT SELECT ON public.site_content TO anon, authenticated;
GRANT SELECT ON public.volunteer_programs TO anon, authenticated;
GRANT SELECT ON public.public_campaign_stats TO anon, authenticated;

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
GRANT EXECUTE ON FUNCTION public.create_pending_donation(uuid, text, text, text, numeric, text, text, boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.submit_school_report(text, text, text, text, text, text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.submit_volunteer_registration(uuid, text, text, text, text, text, date, text, text, text, text, text, text, text) TO service_role;

REVOKE ALL ON FUNCTION public.record_audit_log() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_campaign_category_name() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.apply_campaign_donation_delta(uuid, numeric, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_campaign_amount_after_donation() FROM PUBLIC, anon, authenticated;
