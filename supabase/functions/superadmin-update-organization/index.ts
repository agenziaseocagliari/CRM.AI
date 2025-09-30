/**
 * Super Admin Update Organization
 * Updates organization settings, credits, and status
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
    const { organizationId, updates, status, reason } = await req.json();

    if (!organizationId) {
      return createSuperAdminErrorResponse('organizationId is required', 400);
    }

    // Get client info for audit logging
    const clientInfo = extractClientInfo(req);

    let result: any = {};

    // Fetch current organization data for logging
    const { data: currentOrg } = await supabase
      .from('organizations')
      .select('*, organization_credits(*)')
      .eq('id', organizationId)
      .single();

    // Update organization basic info if provided
    if (updates && typeof updates === 'object') {
      const allowedOrgFields = ['name'];
      const orgUpdateData: Record<string, any> = {};
      
      for (const field of allowedOrgFields) {
        if (updates[field] !== undefined) {
          orgUpdateData[field] = updates[field];
        }
      }

      if (Object.keys(orgUpdateData).length > 0) {
        const { data: updatedOrg, error } = await supabase
          .from('organizations')
          .update(orgUpdateData)
          .eq('id', organizationId)
          .select()
          .single();

        if (error) {
          console.error('[Super Admin Update Organization] Error updating org:', error);
          await logSuperAdminAction(
            {
              action: 'Update Organization',
              operationType: 'UPDATE',
              targetType: 'ORGANIZATION',
              targetId: organizationId,
              details: { updates: orgUpdateData, error: error.message },
              result: 'FAILURE',
              errorMessage: error.message,
              ...clientInfo,
            },
            validation.userId!,
            validation.email!
          );
          return createSuperAdminErrorResponse('Failed to update organization', 500);
        }

        result.organization = updatedOrg;
      }
    }

    // Update credits if provided
    if (updates?.credits !== undefined || updates?.plan_name !== undefined) {
      const creditsUpdate: Record<string, any> = {};
      
      if (updates.credits !== undefined) {
        creditsUpdate.credits_remaining = updates.credits;
        creditsUpdate.total_credits = updates.credits;
      }
      if (updates.plan_name !== undefined) {
        creditsUpdate.plan_name = updates.plan_name;
      }

      const { data: updatedCredits, error: creditsError } = await supabase
        .from('organization_credits')
        .update(creditsUpdate)
        .eq('organization_id', organizationId)
        .select()
        .single();

      if (creditsError) {
        console.error('[Super Admin Update Organization] Error updating credits:', creditsError);
        await logSuperAdminAction(
          {
            action: 'Update Organization Credits',
            operationType: 'UPDATE',
            targetType: 'ORGANIZATION',
            targetId: organizationId,
            details: { updates: creditsUpdate, error: creditsError.message },
            result: 'FAILURE',
            errorMessage: creditsError.message,
            ...clientInfo,
          },
          validation.userId!,
          validation.email!
        );
        return createSuperAdminErrorResponse('Failed to update organization credits', 500);
      }

      result.credits = updatedCredits;
    }

    // Handle status updates with reason
    if (status) {
      result.statusUpdate = {
        status,
        reason: reason || 'No reason provided',
        updatedAt: new Date().toISOString(),
      };
    }

    // Log the action with before/after data
    await logSuperAdminAction(
      {
        action: 'Update Organization',
        operationType: 'UPDATE',
        targetType: 'ORGANIZATION',
        targetId: organizationId,
        details: {
          before: currentOrg,
          after: result,
          updates,
          status,
          reason,
        },
        result: 'SUCCESS',
        ...clientInfo,
      },
      validation.userId!,
      validation.email!
    );

    return createSuperAdminSuccessResponse(result);
  } catch (error) {
    console.error('[Super Admin Update Organization] Error:', error);
    return createSuperAdminErrorResponse('Internal server error', 500);
  }
});
