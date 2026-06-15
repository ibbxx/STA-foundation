import { Session } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { logError } from '../lib/error-logger';
import { supabase } from '../lib/supabase';

interface UseAuthReturn {
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
}

/**
 * Hook terpusat untuk manajemen session autentikasi Supabase.
 * Menggantikan logik session yang duplikat di ProtectedRoute dan GuestRoute.
 */
export function useAuth(): UseAuthReturn {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [adminLoading, setAdminLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function loadSession() {
      const { data, error } = await supabase.auth.getSession();

      if (ignore) return;

      if (error) {
        logError('useAuth.loadSession', error);
        const { error: signOutError } = await supabase.auth.signOut();
        if (signOutError) {
          logError('useAuth.signOutAfterSessionError', signOutError);
        }
        setSession(null);
        setAuthLoading(false);
        return;
      }

      setSession(data.session);
      setAuthLoading(false);
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (ignore) return;
      setSession(nextSession);
      if (event !== 'INITIAL_SESSION') {
        setAuthLoading(false);
      }
    });

    return () => {
      ignore = true;
      subscription.unsubscribe();
    };
  }, []);

  const [verifiedUserId, setVerifiedUserId] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    if (!session) {
      setIsAdmin(false);
      setAdminLoading(false);
      setVerifiedUserId(null);
      return;
    }

    const currentUserId = session.user.id;
    if (verifiedUserId === currentUserId) {
      return;
    }

    setAdminLoading(true);
    supabase
      .rpc('is_admin')
      .then(({ data, error }) => {
        if (ignore) return;
        if (error) {
          logError('useAuth.isAdmin', error);
          setIsAdmin(false);
        } else {
          setIsAdmin(data === true);
          setVerifiedUserId(currentUserId);
        }
        setAdminLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [session, verifiedUserId]);

  return {
    session,
    isAdmin,
    loading: authLoading || Boolean(session && adminLoading),
  };
}
