// ===================================================================
// GUARDIAN AI CRM - USAGE TRACKING HOOK
// File: src/hooks/useUsageTracking.ts
// React hook per gestire usage tracking nel CRM
// ===================================================================

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

import { 
  UsageStatistics, 
  TrackUsageRequest, 
  // UsageTracking,
  // OrganizationUsageSummary 
} from '../types/usage';
import { UsageTrackingService } from '../lib/services/usageTrackingService';
import { useAuth } from '../contexts/AuthContext';

export interface UseUsageTrackingReturn {
  // Current usage statistics
  usageStats: UsageStatistics | null;
  
  // Loading states
  loading: boolean;
  trackingUsage: boolean;
  isLoading: boolean; // Alias for compatibility
  
  // Error states
  error: string | null;
  
  // Actions
  trackUsage: (request: TrackUsageRequest) => Promise<{ success: boolean; quota_exceeded?: boolean }>;
  refreshUsage: () => Promise<void>;
  checkQuota: (serviceType: string, quantity?: number) => Promise<boolean>;
  
  // Computed properties
  hasWarningAlerts: boolean;
  hasCriticalAlerts: boolean;
  isOverQuota: boolean;
  daysRemaining: number;
}

/**
 * Hook for managing usage tracking in the CRM
 * Provides real-time usage statistics and quota management
 */
