-- ============================================================
-- Migration: Auto-Refresh Leaderboard Materialized View
-- ============================================================
-- Masalah: Materialized View `leaderboard` tidak diperbarui secara otomatis
-- saat admin mengubah payment_status donasi menjadi 'success'.
-- Solusi: Menambahkan trigger pada tabel `donations` yang secara otomatis
-- memanggil REFRESH MATERIALIZED VIEW saat data yang relevan berubah.
-- ============================================================

-- Trigger function: auto-refresh materialized view leaderboard
-- Hanya refresh saat perubahan relevan terjadi (status berubah ke/dari success,
-- atau data donatur berubah pada donasi yang sudah success)
CREATE OR REPLACE FUNCTION public.auto_refresh_leaderboard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  -- DELETE: refresh hanya jika donasi yang dihapus berstatus success
  IF TG_OP = 'DELETE' THEN
    IF OLD.payment_status = 'success' AND NOT OLD.is_anonymous THEN
      REFRESH MATERIALIZED VIEW public.leaderboard;
    END IF;
    RETURN OLD;
  END IF;

  -- INSERT: refresh hanya jika donasi baru langsung berstatus success (jarang terjadi)
  IF TG_OP = 'INSERT' THEN
    IF NEW.payment_status = 'success' AND NOT NEW.is_anonymous THEN
      REFRESH MATERIALIZED VIEW public.leaderboard;
    END IF;
    RETURN NEW;
  END IF;

  -- UPDATE: refresh jika status berubah ke/dari success,
  -- atau jika data yang mempengaruhi leaderboard berubah pada donasi success
  IF (OLD.payment_status IS DISTINCT FROM NEW.payment_status
      AND ('success' IN (OLD.payment_status, NEW.payment_status)))
     OR (NEW.payment_status = 'success' AND (
           OLD.is_anonymous IS DISTINCT FROM NEW.is_anonymous
           OR OLD.donor_name IS DISTINCT FROM NEW.donor_name
           OR OLD.donor_email IS DISTINCT FROM NEW.donor_email
           OR OLD.amount IS DISTINCT FROM NEW.amount
         ))
  THEN
    REFRESH MATERIALIZED VIEW public.leaderboard;
  END IF;

  RETURN NEW;
END;
$$;

-- Grant hanya ke service_role (trigger berjalan sebagai SECURITY DEFINER / owner)
REVOKE EXECUTE ON FUNCTION public.auto_refresh_leaderboard() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.auto_refresh_leaderboard() TO service_role;

-- Pasang trigger pada tabel donations
DROP TRIGGER IF EXISTS trg_auto_refresh_leaderboard ON public.donations;
CREATE TRIGGER trg_auto_refresh_leaderboard
AFTER INSERT OR UPDATE OR DELETE ON public.donations
FOR EACH ROW
EXECUTE FUNCTION public.auto_refresh_leaderboard();
