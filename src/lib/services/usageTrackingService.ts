// ===================================================================
// GUARDIAN AI CRM - USAGE TRACKING SERVICE
// File: src/lib/services/usageTrackingService.ts
// Servizio per gestire tracking usage, quote e billing
// ===================================================================

import { supabase } from '../supabaseClient';
import { 
  UsageTracking, 
  UsageQuota, 
  TrackUsageRequest, 
  OrganizationUsageSummary,
  UsageStatistics,
  PricingCalculation,
  SERVICE_COSTS,
  USAGE_ALERT_THRESHOLDS,
  SubscriptionTier,
  OrganizationSubscription
} from '../../types/usage';
import { diagnosticLogger } from '../mockDiagnosticLogger';

export class UsageTrackingService {
  
  /**
   * Track usage for a specific service
   */
  static async trackUsage(
    organizationId: string,
    request: TrackUsageRequest
  ): Promise<{ success: boolean; quota_exceeded?: boolean; current_usage?: UsageStatistics }> {
    try {
      // 1. Get current quota and limits
      const quota = await this.getCurrentQuota(organizationId);
      const limits = await this.getUsageLimits(organizationId);
      
      if (!quota || !limits) {
        throw new Error('Unable to get usage quota or limits');
      }
      
      // 2. Calculate costs
      const costCents = this.calculateServiceCost(request.service_type, request.service_action, request.quantity);
      const billableCents = request.cost_cents || costCents;
      
      // 3. Check if usage would exceed limits
      const currentUsage = this.getCurrentUsageForService(quota, request.service_type);
      const newUsage = currentUsage + (request.quantity || 1);
      const limit = this.getLimitForService(limits, request.service_type);
      
      const quotaExceeded = limit > 0 && newUsage > limit; // limit -1 = unlimited
      
      // 4. Track the usage
      const { error: trackingError } = await supabase
        .from('usage_tracking')
        .insert({
          organization_id: organizationId,
          service_type: request.service_type,
          service_action: request.service_action,
          usage_date: new Date().toISOString().split('T')[0],
          quantity: request.quantity || 1,
          cost_cents: costCents,
          billable_cents: billableCents,
          metadata: request.metadata || {},
          contact_id: request.contact_id,
          automation_id: request.automation_id
        });
      
      if (trackingError) {
        diagnosticLogger.error('Error tracking usage:', trackingError);
        throw trackingError;
      }
      
      // 5. Update quota counters
      await this.updateQuotaUsage(organizationId, request.service_type, request.quantity || 1);
      
      // 6. Check for alerts
      if (!quotaExceeded) {
        await this.checkAndSendAlerts(organizationId, request.service_type, newUsage, limit);
      }
      
      // 7. Get updated usage statistics
      const updatedStats = await this.getUsageStatistics(organizationId);
      
      return {
        success: true,
        quota_exceeded: quotaExceeded,
        current_usage: updatedStats || undefined
      };
      
    } catch (error) {
      diagnosticLogger.error('Error in trackUsage:', error);
      return { success: false };
    }
  }
  
