/**
 * Super Admin Quota Management
 * Manage quota policies, overrides, and view usage statistics
 * Phase 1: Foundation + Quick Win Enterprise
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

  console.log('[superadmin-quota-management] START');

  try {
    const validation = await validateSuperAdmin(req);
    if (!validation.isValid) {
      return createSuperAdminErrorResponse(validation.error || 'Unauthorized', 403);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, organizationId, period = 'day' } = await req.json().catch(() => ({}));
    const clientInfo = extractClientInfo(req);

    if (action === 'get_global_stats') {
      const { count: totalRequests } = await supabase
        .from('api_usage_statistics')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 86400000).toISOString());

      const { count: activeAlerts } = await supabase
        .from('quota_alerts')
        .select('*', { count: 'exact', head: true })
        .eq('is_acknowledged', false);

      return createSuperAdminSuccessResponse({
        totalRequests24h: totalRequests || 0,
        activeAlerts: activeAlerts || 0
      });
    }

    return createSuperAdminErrorResponse('Invalid action', 400);
  } catch (error: any) {
    console.error('[superadmin-quota-management] ERROR:', error);
    return createSuperAdminErrorResponse('Internal server error: ' + error.message, 500);
  }
});
