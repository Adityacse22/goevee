import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/controllers/useAuth';
import type { UserRole } from '@/models/auth.model';

interface ProtectedRouteProps {
  children: ReactNode;
  roles?: UserRole[];
}

const ProtectedRoute = ({ children, roles }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-black" />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
