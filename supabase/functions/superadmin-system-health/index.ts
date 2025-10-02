/**
 * Super Admin System Health Dashboard
 * Real-time monitoring of system health, API status, and performance
 * Phase 1: Foundation + Quick Win Enterprise (QW-3)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.4';
import { corsHeaders } from '../_shared/cors.ts';
import {
  validateSuperAdmin,
  logSuperAdminAction,
  extractClientInfo,
  createSuperAdminErrorResponse,
  createSuperAdminSuccessResponse,
} from '../_shared/superadmin.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  console.log('[superadmin-system-health] START');

  try {
    const validation = await validateSuperAdmin(req);
    if (!validation.isValid) {
      return createSuperAdminErrorResponse(validation.error || 'Unauthorized', 403);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    const clientInfo = extractClientInfo(req);

    // Get current timestamp
    const now = Date.now();
    const last24h = new Date(now - 86400000).toISOString();
    const last1h = new Date(now - 3600000).toISOString();
    const last5m = new Date(now - 300000).toISOString();

    // Fetch health metrics in parallel
    const [
      apiUsageResult,
      errorRateResult,
      slowQueriesResult,
      rateLimitedResult,
      recentErrorsResult,
      systemAlertsResult
    ] = await Promise.all([
      // Total API requests
      supabase
        .from('api_usage_statistics')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', last24h),
      
      // Error rate
      supabase
        .from('api_usage_statistics')
        .select('status_code')
        .gte('created_at', last1h),
      
      // Slow queries (response time > 3s)
      supabase
        .from('api_usage_statistics')
        .select('endpoint, response_time_ms, created_at')
        .gte('created_at', last24h)
        .gt('response_time_ms', 3000)
        .order('response_time_ms', { ascending: false })
        .limit(10),
      
      // Rate limited requests
      supabase
        .from('api_usage_statistics')
        .select('*', { count: 'exact', head: true })
        .eq('was_rate_limited', true)
        .gte('created_at', last24h),
      
      // Recent errors
      supabase
        .from('api_usage_statistics')
        .select('endpoint, status_code, error_message, created_at')
        .gte('status_code', 400)
        .gte('created_at', last5m)
        .order('created_at', { ascending: false })
        .limit(20),
      
      // System alerts
      supabase
        .from('quota_alerts')
        .select('*')
        .eq('is_acknowledged', false)
        .order('created_at', { ascending: false })
        .limit(10)
    ]);

    // Calculate metrics
    const totalRequests24h = apiUsageResult.count || 0;
    const requests1h = errorRateResult.data?.length || 0;
    const errors1h = errorRateResult.data?.filter(r => r.status_code >= 400).length || 0;
    const errorRate = requests1h > 0 ? (errors1h / requests1h * 100).toFixed(2) : '0.00';
    
    // Calculate average response time
    const { data: avgResponseData } = await supabase
      .from('api_usage_statistics')
      .select('response_time_ms')
      .not('response_time_ms', 'is', null)
      .gte('created_at', last1h);
    
    const avgResponseTime = avgResponseData && avgResponseData.length > 0
      ? Math.round(avgResponseData.reduce((sum, r) => sum + (r.response_time_ms || 0), 0) / avgResponseData.length)
      : 0;

    // Calculate uptime (simplified - based on recent successful requests)
    const { data: recentRequests } = await supabase
      .from('api_usage_statistics')
      .select('status_code')
      .gte('created_at', last5m)
      .limit(100);
    
    const successfulRecent = recentRequests?.filter(r => r.status_code < 400).length || 0;
    const totalRecent = recentRequests?.length || 1;
    const uptime = ((successfulRecent / totalRecent) * 100).toFixed(2);

    // Endpoint health status
    const { data: endpointStats } = await supabase
      .from('api_usage_statistics')
      .select('endpoint, status_code')
      .gte('created_at', last1h);

    const endpointHealth = new Map<string, { total: number; errors: number }>();
    endpointStats?.forEach(stat => {
      const current = endpointHealth.get(stat.endpoint) || { total: 0, errors: 0 };
      current.total++;
      if (stat.status_code >= 400) current.errors++;
      endpointHealth.set(stat.endpoint, current);
    });

    const topEndpoints = Array.from(endpointHealth.entries())
      .map(([endpoint, stats]) => ({
        endpoint,
        total: stats.total,
        errors: stats.errors,
        errorRate: ((stats.errors / stats.total) * 100).toFixed(2),
        status: stats.errors / stats.total > 0.1 ? 'warning' : 'healthy'
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    // Determine overall system status
    let systemStatus = 'healthy';
    if (parseFloat(errorRate) > 5 || parseFloat(uptime) < 95) {
      systemStatus = 'critical';
    } else if (parseFloat(errorRate) > 2 || parseFloat(uptime) < 98) {
      systemStatus = 'warning';
    }

    const healthData = {
      status: systemStatus,
      uptime: parseFloat(uptime),
      metrics: {
        totalRequests24h,
        requests1h,
        errorRate: parseFloat(errorRate),
        avgResponseTime,
        rateLimitedRequests24h: rateLimitedResult.count || 0,
        slowQueries: slowQueriesResult.data?.length || 0
      },
      endpoints: topEndpoints,
      slowQueries: slowQueriesResult.data || [],
      recentErrors: recentErrorsResult.data || [],
      activeAlerts: systemAlertsResult.data || [],
      timestamp: new Date().toISOString()
    };

    await logSuperAdminAction(
      {
        action: 'View System Health',
        operationType: 'READ',
        targetType: 'SYSTEM',
        details: { status: systemStatus },
        result: 'SUCCESS',
        ...clientInfo,
      },
      validation.userId!,
      validation.email!
    );

    console.log('[superadmin-system-health] Health data generated:', { systemStatus, errorRate, uptime });
    return createSuperAdminSuccessResponse({ health: healthData });
  } catch (error: any) {
    console.error('[superadmin-system-health] ERROR:', error);
    return createSuperAdminErrorResponse('Internal server error: ' + error.message, 500);
  }
});
