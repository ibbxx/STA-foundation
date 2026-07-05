-- ============================================================
-- Migration: Move is_admin() to private schema
-- ============================================================
-- Supabase Database Linter memperingatkan bahwa fungsi SECURITY DEFINER
-- yang berada di schema `public` dapat diakses langsung melalui REST API
-- endpoint `/rest/v1/rpc/is_admin` oleh siapa saja (anon & authenticated).
--
-- Solusi: Pindahkan fungsi ke schema `private` yang TIDAK diekspos oleh
-- PostgREST API Supabase. Fungsi tetap bisa dipanggil secara internal
-- oleh RLS policies di dalam database.
--
-- PENTING: Ini TIDAK akan merusak akses campaign untuk user biasa.
-- RLS policies tetap mengevaluasi private.is_admin() secara internal,
-- dan karena fungsi ini SECURITY DEFINER, ia tetap bisa membaca
-- tabel admin_users tanpa masalah permission.
-- ============================================================

-- 1. Buat schema private jika belum ada
CREATE SCHEMA IF NOT EXISTS private;

-- 2. Buat fungsi private.is_admin()
CREATE OR REPLACE FUNCTION private.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = pg_catalog, public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE user_id = auth.uid()
  );
$$;

-- 3. Berikan izin EXECUTE kepada role yang diperlukan
--    (diperlukan agar RLS policies yang berjalan atas nama role ini bisa memanggil fungsi)
GRANT USAGE ON SCHEMA private TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_admin() TO anon, authenticated, service_role;


-- ============================================================
-- 4. Perbarui semua RLS policies untuk menggunakan private.is_admin()
-- ============================================================

-- ── 4a. campaign_updates ──────────────────────────────────────
DROP POLICY IF EXISTS "campaign_updates_select" ON public.campaign_updates;
CREATE POLICY "campaign_updates_select"
ON public.campaign_updates
FOR SELECT
TO anon, authenticated
USING (
  (SELECT private.is_admin()) OR
  EXISTS (
    SELECT 1
    FROM public.campaigns AS c
    WHERE c.id = campaign_updates.campaign_id
      AND c.status <> 'draft'
  )
);

DROP POLICY IF EXISTS "campaign_updates_admin_insert" ON public.campaign_updates;
CREATE POLICY "campaign_updates_admin_insert"
ON public.campaign_updates
FOR INSERT
TO authenticated
WITH CHECK ((SELECT private.is_admin()));

DROP POLICY IF EXISTS "campaign_updates_admin_update" ON public.campaign_updates;
CREATE POLICY "campaign_updates_admin_update"
ON public.campaign_updates
FOR UPDATE
TO authenticated
USING ((SELECT private.is_admin()))
WITH CHECK ((SELECT private.is_admin()));

DROP POLICY IF EXISTS "campaign_updates_admin_delete" ON public.campaign_updates;
CREATE POLICY "campaign_updates_admin_delete"
ON public.campaign_updates
FOR DELETE
TO authenticated
USING ((SELECT private.is_admin()));


-- ── 4b. campaigns ─────────────────────────────────────────────
DROP POLICY IF EXISTS "campaigns_select" ON public.campaigns;
CREATE POLICY "campaigns_select"
ON public.campaigns
FOR SELECT
TO anon, authenticated
USING (
  (SELECT private.is_admin()) OR
  (status <> 'draft')
);

DROP POLICY IF EXISTS "campaigns_admin_insert" ON public.campaigns;
CREATE POLICY "campaigns_admin_insert"
ON public.campaigns
FOR INSERT
TO authenticated
WITH CHECK ((SELECT private.is_admin()));

DROP POLICY IF EXISTS "campaigns_admin_update" ON public.campaigns;
CREATE POLICY "campaigns_admin_update"
ON public.campaigns
FOR UPDATE
TO authenticated
USING ((SELECT private.is_admin()))
WITH CHECK ((SELECT private.is_admin()));

DROP POLICY IF EXISTS "campaigns_admin_delete" ON public.campaigns;
CREATE POLICY "campaigns_admin_delete"
ON public.campaigns
FOR DELETE
TO authenticated
USING ((SELECT private.is_admin()));


