// ===================================================================
// GUARDIAN AI CRM - USAGE DASHBOARD COMPONENT
// File: src/components/usage/UsageDashboard.tsx
// Dashboard per visualizzare usage, quote e billing info
// ===================================================================

import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

import { UsageStatistics, UsageLimitsWithExtraCredits } from '../../types/usage';
import { UsageTrackingService } from '../../lib/services/usageTrackingService';
import { useAuth } from '../../contexts/AuthContext';

import { CheckCircleIcon, ExclamationTriangleIcon } from '../ui/icons';

// Progress bar component
interface ProgressBarProps {
  percentage: number;
  className?: string;
  showOverage?: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ percentage, className = '', showOverage = false }) => {
  const clampedPercentage = Math.min(percentage, 100);
  const isOverage = percentage > 100;
  
  let colorClass = 'bg-green-500';
  if (percentage >= 90) colorClass = 'bg-red-500';
  else if (percentage >= 80) colorClass = 'bg-yellow-500';
  
  return (
    <div className={`w-full bg-gray-200 rounded-full h-3 ${className}`}>
      <div 
        className={`h-3 rounded-full transition-all duration-300 ${colorClass}`}
        style={{ width: `${clampedPercentage}%` }}
      ></div>
      {isOverage && showOverage && (
        <div className="mt-1 text-xs text-red-600 font-medium">
          Overage: {(percentage - 100).toFixed(1)}%
        </div>
      )}
    </div>
  );
};

// Usage card component with extra credits support
interface UsageCardProps {
  title: string;
  used: number;
  limit: number;
  percentage: number;
  icon: React.ReactNode;
  overage?: number;
  unit?: string;
  extraCredits?: number;
  subscriptionLimit?: number;
}

