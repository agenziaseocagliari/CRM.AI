/**
 * Super Admin Logs
 * Retrieves audit logs with filtering and pagination
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

  console.log('[superadmin-logs] START - Function invoked');

  try {
    // Step 1: Validate super admin access
    const validation = await validateSuperAdmin(req);
    if (!validation.isValid) {
      console.error('[superadmin-logs] Validation failed:', validation.error);
      return createSuperAdminErrorResponse(
        validation.error || 'Unauthorized', 
        403,
        { function: 'superadmin-logs' }
      );
    }

    console.log('[superadmin-logs] Super admin validated:', {
      userId: validation.userId,
      email: validation.email
    });

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

    console.log('[superadmin-logs] Query parameters:', {
      search,
      operationType,
      targetType,
      result,
      startDate,
      endDate,
      limit,
      offset
    });

    // Get client info for audit logging
    const clientInfo = extractClientInfo(req);

    // 🚀 LEVEL 5 FIX: Use raw SQL function instead of PostgREST embedded resources
    // This solves the foreign key relationships problem definitively
    console.log('[superadmin-logs] Using get_superadmin_logs_filtered SQL function...');
    const { data: logs, error } = await supabase.rpc('get_superadmin_logs_filtered', {
      p_search: search || null,
      p_operation_type: operationType || null,
      p_target_type: targetType || null,
      p_result: result || null,
      p_limit: limit,
      p_offset: offset
    });

    if (error) {
      console.error('[superadmin-logs] Database error:', {
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      
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
      return createSuperAdminErrorResponse(
        'Failed to fetch audit logs: ' + error.message, 
        500,
        { function: 'superadmin-logs', dbError: error.code }
      );
    }

    console.log('[superadmin-logs] SQL function executed successfully:', {
      logsCount: logs?.length || 0,
      filters: { search, operationType, targetType, result, startDate, endDate }
    });

    // Transform logs to match expected format - logs already comes with correct structure from SQL function
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

    console.log('[superadmin-logs] SUCCESS - Returning audit logs');
    return createSuperAdminSuccessResponse({ 
      logs: transformedLogs,
      total: transformedLogs.length, // SQL function handles pagination internally
      offset,
      limit,
    });
  } catch (error: any) {
    console.error('[superadmin-logs] EXCEPTION:', {
      error: error.message,
      stack: error.stack,
      name: error.name
    });
    return createSuperAdminErrorResponse(
      'Internal server error: ' + error.message, 
      500,
      { function: 'superadmin-logs', error: error.message }
    );
  }
});
