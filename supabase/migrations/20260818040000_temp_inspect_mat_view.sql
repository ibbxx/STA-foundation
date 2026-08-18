CREATE OR REPLACE FUNCTION public.temp_inspect_view_def(view_name text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  res text;
BEGIN
  SELECT pg_get_viewdef(view_name, true) INTO res;
  RETURN res;
END;
$$;
GRANT EXECUTE ON FUNCTION public.temp_inspect_view_def(text) TO anon;
