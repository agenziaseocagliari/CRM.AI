import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

// import { supabase } from '../../lib/supabaseClient'; // Unused

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
  errors: SystemError[];
  alerts: SystemAlert[];
}

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: string;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'indigo' | 'purple' | 'orange';
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-600',
    green: 'bg-green-50 border-green-200 text-green-600',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-600',
    red: 'bg-red-50 border-red-200 text-red-600',
    indigo: 'bg-indigo-50 border-indigo-200 text-indigo-600',
    purple: 'bg-purple-50 border-purple-200 text-purple-600',
    orange: 'bg-orange-50 border-orange-200 text-orange-600',
  };

  return (
    <div className={`p-6 rounded-lg border-2 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        <div className="text-2xl">{icon}</div>
      </div>
    </div>
  );
};

const SystemHealthDashboard: React.FC = () => {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSystemHealth = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Mock data for demonstration - replace with actual API calls
      const mockHealth: SystemHealth = {
        status: 'healthy',
        uptime: 99.9,
        metrics: {
          totalRequests24h: 15420,
          requests1h: 642,
          errorRate: 0.12,
          avgResponseTime: 245,
          rateLimitedRequests24h: 23,
          slowQueries: 8
        },
        endpoints: [
          { endpoint: '/api/users', total: 5420, errors: 2, errorRate: '0.04%', status: 'healthy' },
          { endpoint: '/api/orders', total: 3210, errors: 15, errorRate: '0.47%', status: 'warning' },
          { endpoint: '/api/payments', total: 1890, errors: 0, errorRate: '0.00%', status: 'healthy' }
        ],
        slowQueries: [
          { query: 'SELECT * FROM orders WHERE...', duration: 2340, timestamp: '2024-01-15T10:30:00Z', table: 'orders' },
          { query: 'UPDATE users SET...', duration: 1890, timestamp: '2024-01-15T10:25:00Z', table: 'users' }
        ],
        errors: [
          { endpoint: '/api/payments', error_message: 'Connection timeout', status_code: 500, created_at: '2024-01-15T10:32:00Z', severity: 'high' }
        ],
        alerts: [
          { id: '1', message: 'High error rate detected on /api/orders', alert_type: 'warning', created_at: '2024-01-15T10:30:00Z', resolved: false }
        ]
      };

      setHealth(mockHealth);
      diagnosticLogger.info('system_health', 'System health data loaded successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Failed to load system health data: ${errorMessage}`);
      diagnosticLogger.error('system_health', `Failed to fetch system health: ${errorMessage}`);
      toast.error('Failed to load system health data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSystemHealth();
    // Refresh every 30 seconds
    const interval = setInterval(fetchSystemHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return '✓';
      case 'warning':
        return '!';
      case 'critical':
        return '✗';
      default:
        return '?';
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

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <div className="text-red-600 text-xl mr-3">⚠</div>
          <div>
            <h3 className="text-lg font-medium text-red-800">System Health Error</h3>
            <p className="text-red-600 mt-1">{error}</p>
            <button
              onClick={fetchSystemHealth}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!health) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <p className="text-gray-600">No system health data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Health Dashboard</h1>
          <p className="text-gray-600">Monitor system performance and health metrics</p>
        </div>
        <button
          onClick={fetchSystemHealth}
          disabled={loading}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Overall Status */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Overall System Status</h2>
            <div className="flex items-center mt-2">
              <span className="text-2xl mr-2">{getStatusIcon(health.status)}</span>
              <span className="text-xl font-bold text-green-600">{health.status.toUpperCase()}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Uptime: {health.uptime}%</p>
            <p className="text-sm text-gray-600">Last updated: {new Date().toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard
          title="Total Requests (24h)"
          value={health?.metrics?.totalRequests24h?.toLocaleString() || '0'}
          icon="CHART"
          color="blue"
        />
        <MetricCard
          title="Requests (1h)"
          value={health?.metrics?.requests1h?.toLocaleString() || '0'}
          icon="TREND"
          color="indigo"
        />
        <MetricCard
          title="Error Rate (1h)"
          value={`${health?.metrics?.errorRate?.toFixed(2) || '0.00'}%`}
          icon={health?.metrics?.errorRate && health.metrics.errorRate > 5 ? 'ERROR' : 'OK'}
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
          icon="SHIELD"
          color="orange"
        />
        <MetricCard
          title="Slow Queries (24h)"
          value={health?.metrics?.slowQueries?.toLocaleString() || '0'}
          icon="GLOBE"
          color="purple"
        />
      </div>

      {/* Active Alerts */}
      {health.alerts && health.alerts.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Active Alerts</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {health.alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-lg border-l-4 ${
                    alert.alert_type === 'critical'
                      ? 'bg-red-50 border-red-400'
                      : alert.alert_type === 'warning'
                      ? 'bg-yellow-50 border-yellow-400'
                      : 'bg-blue-50 border-blue-400'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">{alert.message}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {new Date(alert.created_at).toLocaleString()}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        alert.alert_type === 'critical'
                          ? 'bg-red-100 text-red-800'
                          : alert.alert_type === 'warning'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {alert.alert_type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Endpoint Health */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Endpoint Health (Last Hour)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Endpoint
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Requests
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Errors
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Error Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {health.endpoints.map((endpoint, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {endpoint.endpoint}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {endpoint.total.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {endpoint.errors}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {endpoint.errorRate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="mr-2">{getStatusIcon(endpoint.status)}</span>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          endpoint.status === 'healthy'
                            ? 'bg-green-100 text-green-800'
                            : endpoint.status === 'warning'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {endpoint.status}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Errors */}
      {health.errors && health.errors.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Errors</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {health.errors.map((error, index) => (
                <div key={index} className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-red-900">{error.endpoint}</p>
                      <p className="text-red-700 mt-1">{error.error_message}</p>
                      <p className="text-sm text-red-600 mt-2">
                        Status: {error.status_code} | {new Date(error.created_at).toLocaleString()}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        error.severity === 'critical'
                          ? 'bg-red-100 text-red-800'
                          : error.severity === 'high'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {error.severity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Slow Queries */}
      {health.slowQueries && health.slowQueries.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Slow Queries</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {health.slowQueries.map((query, index) => (
                <div key={index} className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-mono text-sm text-gray-800 bg-gray-100 p-2 rounded">
                        {query.query}
                      </p>
                      <p className="text-sm text-gray-600 mt-2">
                        Table: {query.table} | Duration: {query.duration}ms | {new Date(query.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemHealthDashboard;