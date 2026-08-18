CREATE OR REPLACE FUNCTION public.temp_inspect_view()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  res text;
BEGIN
  SELECT pg_get_viewdef('public.public_campaign_donations', true) INTO res;
  RETURN res;
END;
$$;
GRANT EXECUTE ON FUNCTION public.temp_inspect_view() TO anon;
