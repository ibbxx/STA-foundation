CREATE TABLE public.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  user_email text,
  action_type text NOT NULL CHECK (action_type IN ('INSERT', 'UPDATE', 'DELETE')),
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  old_values jsonb,
  new_values jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT audit_logs_pkey PRIMARY KEY (id)
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs" 
ON public.audit_logs FOR SELECT 
USING (true); -- Asumsi semua admin bisa melihat (policy dapat disesuaikan)

CREATE OR REPLACE FUNCTION public.record_audit_log()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id uuid;
  v_user_email text;
BEGIN
  -- Ambil ID user dari auth context Supabase
  v_user_id := auth.uid();
  
  -- Jika null (contohnya insert data via service role di backend anonim), biarkan null
  IF v_user_id IS NOT NULL THEN
    SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;
  END IF;

  IF (TG_OP = 'INSERT') THEN
    INSERT INTO public.audit_logs (user_id, user_email, action_type, entity_type, entity_id, new_values)
    VALUES (v_user_id, v_user_email, 'INSERT', TG_TABLE_NAME, NEW.id::text, row_to_json(NEW)::jsonb);
    RETURN NEW;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO public.audit_logs (user_id, user_email, action_type, entity_type, entity_id, old_values, new_values)
    VALUES (v_user_id, v_user_email, 'UPDATE', TG_TABLE_NAME, NEW.id::text, row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    INSERT INTO public.audit_logs (user_id, user_email, action_type, entity_type, entity_id, old_values)
    VALUES (v_user_id, v_user_email, 'DELETE', TG_TABLE_NAME, OLD.id::text, row_to_json(OLD)::jsonb);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger untuk campaigns
CREATE TRIGGER audit_campaigns_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.campaigns
FOR EACH ROW EXECUTE FUNCTION public.record_audit_log();

-- Trigger untuk site_content
CREATE TRIGGER audit_site_content_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.site_content
FOR EACH ROW EXECUTE FUNCTION public.record_audit_log();

-- Trigger untuk programs
CREATE TRIGGER audit_programs_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.programs
FOR EACH ROW EXECUTE FUNCTION public.record_audit_log();
