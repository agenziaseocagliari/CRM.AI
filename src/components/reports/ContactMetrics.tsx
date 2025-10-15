'use client';

import { formatNumber, formatPercentage } from '@/lib/utils';
import {
    ArrowTrendingDownIcon,
    ArrowTrendingUpIcon,
    ChartBarIcon,
    StarIcon,
    UserGroupIcon,
    UserPlusIcon
} from '@heroicons/react/24/outline';

interface ContactMetricsProps {
  totalContacts: number;
  newThisMonth: number;
  conversionRate: number;
  averageLeadScore: number;
  growthRate: number;
  qualifiedLeads: number;
  isLoading?: boolean;
}

interface MetricCardProps {
  title: string;
  value: string;
  change?: number;
  icon: React.ElementType;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'indigo';
  isLoading?: boolean;
}

function MetricCard({ title, value, change, icon: Icon, color, isLoading }: MetricCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200'
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

export default function ContactMetrics({
  totalContacts,
  newThisMonth,
  conversionRate,
  averageLeadScore,
  growthRate,
  qualifiedLeads,
  isLoading = false
}: ContactMetricsProps) {
  const qualificationRate = totalContacts > 0 ? (qualifiedLeads / totalContacts) * 100 : 0;

  const metrics = [
    {
      title: 'Total Contacts',
      value: formatNumber(totalContacts),
      change: growthRate,
      icon: UserGroupIcon,
      color: 'blue' as const
    },
    {
      title: 'New This Month',
      value: formatNumber(newThisMonth),
      icon: UserPlusIcon,
      color: 'green' as const
    },
    {
      title: 'Conversion Rate',
      value: formatPercentage(conversionRate),
      icon: ChartBarIcon,
      color: 'purple' as const
    },
    {
      title: 'Average Lead Score',
      value: `${averageLeadScore.toFixed(1)}/100`,
      icon: StarIcon,
      color: 'orange' as const
    },
    {
      title: 'Qualified Leads',
      value: formatNumber(qualifiedLeads),
      icon: ArrowTrendingUpIcon,
      color: 'indigo' as const
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Contact Analytics</h3>
        {!isLoading && (
          <span className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleString()}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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

      {/* Contact Quality Analysis */}
      {!isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Lead Quality Summary */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg border border-purple-200">
            <h4 className="font-semibold text-gray-900 mb-4">Lead Quality Insights</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Average Lead Score:</span>
                <span className="font-medium text-purple-600">
                  {averageLeadScore.toFixed(1)}/100
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Qualification Rate:</span>
                <span className="font-medium text-purple-600">
                  {formatPercentage(qualificationRate)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">High-Quality Leads:</span>
                <span className="font-medium text-purple-600">
                  {qualifiedLeads} contacts
                </span>
              </div>
            </div>
          </div>

          {/* Growth Analysis */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-gray-900 mb-4">Growth Analysis</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Monthly Growth:</span>
                <span className={`font-medium ${
                  growthRate >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {growthRate >= 0 ? '+' : ''}{formatPercentage(growthRate)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">New Contacts:</span>
                <span className="font-medium text-blue-600">
                  {newThisMonth} this month
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Conversion Rate:</span>
                <span className="font-medium text-blue-600">
                  {formatPercentage(conversionRate)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Items */}
      {!isLoading && (
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-4">Recommended Actions</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              {averageLeadScore < 50 && (
                <div className="flex items-start space-x-2 text-orange-700">
                  <div className="w-2 h-2 bg-orange-400 rounded-full mt-2"></div>
                  <span>Focus on lead quality: Current average score is {averageLeadScore.toFixed(1)}/100</span>
                </div>
              )}
              {conversionRate < 20 && (
                <div className="flex items-start space-x-2 text-red-700">
                  <div className="w-2 h-2 bg-red-400 rounded-full mt-2"></div>
                  <span>Improve conversion: Only {formatPercentage(conversionRate)} of leads convert</span>
                </div>
              )}
              {growthRate < 0 && (
                <div className="flex items-start space-x-2 text-red-700">
                  <div className="w-2 h-2 bg-red-400 rounded-full mt-2"></div>
                  <span>Address negative growth: {formatPercentage(growthRate)} decline this period</span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              {averageLeadScore > 70 && (
                <div className="flex items-start space-x-2 text-green-700">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                  <span>Great lead quality: Maintain current lead generation strategy</span>
                </div>
              )}
              {conversionRate > 30 && (
                <div className="flex items-start space-x-2 text-green-700">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                  <span>Excellent conversion: Consider scaling marketing efforts</span>
                </div>
              )}
              {growthRate > 20 && (
                <div className="flex items-start space-x-2 text-green-700">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                  <span>Strong growth: Prepare for increased capacity needs</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}