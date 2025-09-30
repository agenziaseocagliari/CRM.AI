/**
 * Super Admin Create Organization
 * Creates a new organization with initial setup
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
    const { name, adminEmail, plan = 'free', initialCredits = 100 } = await req.json();

    if (!name || !adminEmail) {
      return createSuperAdminErrorResponse('name and adminEmail are required', 400);
    }

    // Get client info for audit logging
    const clientInfo = extractClientInfo(req);

    // Check if organization with this name already exists
    const { data: existingOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('name', name)
      .single();

    if (existingOrg) {
      return createSuperAdminErrorResponse('Organization with this name already exists', 400);
    }

    // Create organization
    const { data: newOrg, error: orgError } = await supabase
      .from('organizations')
      .insert({ name })
      .select()
      .single();

    if (orgError || !newOrg) {
      console.error('[Super Admin Create Org] Error creating organization:', orgError);
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
      return createSuperAdminErrorResponse('Failed to create organization', 500);
    }

    // Create organization credits
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
      console.error('[Super Admin Create Org] Error creating credits:', creditsError);
      // Rollback organization creation
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
      return createSuperAdminErrorResponse('Failed to create organization credits', 500);
    }

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

    return createSuperAdminSuccessResponse({
      organization: newOrg,
      credits,
      message: 'Organization created successfully. Admin user should be invited separately.',
    });
  } catch (error) {
    console.error('[Super Admin Create Org] Error:', error);
    return createSuperAdminErrorResponse('Internal server error', 500);
  }
});
