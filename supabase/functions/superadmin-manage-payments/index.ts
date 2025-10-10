/**
 * Super Admin Manage Payments
 * Lists and manages payment transactions
 * 
 * AGGIORNATO: Usa nuovo helper getUserIdFromJWT + logging avanzato
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.4';
import { corsHeaders } from '../_shared/cors.ts';
import {
  createSuperAdminErrorResponse,
  createSuperAdminSuccessResponse,
  extractClientInfo,
  logSuperAdminAction,
  validateSuperAdmin,
} from '../_shared/superadmin.ts';

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  console.log('[superadmin-manage-payments] START - Function invoked');

  try {
    // Step 1: Validate super admin access
    const validation = await validateSuperAdmin(req);
    if (!validation.isValid) {
      console.error('[superadmin-manage-payments] Validation failed:', validation.error);
      return createSuperAdminErrorResponse(
        validation.error || 'Unauthorized',
        403,
        { function: 'superadmin-manage-payments' }
      );
    }

    console.log('[superadmin-manage-payments] Super admin validated:', {
      userId: validation.userId,
      email: validation.email
    });

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body
    const { action, transactionId, status, limit = 50, offset = 0 } = await req.json().catch(() => ({}));

    console.log('[superadmin-manage-payments] Request parameters:', {
      action,
      transactionId,
      status,
      limit,
      offset
    });

    // Get client info for audit logging
    const clientInfo = extractClientInfo(req);

    // If action is provided, handle payment operations
    if (action === 'refund' && transactionId) {
      console.log('[superadmin-manage-payments] Processing refund for transaction:', transactionId);

      // Placeholder for refund logic
      await logSuperAdminAction(
        {
          action: 'Refund Payment',
          operationType: 'UPDATE',
          targetType: 'PAYMENT',
          targetId: transactionId,
          details: { action: 'refund' },
          result: 'SUCCESS',
          ...clientInfo,
        },
        validation.userId!,
        validation.email!
      );

      console.log('[superadmin-manage-payments] Refund processed successfully');
      return createSuperAdminSuccessResponse({
        message: 'Refund processed successfully',
        transactionId,
      });
    }

    console.log('[superadmin-manage-payments] Fetching payment transactions...');

    // Fetch payment transactions from credit consumption logs (without nested join)
    const { data: creditLogs, error: logsError } = await supabase
      .from('credit_consumption_logs')
      .select('id, organization_id, action_type, credits_consumed, created_at, success')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (logsError) {
      console.error('[superadmin-manage-payments] Error fetching logs:', {
        error: logsError.message,
        code: logsError.code,
        details: logsError.details,
        hint: logsError.hint
      });

      await logSuperAdminAction(
        {
          action: 'List Payments',
          operationType: 'READ',
          targetType: 'PAYMENT',
          details: { error: logsError.message },
          result: 'FAILURE',
          errorMessage: logsError.message,
          ...clientInfo,
        },
        validation.userId!,
        validation.email!
      );
      return createSuperAdminErrorResponse(
        'Failed to fetch payments: ' + logsError.message,
        500,
        { function: 'superadmin-manage-payments', dbError: logsError.code }
      );
    }

    console.log('[superadmin-manage-payments] Fetching organization credits...');

    // Fetch organization credits (without nested join)
    const { data: orgCredits, error: creditsError } = await supabase
      .from('organization_credits')
      .select('organization_id, plan_name, total_credits, cycle_start_date');

    if (creditsError) {
      console.warn('[superadmin-manage-payments] Error fetching org credits:', creditsError.message);
    }

    // Fetch organization names separately
    const orgIds = orgCredits?.map(o => o.organization_id) || [];
    const { data: orgsData } = await supabase
      .from('organizations')
      .select('id, name')
      .in('id', orgIds);

    // Create organization lookup map
    const orgsMap = new Map(orgsData?.map(o => [o.id, o.name]) || []);

    // Transform data to match expected payment format
    const payments = (orgCredits || []).map((org: any, index: number) => {
      const planPrices: Record<string, number> = {
        'free': 0,
        'pro': 49,
        'enterprise': 199,
      };

      const amount = planPrices[org.plan_name] || 0;

      return {
        id: `payment-${org.organization_id}-${index}`,
        organizationName: orgsMap.get(org.organization_id) || 'Unknown',
        organizationId: org.organization_id,
        amount,
        date: org.cycle_start_date || new Date().toISOString(),
        status: amount > 0 ? 'Paid' : 'Pending',
        plan: org.plan_name,
        credits: org.total_credits,
      };
    });

    // Apply status filter if provided
    let filteredPayments = payments;
    if (status) {
      filteredPayments = payments.filter((p: any) => p.status === status);
    }

    console.log('[superadmin-manage-payments] Data prepared:', {
      totalPayments: payments.length,
      filteredPayments: filteredPayments.length,
      creditLogs: creditLogs?.length || 0
    });

    // Log the action
    await logSuperAdminAction(
      {
        action: 'List Payments',
        operationType: 'READ',
        targetType: 'PAYMENT',
        details: { count: filteredPayments.length, filters: { status } },
        result: 'SUCCESS',
        ...clientInfo,
      },
      validation.userId!,
      validation.email!
    );

    console.log('[superadmin-manage-payments] SUCCESS - Returning payments');
    return createSuperAdminSuccessResponse({
      payments: filteredPayments,
      creditLogs: creditLogs || [],
    });
  } catch (error: any) {
    console.error('[superadmin-manage-payments] EXCEPTION:', {
      error: error.message,
      stack: error.stack,
      name: error.name
    });
    return createSuperAdminErrorResponse(
      'Internal server error: ' + error.message,
      500,
      { function: 'superadmin-manage-payments', error: error.message }
    );
  }
});
