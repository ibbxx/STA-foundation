-- ============================================
-- STORAGE BUCKET SETUP
-- Jalankan di Supabase SQL Editor
-- ============================================

-- 1. Buat bucket "campaign-assets" (public, untuk gambar campaign)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'campaign-assets',
  'campaign-assets',
  true,
  2097152,
  ARRAY['image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/jpeg', 'image/webp'];

-- 2. Buat bucket "site-media" (public, untuk gambar hero, program, laporan)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'site-media',
  'site-media',
  true,
  2097152,
  ARRAY['image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/jpeg', 'image/webp'];

-- ============================================
-- STORAGE RLS POLICIES
-- ============================================

-- Campaign Assets: Publik bisa lihat, Admin bisa upload & hapus
CREATE POLICY "Public can view campaign assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'campaign-assets');

CREATE POLICY "Authenticated users can upload campaign assets"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'campaign-assets'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Authenticated users can update campaign assets"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'campaign-assets'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Authenticated users can delete campaign assets"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'campaign-assets'
    AND auth.role() = 'authenticated'
  );

-- Site Media: Sama — publik lihat, admin kelola
CREATE POLICY "Public can view site media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'site-media');

CREATE POLICY "Authenticated users can upload site media"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'site-media'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Authenticated users can update site media"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'site-media'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Authenticated users can delete site media"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'site-media'
    AND auth.role() = 'authenticated'
  );

-- Laporan Sekolah: Publik bisa upload foto bukti (tanpa login)
CREATE POLICY "Anyone can upload school report photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'site-media'
    AND (storage.foldername(name))[1] = 'school-reports'
  );