  /**
   * Get current usage statistics for organization
   */
  static async getUsageStatistics(organizationId: string): Promise<UsageStatistics | null> {
    try {
      const { data, error } = await supabase
        .from('organization_usage_summary')
        .select('*')
        .eq('organization_id', organizationId)
        .single();
      
      if (error || !data) {
        diagnosticLogger.error('Error getting usage statistics:', error);
        return null;
      }
      
      // Calculate current period info
      const currentPeriodEnd = new Date(data.current_period_end);
      const now = new Date();
      const daysRemaining = Math.max(0, Math.ceil((currentPeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      
      return {
        current_period: {
          start: data.current_period_start || now.toISOString(),
          end: data.current_period_end,
          days_remaining: daysRemaining
        },
        usage: {
          ai_requests: {
            used: data.ai_used,
            limit: data.ai_limit,
            percentage: data.ai_usage_percent,
            overage: Math.max(0, data.ai_used - data.ai_limit)
          },
          whatsapp_messages: {
            used: data.whatsapp_used,
            limit: data.whatsapp_limit,
            percentage: data.whatsapp_usage_percent,
            overage: Math.max(0, data.whatsapp_used - data.whatsapp_limit)
          },
          email_marketing: {
            used: data.email_used,
            limit: data.email_limit,
            percentage: data.email_usage_percent,
            overage: Math.max(0, data.email_used - data.email_limit)
          }
        },
        costs: {
          current_period_cents: await this.calculatePeriodCosts(organizationId),
          overage_cents: await this.calculateOverageCosts(organizationId),
          total_cents: 0 // Will be calculated
        },
        alerts: {
          ai_warning: data.ai_usage_percent >= USAGE_ALERT_THRESHOLDS.WARNING_THRESHOLD,
          ai_critical: data.ai_usage_percent >= USAGE_ALERT_THRESHOLDS.CRITICAL_THRESHOLD,
          whatsapp_warning: data.whatsapp_usage_percent >= USAGE_ALERT_THRESHOLDS.WARNING_THRESHOLD,
          whatsapp_critical: data.whatsapp_usage_percent >= USAGE_ALERT_THRESHOLDS.CRITICAL_THRESHOLD,
          email_warning: data.email_usage_percent >= USAGE_ALERT_THRESHOLDS.WARNING_THRESHOLD,
          email_critical: data.email_usage_percent >= USAGE_ALERT_THRESHOLDS.CRITICAL_THRESHOLD
        }
      };
      
    } catch (error) {
      diagnosticLogger.error('Error getting usage statistics:', error);
      return null;
    }
  }
  
  /**
   * Get current quota for organization
   */
  static async getCurrentQuota(organizationId: string): Promise<UsageQuota | null> {
    try {
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('usage_quotas')
        .select('*')
        .eq('organization_id', organizationId)
        .lte('period_start', now)
        .gte('period_end', now)
        .single();
      
      if (error && error.code !== 'PGRST116') { // Not found is OK
        diagnosticLogger.error('Error getting current quota:', error);
        return null;
      }
      
      return data;
      
    } catch (error) {
      diagnosticLogger.error('Error in getCurrentQuota:', error);
      return null;
    }
  }
  
  /**
   * Get usage limits for organization
   */
  static async getUsageLimits(organizationId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('organization_subscriptions')
        .select(`
          *,
          subscription_tier:subscription_tiers(*)
        `)
        .eq('organization_id', organizationId)
        .single();
      
      if (error || !data) {
        diagnosticLogger.error('Error getting usage limits:', error);
        return null;
      }
      
      const tier = data.subscription_tier;
      if (!tier) return null;
      
      // Apply custom limits if they exist
      const customLimits = data.custom_limits || {};
      
      return {
        ai_requests: customLimits.ai_requests_limit ?? tier.ai_requests_limit,
        whatsapp_messages: customLimits.whatsapp_messages_limit ?? tier.whatsapp_messages_limit,
        email_marketing: customLimits.email_marketing_limit ?? tier.email_marketing_limit,
        contacts: customLimits.contacts_limit ?? tier.contacts_limit,
        storage_gb: customLimits.storage_limit_gb ?? tier.storage_limit_gb,
        overage_pricing: {
          ai_requests: tier.ai_overage_cents,
          whatsapp_messages: tier.whatsapp_overage_cents,
          email_marketing: tier.email_overage_cents
        }
      };
      
    } catch (error) {
      diagnosticLogger.error('Error in getUsageLimits:', error);
      return null;
    }
  }
  
  /**
   * Calculate service cost based on type and action
   */
  static calculateServiceCost(serviceType: string, serviceAction?: string, quantity = 1): number {
    let unitCost = 0;
    
    switch (serviceType) {
      case 'ai_request':
        unitCost = SERVICE_COSTS.ai_request[serviceAction as keyof typeof SERVICE_COSTS.ai_request] || SERVICE_COSTS.ai_request.default;
        break;
      case 'whatsapp_message':
        unitCost = SERVICE_COSTS.whatsapp_message;
        break;
      case 'email_marketing':
        unitCost = SERVICE_COSTS.email_marketing;
        break;
      case 'storage':
        unitCost = SERVICE_COSTS.storage;
        break;
      default:
        unitCost = 0;
    }
    
    return Math.round(unitCost * quantity * 100); // Convert to cents
  }
  
  /**
   * Update quota usage counters
   */
  static async updateQuotaUsage(organizationId: string, serviceType: string, quantity: number): Promise<boolean> {
    try {
      let updateField = '';
      
      switch (serviceType) {
        case 'ai_request':
          updateField = 'ai_requests_used';
          break;
        case 'whatsapp_message':
          updateField = 'whatsapp_messages_used';
          break;
        case 'email_marketing':
          updateField = 'email_marketing_used';
          break;
        default:
          return true; // Skip for unknown types
      }
      
      const { error } = await supabase.rpc('increment_usage_quota', {
        org_id: organizationId,
        field_name: updateField,
        increment_value: quantity
      });
      
      if (error) {
        diagnosticLogger.error('Error updating quota usage:', error);
        return false;
      }
      
      return true;
      
    } catch (error) {
      diagnosticLogger.error('Error in updateQuotaUsage:', error);
      return false;
    }
  }
  
  /**
   * Check usage and send alerts if thresholds reached
   */
  static async checkAndSendAlerts(
    organizationId: string,
    serviceType: string,
    currentUsage: number,
    limit: number
  ): Promise<void> {
    if (limit <= 0) return; // Unlimited
    
    const percentage = (currentUsage / limit) * 100;
    
    try {
      const quota = await this.getCurrentQuota(organizationId);
      if (!quota) return;
      
      // Check 80% threshold
      if (percentage >= USAGE_ALERT_THRESHOLDS.WARNING_THRESHOLD && !this.getAlertSentFlag(quota, serviceType, '80')) {
        await this.sendUsageAlert(organizationId, serviceType, 'warning', percentage);
        await this.setAlertSentFlag(organizationId, serviceType, '80', true);
      }
      
      // Check 90% threshold
      if (percentage >= USAGE_ALERT_THRESHOLDS.CRITICAL_THRESHOLD && !this.getAlertSentFlag(quota, serviceType, '90')) {
        await this.sendUsageAlert(organizationId, serviceType, 'critical', percentage);
        await this.setAlertSentFlag(organizationId, serviceType, '90', true);
      }
      
    } catch (error) {
      diagnosticLogger.error('Error checking alerts:', error);
    }
  }
  
  /**
   * Send usage alert (integrate with notification system)
   */
  static async sendUsageAlert(
    organizationId: string,
    serviceType: string,
    alertType: 'warning' | 'critical',
    percentage: number
  ): Promise<void> {
    // TODO: Integrate with notification system
    diagnosticLogger.info(`Usage Alert: ${organizationId} - ${serviceType} at ${percentage.toFixed(1)}% (${alertType})`);
    
    // For now, we'll just log. Later integrate with:
    // - Email notifications
    // - In-app notifications  
    // - Webhook notifications
  }
  
  /**
   * Calculate period costs
   */
  static async calculatePeriodCosts(organizationId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('usage_tracking')
        .select('billable_cents')
        .eq('organization_id', organizationId)
        .gte('usage_date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
      
      if (error) {
        diagnosticLogger.error('Error calculating period costs:', error);
        return 0;
      }
      
      return data?.reduce((sum, item) => sum + (item.billable_cents || 0), 0) || 0;
      
    } catch (error) {
      diagnosticLogger.error('Error in calculatePeriodCosts:', error);
      return 0;
    }
  }
  
  /**
   * Calculate overage costs
   */
  static async calculateOverageCosts(organizationId: string): Promise<number> {
    try {
      const stats = await this.getUsageStatistics(organizationId);
      if (!stats) return 0;
      
      const limits = await this.getUsageLimits(organizationId);
      if (!limits) return 0;
      
      let totalOverageCents = 0;
      
      // AI requests overage
      if (stats.usage.ai_requests.overage > 0) {
        totalOverageCents += stats.usage.ai_requests.overage * limits.overage_pricing.ai_requests;
      }
      
      // WhatsApp messages overage
      if (stats.usage.whatsapp_messages.overage > 0) {
        totalOverageCents += stats.usage.whatsapp_messages.overage * limits.overage_pricing.whatsapp_messages;
      }
      
      // Email marketing overage
      if (stats.usage.email_marketing.overage > 0) {
        totalOverageCents += stats.usage.email_marketing.overage * limits.overage_pricing.email_marketing;
      }
      
      return totalOverageCents;
      
    } catch (error) {
      diagnosticLogger.error('Error calculating overage costs:', error);
      return 0;
    }
  }
  
  // Helper methods
  private static getCurrentUsageForService(quota: UsageQuota, serviceType: string): number {
    switch (serviceType) {
      case 'ai_request': return quota.ai_requests_used;
      case 'whatsapp_message': return quota.whatsapp_messages_used;
      case 'email_marketing': return quota.email_marketing_used;
      default: return 0;
    }
  }
  
  private static getLimitForService(limits: any, serviceType: string): number {
    switch (serviceType) {
      case 'ai_request': return limits.ai_requests;
      case 'whatsapp_message': return limits.whatsapp_messages;
      case 'email_marketing': return limits.email_marketing;
      default: return -1;
    }
  }
  
  private static getAlertSentFlag(quota: UsageQuota, serviceType: string, threshold: '80' | '90'): boolean {
    const field = `${serviceType.replace('_', '')}_alert_${threshold}_sent` as keyof UsageQuota;
    return Boolean(quota[field]);
  }
  
  private static async setAlertSentFlag(organizationId: string, serviceType: string, threshold: '80' | '90', value: boolean): Promise<void> {
    const field = `${serviceType.replace('_', '')}_alert_${threshold}_sent`;
    
    await supabase
      .from('usage_quotas')
      .update({ [field]: value })
      .eq('organization_id', organizationId)
      .lte('period_start', new Date().toISOString())
      .gte('period_end', new Date().toISOString());
  }
}

// Supabase function for incrementing usage (to be created)
export const createIncrementUsageQuotaFunction = `
CREATE OR REPLACE FUNCTION increment_usage_quota(
  org_id UUID,
  field_name TEXT,
  increment_value INTEGER
)
RETURNS VOID AS $$
BEGIN
  -- Update current period quota
  UPDATE usage_quotas 
  SET 
    updated_at = NOW(),
    ai_requests_used = CASE WHEN field_name = 'ai_requests_used' THEN ai_requests_used + increment_value ELSE ai_requests_used END,
    whatsapp_messages_used = CASE WHEN field_name = 'whatsapp_messages_used' THEN whatsapp_messages_used + increment_value ELSE whatsapp_messages_used END,
    email_marketing_used = CASE WHEN field_name = 'email_marketing_used' THEN email_marketing_used + increment_value ELSE email_marketing_used END
  WHERE organization_id = org_id
    AND period_start <= NOW() 
    AND period_end > NOW();
    
  -- If no current period found, create one
  IF NOT FOUND THEN
    INSERT INTO usage_quotas (
      organization_id,
      period_start,
      period_end,
      ai_requests_used,
      whatsapp_messages_used,
      email_marketing_used
    )
    SELECT 
      org_id,
      date_trunc('month', NOW()),
      date_trunc('month', NOW()) + INTERVAL '1 month',
      CASE WHEN field_name = 'ai_requests_used' THEN increment_value ELSE 0 END,
      CASE WHEN field_name = 'whatsapp_messages_used' THEN increment_value ELSE 0 END,
      CASE WHEN field_name = 'email_marketing_used' THEN increment_value ELSE 0 END;
  END IF;
END;
$$ LANGUAGE plpgsql;
`;