const UsageCard: React.FC<UsageCardProps> = ({ 
  title, 
  used, 
  limit, 
  percentage, 
  icon, 
  overage = 0,
  unit = '',
  extraCredits = 0,
  subscriptionLimit 
}) => {
  const isUnlimited = limit === 999999 || limit === -1;
  const isOverLimit = used > limit && !isUnlimited;
  
  const getStatusIcon = () => {
    if (isOverLimit) return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />;
    if (percentage >= 90) return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />;
    return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
  };
  
  const getStatusColor = () => {
    if (isOverLimit) return 'border-red-500 bg-red-50';
    if (percentage >= 90) return 'border-yellow-500 bg-yellow-50';
    if (percentage >= 80) return 'border-yellow-400 bg-yellow-25';
    return 'border-green-500 bg-green-50';
  };
  
  return (
    <div className={`bg-white rounded-lg border-2 p-6 ${getStatusColor()}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="p-2 bg-white rounded-lg mr-3">
            {icon}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <div className="flex items-center space-x-2">
              {getStatusIcon()}
              <span className="text-sm text-gray-600">
                {isUnlimited ? 'Unlimited' : `${used.toLocaleString()} / ${limit.toLocaleString()} ${unit}`}
              </span>
            </div>
            {extraCredits > 0 && subscriptionLimit && (
              <div className="mt-1 text-xs text-blue-600 font-medium">
                + {extraCredits.toLocaleString()} crediti extra
              </div>
            )}
          </div>
        </div>
      </div>
      
      {!isUnlimited && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Usage</span>
            <span className={`font-medium ${isOverLimit ? 'text-red-600' : 'text-gray-900'}`}>
              {percentage.toFixed(1)}%
            </span>
          </div>
          <ProgressBar 
            percentage={percentage} 
            showOverage={isOverLimit} 
          />
          
          {overage > 0 && (
            <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded-lg">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="w-4 h-4 text-red-500 mr-2" />
                <span className="text-sm font-medium text-red-800">
                  Overage: {overage.toLocaleString()} {unit}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Alert component
interface AlertBannerProps {
  type: 'warning' | 'critical' | 'info';
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const AlertBanner: React.FC<AlertBannerProps> = ({ type, title, message, action }) => {
  const bgColor = type === 'critical' ? 'bg-red-100 border-red-400' : 
                  type === 'warning' ? 'bg-yellow-100 border-yellow-400' : 
                  'bg-blue-100 border-blue-400';
  
  const textColor = type === 'critical' ? 'text-red-800' : 
                    type === 'warning' ? 'text-yellow-800' : 
                    'text-blue-800';
  
  const iconColor = type === 'critical' ? 'text-red-500' : 
                    type === 'warning' ? 'text-yellow-500' : 
                    'text-blue-500';
  
  return (
    <div className={`${bgColor} border-l-4 p-4 rounded-r-lg`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <ExclamationTriangleIcon className={`h-5 w-5 ${iconColor}`} />
        </div>
        <div className="ml-3 flex-1">
          <h3 className={`text-sm font-medium ${textColor}`}>{title}</h3>
          <p className={`mt-1 text-sm ${textColor}`}>{message}</p>
          {action && (
            <div className="mt-2">
              <button
                onClick={action.onClick}
                className={`text-sm font-medium underline ${textColor} hover:no-underline`}
              >
                {action.label}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Main dashboard component
export const UsageDashboard: React.FC = () => {
  const { session } = useAuth();
  const [usageStats, setUsageStats] = useState<UsageStatistics | null>(null);
  const [extendedLimits, setExtendedLimits] = useState<UsageLimitsWithExtraCredits | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // TODO: Get organization ID from user profile or context
  const organizationId = session?.user?.id; // Temporary - will be replaced with proper org ID
  
  const loadUsageStatistics = useCallback(async () => {
    if (!organizationId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Load both usage statistics and extended limits
      const [stats, limits] = await Promise.all([
        UsageTrackingService.getUsageStatistics(organizationId),
        UsageTrackingService.getUsageLimitsWithExtraCredits(organizationId)
      ]);
      
      if (stats) {
        setUsageStats(stats);
      } else {
        setError('Unable to load usage statistics');
      }
      
      if (limits) {
        setExtendedLimits(limits);
      }
      
    } catch (err) {
      console.error('Error loading usage statistics:', err);
      setError('Failed to load usage data');
      toast.error('Failed to load usage data');
    } finally {
      setLoading(false);
    }
  }, [organizationId]);
  
  useEffect(() => {
    if (organizationId) {
      loadUsageStatistics();
    }
  }, [organizationId, loadUsageStatistics]);
  
  const handleUpgrade = () => {
    // TODO: Integrate with subscription management
    toast.success('Redirecting to upgrade page...');
  };
  
  const getAlerts = () => {
    if (!usageStats) return [];
    
    const alerts = [];
    
    // Check for critical alerts
    if (usageStats.alerts.ai_critical) {
      alerts.push({
        type: 'critical' as const,
        title: 'AI Requests Limit Critical',
        message: `You've used ${usageStats.usage.ai_requests.percentage.toFixed(1)}% of your AI requests. Consider upgrading to avoid service interruption.`,
        action: { label: 'Upgrade Plan', onClick: handleUpgrade }
      });
    }
    
    if (usageStats.alerts.whatsapp_critical) {
      alerts.push({
        type: 'critical' as const,
        title: 'WhatsApp Messages Limit Critical',
        message: `You've used ${usageStats.usage.whatsapp_messages.percentage.toFixed(1)}% of your WhatsApp messages.`,
        action: { label: 'Upgrade Plan', onClick: handleUpgrade }
      });
    }
    
    if (usageStats.alerts.email_critical) {
      alerts.push({
        type: 'critical' as const,
        title: 'Email Marketing Limit Critical',
        message: `You've used ${usageStats.usage.email_marketing.percentage.toFixed(1)}% of your email marketing quota.`,
        action: { label: 'Upgrade Plan', onClick: handleUpgrade }
      });
    }
    
    // Check for warning alerts
    if (usageStats.alerts.ai_warning && !usageStats.alerts.ai_critical) {
      alerts.push({
        type: 'warning' as const,
        title: 'AI Requests Warning',
        message: `You've used ${usageStats.usage.ai_requests.percentage.toFixed(1)}% of your AI requests this month.`,
        action: { label: 'View Plans', onClick: handleUpgrade }
      });
    }
    
    return alerts;
  };
  
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-text-primary">Usage & Billing</h1>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }
  
  if (error || !usageStats) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-text-primary">Usage & Billing</h1>
        </div>
        <div className="bg-red-50 border border-red-300 rounded-lg p-6 text-center">
          <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-red-800 mb-2">Unable to Load Usage Data</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadUsageStatistics}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  const alerts = getAlerts();
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Usage & Billing</h1>
          <p className="text-text-secondary mt-1">
            Monitor your usage and manage your subscription
          </p>
        </div>
        <button
          onClick={loadUsageStatistics}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
        >
          Refresh
        </button>
      </div>
      
      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-4">
          {alerts.map((alert, index) => (
            <AlertBanner key={index} {...alert} />
          ))}
        </div>
      )}
      
      {/* Period Info */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Current Billing Period</h3>
            <p className="text-gray-600">
              {new Date(usageStats.current_period.start).toLocaleDateString()} - {new Date(usageStats.current_period.end).toLocaleDateString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">{usageStats.current_period.days_remaining}</p>
            <p className="text-sm text-gray-600">days remaining</p>
          </div>
        </div>
      </div>
      
      {/* Usage Cards with Extra Credits Support */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <UsageCard
          title="AI Requests"
          used={usageStats.usage.ai_requests.used}
          limit={usageStats.usage.ai_requests.limit}
          percentage={usageStats.usage.ai_requests.percentage}
          overage={usageStats.usage.ai_requests.overage}
          icon={<div className="w-8 h-8 bg-blue-500 rounded text-white flex items-center justify-center text-sm font-bold">AI</div>}
          unit="requests"
          extraCredits={extendedLimits?.extra_credits.ai_credits}
          subscriptionLimit={extendedLimits?.ai_requests}
        />
        
        <UsageCard
          title="WhatsApp Messages"
          used={usageStats.usage.whatsapp_messages.used}
          limit={usageStats.usage.whatsapp_messages.limit}
          percentage={usageStats.usage.whatsapp_messages.percentage}
          overage={usageStats.usage.whatsapp_messages.overage}
          icon={<div className="w-8 h-8 bg-green-500 rounded text-white flex items-center justify-center text-sm font-bold">WA</div>}
          unit="messages"
          extraCredits={extendedLimits?.extra_credits.whatsapp_credits}
          subscriptionLimit={extendedLimits?.whatsapp_messages}
        />
        
        <UsageCard
          title="Email Marketing"
          used={usageStats.usage.email_marketing.used}
          limit={usageStats.usage.email_marketing.limit}
          percentage={usageStats.usage.email_marketing.percentage}
          overage={usageStats.usage.email_marketing.overage}
          icon={<div className="w-8 h-8 bg-purple-500 rounded text-white flex items-center justify-center text-sm font-bold">📧</div>}
          unit="emails"
          extraCredits={extendedLimits?.extra_credits.email_credits}
          subscriptionLimit={extendedLimits?.email_marketing}
        />
      </div>
      
      {/* Extra Credits Summary */}
      {extendedLimits && (extendedLimits.extra_credits.ai_credits > 0 || extendedLimits.extra_credits.whatsapp_credits > 0 || extendedLimits.extra_credits.email_credits > 0) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
            <CheckCircleIcon className="w-5 h-5 mr-2" />
            Crediti Extra Disponibili
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {extendedLimits.extra_credits.ai_credits > 0 && (
              <div className="text-center bg-white rounded-lg p-4">
                <p className="text-xl font-bold text-blue-600">
                  {extendedLimits.extra_credits.ai_credits.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">AI Credits Extra</p>
              </div>
            )}
            {extendedLimits.extra_credits.whatsapp_credits > 0 && (
              <div className="text-center bg-white rounded-lg p-4">
                <p className="text-xl font-bold text-green-600">
                  {extendedLimits.extra_credits.whatsapp_credits.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">WhatsApp Credits Extra</p>
              </div>
            )}
            {extendedLimits.extra_credits.email_credits > 0 && (
              <div className="text-center bg-white rounded-lg p-4">
                <p className="text-xl font-bold text-purple-600">
                  {extendedLimits.extra_credits.email_credits.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">Email Credits Extra</p>
              </div>
            )}
          </div>
          <div className="mt-4 text-center">
            <button 
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              onClick={() => toast.success('Redirecting to credits store...')}
            >
              Acquista Altri Crediti
            </button>
          </div>
        </div>
      )}

      {/* Costs Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Period Costs</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">
              €{(usageStats.costs.current_period_cents / 100).toFixed(2)}
            </p>
            <p className="text-sm text-gray-600">Base Usage</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">
              €{(usageStats.costs.overage_cents / 100).toFixed(2)}
            </p>
            <p className="text-sm text-gray-600">Overage Charges</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">
              €{(usageStats.costs.total_cents / 100).toFixed(2)}
            </p>
            <p className="text-sm text-gray-600">Total</p>
          </div>
        </div>
      </div>
      
      {/* Upgrade CTA */}
      {(usageStats.alerts.ai_warning || usageStats.alerts.whatsapp_warning || usageStats.alerts.email_warning) && (
        <div className="bg-gradient-to-r from-primary to-indigo-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold">Need More Resources?</h3>
              <p className="mt-1 opacity-90">
                Upgrade your plan to get higher limits and unlock advanced features.
              </p>
            </div>
            <button
              onClick={handleUpgrade}
              className="bg-white text-primary px-6 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              Upgrade Plan
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsageDashboard;