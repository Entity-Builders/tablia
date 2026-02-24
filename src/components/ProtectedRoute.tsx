import { useAuth } from '../contexts/AuthProvider';
import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { FullDashboardSkeleton } from './DashboardSkeleton';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <FullDashboardSkeleton />;
  }

  if (!user) {
    return <Navigate to='/login' replace />;
  }

  return <>{children}</>;
}
