/**
 * Phase 3 - M01: API Rate Limiting & Quota Management
 * 
 * Intelligent rate limiter with sliding window algorithm for per-organization quotas.
 * 
 * Features:
 * - Sliding window rate limiting
 * - Per-organization and per-resource-type limits
 * - Real-time quota tracking
 * - Graceful degradation
 * - Comprehensive logging
 */

import { supabase } from './supabaseClient';

export interface RateLimitConfig {
  organizationId: string;
  resourceType: string;
  endpointPattern?: string;
  maxRequests: number;
  windowSeconds: number;
  quotaMonthly?: number;
  enabled: boolean;
}

export interface RateLimitCheck {
  isAllowed: boolean;
  currentUsage: number;
  limitValue: number;
  windowSeconds: number;
  resetAt: Date;
}

export interface RateLimitTracking {
  organizationId: string;
  userId?: string;
  resourceType: string;
  endpoint: string;
  responseStatus?: number;
  rateLimited: boolean;
  metadata?: Record<string, unknown>;
}

export interface QuotaUsage {
  organizationId: string;
  resourceType: string;
  year: number;
  month: number;
  requestCount: number;
  rateLimitedCount: number;
  lastUpdated: Date;
}

/**
 * Check if a request is allowed based on rate limits
 */
export async function checkRateLimit(
  organizationId: string,
  resourceType: string,
  endpoint?: string
): Promise<RateLimitCheck> {
  try {
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_organization_id: organizationId,
      p_resource_type: resourceType,
      p_endpoint: endpoint || null,
    });

    if (error) {
      console.error('Rate limit check error:', error);
      // Graceful degradation: allow request if check fails
      return {
        isAllowed: true,
        currentUsage: 0,
        limitValue: 999999,
        windowSeconds: 3600,
        resetAt: new Date(Date.now() + 3600000),
      };
    }

    if (!data || data.length === 0) {
      // No rate limit configured, allow by default
      return {
        isAllowed: true,
        currentUsage: 0,
        limitValue: 999999,
        windowSeconds: 3600,
        resetAt: new Date(Date.now() + 3600000),
      };
    }

    const result = data[0];
    return {
      isAllowed: result.is_allowed,
      currentUsage: result.current_usage,
      limitValue: result.limit_value,
      windowSeconds: result.window_seconds,
      resetAt: new Date(result.reset_at),
    };
  } catch (error) {
    console.error('Rate limit check exception:', error);
    // Graceful degradation
    return {
      isAllowed: true,
      currentUsage: 0,
      limitValue: 999999,
      windowSeconds: 3600,
      resetAt: new Date(Date.now() + 3600000),
    };
  }
}

/**
 * Track a request for rate limiting purposes
 */
