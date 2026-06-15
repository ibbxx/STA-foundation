import { Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { logError } from '../lib/error-logger';
import { supabase } from '../lib/supabase';

interface AuthContextValue {
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
}

/**
 * Context global untuk state autentikasi.
 * Menghindari duplikasi network request ketika banyak komponen (GuestRoute,
 * ProtectedRoute, dll.) memerlukan informasi session/admin secara bersamaan.
 */
export const AuthContext = createContext<AuthContextValue>({
  session: null,
  isAdmin: false,
  loading: true,
});

/**
 * Hook untuk mengonsumsi AuthContext.
 * Harus dipanggil di dalam tree <AuthProvider>.
 */
export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}

/**
 * Hook internal yang menjalankan logik autentikasi sesungguhnya.
 * Hanya boleh dipakai SATU KALI oleh <AuthProvider>.
 *
 * Perubahan dari versi sebelumnya:
 * 1. `onAuthStateChange` menjadi satu-satunya sumber kebenaran untuk session
 *    (menghilangkan race condition antara `getSession` dan listener).
 * 2. `is_admin` RPC memiliki retry logic sederhana.
 * 3. State diekspos melalui Context, bukan hook langsung.
 */
export function useAuthProvider(): AuthContextValue {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [adminLoading, setAdminLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [verifiedUserId, setVerifiedUserId] = useState<string | null>(null);

  // ── Session management ──────────────────────────────────────────
  useEffect(() => {
    let ignore = false;

    // Gunakan getSession() untuk initial load, lalu onAuthStateChange sebagai listener.
    // Penting: getSession() dibaca dari local storage (sinkron secara efektif di Supabase SDK),
    // sementara onAuthStateChange emit INITIAL_SESSION segera setelah subscription.
    // Kita handle keduanya secara idempoten.

    let initialResolved = false;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (ignore) return;
      setSession(nextSession);
      // Untuk INITIAL_SESSION maupun event lainnya, kita selalu set loading false
      // karena setelah event pertama, session state sudah definitif.
      if (!initialResolved) {
        initialResolved = true;
        setAuthLoading(false);
      }
    });

    // Fallback: jika onAuthStateChange tidak fire dalam 3 detik
    // (edge case pada koneksi lambat atau SDK issue), resolve secara manual.
    const fallbackTimer = setTimeout(async () => {
      if (ignore || initialResolved) return;

      try {
        const { data, error } = await supabase.auth.getSession();
        if (ignore || initialResolved) return;

        if (error) {
          logError('useAuth.fallbackGetSession', error);
          await supabase.auth.signOut().catch((e) =>
            logError('useAuth.signOutAfterFallbackError', e),
          );
          setSession(null);
        } else {
          setSession(data.session);
        }
      } catch (e) {
        logError('useAuth.fallbackGetSessionCatch', e);
        setSession(null);
      } finally {
        if (!ignore) {
          initialResolved = true;
          setAuthLoading(false);
        }
      }
    }, 3000);

    return () => {
      ignore = true;
      clearTimeout(fallbackTimer);
      subscription.unsubscribe();
    };
  }, []);

  // ── Admin verification ──────────────────────────────────────────
  const checkAdmin = useCallback(async (userId: string, signal: { ignore: boolean }) => {
    setAdminLoading(true);

    // Retry sederhana: coba 2x jika gagal
    for (let attempt = 0; attempt < 2; attempt++) {
      if (signal.ignore) return;

      const { data, error } = await supabase.rpc('is_admin');

      if (signal.ignore) return;

      if (!error) {
        setIsAdmin(data === true);
        setVerifiedUserId(userId);
        setAdminLoading(false);
        return;
      }

      logError('useAuth.isAdmin', error, { attempt, userId });

      // Tunggu sebentar sebelum retry (hanya jika bukan attempt terakhir)
      if (attempt < 1) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }

    // Semua attempt gagal
    if (!signal.ignore) {
      setIsAdmin(false);
      setVerifiedUserId(userId);
      setAdminLoading(false);
    }
  }, []);

  useEffect(() => {
    const signal = { ignore: false };

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

    checkAdmin(currentUserId, signal);

    return () => {
      signal.ignore = true;
    };
  }, [session, verifiedUserId, checkAdmin]);

  // ── Return memoized value ───────────────────────────────────────
  return useMemo(() => ({
    session,
    isAdmin,
    loading: authLoading || Boolean(session && adminLoading),
  }), [session, isAdmin, authLoading, adminLoading]);
}