-- ── 4c. categories ────────────────────────────────────────────
DROP POLICY IF EXISTS "categories_admin_insert" ON public.categories;
CREATE POLICY "categories_admin_insert"
ON public.categories
FOR INSERT
TO authenticated
WITH CHECK ((SELECT private.is_admin()));

DROP POLICY IF EXISTS "categories_admin_update" ON public.categories;
CREATE POLICY "categories_admin_update"
ON public.categories
FOR UPDATE
TO authenticated
USING ((SELECT private.is_admin()))
WITH CHECK ((SELECT private.is_admin()));

DROP POLICY IF EXISTS "categories_admin_delete" ON public.categories;
CREATE POLICY "categories_admin_delete"
ON public.categories
FOR DELETE
TO authenticated
USING ((SELECT private.is_admin()));


-- ── 4d. programs ──────────────────────────────────────────────
DROP POLICY IF EXISTS "programs_admin_insert" ON public.programs;
CREATE POLICY "programs_admin_insert"
ON public.programs
FOR INSERT
TO authenticated
WITH CHECK ((SELECT private.is_admin()));

DROP POLICY IF EXISTS "programs_admin_update" ON public.programs;
CREATE POLICY "programs_admin_update"
ON public.programs
FOR UPDATE
TO authenticated
USING ((SELECT private.is_admin()))
WITH CHECK ((SELECT private.is_admin()));

DROP POLICY IF EXISTS "programs_admin_delete" ON public.programs;
CREATE POLICY "programs_admin_delete"
ON public.programs
FOR DELETE
TO authenticated
USING ((SELECT private.is_admin()));


-- ── 4e. site_content ──────────────────────────────────────────
DROP POLICY IF EXISTS "site_content_admin_insert" ON public.site_content;
CREATE POLICY "site_content_admin_insert"
ON public.site_content
FOR INSERT
TO authenticated
WITH CHECK ((SELECT private.is_admin()));

DROP POLICY IF EXISTS "site_content_admin_update" ON public.site_content;
CREATE POLICY "site_content_admin_update"
ON public.site_content
FOR UPDATE
TO authenticated
USING ((SELECT private.is_admin()))
WITH CHECK ((SELECT private.is_admin()));

DROP POLICY IF EXISTS "site_content_admin_delete" ON public.site_content;
CREATE POLICY "site_content_admin_delete"
ON public.site_content
FOR DELETE
TO authenticated
USING ((SELECT private.is_admin()));


-- ── 4f. volunteer_programs ────────────────────────────────────
DROP POLICY IF EXISTS "volunteer_programs_admin_insert" ON public.volunteer_programs;
CREATE POLICY "volunteer_programs_admin_insert"
ON public.volunteer_programs
FOR INSERT
TO authenticated
WITH CHECK ((SELECT private.is_admin()));

DROP POLICY IF EXISTS "volunteer_programs_admin_update" ON public.volunteer_programs;
CREATE POLICY "volunteer_programs_admin_update"
ON public.volunteer_programs
FOR UPDATE
TO authenticated
USING ((SELECT private.is_admin()))
WITH CHECK ((SELECT private.is_admin()));

DROP POLICY IF EXISTS "volunteer_programs_admin_delete" ON public.volunteer_programs;
CREATE POLICY "volunteer_programs_admin_delete"
ON public.volunteer_programs
FOR DELETE
TO authenticated
USING ((SELECT private.is_admin()));


-- ── 4g. volunteer_registrations ───────────────────────────────
DROP POLICY IF EXISTS "volunteer_registrations_admin_all" ON public.volunteer_registrations;
CREATE POLICY "volunteer_registrations_admin_all"
ON public.volunteer_registrations
FOR ALL
TO authenticated
USING ((SELECT private.is_admin()))
WITH CHECK ((SELECT private.is_admin()));


-- ── 4h. spammer_blacklist ─────────────────────────────────────
DROP POLICY IF EXISTS "spammer_blacklist_admin_all" ON public.spammer_blacklist;
CREATE POLICY "spammer_blacklist_admin_all"
ON public.spammer_blacklist
FOR ALL
TO authenticated
USING ((SELECT private.is_admin()))
WITH CHECK ((SELECT private.is_admin()));


