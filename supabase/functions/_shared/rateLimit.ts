/**
 * Rate Limiting Middleware for Edge Functions
 * Phase 1: Foundation + Quick Win Enterprise
 * 
 * Provides rate limiting and quota management for all API endpoints
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.4';

export interface RateLimitConfig {
  maxRequestsPerHour?: number;
  maxRequestsPerDay?: number;
  maxRequestsPerMonth?: number;
  endpoint: string;
  bypassForSuperAdmin?: boolean;
}

export interface RateLimitResult {
  allowed: boolean;
  currentUsage?: number;
  limit?: number;
  resetAt?: Date;
  message?: string;
  quotaExceeded?: boolean;
}

/**
 * Check rate limit for a request
 * @param organizationId Organization making the request
 * @param userId User making the request
 * @param config Rate limit configuration
 * @param userRole User role for bypass checks
 * @returns Rate limit result
 */
export async function checkRateLimit(
  organizationId: string,
  userId: string,
  config: RateLimitConfig,
  userRole?: string
): Promise<RateLimitResult> {
  console.log('[checkRateLimit] START', {
    organizationId,
    userId,
    endpoint: config.endpoint,
    userRole
  });

  // Bypass for super admins if configured
  if (config.bypassForSuperAdmin && userRole === 'super_admin') {
    console.log('[checkRateLimit] Bypassing rate limit for super_admin');
    return { allowed: true };
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Check hourly limit
    if (config.maxRequestsPerHour) {
      const hourlyUsage = await getUsageCount(supabase, organizationId, userId, config.endpoint, 60);
      console.log('[checkRateLimit] Hourly usage:', hourlyUsage, '/', config.maxRequestsPerHour);
      
      if (hourlyUsage >= config.maxRequestsPerHour) {
        await createQuotaAlert(supabase, organizationId, userId, 'exceeded', 'hourly', hourlyUsage, config.maxRequestsPerHour);
        return {
          allowed: false,
          currentUsage: hourlyUsage,
          limit: config.maxRequestsPerHour,
          resetAt: getNextWindowReset(60),
          message: `Hourly rate limit exceeded. Limit: ${config.maxRequestsPerHour} requests/hour`,
          quotaExceeded: true
        };
      }

      // Warning at 80%
      if (hourlyUsage >= config.maxRequestsPerHour * 0.8) {
        await createQuotaAlert(supabase, organizationId, userId, 'warning', 'hourly', hourlyUsage, config.maxRequestsPerHour);
      }
    }

    // Check daily limit
    if (config.maxRequestsPerDay) {
      const dailyUsage = await getUsageCount(supabase, organizationId, userId, config.endpoint, 1440);
      console.log('[checkRateLimit] Daily usage:', dailyUsage, '/', config.maxRequestsPerDay);
      
      if (dailyUsage >= config.maxRequestsPerDay) {
        await createQuotaAlert(supabase, organizationId, userId, 'exceeded', 'daily', dailyUsage, config.maxRequestsPerDay);
        return {
          allowed: false,
          currentUsage: dailyUsage,
          limit: config.maxRequestsPerDay,
          resetAt: getNextWindowReset(1440),
          message: `Daily rate limit exceeded. Limit: ${config.maxRequestsPerDay} requests/day`,
          quotaExceeded: true
        };
      }

      // Warning at 80%
      if (dailyUsage >= config.maxRequestsPerDay * 0.8) {
        await createQuotaAlert(supabase, organizationId, userId, 'warning', 'daily', dailyUsage, config.maxRequestsPerDay);
      }
    }

    // Check monthly limit
    if (config.maxRequestsPerMonth) {
      const monthlyUsage = await getUsageCount(supabase, organizationId, userId, config.endpoint, 43200);
      console.log('[checkRateLimit] Monthly usage:', monthlyUsage, '/', config.maxRequestsPerMonth);
      
      if (monthlyUsage >= config.maxRequestsPerMonth) {
        await createQuotaAlert(supabase, organizationId, userId, 'exceeded', 'monthly', monthlyUsage, config.maxRequestsPerMonth);
        return {
          allowed: false,
          currentUsage: monthlyUsage,
          limit: config.maxRequestsPerMonth,
          resetAt: getNextWindowReset(43200),
          message: `Monthly rate limit exceeded. Limit: ${config.maxRequestsPerMonth} requests/month`,
          quotaExceeded: true
        };
      }

      // Warning at 90%
      if (monthlyUsage >= config.maxRequestsPerMonth * 0.9) {
        await createQuotaAlert(supabase, organizationId, userId, 'critical', 'monthly', monthlyUsage, config.maxRequestsPerMonth);
      }
    }

    console.log('[checkRateLimit] Rate limit check passed');
    return { allowed: true };
  } catch (error: any) {
    console.error('[checkRateLimit] Error checking rate limit:', error);
    // Fail open - allow request if rate limit check fails
    return { 
      allowed: true, 
      message: 'Rate limit check failed, allowing request'
    };
  }
}

/**
 * Record API request for rate limiting and analytics
 */
