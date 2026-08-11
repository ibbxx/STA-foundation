-- Migration: Auto Remove Admin Access When Banned
-- Author: Antigravity Assistant
-- Description: Automatically deletes banned users from public.admin_users table when banned_until is set in auth.users.

CREATE OR REPLACE FUNCTION public.handle_banned_admin()
RETURNS TRIGGER AS $$
BEGIN
  -- Jika kolom banned_until terisi (user di-ban oleh admin di Supabase Auth)
  IF NEW.banned_until IS NOT NULL THEN
    DELETE FROM public.admin_users WHERE user_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Pasang Trigger pada tabel auth.users
DROP TRIGGER IF EXISTS trigger_on_admin_banned ON auth.users;
CREATE TRIGGER trigger_on_admin_banned
AFTER UPDATE OF banned_until ON auth.users
FOR EACH ROW
WHEN (NEW.banned_until IS NOT NULL)
EXECUTE FUNCTION public.handle_banned_admin();
