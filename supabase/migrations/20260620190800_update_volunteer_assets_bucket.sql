-- Perbarui konfigurasi bucket volunteer-assets di Supabase Storage
-- Menambahkan 'application/pdf' ke allowed_mime_types dan menaikkan batas ukuran file menjadi 10MB (10485760 bytes)
UPDATE storage.buckets
SET 
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  file_size_limit = 10485760 -- 10MB
WHERE id = 'volunteer-assets';