-- ── 4i. donations ─────────────────────────────────────────────
DROP POLICY IF EXISTS "donations_admin_all" ON public.donations;
CREATE POLICY "donations_admin_all"
ON public.donations
FOR ALL
TO authenticated
USING ((SELECT private.is_admin()))
WITH CHECK ((SELECT private.is_admin()));


-- ── 4j. school_reports ────────────────────────────────────────
DROP POLICY IF EXISTS "school_reports_admin_all" ON public.school_reports;
CREATE POLICY "school_reports_admin_all"
ON public.school_reports
FOR ALL
TO authenticated
USING ((SELECT private.is_admin()))
WITH CHECK ((SELECT private.is_admin()));


-- ── 4k. audit_logs ────────────────────────────────────────────
DROP POLICY IF EXISTS "audit_logs_admin_select" ON public.audit_logs;
CREATE POLICY "audit_logs_admin_select"
ON public.audit_logs
FOR SELECT
TO authenticated
USING ((SELECT private.is_admin()));


-- ── 4l. storage.objects ───────────────────────────────────────
DROP POLICY IF EXISTS "volunteer_assets_admin_select" ON storage.objects;
CREATE POLICY "volunteer_assets_admin_select"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'volunteer-assets' AND (SELECT private.is_admin()));

DROP POLICY IF EXISTS "volunteer_assets_admin_insert" ON storage.objects;
CREATE POLICY "volunteer_assets_admin_insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'volunteer-assets' AND (SELECT private.is_admin()));

DROP POLICY IF EXISTS "volunteer_assets_admin_update" ON storage.objects;
CREATE POLICY "volunteer_assets_admin_update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'volunteer-assets' AND (SELECT private.is_admin()))
WITH CHECK (bucket_id = 'volunteer-assets' AND (SELECT private.is_admin()));

DROP POLICY IF EXISTS "volunteer_assets_admin_delete" ON storage.objects;
CREATE POLICY "volunteer_assets_admin_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'volunteer-assets' AND (SELECT private.is_admin()));

DROP POLICY IF EXISTS "campaign_assets_admin_select" ON storage.objects;
CREATE POLICY "campaign_assets_admin_select"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'campaign-assets' AND (SELECT private.is_admin()));

DROP POLICY IF EXISTS "campaign_assets_admin_insert" ON storage.objects;
CREATE POLICY "campaign_assets_admin_insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'campaign-assets' AND (SELECT private.is_admin()));

DROP POLICY IF EXISTS "campaign_assets_admin_update" ON storage.objects;
CREATE POLICY "campaign_assets_admin_update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'campaign-assets' AND (SELECT private.is_admin()))
WITH CHECK (bucket_id = 'campaign-assets' AND (SELECT private.is_admin()));

DROP POLICY IF EXISTS "campaign_assets_admin_delete" ON storage.objects;
CREATE POLICY "campaign_assets_admin_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'campaign-assets' AND (SELECT private.is_admin()));

DROP POLICY IF EXISTS "site_media_admin_select" ON storage.objects;
CREATE POLICY "site_media_admin_select"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'site-media' AND (SELECT private.is_admin()));

DROP POLICY IF EXISTS "site_media_admin_insert" ON storage.objects;
CREATE POLICY "site_media_admin_insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'site-media' AND (SELECT private.is_admin()));

DROP POLICY IF EXISTS "site_media_admin_update" ON storage.objects;
CREATE POLICY "site_media_admin_update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'site-media' AND (SELECT private.is_admin()))
WITH CHECK (bucket_id = 'site-media' AND (SELECT private.is_admin()));

DROP POLICY IF EXISTS "site_media_admin_delete" ON storage.objects;
CREATE POLICY "site_media_admin_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'site-media' AND (SELECT private.is_admin()));


-- ============================================================
-- 5. Hapus fungsi lama public.is_admin()
-- ============================================================
DROP FUNCTION IF EXISTS public.is_admin();
