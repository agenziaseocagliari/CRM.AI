import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

import { supabase } from '../../lib/supabaseClient';

import { diagnosticLogger } from '../../lib/mockDiagnosticLogger';
interface HealthMetrics {
  totalRequests24h: number;
  requests1h: number;
  errorRate: number;
  avgResponseTime: number;
  rateLimitedRequests24h: number;
  slowQueries: number;
}

interface EndpointHealth {
  endpoint: string;
  total: number;
  errors: number;
  errorRate: string;
  status: 'healthy' | 'warning' | 'critical';
}

interface SlowQuery {
  query: string;
  duration: number;
  timestamp: string;
  table?: string;
}

interface SystemError {
  endpoint: string;
  error_message?: string;
  status_code: number;
  created_at: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

interface SystemAlert {
  id: string;
  message: string;
  alert_type: 'exceeded' | 'critical' | 'warning' | 'info';
  created_at: string;
  resolved?: boolean;
}

interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  uptime: number;
  metrics: HealthMetrics;
  endpoints: EndpointHealth[];
  slowQueries: SlowQuery[];
  recentErrors: SystemError[];
  activeAlerts: SystemAlert[];
  timestamp: string;
}

export const SystemHealthDashboard: React.FC = () => {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchSystemHealth();
    
    if (autoRefresh) {
      const interval = setInterval(fetchSystemHealth, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const fetchSystemHealth = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('No session found');
      }

      const supabaseUrl = process.env.VITE_SUPABASE_URL;
      
      const response = await fetch(
        `${supabaseUrl}/functions/v1/superadmin-system-health`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch system health');
      }

      const data = await response.json();
      setHealth(data.health);
    } catch (error: unknown) {
      const err = error as Error;
      diagnosticLogger.error('api', 'Error fetching system health:', err);
      toast.error('Failed to load system health data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return '✓';
      case 'warning':
        return 'âš ï¸';
      case 'critical':
        return '✗';
      default:
        return 'â“';
    }
  };

  if (loading && !health) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-text-secondary">Loading system health...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-text-primary dark:text-dark-text-primary">
            System Health Dashboard
          </h1>
          <p className="text-text-secondary dark:text-dark-text-secondary mt-1">
            Real-time monitoring and performance metrics
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span className="text-sm text-text-secondary">Auto-refresh (30s)</span>
          </label>
          <button
            onClick={fetchSystemHealth}
            disabled={loading}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Overall System Status */}
      <div className="bg-white dark:bg-dark-card p-6 rounded-lg shadow">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-text-primary dark:text-dark-text-primary mb-2">
              Overall System Status
            </h2>
            <div className="flex items-center space-x-4">
              <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(health?.status || 'healthy')}`}>
                {getStatusIcon(health?.status || 'healthy')} {health?.status?.toUpperCase() || 'UNKNOWN'}
              </span>
              <div className="text-sm text-text-secondary">
                Uptime: <span className="font-bold text-text-primary">{health?.uptime?.toFixed(2)}%</span>
              </div>
              <div className="text-sm text-text-secondary">
                Last updated: {health?.timestamp ? new Date(health.timestamp).toLocaleTimeString() : 'N/A'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard
          title="Total Requests (24h)"
          value={health?.metrics?.totalRequests24h?.toLocaleString() || '0'}
          icon="ðŸ“Š"
          color="blue"
        />
        <MetricCard
          title="Requests (1h)"
          value={health?.metrics?.requests1h?.toLocaleString() || '0'}
          icon="ðŸ“ˆ"
          color="indigo"
        />
        <MetricCard
          title="Error Rate (1h)"
          value={`${health?.metrics?.errorRate?.toFixed(2) || '0.00'}%`}
          icon={health?.metrics?.errorRate && health.metrics.errorRate > 5 ? '✗' : '✓'}
          color={health?.metrics?.errorRate && health.metrics.errorRate > 5 ? 'red' : 'green'}
        />
        <MetricCard
          title="Avg Response Time"
          value={`${health?.metrics?.avgResponseTime || '0'}ms`}
          icon="SPEED"
          color="yellow"
        />
        <MetricCard
          title="Rate Limited (24h)"
          value={health?.metrics?.rateLimitedRequests24h?.toLocaleString() || '0'}
          icon="ðŸ›‘"
          color="orange"
        />
        <MetricCard
          title="Slow Queries (24h)"
          value={health?.metrics?.slowQueries?.toLocaleString() || '0'}
          icon="ðŸŒ"
          color="purple"
        />
      </div>

      {/* Active Alerts */}
      {health?.activeAlerts && health.activeAlerts.length > 0 && (
        <div className="bg-white dark:bg-dark-card p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold text-text-primary dark:text-dark-text-primary mb-4">
            ✗ Active Alerts
          </h2>
          <div className="space-y-3">
            {health.activeAlerts.slice(0, 5).map((alert: SystemAlert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border-l-4 ${
                  alert.alert_type === 'exceeded'
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-500'
                    : alert.alert_type === 'critical'
                    ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-500'
                    : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-text-primary dark:text-dark-text-primary">
                      {alert.message}
                    </p>
                    <p className="text-sm text-text-secondary dark:text-dark-text-secondary mt-1">
                      {new Date(alert.created_at).toLocaleString()}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    alert.alert_type === 'exceeded'
                      ? 'bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200'
                      : alert.alert_type === 'critical'
                      ? 'bg-orange-200 text-orange-800 dark:bg-orange-800 dark:text-orange-200'
                      : 'bg-yellow-200 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200'
                  }`}>
                    {alert.alert_type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Endpoint Health */}
      <div className="bg-white dark:bg-dark-card p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold text-text-primary dark:text-dark-text-primary mb-4">
          Endpoint Health (Last Hour)
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Endpoint
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Requests
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Errors
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Error Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-dark-card divide-y divide-gray-200 dark:divide-gray-700">
              {health?.endpoints?.slice(0, 10).map((endpoint, idx) => (
                <tr key={idx}>
                  <td className="px-6 py-4 text-sm font-mono text-text-primary dark:text-dark-text-primary">
                    {endpoint.endpoint}
                  </td>
                  <td className="px-6 py-4 text-sm text-text-secondary dark:text-dark-text-secondary">
                    {endpoint.total}
                  </td>
                  <td className="px-6 py-4 text-sm text-text-secondary dark:text-dark-text-secondary">
                    {endpoint.errors}
                  </td>
                  <td className="px-6 py-4 text-sm text-text-secondary dark:text-dark-text-secondary">
                    {endpoint.errorRate}%
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(endpoint.status)}`}>
                      {getStatusIcon(endpoint.status)} {endpoint.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Errors */}
      {health?.recentErrors && health.recentErrors.length > 0 && (
        <div className="bg-white dark:bg-dark-card p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold text-text-primary dark:text-dark-text-primary mb-4">
            Recent Errors (Last 5 minutes)
          </h2>
          <div className="space-y-2">
            {health.recentErrors.slice(0, 10).map((error: SystemError, idx: number) => (
              <div key={idx} className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-sm font-mono text-text-primary dark:text-dark-text-primary">
                      {error.endpoint}
                    </p>
                    {error.error_message && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                        {error.error_message}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-3 ml-4">
                    <span className="px-2 py-1 bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200 rounded text-xs font-semibold">
                      {error.status_code}
                    </span>
                    <span className="text-xs text-text-secondary dark:text-dark-text-secondary whitespace-nowrap">
                      {new Date(error.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface MetricCardProps {
  title: string;
  value: string;
  icon: string;
  color: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon, color }) => {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-100 dark:bg-blue-900',
    indigo: 'bg-indigo-100 dark:bg-indigo-900',
    green: 'bg-green-100 dark:bg-green-900',
    yellow: 'bg-yellow-100 dark:bg-yellow-900',
    orange: 'bg-orange-100 dark:bg-orange-900',
    red: 'bg-red-100 dark:bg-red-900',
    purple: 'bg-purple-100 dark:bg-purple-900',
  };

  return (
    <div className="bg-white dark:bg-dark-card p-6 rounded-lg shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-text-secondary dark:text-dark-text-secondary">
            {title}
          </p>
          <p className="text-2xl font-bold text-text-primary dark:text-dark-text-primary mt-1">
            {value}
          </p>
        </div>
        <div className={`p-3 rounded-full ${colorClasses[color] || colorClasses.blue}`}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
    </div>
  );
};


