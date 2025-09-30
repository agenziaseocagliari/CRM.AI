/**
 * Super Admin Create Organization
 * Creates a new organization with initial setup
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

  console.log('[superadmin-create-org] START - Function invoked');

  try {
    // Step 1: Validate super admin access
    const validation = await validateSuperAdmin(req);
    if (!validation.isValid) {
      console.error('[superadmin-create-org] Validation failed:', validation.error);
      return createSuperAdminErrorResponse(
        validation.error || 'Unauthorized', 
        403,
        { function: 'superadmin-create-org' }
      );
    }

    console.log('[superadmin-create-org] Super admin validated:', {
      userId: validation.userId,
      email: validation.email
    });

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body
    const { name, adminEmail, plan = 'free', initialCredits = 100 } = await req.json();

    console.log('[superadmin-create-org] Request parameters:', {
      name,
      adminEmail,
      plan,
      initialCredits
    });

    if (!name || !adminEmail) {
      console.error('[superadmin-create-org] Missing required parameters');
      return createSuperAdminErrorResponse('name and adminEmail are required', 400);
    }

    // Get client info for audit logging
    const clientInfo = extractClientInfo(req);

    // Check if organization with this name already exists
    console.log('[superadmin-create-org] Checking for existing organization...');
    const { data: existingOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('name', name)
      .single();

    if (existingOrg) {
      console.warn('[superadmin-create-org] Organization already exists:', name);
      return createSuperAdminErrorResponse(
        'Organization with this name already exists', 
        400,
        { function: 'superadmin-create-org', organizationName: name }
      );
    }

    // Create organization
    console.log('[superadmin-create-org] Creating organization...');
    const { data: newOrg, error: orgError } = await supabase
      .from('organizations')
      .insert({ name })
      .select()
      .single();

    if (orgError || !newOrg) {
      console.error('[superadmin-create-org] Error creating organization:', {
        error: orgError?.message,
        code: orgError?.code,
        details: orgError?.details,
        hint: orgError?.hint
      });
      
      await logSuperAdminAction(
        {
          action: 'Create Organization',
          operationType: 'CREATE',
          targetType: 'ORGANIZATION',
          details: { name, adminEmail, plan, error: orgError?.message },
          result: 'FAILURE',
          errorMessage: orgError?.message,
          ...clientInfo,
        },
        validation.userId!,
        validation.email!
      );
      return createSuperAdminErrorResponse(
        'Failed to create organization: ' + orgError?.message, 
        500,
        { function: 'superadmin-create-org', dbError: orgError?.code }
      );
    }

    console.log('[superadmin-create-org] Organization created:', {
      id: newOrg.id,
      name: newOrg.name
    });

    // Create organization credits
    console.log('[superadmin-create-org] Creating organization credits...');
    const { data: credits, error: creditsError } = await supabase
      .from('organization_credits')
      .insert({
        organization_id: newOrg.id,
        plan_name: plan,
        total_credits: initialCredits,
        credits_remaining: initialCredits,
        cycle_start_date: new Date().toISOString(),
        cycle_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single();

    if (creditsError) {
      console.error('[superadmin-create-org] Error creating credits:', {
        error: creditsError.message,
        code: creditsError.code,
        details: creditsError.details,
        hint: creditsError.hint
      });
      
      // Rollback organization creation
      console.log('[superadmin-create-org] Rolling back organization creation...');
      await supabase.from('organizations').delete().eq('id', newOrg.id);
      
      await logSuperAdminAction(
        {
          action: 'Create Organization',
          operationType: 'CREATE',
          targetType: 'ORGANIZATION',
          details: { name, adminEmail, plan, error: creditsError.message },
          result: 'FAILURE',
          errorMessage: creditsError.message,
          ...clientInfo,
        },
        validation.userId!,
        validation.email!
      );
      return createSuperAdminErrorResponse(
        'Failed to create organization credits: ' + creditsError.message, 
        500,
        { function: 'superadmin-create-org', dbError: creditsError.code }
      );
    }

    console.log('[superadmin-create-org] Credits created:', {
      organizationId: credits.organization_id,
      plan: credits.plan_name,
      credits: credits.total_credits
    });

    // Note: Admin user creation should be handled separately via Supabase Auth
    // This function only creates the organization structure

    // Log the action
    await logSuperAdminAction(
      {
        action: 'Create Organization',
        operationType: 'CREATE',
        targetType: 'ORGANIZATION',
        targetId: newOrg.id,
        details: {
          organization: newOrg,
          credits,
          adminEmail,
          plan,
          initialCredits,
        },
        result: 'SUCCESS',
        ...clientInfo,
      },
      validation.userId!,
      validation.email!
    );

    console.log('[superadmin-create-org] SUCCESS - Organization created');
    return createSuperAdminSuccessResponse({
      organization: newOrg,
      credits,
      message: 'Organization created successfully. Admin user should be invited separately.',
    });
  } catch (error: any) {
    console.error('[superadmin-create-org] EXCEPTION:', {
      error: error.message,
      stack: error.stack,
      name: error.name
    });
    return createSuperAdminErrorResponse(
      'Internal server error: ' + error.message, 
      500,
      { function: 'superadmin-create-org', error: error.message }
    );
  }
});
