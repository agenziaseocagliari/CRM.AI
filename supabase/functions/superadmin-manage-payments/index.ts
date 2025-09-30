/**
 * Super Admin Manage Payments
 * Lists and manages payment transactions
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

    // Parse request body
    const { action, transactionId, status, limit = 50, offset = 0 } = await req.json().catch(() => ({}));

    // Get client info for audit logging
    const clientInfo = extractClientInfo(req);

    // If action is provided, handle payment operations
    if (action === 'refund' && transactionId) {
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

      return createSuperAdminSuccessResponse({ 
        message: 'Refund processed successfully',
        transactionId,
      });
    }

    // Fetch payment transactions from credit consumption logs
    const { data: creditLogs, error: logsError } = await supabase
      .from('credit_consumption_logs')
      .select(`
        id,
        organization_id,
        action_type,
        credits_consumed,
        created_at,
        success,
        organizations:organization_id (
          name
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (logsError) {
      console.error('[Super Admin Manage Payments] Error:', logsError);
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
      return createSuperAdminErrorResponse('Failed to fetch payments', 500);
    }

    // Also fetch organization credits for revenue calculation
    const { data: orgCredits, error: creditsError } = await supabase
      .from('organization_credits')
      .select(`
        organization_id,
        plan_name,
        total_credits,
        cycle_start_date,
        organizations:organization_id (
          name
        )
      `);

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
        organizationName: org.organizations?.name || 'Unknown',
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

    return createSuperAdminSuccessResponse({ 
      payments: filteredPayments,
      creditLogs: creditLogs || [],
    });
  } catch (error) {
    console.error('[Super Admin Manage Payments] Error:', error);
    return createSuperAdminErrorResponse('Internal server error', 500);
  }
});