export async function recordApiRequest(
  organizationId: string,
  userId: string,
  endpoint: string,
  method: string = 'POST',
  statusCode: number = 200,
  responseTimeMs?: number,
  wasRateLimited: boolean = false,
  errorMessage?: string
): Promise<void> {
  console.log('[recordApiRequest]', {
    organizationId,
    userId,
    endpoint,
    statusCode,
    wasRateLimited
  });

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Record in usage statistics
    await supabase.from('api_usage_statistics').insert({
      organization_id: organizationId,
      user_id: userId,
      endpoint: endpoint,
      method: method,
      status_code: statusCode,
      response_time_ms: responseTimeMs,
      was_rate_limited: wasRateLimited,
      was_quota_exceeded: wasRateLimited,
      error_message: errorMessage
    });

    // Update rate limit counter
    if (!wasRateLimited) {
      const windowStart = new Date();
      windowStart.setMinutes(0, 0, 0); // Start of current hour

      await supabase.from('api_rate_limits').upsert({
        organization_id: organizationId,
        user_id: userId,
        endpoint: endpoint,
        request_count: 1,
        window_start: windowStart.toISOString(),
        window_duration_minutes: 60,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'organization_id,user_id,endpoint,window_start',
        ignoreDuplicates: false
      });
    }

    console.log('[recordApiRequest] Request recorded successfully');
  } catch (error: any) {
    console.error('[recordApiRequest] Error recording request:', error);
    // Don't throw - logging failures shouldn't break the request
  }
}

/**
 * Get usage count for a specific window
 */
async function getUsageCount(
  supabase: any,
  organizationId: string,
  userId: string,
  endpoint: string,
  windowMinutes: number
): Promise<number> {
  const windowStart = new Date();
  windowStart.setMinutes(windowStart.getMinutes() - windowMinutes);

  const { data, error } = await supabase
    .from('api_usage_statistics')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .eq('endpoint', endpoint)
    .gte('created_at', windowStart.toISOString());

  if (error) {
    console.error('[getUsageCount] Error:', error);
    return 0;
  }

  return data || 0;
}

/**
 * Create quota alert
 */
async function createQuotaAlert(
  supabase: any,
  organizationId: string,
  userId: string,
  alertType: 'warning' | 'critical' | 'exceeded',
  period: string,
  currentUsage: number,
  limit: number
): Promise<void> {
  const percentage = (currentUsage / limit) * 100;
  
  // Check if alert already exists for this period (avoid spam)
  const { data: existingAlert } = await supabase
    .from('quota_alerts')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('alert_type', alertType)
    .eq('policy_name', period)
    .gte('created_at', new Date(Date.now() - 3600000).toISOString()) // Last hour
    .single();

  if (existingAlert) {
    console.log('[createQuotaAlert] Alert already exists, skipping');
    return;
  }

  const message = alertType === 'exceeded'
    ? `Quota exceeded for ${period} period. Usage: ${currentUsage}/${limit} (${percentage.toFixed(1)}%)`
    : `Quota ${alertType} for ${period} period. Usage: ${currentUsage}/${limit} (${percentage.toFixed(1)}%)`;

  await supabase.from('quota_alerts').insert({
    organization_id: organizationId,
    user_id: userId,
    alert_type: alertType,
    policy_name: period,
    current_usage: currentUsage,
    limit_value: limit,
    percentage_used: percentage,
    message: message
  });

  console.log('[createQuotaAlert] Alert created:', { alertType, period, percentage });
}

/**
 * Get next window reset time
 */
function getNextWindowReset(windowMinutes: number): Date {
  const now = new Date();
  const resetTime = new Date(now);
  
  if (windowMinutes === 60) {
    // Next hour
    resetTime.setHours(resetTime.getHours() + 1, 0, 0, 0);
  } else if (windowMinutes === 1440) {
    // Next day
    resetTime.setDate(resetTime.getDate() + 1);
    resetTime.setHours(0, 0, 0, 0);
  } else if (windowMinutes === 43200) {
    // Next month
    resetTime.setMonth(resetTime.getMonth() + 1, 1);
    resetTime.setHours(0, 0, 0, 0);
  } else {
    resetTime.setMinutes(resetTime.getMinutes() + windowMinutes);
  }
  
  return resetTime;
}

/**
 * Create rate limit error response
 */
export function createRateLimitErrorResponse(result: RateLimitResult): Response {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  };

  return new Response(
    JSON.stringify({
      error: result.message || 'Rate limit exceeded',
      currentUsage: result.currentUsage,
      limit: result.limit,
      resetAt: result.resetAt?.toISOString(),
      quotaExceeded: result.quotaExceeded
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': String(result.limit),
        'X-RateLimit-Remaining': String(Math.max(0, (result.limit || 0) - (result.currentUsage || 0))),
        'X-RateLimit-Reset': result.resetAt?.toISOString() || '',
        'Retry-After': String(Math.ceil((result.resetAt?.getTime() || Date.now()) - Date.now()) / 1000),
        ...corsHeaders
      }
    }
  );
}
