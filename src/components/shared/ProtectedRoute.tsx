import { Session } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { logError } from '../../lib/error-logger';
import { supabase } from '../../lib/supabase';

type ProtectedRouteProps = {
  children: ReactNode;
};

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    let ignore = false;

    async function loadSession() {
      const { data, error } = await supabase.auth.getSession();

      if (ignore) return;

      if (error) {
        logError('ProtectedRoute.loadSession', error);
        const { error: signOutError } = await supabase.auth.signOut();
        if (signOutError) {
          logError('ProtectedRoute.signOutAfterSessionError', signOutError);
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f7f3]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
