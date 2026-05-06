-- ================================================================
-- FIX DEFINITIF: EduXplore Form — RLS + Storage + Schema
-- Jalankan SELURUH file ini di Supabase SQL Editor (1x run)
-- ================================================================

-- 1. Tambahkan kolom external_link jika belum ada
ALTER TABLE public.volunteer_programs
  ADD COLUMN IF NOT EXISTS external_link text;

-- 2. Pastikan tabel ada dan RLS aktif
ALTER TABLE public.volunteer_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteer_registrations ENABLE ROW LEVEL SECURITY;

-- 3. Grant privilege level ke role anon dan authenticated
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.volunteer_programs TO anon;
GRANT INSERT ON public.volunteer_registrations TO anon;
GRANT ALL ON public.volunteer_programs TO authenticated;
GRANT ALL ON public.volunteer_registrations TO authenticated;

-- 4. RLS Policy: volunteer_programs
DROP POLICY IF EXISTS "Allow public read volunteer_programs" ON public.volunteer_programs;
CREATE POLICY "Allow public read volunteer_programs"
  ON public.volunteer_programs FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow authenticated all volunteer_programs" ON public.volunteer_programs;
CREATE POLICY "Allow authenticated all volunteer_programs"
  ON public.volunteer_programs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 5. RLS Policy: volunteer_registrations
DROP POLICY IF EXISTS "Allow public insert volunteer_registrations" ON public.volunteer_registrations;
CREATE POLICY "Allow public insert volunteer_registrations"
  ON public.volunteer_registrations FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated all volunteer_registrations" ON public.volunteer_registrations;
CREATE POLICY "Allow authenticated all volunteer_registrations"
  ON public.volunteer_registrations FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 6. Buat/update bucket volunteer-assets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'volunteer-assets',
  'volunteer-assets',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'];

-- 7. Storage RLS: Hapus semua policy lama volunteer-assets
DROP POLICY IF EXISTS "Allow public upload volunteer-assets" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read volunteer-assets" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete volunteer-assets" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated update volunteer-assets" ON storage.objects;
DROP POLICY IF EXISTS "volunteer_assets_select" ON storage.objects;
DROP POLICY IF EXISTS "volunteer_assets_insert" ON storage.objects;
DROP POLICY IF EXISTS "volunteer_assets_update" ON storage.objects;
DROP POLICY IF EXISTS "volunteer_assets_delete" ON storage.objects;

-- 8. Storage RLS: Buat ulang tanpa batasan role (paling kompatibel)
CREATE POLICY "volunteer_assets_public_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'volunteer-assets');

CREATE POLICY "volunteer_assets_public_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'volunteer-assets');

CREATE POLICY "volunteer_assets_authenticated_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'volunteer-assets');

-- 9. Verifikasi akhir
SELECT 'TABEL volunteer_registrations:' AS info,
  (SELECT count(*) FROM public.volunteer_registrations) AS total_rows;

SELECT 'BUCKET volunteer-assets:' AS info,
  id, name, public, file_size_limit
FROM storage.buckets WHERE id = 'volunteer-assets';

SELECT 'RLS POLICIES volunteer_registrations:' AS info,
  policyname, roles, cmd
FROM pg_policies WHERE tablename = 'volunteer_registrations';

SELECT 'STORAGE POLICIES volunteer-assets:' AS info,
  policyname, cmd
FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE 'volunteer%';
