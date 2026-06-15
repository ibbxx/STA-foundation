import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

type GuestRouteProps = {
  children: ReactNode;
};

/**
 * Route guard untuk halaman yang hanya boleh diakses oleh user yang BELUM login
 * (contoh: halaman login admin).
 *
 * Jika user sudah login dan terverifikasi sebagai admin → redirect ke /admin.
 * Jika masih loading (session atau admin check belum selesai) → tampilkan spinner.
 *
 * PENTING: Loading guard harus menunggu SEMUA async operation selesai
 * (termasuk is_admin check) sebelum membuat keputusan. Kondisi lama
 * `loading && !session` menyebabkan race condition karena session bisa
 * tersedia dari cache sebelum is_admin selesai.
 */
export default function GuestRoute({ children }: GuestRouteProps) {
  const { session, isAdmin, loading } = useAuth();

  // Tunggu hingga auth state sepenuhnya resolved (session + admin check)
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f7f3]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  // Sudah login dan terverifikasi admin → redirect ke dashboard
  if (session && isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  // Belum login atau bukan admin → tampilkan children (login form)
  return <>{children}</>;
}