export async function trackRequest(tracking: RateLimitTracking): Promise<boolean> {
  try {
    const { error } = await supabase.from('rate_limit_tracking').insert({
      organization_id: tracking.organizationId,
      user_id: tracking.userId,
      resource_type: tracking.resourceType,
      endpoint: tracking.endpoint,
      response_status: tracking.responseStatus,
      rate_limited: tracking.rateLimited,
      metadata: tracking.metadata || {},
    });

    if (error) {
      console.error('Failed to track request:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Exception tracking request:', error);
    return false;
  }
}

/**
 * Get rate limit configuration for an organization
 */
export async function getRateLimitConfig(
  organizationId: string,
  resourceType?: string
): Promise<RateLimitConfig[]> {
  try {
    let query = supabase
      .from('rate_limit_config')
      .select('*')
      .eq('organization_id', organizationId);

    if (resourceType) {
      query = query.eq('resource_type', resourceType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to get rate limit config:', error);
      return [];
    }

    return (data || []).map((row) => ({
      organizationId: row.organization_id,
      resourceType: row.resource_type,
      endpointPattern: row.endpoint_pattern,
      maxRequests: row.max_requests,
      windowSeconds: row.window_seconds,
      quotaMonthly: row.quota_monthly,
      enabled: row.enabled,
    }));
  } catch (error) {
    console.error('Exception getting rate limit config:', error);
    return [];
  }
}

/**
 * Update rate limit configuration
 */
export async function updateRateLimitConfig(
  organizationId: string,
  resourceType: string,
  config: Partial<RateLimitConfig>
): Promise<boolean> {
  try {
    const updateData: Record<string, unknown> = {};
    
    if (config.maxRequests !== undefined) updateData.max_requests = config.maxRequests;
    if (config.windowSeconds !== undefined) updateData.window_seconds = config.windowSeconds;
    if (config.quotaMonthly !== undefined) updateData.quota_monthly = config.quotaMonthly;
    if (config.enabled !== undefined) updateData.enabled = config.enabled;
    if (config.endpointPattern !== undefined) updateData.endpoint_pattern = config.endpointPattern;
    
    updateData.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from('rate_limit_config')
      .update(updateData)
      .eq('organization_id', organizationId)
      .eq('resource_type', resourceType);

    if (error) {
      console.error('Failed to update rate limit config:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Exception updating rate limit config:', error);
    return false;
  }
}

/**
 * Get quota usage for an organization
 */
export async function getQuotaUsage(
  organizationId: string,
  resourceType?: string,
  year?: number,
  month?: number
): Promise<QuotaUsage[]> {
  try {
    let query = supabase
      .from('rate_limit_quota_usage')
      .select('*')
      .eq('organization_id', organizationId);

    if (resourceType) query = query.eq('resource_type', resourceType);
    if (year) query = query.eq('year', year);
    if (month) query = query.eq('month', month);

    query = query.order('year', { ascending: false }).order('month', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Failed to get quota usage:', error);
      return [];
    }

    return (data || []).map((row) => ({
      organizationId: row.organization_id,
      resourceType: row.resource_type,
      year: row.year,
      month: row.month,
      requestCount: row.request_count,
      rateLimitedCount: row.rate_limited_count,
      lastUpdated: new Date(row.last_updated),
    }));
  } catch (error) {
    console.error('Exception getting quota usage:', error);
    return [];
  }
}

/**
 * Middleware function to check rate limits before API calls
 */
export async function withRateLimit<T>(
  organizationId: string,
  resourceType: string,
  endpoint: string,
  fn: () => Promise<T>
): Promise<T> {
  const userId = (await supabase.auth.getUser()).data.user?.id;

  // Check rate limit
  const check = await checkRateLimit(organizationId, resourceType, endpoint);

  if (!check.isAllowed) {
    // Track the rate-limited request
    await trackRequest({
      organizationId,
      userId,
      resourceType,
      endpoint,
      rateLimited: true,
      responseStatus: 429,
      metadata: {
        currentUsage: check.currentUsage,
        limitValue: check.limitValue,
        resetAt: check.resetAt.toISOString(),
      },
    });

    // Throw rate limit error
    const error = new Error(`Rate limit exceeded. Limit: ${check.limitValue} requests per ${check.windowSeconds}s. Current usage: ${check.currentUsage}. Resets at: ${check.resetAt.toISOString()}`);
    (error as Error & { code: string }).code = 'RATE_LIMIT_EXCEEDED';
    throw error;
  }

  // Execute the function
  try {
    const result = await fn();

    // Track successful request
    await trackRequest({
      organizationId,
      userId,
      resourceType,
      endpoint,
      rateLimited: false,
      responseStatus: 200,
      metadata: {
        currentUsage: check.currentUsage + 1,
        limitValue: check.limitValue,
      },
    });

    return result;
  } catch (error) {
    // Track failed request
    await trackRequest({
      organizationId,
      userId,
      resourceType,
      endpoint,
      rateLimited: false,
      responseStatus: 500,
      metadata: {
        error: error instanceof Error ? error.message : String(error),
      },
    });

    throw error;
  }
}

/**
 * Get current rate limit status for display
 */
export async function getRateLimitStatus(
  organizationId: string,
  resourceType: string
): Promise<{
  allowed: boolean;
  usage: number;
  limit: number;
  percentage: number;
  resetAt: Date;
  windowSeconds: number;
}> {
  const check = await checkRateLimit(organizationId, resourceType);

  return {
    allowed: check.isAllowed,
    usage: check.currentUsage,
    limit: check.limitValue,
    percentage: Math.round((check.currentUsage / check.limitValue) * 100),
    resetAt: check.resetAt,
    windowSeconds: check.windowSeconds,
  };
}

export default {
  checkRateLimit,
  trackRequest,
  getRateLimitConfig,
  updateRateLimitConfig,
  getQuotaUsage,
  withRateLimit,
  getRateLimitStatus,
};
