import React from 'react';
import { useAuthStore } from '../../stores/auth';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback: React.ReactNode;
}

export default function AuthGuard({ children, fallback }: AuthGuardProps): React.JSX.Element {
  const { isAuthenticated, hasCompletedOnboarding } = useAuthStore();

  if (!isAuthenticated || !hasCompletedOnboarding) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}