export const useUsageTracking = (organizationId?: string): UseUsageTrackingReturn => {
  const { session } = useAuth();
  const [usageStats, setUsageStats] = useState<UsageStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [trackingUsage, setTrackingUsage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Use provided organizationId or fallback to session user ID
  const activeOrgId = organizationId || session?.user?.id;
  
  // Load usage statistics
  const loadUsageStats = useCallback(async () => {
    if (!activeOrgId) {
      setError('Organization ID not available');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const stats = await UsageTrackingService.getUsageStatistics(activeOrgId);
      
      if (stats) {
        setUsageStats(stats);
      } else {
        setError('Unable to load usage statistics');
      }
      
    } catch (err) {
      console.error('Error loading usage statistics:', err);
      setError('Failed to load usage data');
    } finally {
      setLoading(false);
    }
  }, [activeOrgId]);
  
  // Track usage for a service
  const trackUsage = useCallback(async (request: TrackUsageRequest) => {
    if (!activeOrgId) {
      toast.error('Organization ID not available');
      return { success: false };
    }
    
    try {
      setTrackingUsage(true);
      
      const result = await UsageTrackingService.trackUsage(activeOrgId, request);
      
      if (result.success) {
        // Update local stats if returned
        if (result.current_usage) {
          setUsageStats(result.current_usage);
        }
        
        // Show quota exceeded warning
        if (result.quota_exceeded) {
          toast.error(
            `Quota exceeded for ${request.service_type.replace('_', ' ')}. Consider upgrading your plan.`,
            { duration: 6000 }
          );
        }
        
        return { success: true, quota_exceeded: result.quota_exceeded };
      } else {
        toast.error('Failed to track usage');
        return { success: false };
      }
      
    } catch (err) {
      console.error('Error tracking usage:', err);
      toast.error('Error tracking usage');
      return { success: false };
    } finally {
      setTrackingUsage(false);
    }
  }, [activeOrgId]);
  
  // Refresh usage statistics
  const refreshUsage = useCallback(async () => {
    await loadUsageStats();
  }, [loadUsageStats]);
  
  // Load stats on mount and when organizationId changes
  useEffect(() => {
    if (activeOrgId) {
      loadUsageStats();
    }
  }, [activeOrgId, loadUsageStats]);
  
  // Computed properties
  const hasWarningAlerts = usageStats ? (
    usageStats.alerts.ai_warning || 
    usageStats.alerts.whatsapp_warning || 
    usageStats.alerts.email_warning
  ) : false;
  
  const hasCriticalAlerts = usageStats ? (
    usageStats.alerts.ai_critical || 
    usageStats.alerts.whatsapp_critical || 
    usageStats.alerts.email_critical
  ) : false;
  
  const isOverQuota = usageStats ? (
    usageStats.usage.ai_requests.overage > 0 ||
    usageStats.usage.whatsapp_messages.overage > 0 ||
    usageStats.usage.email_marketing.overage > 0
  ) : false;
  
  const daysRemaining = usageStats ? usageStats.current_period.days_remaining : 0;
  
  // Check quota for a service type
  const checkQuota = useCallback(async (serviceType: string, quantity = 1): Promise<boolean> => {
    if (!usageStats) return true; // Allow if no stats available
    
    switch (serviceType) {
      case 'ai_request': {
        const aiRemaining = usageStats.usage.ai_requests.limit - usageStats.usage.ai_requests.used;
        return aiRemaining >= quantity;
      }
      case 'whatsapp_message': {
        const whatsappRemaining = usageStats.usage.whatsapp_messages.limit - usageStats.usage.whatsapp_messages.used;
        return whatsappRemaining >= quantity;
      }
      case 'email_marketing': {
        const emailRemaining = usageStats.usage.email_marketing.limit - usageStats.usage.email_marketing.used;
        return emailRemaining >= quantity;
      }
      default:
        return true;
    }
  }, [usageStats]);
  
  return {
    usageStats,
    loading,
    trackingUsage,
    isLoading: loading, // Alias for compatibility
    error,
    trackUsage,
    refreshUsage,
    checkQuota,
    hasWarningAlerts,
    hasCriticalAlerts,
    isOverQuota,
    daysRemaining
  };
};

/**
 * Simple hook for tracking usage without full statistics
 * Useful for components that only need to track usage
 */
export const useSimpleUsageTracking = (organizationId?: string) => {
  const { session } = useAuth();
  const [trackingUsage, setTrackingUsage] = useState(false);
  
  const activeOrgId = organizationId || session?.user?.id;
  
  const trackUsage = useCallback(async (request: TrackUsageRequest) => {
    if (!activeOrgId) {
      return { success: false };
    }
    
    try {
      setTrackingUsage(true);
      const result = await UsageTrackingService.trackUsage(activeOrgId, request);
      
      if (result.quota_exceeded) {
        toast.error(
          `Quota exceeded for ${request.service_type.replace('_', ' ')}`,
          { duration: 4000 }
        );
      }
      
      return result;
    } catch (err) {
      console.error('Error tracking usage:', err);
      return { success: false };
    } finally {
      setTrackingUsage(false);
    }
  }, [activeOrgId]);
  
  return { trackUsage, trackingUsage };
};

/**
 * Hook for checking quota before performing actions
 * Returns whether action can proceed based on current limits
 */
export const useQuotaCheck = (organizationId?: string) => {
  const { usageStats, loading } = useUsageTracking(organizationId);
  
  const canUseAI = useCallback((requestsNeeded = 1) => {
    if (!usageStats || loading) return { allowed: true, reason: 'Loading...' };
    
    const { used, limit } = usageStats.usage.ai_requests;
    const remaining = limit - used;
    
    if (limit === 999999) return { allowed: true, reason: 'Unlimited' }; // Unlimited
    if (remaining >= requestsNeeded) return { allowed: true, reason: `${remaining} requests remaining` };
    
    return { 
      allowed: false, 
      reason: `Quota exceeded. Used ${used}/${limit} AI requests this period.` 
    };
  }, [usageStats, loading]);
  
  const canSendWhatsApp = useCallback((messagesNeeded = 1) => {
    if (!usageStats || loading) return { allowed: true, reason: 'Loading...' };
    
    const { used, limit } = usageStats.usage.whatsapp_messages;
    const remaining = limit - used;
    
    if (limit === 999999) return { allowed: true, reason: 'Unlimited' };
    if (remaining >= messagesNeeded) return { allowed: true, reason: `${remaining} messages remaining` };
    
    return { 
      allowed: false, 
      reason: `Quota exceeded. Used ${used}/${limit} WhatsApp messages this period.` 
    };
  }, [usageStats, loading]);
  
  const canSendEmails = useCallback((emailsNeeded = 1) => {
    if (!usageStats || loading) return { allowed: true, reason: 'Loading...' };
    
    const { used, limit } = usageStats.usage.email_marketing;
    const remaining = limit - used;
    
    if (limit === 999999) return { allowed: true, reason: 'Unlimited' };
    if (remaining >= emailsNeeded) return { allowed: true, reason: `${remaining} emails remaining` };
    
    return { 
      allowed: false, 
      reason: `Quota exceeded. Used ${used}/${limit} emails this period.` 
    };
  }, [usageStats, loading]);
  
  return {
    canUseAI,
    canSendWhatsApp,
    canSendEmails,
    usageStats,
    loading
  };
};

export default useUsageTracking;