-- ============================================================
-- Migration: Memasukkan donasi anonim ke dalam leaderboard
-- ============================================================
-- Sesuai permintaan, donasi yang is_anonymous = true akan tetap
-- ditampilkan di leaderboard, tetapi namanya disamarkan menjadi "Orang Baik"
-- seperti pada tab donatur campaign.

-- 1. Update Fungsi RPC `get_public_leaderboard` (Layer 1)
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
    max(
      CASE
        WHEN d.is_anonymous THEN 'Orang Baik'
        ELSE coalesce(nullif(d.donor_name, ''), 'Tanpa nama')
      END
    ) AS display_name,
    coalesce(sum(d.amount), 0) AS total_amount,
    count(*)::integer AS donation_count
  FROM public.donations AS d
  WHERE d.payment_status = 'success'
  -- HAPUS: AND NOT d.is_anonymous
  GROUP BY md5(coalesce(nullif(lower(d.donor_email), ''), nullif(lower(d.donor_name), ''), d.id::text))
  ORDER BY total_amount DESC
  LIMIT LEAST(GREATEST(p_limit, 1), 100);
$$;

GRANT EXECUTE ON FUNCTION public.get_public_leaderboard(integer) TO anon, authenticated, service_role;

-- 2. Update Materialized View `public.leaderboard` (Layer 3)
DROP MATERIALIZED VIEW IF EXISTS public.leaderboard;

CREATE MATERIALIZED VIEW public.leaderboard AS
SELECT
  md5(coalesce(nullif(lower(d.donor_email), ''), nullif(lower(d.donor_name), ''), d.id::text)) AS identifier,
  max(
    CASE
      WHEN d.is_anonymous THEN 'Orang Baik'
      ELSE coalesce(nullif(d.donor_name, ''), 'Tanpa nama')
    END
  ) AS display_name,
  sum(d.amount) AS total_amount,
  count(*)::integer AS donation_count
FROM public.donations AS d
WHERE d.payment_status = 'success'
GROUP BY md5(coalesce(nullif(lower(d.donor_email), ''), nullif(lower(d.donor_name), ''), d.id::text));

-- Buat ulang index
CREATE UNIQUE INDEX idx_leaderboard_identifier ON public.leaderboard(identifier);
CREATE INDEX idx_leaderboard_amount ON public.leaderboard(total_amount DESC);

-- Grant privileges kembali
GRANT SELECT ON public.leaderboard TO service_role;
REVOKE SELECT ON public.leaderboard FROM anon, authenticated;
