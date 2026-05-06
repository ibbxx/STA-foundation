-- ============================================================
-- Migration: EduXplore Volunteer System
-- Deskripsi: Membuat tabel volunteer_programs dan volunteer_registrations (Aman dijalankan berulang)
-- ============================================================

-- 1. Master Data Program Volunteer
CREATE TABLE IF NOT EXISTS public.volunteer_programs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  location text NOT NULL,
  image_url text,
  timeline jsonb NOT NULL DEFAULT '[]'::jsonb,
  requirements jsonb NOT NULL DEFAULT '[]'::jsonb,
  description text,
  show_in_hero boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'open' CHECK (status = ANY (ARRAY['open','closed','ongoing'])),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT volunteer_programs_pkey PRIMARY KEY (id)
);

-- 2. Data Pendaftar Volunteer
CREATE TABLE IF NOT EXISTS public.volunteer_registrations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES public.volunteer_programs(id) ON DELETE CASCADE,
  nama_lengkap text NOT NULL,
  email text NOT NULL,
  whatsapp text NOT NULL,
  whatsapp_emergency text NOT NULL,
  alamat text NOT NULL,
  tanggal_lahir date NOT NULL,
  size_baju text NOT NULL,
  riwayat_penyakit text,
  bukti_dp_url text,
  bukti_follow_url text,
  foto_id_url text,
  status text NOT NULL DEFAULT 'pending' CHECK (status = ANY (ARRAY['pending','verified','rejected'])),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT volunteer_registrations_pkey PRIMARY KEY (id)
);

-- 3. Row Level Security (Drop first to avoid errors, then recreate)
ALTER TABLE public.volunteer_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteer_registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read volunteer_programs" ON public.volunteer_programs;
CREATE POLICY "Allow public read volunteer_programs" ON public.volunteer_programs
  FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow authenticated all volunteer_programs" ON public.volunteer_programs;
CREATE POLICY "Allow authenticated all volunteer_programs" ON public.volunteer_programs
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public insert volunteer_registrations" ON public.volunteer_registrations;
CREATE POLICY "Allow public insert volunteer_registrations" ON public.volunteer_registrations
  FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated all volunteer_registrations" ON public.volunteer_registrations;
CREATE POLICY "Allow authenticated all volunteer_registrations" ON public.volunteer_registrations
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. Storage Bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('volunteer-assets', 'volunteer-assets', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Allow public upload volunteer-assets" ON storage.objects;
CREATE POLICY "Allow public upload volunteer-assets" ON storage.objects
  FOR INSERT TO anon WITH CHECK (bucket_id = 'volunteer-assets');

DROP POLICY IF EXISTS "Allow public read volunteer-assets" ON storage.objects;
CREATE POLICY "Allow public read volunteer-assets" ON storage.objects
  FOR SELECT TO anon USING (bucket_id = 'volunteer-assets');

DROP POLICY IF EXISTS "Allow authenticated delete volunteer-assets" ON storage.objects;
CREATE POLICY "Allow authenticated delete volunteer-assets" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'volunteer-assets');

-- 5. Seed: Program Pertama (Pujananting)
INSERT INTO public.volunteer_programs (slug, title, location, description, timeline, requirements, status)
VALUES (
  'pujananting-2026',
  'EduXplore Pujananting',
  'Barru, Pujananting — Sulawesi Selatan',
  'Jadilah bagian dari gerakan pendidikan di daerah terpencil. Program EduXplore mengajak relawan untuk terjun langsung memberikan edukasi, kegiatan lapangan, dan dampak sosial bagi anak-anak di pedalaman Pujananting.',
  '[
    {"date": "7–11 Mei 2026", "label": "Registrasi"},
    {"date": "12 Mei 2026", "label": "Briefing"},
    {"date": "13–14 Mei 2026", "label": "Persiapan"},
    {"date": "15 Mei 2026", "label": "Onboarding"},
    {"date": "16–20 Mei 2026", "label": "Program Berlangsung"}
  ]'::jsonb,
  '["Follow Instagram @sekolah.tanah.air", "Membayar DP pendaftaran", "Sehat jasmani dan rohani"]'::jsonb,
  'open'
) ON CONFLICT (slug) DO NOTHING;
