// src/components/superadmin/incidents/IncidentDashboard.tsx
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

import { invokeSupabaseFunction } from '../../../lib/api';

import { diagnosticLogger } from '../../../lib/mockDiagnosticLogger';
interface Incident {
  id: string;
  incident_type: string;
  severity: string;
  status: string;
  title: string;
  description: string;
  affected_service: string;
  detected_at: string;
  resolved_at: string | null;
  organization_id: string | null;
  assigned_to: string | null;
}

interface IncidentStats {
  total: number;
  open: number;
  investigating: number;
  resolved: number;
  critical: number;
  high: number;
}

export const IncidentDashboard: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [stats, setStats] = useState<IncidentStats>({
    total: 0,
    open: 0,
    investigating: 0,
    resolved: 0,
    critical: 0,
    high: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string[]>(['open', 'investigating']);
  const [filterSeverity, setFilterSeverity] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadIncidents();
  }, [filterStatus, filterSeverity, page]);

  const loadIncidents = async () => {
    try {
      setIsLoading(true);

      const result = await invokeSupabaseFunction('incident-management', {
        action: 'list_incidents',
        filters: {
          status: filterStatus.length > 0 ? filterStatus : undefined,
          severity: filterSeverity.length > 0 ? filterSeverity : undefined,
        },
        page,
        per_page: 20,
      });

      setIncidents(result.incidents || []);
      setTotalPages(result.pagination?.total_pages || 1);

      // Calculate stats
      const newStats: IncidentStats = {
        total: result.pagination?.total || 0,
        open: 0,
        investigating: 0,
        resolved: 0,
        critical: 0,
        high: 0,
      };

      result.incidents?.forEach((incident: Incident) => {
        if (incident.status === 'open') {newStats.open++;}
        if (incident.status === 'investigating') {newStats.investigating++;}
        if (incident.status === 'resolved') {newStats.resolved++;}
        if (incident.severity === 'critical') {newStats.critical++;}
        if (incident.severity === 'high') {newStats.high++;}
      });

      setStats(newStats);
    } catch (error) {
      diagnosticLogger.error('Error loading incidents:', error);
      toast.error('Failed to load incidents');
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800';
      case 'investigating': return 'bg-yellow-100 text-yellow-800';
      case 'identified': return 'bg-blue-100 text-blue-800';
      case 'monitoring': return 'bg-purple-100 text-purple-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const toggleStatusFilter = (status: string) => {
    setFilterStatus(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
    setPage(1);
  };

  const toggleSeverityFilter = (severity: string) => {
    setFilterSeverity(prev =>
      prev.includes(severity)
        ? prev.filter(s => s !== severity)
        : [...prev, severity]
    );
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Incident Management</h1>
          <p className="text-gray-600 mt-1">Monitor and manage system incidents</p>
        </div>
        <button
          onClick={loadIncidents}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-indigo-700"
        >
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Total</div>
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Open</div>
          <div className="text-2xl font-bold text-red-600">{stats.open}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Investigating</div>
          <div className="text-2xl font-bold text-yellow-600">{stats.investigating}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Resolved</div>
          <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Critical</div>
          <div className="text-2xl font-bold text-red-700">{stats.critical}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">High</div>
          <div className="text-2xl font-bold text-orange-600">{stats.high}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Status</h3>
            <div className="flex flex-wrap gap-2">
              {['open', 'investigating', 'identified', 'monitoring', 'resolved', 'closed'].map(status => (
                <button
                  key={status}
                  onClick={() => toggleStatusFilter(status)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    filterStatus.includes(status)
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Severity</h3>
            <div className="flex flex-wrap gap-2">
              {['critical', 'high', 'medium', 'low'].map(severity => (
                <button
                  key={severity}
                  onClick={() => toggleSeverityFilter(severity)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    filterSeverity.includes(severity)
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {severity.charAt(0).toUpperCase() + severity.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Incidents List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
            <p className="text-gray-600 mt-4">Loading incidents...</p>
          </div>
        ) : incidents.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-600">No incidents found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Incident
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Severity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Detected
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {incidents.map((incident) => (
                  <tr key={incident.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{incident.title}</div>
                      {incident.description && (
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {incident.description}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {incident.incident_type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getSeverityColor(incident.severity)}`}>
                        {incident.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(incident.status)}`}>
                        {incident.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {incident.affected_service || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(incident.detected_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => toast.success('Incident details view coming soon')}
                        className="text-primary hover:text-indigo-900"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-700">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

