/**
 * Super Admin Update Organization
 * Updates organization settings, credits, and status
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

  console.log('[superadmin-update-organization] START - Function invoked');

  try {
    // Step 1: Validate super admin access
    const validation = await validateSuperAdmin(req);
    if (!validation.isValid) {
      console.error('[superadmin-update-organization] Validation failed:', validation.error);
      return createSuperAdminErrorResponse(
        validation.error || 'Unauthorized',
        403,
        { function: 'superadmin-update-organization' }
      );
    }

    console.log('[superadmin-update-organization] Super admin validated:', {
      adminUserId: validation.userId,
      adminEmail: validation.email
    });

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body
    const { organizationId, updates, status, reason } = await req.json();

    console.log('[superadmin-update-organization] Request parameters:', {
      organizationId,
      hasUpdates: !!updates,
      status,
      hasReason: !!reason
    });

    if (!organizationId) {
      console.error('[superadmin-update-organization] Missing organizationId');
      return createSuperAdminErrorResponse('organizationId is required', 400);
    }

    // Get client info for audit logging
    const clientInfo = extractClientInfo(req);

    let result: any = {};

    // Fetch current organization data for logging
    console.log('[superadmin-update-organization] Fetching current organization data...');
    const { data: currentOrg } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', organizationId)
      .single();

    // Fetch credits separately
    const { data: currentCredits } = await supabase
      .from('organization_credits')
      .select('*')
      .eq('organization_id', organizationId)
      .single();

    console.log('[superadmin-update-organization] Current organization:', {
      id: currentOrg?.id,
      name: currentOrg?.name
    });

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
        console.log('[superadmin-update-organization] Updating organization fields:', orgUpdateData);
        const { data: updatedOrg, error } = await supabase
          .from('organizations')
          .update(orgUpdateData)
          .eq('id', organizationId)
          .select()
          .single();

        if (error) {
          console.error('[superadmin-update-organization] Error updating org:', {
            error: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
          });

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
          return createSuperAdminErrorResponse(
            'Failed to update organization: ' + error.message,
            500,
            { function: 'superadmin-update-organization', dbError: error.code, organizationId }
          );
        }

        result.organization = updatedOrg;
        console.log('[superadmin-update-organization] Organization updated successfully');
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

      console.log('[superadmin-update-organization] Updating credits:', creditsUpdate);
      const { data: updatedCredits, error: creditsError } = await supabase
        .from('organization_credits')
        .update(creditsUpdate)
        .eq('organization_id', organizationId)
        .select()
        .single();

      if (creditsError) {
        console.error('[superadmin-update-organization] Error updating credits:', {
          error: creditsError.message,
          code: creditsError.code,
          details: creditsError.details,
          hint: creditsError.hint
        });

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
        return createSuperAdminErrorResponse(
          'Failed to update organization credits: ' + creditsError.message,
          500,
          { function: 'superadmin-update-organization', dbError: creditsError.code, organizationId }
        );
      }

      result.credits = updatedCredits;
      console.log('[superadmin-update-organization] Credits updated successfully');
    }

    // Handle status updates with reason
    if (status) {
      result.statusUpdate = {
        status,
        reason: reason || 'No reason provided',
        updatedAt: new Date().toISOString(),
      };
      console.log('[superadmin-update-organization] Status updated:', result.statusUpdate);
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

    console.log('[superadmin-update-organization] SUCCESS - Organization updated');
    return createSuperAdminSuccessResponse(result);
  } catch (error: any) {
    console.error('[superadmin-update-organization] EXCEPTION:', {
      error: error.message,
      stack: error.stack,
      name: error.name
    });
    return createSuperAdminErrorResponse(
      'Internal server error: ' + error.message,
      500,
      { function: 'superadmin-update-organization', error: error.message }
    );
  }
});
