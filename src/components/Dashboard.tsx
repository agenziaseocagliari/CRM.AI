import React, { Suspense, lazy } from 'react';
import { useVertical } from '@/hooks/useVertical';

// Lazy load vertical-specific dashboards
const StandardDashboard = lazy(() => import('./dashboards/StandardDashboard'));
const InsuranceDashboard = lazy(() => import('../features/insurance/components/Dashboard'));

export const Dashboard: React.FC = () => {
  const { vertical, loading } = useVertical();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      {vertical === 'insurance' && <InsuranceDashboard />}
      {vertical === 'standard' && <StandardDashboard />}
      {vertical !== 'insurance' && vertical !== 'standard' && (
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-900">
              Dashboard for vertical "{vertical}" not yet implemented.
            </p>
          </div>
        </div>
      )}
    </Suspense>
  );
};


