import { Session } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { logError } from '../lib/error-logger';
import { supabase } from '../lib/supabase';

interface UseAuthReturn {
  session: Session | null;
  loading: boolean;
}

/**
 * Hook terpusat untuk manajemen session autentikasi Supabase.
 * Menggantikan logik session yang duplikat di ProtectedRoute dan GuestRoute.
 */
export function useAuth(): UseAuthReturn {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

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
        setLoading(false);
        return;
      }

      setSession(data.session);
      setLoading(false);
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (ignore) return;
      setSession(nextSession);
      setLoading(false);
    });

    return () => {
      ignore = true;
      subscription.unsubscribe();
    };
  }, []);

  return { session, loading };
}
