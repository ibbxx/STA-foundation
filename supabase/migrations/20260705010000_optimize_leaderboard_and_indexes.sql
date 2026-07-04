-- ============================================================
-- Performance Optimization: Leaderboard Materialized View
-- + Missing Indexes
-- ============================================================
-- Tujuan:
-- 1. Mengganti view `leaderboard` (yang melakukan full-table scan + md5 GROUP BY)
--    dengan materialized view yang di-cache di disk
-- 2. Menambah index pada campaign_updates.campaign_id untuk optimasi RLS policy
-- ============================================================

-- 1. Index untuk campaign_updates (optimasi RLS correlated subquery)
CREATE INDEX IF NOT EXISTS idx_campaign_updates_campaign_id
  ON public.campaign_updates(campaign_id);

-- 2. Konversi leaderboard dari VIEW ke MATERIALIZED VIEW
--    Menggunakan PL/pgSQL block agar aman dijalankan berulang kali (idempotent)
--    baik saat leaderboard masih berupa VIEW biasa maupun sudah menjadi MATERIALIZED VIEW.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'leaderboard' AND relkind = 'v') THEN
    DROP VIEW public.leaderboard;
  ELSIF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'leaderboard' AND relkind = 'm') THEN
    DROP MATERIALIZED VIEW public.leaderboard;
  END IF;
END
$$;

CREATE MATERIALIZED VIEW IF NOT EXISTS public.leaderboard AS
SELECT
  md5(coalesce(nullif(lower(d.donor_email), ''), nullif(lower(d.donor_name), ''), d.id::text)) AS identifier,
  max(coalesce(nullif(d.donor_name, ''), 'Tanpa nama')) AS display_name,
  sum(d.amount) AS total_amount,
  count(*)::integer AS donation_count
FROM public.donations AS d
WHERE d.payment_status = 'success'
  AND NOT d.is_anonymous
GROUP BY md5(coalesce(nullif(lower(d.donor_email), ''), nullif(lower(d.donor_name), ''), d.id::text));

-- Index pada materialized view untuk sorting leaderboard
CREATE INDEX IF NOT EXISTS idx_leaderboard_total_amount_desc
  ON public.leaderboard(total_amount DESC);

-- Fungsi untuk refresh materialized view (bisa dipanggil via cron/Edge Function)
CREATE OR REPLACE FUNCTION public.refresh_leaderboard()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  REFRESH MATERIALIZED VIEW public.leaderboard;
$$;

-- Grant akses ke service_role agar Edge Functions bisa memanggil refresh
GRANT EXECUTE ON FUNCTION public.refresh_leaderboard() TO service_role;
