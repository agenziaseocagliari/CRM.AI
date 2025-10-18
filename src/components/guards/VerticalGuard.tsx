import { useVertical } from '@/hooks/verticalUtils';
import { ReactNode, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { diagnostics } from '../../utils/diagnostics';

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

  useEffect(() => {
    diagnostics.log('auth', 'VerticalGuard', {
      evaluating: true,
      allowedVerticals,
      currentVertical: vertical,
      loading,
      location: window.location.pathname
    });
  }, [allowedVerticals, vertical, loading]);

  if (loading) {
    diagnostics.log('auth', 'VerticalGuard', {
      action: 'waiting for vertical',
      state: 'loading'
    });
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
    diagnostics.log('auth', 'VerticalGuard', {
      action: 'redirect',
      reason: 'vertical not allowed',
      currentVertical: vertical,
      allowedVerticals,
      redirectTo: fallback
    });
    console.warn(`Access denied: vertical "${vertical}" not in allowed list [${allowedVerticals.join(', ')}]`);
    return <Navigate to={fallback} replace />;
  }

  diagnostics.log('auth', 'VerticalGuard', {
    action: 'allow',
    vertical,
    allowedVerticals
  });

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