'use client';

import { ArrowDownTrayIcon, CalendarIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

interface RevenueFiltersProps {
  dateRange: string;
  organizationId?: string;
  onDateRangeChange: (range: string) => void;
  onOrganizationChange?: (orgId: string) => void;
  onExportCSV: () => void;
  isLoading?: boolean;
}

const dateRangeOptions = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
  { value: '365', label: 'Last year' },
  { value: 'custom', label: 'Custom range' }
];

export default function RevenueFilters({
  dateRange,
  organizationId,
  onDateRangeChange,
  onOrganizationChange,
  onExportCSV,
  isLoading = false
}: RevenueFiltersProps) {
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          {/* Date Range Filter */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-2">
              <CalendarIcon className="h-4 w-4 inline mr-1" />
              Time Period
            </label>
            <select
              value={dateRange}
              onChange={(e) => onDateRangeChange(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            >
              {dateRangeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Date Range */}
          {dateRange === 'custom' && (
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {/* Organization Filter (for super admin) */}
          {onOrganizationChange && (
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-2">
                <FunnelIcon className="h-4 w-4 inline mr-1" />
                Organization
              </label>
              <select
                value={organizationId || ''}
                onChange={(e) => onOrganizationChange(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[200px]"
                disabled={isLoading}
              >
                <option value="">All Organizations</option>
                <option value="00000000-0000-0000-0000-000000000001">Guardian AI Demo</option>
                <option value="2aab4d72-ca5b-438f-93ac-b4c2fe2f8353">Agenzia SEO Cagliari</option>
              </select>
            </div>
          )}
        </div>

        {/* Export Button */}
        <div className="flex flex-col justify-end">
          <label className="text-sm font-medium text-gray-700 mb-2 opacity-0">
            Export
          </label>
          <button
            onClick={onExportCSV}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Applied Filters Display */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {dateRangeOptions.find(opt => opt.value === dateRange)?.label}
          </span>
          {organizationId && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              Filtered Organization
            </span>
          )}
          {dateRange === 'custom' && customStartDate && customEndDate && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              {customStartDate} to {customEndDate}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}