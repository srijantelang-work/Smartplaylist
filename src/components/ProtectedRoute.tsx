import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
}

export function ProtectedRoute({ children, requireAuth = true }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (requireAuth && !user) {
    // Redirect to login but save the attempted url
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  if (!requireAuth && user) {
    // If user is logged in and tries to access auth pages, redirect to home
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
} 