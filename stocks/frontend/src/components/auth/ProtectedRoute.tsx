import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Skeleton } from '../ui/Skeleton';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isGuest, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isGuest || !user) {
    // Redirect to login preserving the attempted destination
    const returnUrl = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${returnUrl}`} replace />;
  }

  return <>{children}</>;
};
