-- Migration: Remove Custom Banned Admin Trigger
-- Description: Drops custom trigger and function to use native Supabase Auth Ban/Unban feature cleanly without deleting admin data.

DROP TRIGGER IF EXISTS trigger_on_admin_banned ON auth.users;
DROP FUNCTION IF EXISTS public.handle_banned_admin();
