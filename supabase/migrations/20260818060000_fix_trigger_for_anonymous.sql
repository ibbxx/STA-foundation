CREATE OR REPLACE FUNCTION public.auto_refresh_leaderboard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.payment_status = 'success' THEN
      REFRESH MATERIALIZED VIEW public.leaderboard;
    END IF;
    RETURN OLD;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.payment_status = 'success' THEN
      REFRESH MATERIALIZED VIEW public.leaderboard;
    END IF;
    RETURN NEW;
  END IF;

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
