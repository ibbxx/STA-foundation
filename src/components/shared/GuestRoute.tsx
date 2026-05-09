import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

type GuestRouteProps = {
  children: ReactNode;
};

export default function GuestRoute({ children }: GuestRouteProps) {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f7f3]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  if (session) {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
}
