-- Migration: Fix permission denied for function apply_campaign_donation_delta
-- Masalah: Trigger sync_campaign_amount_after_donation dijalankan dengan hak akses pengguna yang memicu trigger (misalnya `authenticated`),
-- namun pengguna `authenticated` tidak memiliki izin `EXECUTE` pada fungsi `apply_campaign_donation_delta`.
-- Solusi: Jadikan trigger function ini sebagai SECURITY DEFINER agar berjalan dengan hak akses owner (postgres) yang bisa mengeksekusi apply_campaign_donation_delta.

CREATE OR REPLACE FUNCTION public.sync_campaign_amount_after_donation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  old_amount numeric := 0;
  new_amount numeric := 0;
  old_count integer := 0;
  new_count integer := 0;
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.payment_status = 'success' THEN
      PERFORM public.apply_campaign_donation_delta(OLD.campaign_id, -OLD.amount, -1);
    END IF;
    RETURN OLD;
  END IF;

  IF NEW.payment_status = 'success' THEN
    new_amount := NEW.amount;
    new_count := 1;
  END IF;

  IF TG_OP = 'INSERT' THEN
    PERFORM public.apply_campaign_donation_delta(NEW.campaign_id, new_amount, new_count);
    RETURN NEW;
  END IF;

  IF OLD.payment_status = 'success' THEN
    old_amount := OLD.amount;
    old_count := 1;
  END IF;

  IF OLD.campaign_id IS DISTINCT FROM NEW.campaign_id THEN
    PERFORM public.apply_campaign_donation_delta(OLD.campaign_id, -old_amount, -old_count);
    PERFORM public.apply_campaign_donation_delta(NEW.campaign_id, new_amount, new_count);
  ELSE
    PERFORM public.apply_campaign_donation_delta(
      NEW.campaign_id,
      new_amount - old_amount,
      new_count - old_count
    );
  END IF;

  RETURN NEW;
END;
$$;
