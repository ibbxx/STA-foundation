-- ============================================================
-- Security Fix: Revoke Public Access to SECURITY DEFINER Functions
-- ============================================================
-- Menghapus default EXECUTE privilege dari role PUBLIC (semua user)
-- pada fungsi-fungsi SECURITY DEFINER agar tidak bisa dieksekusi langsung
-- oleh anon / authenticated via REST API RPC.
-- Fungsi-fungsi ini hanya boleh dipanggil oleh service_role (Edge Functions).
-- ============================================================

-- 1. Fungsi refresh_leaderboard
REVOKE EXECUTE ON FUNCTION public.refresh_leaderboard() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.refresh_leaderboard() FROM anon;
REVOKE EXECUTE ON FUNCTION public.refresh_leaderboard() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_leaderboard() TO service_role;

-- 2. Fungsi create_pending_donation
REVOKE EXECUTE ON FUNCTION public.create_pending_donation(uuid, text, text, text, numeric, text, text, boolean) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_pending_donation(uuid, text, text, text, numeric, text, text, boolean) FROM anon;
REVOKE EXECUTE ON FUNCTION public.create_pending_donation(uuid, text, text, text, numeric, text, text, boolean) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.create_pending_donation(uuid, text, text, text, numeric, text, text, boolean) TO service_role;

-- 3. Fungsi submit_school_report
REVOKE EXECUTE ON FUNCTION public.submit_school_report(text, text, text, text, text, text, jsonb) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.submit_school_report(text, text, text, text, text, text, jsonb) FROM anon;
REVOKE EXECUTE ON FUNCTION public.submit_school_report(text, text, text, text, text, text, jsonb) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.submit_school_report(text, text, text, text, text, text, jsonb) TO service_role;

-- 4. Fungsi submit_volunteer_registration
REVOKE EXECUTE ON FUNCTION public.submit_volunteer_registration(uuid, text, text, text, text, text, date, text, text, text, text, text, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.submit_volunteer_registration(uuid, text, text, text, text, text, date, text, text, text, text, text, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.submit_volunteer_registration(uuid, text, text, text, text, text, date, text, text, text, text, text, text, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.submit_volunteer_registration(uuid, text, text, text, text, text, date, text, text, text, text, text, text, text) TO service_role;
