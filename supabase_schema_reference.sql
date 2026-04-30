-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

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

CREATE TABLE public.campaigns (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text NOT NULL,
  target_amount bigint NOT NULL CHECK (target_amount >= 0),
  current_amount bigint NOT NULL DEFAULT 0 CHECK (current_amount >= 0),
  image_url text,
  category text,
  status text NOT NULL DEFAULT 'active'::text CHECK (status = ANY (ARRAY['draft'::text, 'active'::text, 'completed'::text])),
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

CREATE TABLE public.categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT categories_pkey PRIMARY KEY (id)
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

CREATE TABLE public.spammer_blacklist (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  identifier text UNIQUE,
  reason text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT spammer_blacklist_pkey PRIMARY KEY (id)
);
