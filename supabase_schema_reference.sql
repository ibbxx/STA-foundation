-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.programs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text NOT NULL,
  icon_name text,
  content text,
  image_url text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT programs_pkey PRIMARY KEY (id)
);
CREATE TABLE public.campaigns (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text NOT NULL,
  target_amount bigint NOT NULL CHECK (target_amount >= 0),
  current_amount bigint NOT NULL DEFAULT 0 CHECK (current_amount >= 0),
  image_url text,
  category text,
  status text NOT NULL DEFAULT 'active'::text CHECK (status = ANY (ARRAY['draft'::text, 'active'::text, 'completed'::text, 'upcoming'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  category_id uuid,
  images ARRAY NOT NULL DEFAULT '{}'::text[],
  start_date date,
  end_date date,
  is_featured boolean NOT NULL DEFAULT false,
  donor_count integer NOT NULL DEFAULT 0 CHECK (donor_count >= 0),
  collaborators jsonb DEFAULT '[]'::jsonb,
  CONSTRAINT campaigns_pkey PRIMARY KEY (id),
  CONSTRAINT campaigns_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id)
);
CREATE TABLE public.donations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL,
  donor_name text NOT NULL,
  donor_email text,
  amount bigint NOT NULL CHECK (amount > 0),
  payment_status text NOT NULL DEFAULT 'pending'::text CHECK (payment_status = ANY (ARRAY['pending'::text, 'success'::text, 'failed'::text])),
  payment_method text,
  message text,
  is_anonymous boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  donor_phone text,
  CONSTRAINT donations_pkey PRIMARY KEY (id),
  CONSTRAINT donations_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id)
);
CREATE TABLE public.school_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  reporter_name text NOT NULL,
  reporter_phone text NOT NULL,
  school_name text NOT NULL,
  location text NOT NULL,
  description text NOT NULL,
  image_urls jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'verified'::text, 'actioned'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  reporter_ip text,
  CONSTRAINT school_reports_pkey PRIMARY KEY (id)
);
CREATE TABLE public.site_content (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT site_content_pkey PRIMARY KEY (id)
);
CREATE TABLE public.categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT categories_pkey PRIMARY KEY (id)
);
CREATE TABLE public.campaign_updates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  image_url text,
  update_type text NOT NULL DEFAULT 'General'::text CHECK (update_type = ANY (ARRAY['General'::text, 'Fundraising Progress'::text, 'Distribution'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  images ARRAY,
  CONSTRAINT campaign_updates_pkey PRIMARY KEY (id),
  CONSTRAINT campaign_updates_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id)
);
CREATE TABLE public.spammer_blacklist (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  identifier text UNIQUE,
  reason text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT spammer_blacklist_pkey PRIMARY KEY (id)
);
CREATE TABLE public.volunteer_programs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  location text NOT NULL,
  image_url text,
  timeline jsonb NOT NULL DEFAULT '[]'::jsonb,
  requirements jsonb NOT NULL DEFAULT '[]'::jsonb,
  description text,
  status text NOT NULL DEFAULT 'open'::text CHECK (status = ANY (ARRAY['open'::text, 'closed'::text, 'ongoing'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  show_in_hero boolean NOT NULL DEFAULT false,
  external_link text,
  program_type text NOT NULL DEFAULT 'eduxplore'::text CHECK (program_type = ANY (ARRAY['jelajah'::text, 'eduxplore'::text, 'bangun-asa'::text])),
  form_config jsonb NOT NULL DEFAULT '[{"id": "whatsapp_emergency", "type": "text", "label": "WA Darurat", "required": true}, {"id": "alamat", "type": "textarea", "label": "Alamat", "required": true}, {"id": "tanggal_lahir", "type": "date", "label": "Tanggal Lahir", "required": true}, {"id": "size_baju", "type": "select", "label": "Ukuran Baju", "options": ["XS", "S", "M", "L", "XL", "XXL", "XXXL"], "required": true}, {"id": "pendidikan", "type": "text", "label": "Latar Belakang Pendidikan", "required": true}, {"id": "bidang_diminati", "type": "select", "label": "Bidang yang Diminati", "options": ["Pengembangan Pemuda", "Pendidikan dan Pengajaran Siswa Guru", "Media dan Promosi serta Branding Desa", "Branding Budaya dan Lingkungan Lokal"], "required": true}, {"id": "riwayat_penyakit", "type": "textarea", "label": "Riwayat Penyakit", "required": false}, {"id": "bukti_dp", "type": "file", "label": "Bukti DP", "required": true}, {"id": "bukti_follow_ig", "type": "file", "label": "Bukti Follow IG", "required": true}, {"id": "foto_id_card", "type": "file", "label": "Pas Foto (untuk ID Card)", "required": true}]'::jsonb,
  short_description text,
  CONSTRAINT volunteer_programs_pkey PRIMARY KEY (id)
);
CREATE TABLE public.volunteer_registrations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL,
  nama_lengkap text NOT NULL,
  email text NOT NULL,
  whatsapp text NOT NULL,
  whatsapp_emergency text,
  alamat text,
  tanggal_lahir date,
  size_baju text,
  riwayat_penyakit text,
  bukti_dp_url text,
  bukti_follow_url text,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'verified'::text, 'rejected'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  foto_id_url text,
  pendidikan text,
  bidang_diminati text,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT volunteer_registrations_pkey PRIMARY KEY (id),
  CONSTRAINT volunteer_registrations_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.volunteer_programs(id)
);
CREATE TABLE public.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  user_email text,
  action_type text NOT NULL CHECK (action_type = ANY (ARRAY['INSERT'::text, 'UPDATE'::text, 'DELETE'::text])),
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  old_values jsonb,
  new_values jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT audit_logs_pkey PRIMARY KEY (id)
);
CREATE TABLE public.admin_users (
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT admin_users_pkey PRIMARY KEY (user_id),
  CONSTRAINT admin_users_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
