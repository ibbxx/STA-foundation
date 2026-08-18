CREATE OR REPLACE FUNCTION public.temp_inspect_donations()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  res json;
BEGIN
  SELECT json_agg(row_to_json(d)) INTO res
  FROM (
    SELECT id, donor_name, is_anonymous, payment_status, amount
    FROM public.donations
    WHERE payment_status = 'success'
  ) d;
  RETURN res;
END;
$$;
GRANT EXECUTE ON FUNCTION public.temp_inspect_donations() TO anon;
