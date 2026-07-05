-- ============================================================
-- Migration: Fix is_admin Permissions for Anon Users
-- ============================================================
-- is_admin() dipanggil dalam RLS policies (seperti campaigns_select) yang dievaluasi untuk anon users.
-- Karena is_admin() sebelumnya didefinisikan sebagai SECURITY INVOKER, anon user tidak memiliki:
-- 1. Izin EXECUTE pada fungsi is_admin().
-- 2. Izin SELECT pada tabel public.admin_users.
--
-- Untuk memperbaikinya:
-- 1. Mengubah fungsi menjadi SECURITY DEFINER agar berjalan dengan hak akses owner (postgres).
-- 2. Memberikan izin EXECUTE kepada anon, authenticated, dan service_role.
-- ============================================================

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

-- Berikan izin EXECUTE kepada anon, authenticated, dan service_role
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;
