-- Expand audit logging coverage for admin-facing mutable tables.
-- Scope: INSERT, UPDATE, DELETE only. Reads and auth events are intentionally excluded.

DROP TRIGGER IF EXISTS audit_categories_trigger ON public.categories;
CREATE TRIGGER audit_categories_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.categories
FOR EACH ROW
EXECUTE FUNCTION public.record_audit_log();

DROP TRIGGER IF EXISTS audit_donations_trigger ON public.donations;
CREATE TRIGGER audit_donations_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.donations
FOR EACH ROW
EXECUTE FUNCTION public.record_audit_log();

DROP TRIGGER IF EXISTS audit_campaign_updates_trigger ON public.campaign_updates;
CREATE TRIGGER audit_campaign_updates_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.campaign_updates
FOR EACH ROW
EXECUTE FUNCTION public.record_audit_log();

DROP TRIGGER IF EXISTS audit_school_reports_trigger ON public.school_reports;
CREATE TRIGGER audit_school_reports_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.school_reports
FOR EACH ROW
EXECUTE FUNCTION public.record_audit_log();

DROP TRIGGER IF EXISTS audit_spammer_blacklist_trigger ON public.spammer_blacklist;
CREATE TRIGGER audit_spammer_blacklist_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.spammer_blacklist
FOR EACH ROW
EXECUTE FUNCTION public.record_audit_log();

DROP TRIGGER IF EXISTS audit_volunteer_programs_trigger ON public.volunteer_programs;
CREATE TRIGGER audit_volunteer_programs_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.volunteer_programs
FOR EACH ROW
EXECUTE FUNCTION public.record_audit_log();

DROP TRIGGER IF EXISTS audit_volunteer_registrations_trigger ON public.volunteer_registrations;
CREATE TRIGGER audit_volunteer_registrations_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.volunteer_registrations
FOR EACH ROW
EXECUTE FUNCTION public.record_audit_log();
