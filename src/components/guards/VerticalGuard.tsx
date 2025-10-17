import { useVertical } from '@/hooks/useVertical';
import { Navigate } from 'react-router-dom';
import { ReactNode } from 'react';

interface VerticalGuardProps {
  allowedVerticals: string[];
  children: ReactNode;
  fallback?: string;
}

export default function VerticalGuard({
  allowedVerticals,
  children,
  fallback = '/dashboard'
}: VerticalGuardProps) {
  const { vertical, loading } = useVertical();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!allowedVerticals.includes(vertical)) {
    console.warn(`Access denied: vertical "${vertical}" not in allowed list [${allowedVerticals.join(', ')}]`);
    return <Navigate to={fallback} replace />;
  }

  return <>{children}</>;
}

// Convenience guards
export function InsuranceOnlyGuard({ children }: { children: ReactNode }) {
  return (
    <VerticalGuard allowedVerticals={['insurance']}>
      {children}
    </VerticalGuard>
  );
}

export function StandardOnlyGuard({ children }: { children: ReactNode }) {
  return (
    <VerticalGuard allowedVerticals={['standard']}>
      {children}
    </VerticalGuard>
  );
}