'use client';

import { formatCurrency, formatNumber, formatPercentage } from '@/lib/utils';
import {
    ArrowTrendingDownIcon,
    ArrowTrendingUpIcon,
    CalendarDaysIcon,
    ChartBarIcon,
    CurrencyDollarIcon
} from '@heroicons/react/24/outline';

interface RevenueMetricsProps {
  totalRevenue: number;
  averageDealSize: number;
  growthRate: number;
  dealsWon: number;
  conversionRate: number;
  isLoading?: boolean;
}

interface MetricCardProps {
  title: string;
  value: string;
  change?: number;
  icon: React.ElementType;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  isLoading?: boolean;
}

function MetricCard({ title, value, change, icon: Icon, color, isLoading }: MetricCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
    red: 'bg-red-50 text-red-600 border-red-200'
  };

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change !== undefined && (
            <div className="flex items-center mt-2">
              {change >= 0 ? (
                <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                <ArrowTrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
              )}
              <span className={`text-sm font-medium ${
                change >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {change >= 0 ? '+' : ''}{formatPercentage(change)}
              </span>
              <span className="text-sm text-gray-500 ml-1">vs last period</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

export default function RevenueMetrics({
  totalRevenue,
  averageDealSize,
  growthRate,
  dealsWon,
  conversionRate,
  isLoading = false
}: RevenueMetricsProps) {
  const metrics = [
    {
      title: 'Total Revenue',
      value: formatCurrency(totalRevenue),
      change: growthRate,
      icon: CurrencyDollarIcon,
      color: 'green' as const
    },
    {
      title: 'Average Deal Size',
      value: formatCurrency(averageDealSize),
      icon: ChartBarIcon,
      color: 'blue' as const
    },
    {
      title: 'Deals Won',
      value: formatNumber(dealsWon),
      icon: CalendarDaysIcon,
      color: 'purple' as const
    },
    {
      title: 'Conversion Rate',
      value: formatPercentage(conversionRate),
      icon: ArrowTrendingUpIcon,
      color: 'orange' as const
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Revenue Metrics</h3>
        {!isLoading && (
          <span className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleString()}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <MetricCard
            key={index}
            title={metric.title}
            value={metric.value}
            change={metric.change}
            icon={metric.icon}
            color={metric.color}
            isLoading={isLoading}
          />
        ))}
      </div>

      {/* Additional Summary */}
      {!isLoading && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Summary Insights</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <p>
                  • Revenue growth of <strong className={growthRate >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {formatPercentage(growthRate)}
                  </strong> compared to previous period
                </p>
                <p>
                  • Average deal size: <strong className="text-blue-600">{formatCurrency(averageDealSize)}</strong>
                </p>
                <p>
                  • Conversion rate: <strong className="text-purple-600">{formatPercentage(conversionRate)}</strong>
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(totalRevenue)}
              </div>
              <div className="text-sm text-gray-500">Total Revenue</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}