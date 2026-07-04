-- ============================================================
-- Fix: Buat ulang schema dan tabel migrasi internal Supabase
-- ============================================================
-- Tabel ini diperlukan oleh infrastruktur internal Supabase
-- (PostgREST, Dashboard, CLI) untuk melacak status migrasi.
-- Tanpa tabel ini, PostgREST schema cache reload akan gagal
-- berulang kali dan menyebabkan timeout massal.
-- ============================================================

-- 1. Buat schema jika belum ada
CREATE SCHEMA IF NOT EXISTS supabase_migrations;

-- 2. Buat tabel migrasi jika belum ada
CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (
  version text NOT NULL PRIMARY KEY,
  statements text[],
  name text
);

-- 3. Daftarkan migrasi yang sudah pernah dijalankan
INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES
  ('20260616000000', 'consolidated_schema'),
  ('20260617134800', 'add_registration_type'),
  ('20260620190800', 'update_volunteer_assets_bucket'),
  ('20260705000000', 'add_performance_indexes'),
  ('20260705010000', 'optimize_leaderboard_and_indexes'),
  ('20260705020000', 'create_migrations_table')
ON CONFLICT (version) DO NOTHING;
