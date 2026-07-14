-- ============================================================
-- Migration: Consolidate RLS Policies to Resolve Multiple Permissive Policies Warnings
-- ============================================================
-- Di PostgreSQL, jika terdapat beberapa policy PERMISSIVE untuk role dan action yang sama,
-- PostgreSQL akan mengevaluasi setiap policy dengan kondisi OR. Hal ini tidak optimal untuk performa.
-- Kita menggabungkan policy SELECT umum dan admin menjadi satu policy SELECT per tabel,
-- dan memecah policy ALL admin menjadi policy INSERT, UPDATE, DELETE terpisah.
-- ============================================================

-- Compatibility for databases where the later private.is_admin migration was
-- applied manually without recording the preceding migration history.
CREATE OR REPLACE FUNCTION public.is_admin()
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

GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;

-- 1. Tabel public.campaign_updates
DROP POLICY IF EXISTS "campaign_updates_public_select" ON public.campaign_updates;
DROP POLICY IF EXISTS "campaign_updates_admin_all" ON public.campaign_updates;
DROP POLICY IF EXISTS "campaign_updates_select" ON public.campaign_updates;
DROP POLICY IF EXISTS "campaign_updates_admin_insert" ON public.campaign_updates;
DROP POLICY IF EXISTS "campaign_updates_admin_update" ON public.campaign_updates;
DROP POLICY IF EXISTS "campaign_updates_admin_delete" ON public.campaign_updates;

CREATE POLICY "campaign_updates_select"
ON public.campaign_updates
FOR SELECT
TO anon, authenticated
USING (
  (SELECT public.is_admin()) OR
  EXISTS (
    SELECT 1
    FROM public.campaigns AS c
    WHERE c.id = campaign_updates.campaign_id
      AND c.status <> 'draft'
  )
);

CREATE POLICY "campaign_updates_admin_insert"
ON public.campaign_updates
FOR INSERT
TO authenticated
WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY "campaign_updates_admin_update"
ON public.campaign_updates
FOR UPDATE
TO authenticated
USING ((SELECT public.is_admin()))
WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY "campaign_updates_admin_delete"
ON public.campaign_updates
FOR DELETE
TO authenticated
USING ((SELECT public.is_admin()));


-- 2. Tabel public.campaigns
DROP POLICY IF EXISTS "campaigns_public_select" ON public.campaigns;
DROP POLICY IF EXISTS "campaigns_admin_all" ON public.campaigns;
DROP POLICY IF EXISTS "campaigns_select" ON public.campaigns;
DROP POLICY IF EXISTS "campaigns_admin_insert" ON public.campaigns;
DROP POLICY IF EXISTS "campaigns_admin_update" ON public.campaigns;
DROP POLICY IF EXISTS "campaigns_admin_delete" ON public.campaigns;

CREATE POLICY "campaigns_select"
ON public.campaigns
FOR SELECT
TO anon, authenticated
USING (
  (SELECT public.is_admin()) OR
  (status <> 'draft')
);

CREATE POLICY "campaigns_admin_insert"
ON public.campaigns
FOR INSERT
TO authenticated
WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY "campaigns_admin_update"
ON public.campaigns
FOR UPDATE
TO authenticated
USING ((SELECT public.is_admin()))
WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY "campaigns_admin_delete"
ON public.campaigns
FOR DELETE
TO authenticated
USING ((SELECT public.is_admin()));


-- 3. Tabel public.categories
DROP POLICY IF EXISTS "categories_public_select" ON public.categories;
DROP POLICY IF EXISTS "categories_admin_all" ON public.categories;
DROP POLICY IF EXISTS "categories_select" ON public.categories;
DROP POLICY IF EXISTS "categories_admin_insert" ON public.categories;
DROP POLICY IF EXISTS "categories_admin_update" ON public.categories;
DROP POLICY IF EXISTS "categories_admin_delete" ON public.categories;

CREATE POLICY "categories_select"
ON public.categories
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "categories_admin_insert"
ON public.categories
FOR INSERT
TO authenticated
WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY "categories_admin_update"
ON public.categories
FOR UPDATE
TO authenticated
USING ((SELECT public.is_admin()))
WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY "categories_admin_delete"
ON public.categories
FOR DELETE
TO authenticated
USING ((SELECT public.is_admin()));


-- 4. Tabel public.programs
DROP POLICY IF EXISTS "programs_public_select" ON public.programs;
DROP POLICY IF EXISTS "programs_admin_all" ON public.programs;
DROP POLICY IF EXISTS "programs_select" ON public.programs;
DROP POLICY IF EXISTS "programs_admin_insert" ON public.programs;
DROP POLICY IF EXISTS "programs_admin_update" ON public.programs;
DROP POLICY IF EXISTS "programs_admin_delete" ON public.programs;

CREATE POLICY "programs_select"
ON public.programs
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "programs_admin_insert"
ON public.programs
FOR INSERT
TO authenticated
WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY "programs_admin_update"
ON public.programs
FOR UPDATE
TO authenticated
USING ((SELECT public.is_admin()))
WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY "programs_admin_delete"
ON public.programs
FOR DELETE
TO authenticated
USING ((SELECT public.is_admin()));


-- 5. Tabel public.site_content
DROP POLICY IF EXISTS "site_content_public_select" ON public.site_content;
DROP POLICY IF EXISTS "site_content_admin_all" ON public.site_content;
DROP POLICY IF EXISTS "site_content_select" ON public.site_content;
DROP POLICY IF EXISTS "site_content_admin_insert" ON public.site_content;
DROP POLICY IF EXISTS "site_content_admin_update" ON public.site_content;
DROP POLICY IF EXISTS "site_content_admin_delete" ON public.site_content;

CREATE POLICY "site_content_select"
ON public.site_content
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "site_content_admin_insert"
ON public.site_content
FOR INSERT
TO authenticated
WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY "site_content_admin_update"
ON public.site_content
FOR UPDATE
TO authenticated
USING ((SELECT public.is_admin()))
WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY "site_content_admin_delete"
ON public.site_content
FOR DELETE
TO authenticated
USING ((SELECT public.is_admin()));


-- 6. Tabel public.volunteer_programs
DROP POLICY IF EXISTS "volunteer_programs_public_select" ON public.volunteer_programs;
DROP POLICY IF EXISTS "volunteer_programs_admin_all" ON public.volunteer_programs;
DROP POLICY IF EXISTS "volunteer_programs_select" ON public.volunteer_programs;
DROP POLICY IF EXISTS "volunteer_programs_admin_insert" ON public.volunteer_programs;
DROP POLICY IF EXISTS "volunteer_programs_admin_update" ON public.volunteer_programs;
DROP POLICY IF EXISTS "volunteer_programs_admin_delete" ON public.volunteer_programs;

CREATE POLICY "volunteer_programs_select"
ON public.volunteer_programs
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "volunteer_programs_admin_insert"
ON public.volunteer_programs
FOR INSERT
TO authenticated
WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY "volunteer_programs_admin_update"
ON public.volunteer_programs
FOR UPDATE
TO authenticated
USING ((SELECT public.is_admin()))
WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY "volunteer_programs_admin_delete"
ON public.volunteer_programs
FOR DELETE
TO authenticated
USING ((SELECT public.is_admin()));
