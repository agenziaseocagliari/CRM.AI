/**
 * Super Admin Logs
 * Retrieves audit logs with filtering and pagination
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
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Validate super admin access
    const validation = await validateSuperAdmin(req);
    if (!validation.isValid) {
      return createSuperAdminErrorResponse(validation.error || 'Unauthorized', 403);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body for filters
    const { 
      search,
      operationType, 
      targetType,
      result,
      startDate,
      endDate,
      limit = 100, 
      offset = 0 
    } = await req.json().catch(() => ({}));

    // Get client info for audit logging
    const clientInfo = extractClientInfo(req);

    // Build query
    let query = supabase
      .from('superadmin_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (search) {
      query = query.or(`admin_email.ilike.%${search}%,action.ilike.%${search}%,target_id.ilike.%${search}%`);
    }
    if (operationType) {
      query = query.eq('operation_type', operationType);
    }
    if (targetType) {
      query = query.eq('target_type', targetType);
    }
    if (result) {
      query = query.eq('result', result);
    }
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data: logs, error, count } = await query;

    if (error) {
      console.error('[Super Admin Logs] Error:', error);
      await logSuperAdminAction(
        {
          action: 'View Audit Logs',
          operationType: 'READ',
          targetType: 'SYSTEM',
          details: { filters: { search, operationType, targetType, result }, error: error.message },
          result: 'FAILURE',
          errorMessage: error.message,
          ...clientInfo,
        },
        validation.userId!,
        validation.email!
      );
      return createSuperAdminErrorResponse('Failed to fetch audit logs', 500);
    }

    // Transform logs to match expected format
    const transformedLogs = (logs || []).map((log: any) => ({
      id: log.id.toString(),
      timestamp: log.created_at,
      adminEmail: log.admin_email,
      action: log.action,
      targetId: log.target_id,
      operationType: log.operation_type,
      targetType: log.target_type,
      result: log.result,
      details: log.details,
      errorMessage: log.error_message,
      ipAddress: log.ip_address,
      userAgent: log.user_agent,
    }));

    // Log the action (minimal detail to avoid recursive logging)
    await logSuperAdminAction(
      {
        action: 'View Audit Logs',
        operationType: 'READ',
        targetType: 'SYSTEM',
        details: { 
          count: transformedLogs.length,
          filters: { search, operationType, targetType, result, startDate, endDate }
        },
        result: 'SUCCESS',
        ...clientInfo,
      },
      validation.userId!,
      validation.email!
    );

    return createSuperAdminSuccessResponse({ 
      logs: transformedLogs,
      total: count || transformedLogs.length,
      offset,
      limit,
    });
  } catch (error) {
    console.error('[Super Admin Logs] Error:', error);
    return createSuperAdminErrorResponse('Internal server error', 500);
  }
});
