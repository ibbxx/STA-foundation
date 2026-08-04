-- ============================================================
-- Fix Linter Warnings: Secure Materialized View API Access
-- ============================================================

-- 1. Revoke direct SELECT on Materialized View from anon & authenticated
--    (Access is securely routed through RPC function get_public_leaderboard)
REVOKE SELECT ON public.leaderboard FROM anon, authenticated;
GRANT SELECT ON public.leaderboard TO service_role;

-- 2. Ensure get_public_leaderboard RPC function is locked down with explicit search_path
CREATE OR REPLACE FUNCTION public.get_public_leaderboard(p_limit integer DEFAULT 100)
RETURNS TABLE (
  identifier text,
  display_name text,
  total_amount numeric,
  donation_count integer
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT
    md5(coalesce(nullif(lower(d.donor_email), ''), nullif(lower(d.donor_name), ''), d.id::text)) AS identifier,
    max(coalesce(nullif(d.donor_name, ''), 'Tanpa nama')) AS display_name,
    coalesce(sum(d.amount), 0) AS total_amount,
    count(*)::integer AS donation_count
  FROM public.donations AS d
  WHERE d.payment_status = 'success'
    AND NOT d.is_anonymous
  GROUP BY md5(coalesce(nullif(lower(d.donor_email), ''), nullif(lower(d.donor_name), ''), d.id::text))
  ORDER BY total_amount DESC
  LIMIT LEAST(GREATEST(p_limit, 1), 100);
$$;

GRANT EXECUTE ON FUNCTION public.get_public_leaderboard(integer) TO anon, authenticated, service_role;
