import React from 'react';
import { Navigate } from 'react-router-dom';
import { useVertical } from '../hooks/verticalUtils';

interface VerticalGuardProps {
  allowedVerticals: string[];
  children: React.ReactNode;
  fallbackRoute?: string;
}

export const VerticalGuard: React.FC<VerticalGuardProps> = ({
  allowedVerticals,
  children,
  fallbackRoute = '/dashboard'
}) => {
  const { vertical } = useVertical();

  if (!allowedVerticals.includes(vertical)) {
    return <Navigate to={fallbackRoute} replace />;
  }

  return <>{children}</>;
};