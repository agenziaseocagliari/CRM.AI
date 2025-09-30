/**
 * Super Admin Dashboard Stats
 * Provides comprehensive statistics for the super admin dashboard
 * 
 * AGGIORNATO: Usa nuovo helper getUserIdFromJWT + logging avanzato
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.4';
import { corsHeaders } from '../_shared/cors.ts';
import { getUserIdFromJWT } from '../_shared/supabase.ts';
import {
  validateSuperAdmin,
  logSuperAdminAction,
  extractClientInfo,
  createSuperAdminErrorResponse,
  createSuperAdminSuccessResponse,
} from '../_shared/superadmin.ts';

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  console.log('[superadmin-dashboard-stats] START - Function invoked');
  console.log('[superadmin-dashboard-stats] Request method:', req.method);
  console.log('[superadmin-dashboard-stats] Request headers:', {
    hasAuthorization: !!req.headers.get('Authorization'),
    hasApiKey: !!req.headers.get('apikey'),
    contentType: req.headers.get('Content-Type')
  });

  try {
    // Step 1: Validate super admin access with new centralized helper
    const validation = await validateSuperAdmin(req);
    if (!validation.isValid) {
      console.error('[superadmin-dashboard-stats] Validation failed:', validation.error);
      return createSuperAdminErrorResponse(
        validation.error || 'Unauthorized', 
        403,
        { function: 'superadmin-dashboard-stats', userId: validation.userId }
      );
    }

    console.log('[superadmin-dashboard-stats] Super admin validated:', {
      userId: validation.userId,
      email: validation.email
    });

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get client info for audit logging
    const clientInfo = extractClientInfo(req);

    console.log('[superadmin-dashboard-stats] Fetching statistics...');

    // Fetch all required statistics in parallel
    const [
      usersResult,
      organizationsResult,
      creditsResult,
      eventsResult,
      recentSignupsResult,
    ] = await Promise.all([
      // Total users count
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      
      // Total organizations count
      supabase.from('organizations').select('id', { count: 'exact', head: true }),
      
      // Total credits and revenue calculation
      supabase.from('organization_credits').select('total_credits, plan_name'),
      
      // Total CRM events
      supabase.from('crm_events').select('id', { count: 'exact', head: true }),
      
      // Recent signups (last 7 days)
      supabase
        .from('profiles')
        .select('id')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    ]);

    console.log('[superadmin-dashboard-stats] Query results:', {
      usersCount: usersResult.count,
      organizationsCount: organizationsResult.count,
      creditsCount: creditsResult.data?.length || 0,
      eventsCount: eventsResult.count,
      recentSignupsCount: recentSignupsResult.data?.length || 0
    });

    // Calculate statistics
    const totalUsers = usersResult.count || 0;
    const totalOrganizations = organizationsResult.count || 0;
    const totalEvents = eventsResult.count || 0;
    const newSignupsThisWeek = recentSignupsResult.data?.length || 0;

    // Calculate revenue from credits (simplified calculation)
    let totalRevenue = 0;
    let activeUsers = 0;
    if (creditsResult.data) {
      for (const org of creditsResult.data) {
        if (org.plan_name === 'pro') {
          totalRevenue += 49; // Assuming $49/month for Pro
        } else if (org.plan_name === 'enterprise') {
          totalRevenue += 199; // Assuming $199/month for Enterprise
        }
        if (org.total_credits > 0) {
          activeUsers++;
        }
      }
    }

    // Calculate churn risk (users with 0 remaining credits)
    const { data: churnRiskData } = await supabase
      .from('organization_credits')
      .select('organization_id')
      .eq('credits_remaining', 0);
    
    const churnRiskCount = churnRiskData?.length || 0;

    const stats = {
      totalSignups: totalUsers,
      totalRevenue,
      activeUsers,
      newSignupsThisWeek,
      churnRiskCount,
      totalOrganizations,
      totalEvents,
    };

    console.log('[superadmin-dashboard-stats] Statistics calculated:', stats);

    // Log the action
    await logSuperAdminAction(
      {
        action: 'View Dashboard Stats',
        operationType: 'READ',
        targetType: 'SYSTEM',
        details: { stats },
        result: 'SUCCESS',
        ...clientInfo,
      },
      validation.userId!,
      validation.email!
    );

    console.log('[superadmin-dashboard-stats] SUCCESS - Returning stats');
    return createSuperAdminSuccessResponse({ stats });
  } catch (error: any) {
    console.error('[superadmin-dashboard-stats] EXCEPTION:', {
      error: error.message,
      stack: error.stack,
      name: error.name
    });
    return createSuperAdminErrorResponse(
      'Internal server error: ' + error.message, 
      500,
      { function: 'superadmin-dashboard-stats', error: error.message }
    );
  }
});
