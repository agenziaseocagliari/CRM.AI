/**
 * Super Admin List Organizations
 * Lists all organizations with filtering, pagination, and credit information
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

  console.log('[superadmin-list-organizations] START - Function invoked');

  try {
    // Step 1: Validate super admin access
    const validation = await validateSuperAdmin(req);
    if (!validation.isValid) {
      console.error('[superadmin-list-organizations] Validation failed:', validation.error);
      return createSuperAdminErrorResponse(
        validation.error || 'Unauthorized',
        403,
        { function: 'superadmin-list-organizations' }
      );
    }

    console.log('[superadmin-list-organizations] Super admin validated:', {
      userId: validation.userId,
      email: validation.email
    });

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body for filters
    const { search, status, plan, limit = 50, offset = 0 } = await req.json().catch(() => ({}));

    console.log('[superadmin-list-organizations] Query parameters:', {
      search,
      status,
      plan,
      limit,
      offset
    });

    // Get client info for audit logging
    const clientInfo = extractClientInfo(req);

    // Build query to get organizations with credits and member count
    let query = supabase
      .from('organizations')
      .select(`
        id,
        name,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    console.log('[superadmin-list-organizations] Executing query...');
    const { data: organizations, error } = await query;

    if (error) {
      console.error('[superadmin-list-organizations] Database error:', {
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });

      await logSuperAdminAction(
        {
          action: 'List Organizations',
          operationType: 'READ',
          targetType: 'ORGANIZATION',
          details: { search, status, plan },
          result: 'FAILURE',
          errorMessage: error.message,
          ...clientInfo,
        },
        validation.userId!,
        validation.email!
      );
      return createSuperAdminErrorResponse(
        'Failed to fetch organizations: ' + error.message,
        500,
        { function: 'superadmin-list-organizations', dbError: error.code }
      );
    }

    console.log('[superadmin-list-organizations] Query successful:', {
      organizationsCount: organizations?.length || 0
    });

    // Fetch additional data separately to avoid schema cache issues
    const orgIds = organizations?.map(o => o.id) || [];

    // Fetch credits for all organizations
    const { data: creditsData } = await supabase
      .from('organization_credits')
      .select('*')
      .in('organization_id', orgIds);

    // Fetch profiles for all organizations  
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('*')
      .in('organization_id', orgIds);

    // Create lookup maps
    const creditsMap = new Map(creditsData?.map(c => [c.organization_id, c]) || []);
    const profilesMap = new Map<string, any[]>();
    profilesData?.forEach(p => {
      if (!profilesMap.has(p.organization_id)) {
        profilesMap.set(p.organization_id, []);
      }
      profilesMap.get(p.organization_id)!.push(p);
    });

    // Transform data to match expected format
    const customers = (organizations || []).map((org: any) => {
      const credits = creditsMap.get(org.id) || {};
      const profiles = profilesMap.get(org.id) || [];
      const adminProfile = profiles.find((p: any) => p.role === 'admin') || profiles[0];

      // Determine status based on credits
      let orgStatus: 'active' | 'trial' | 'suspended' = 'active';
      if (credits.credits_remaining === 0) {
        orgStatus = 'suspended';
      } else if (credits.plan_name === 'free') {
        orgStatus = 'trial';
      }

      // Determine payment status (simplified)
      let paymentStatus: 'Paid' | 'Pending' | 'Failed' = 'Paid';
      if (credits.plan_name === 'free') {
        paymentStatus = 'Pending';
      }

      return {
        id: org.id,
        name: org.name,
        adminEmail: adminProfile?.email || 'N/A',
        status: orgStatus,
        paymentStatus,
        plan: credits.plan_name === 'enterprise' ? 'Enterprise' :
          credits.plan_name === 'pro' ? 'Pro' : 'Free',
        memberCount: profiles.length || 0,
        createdAt: org.created_at,
        creditsRemaining: credits.credits_remaining || 0,
        totalCredits: credits.total_credits || 0,
      };
    });

    // Apply status filter if provided
    let filteredCustomers = customers;
    if (status) {
      filteredCustomers = customers.filter((c: any) => c.status === status);
    }
    if (plan) {
      filteredCustomers = filteredCustomers.filter((c: any) =>
        c.plan.toLowerCase() === plan.toLowerCase()
      );
    }

    console.log('[superadmin-list-organizations] Transformed and filtered:', {
      totalOrgs: customers.length,
      filteredOrgs: filteredCustomers.length,
      filters: { search, status, plan }
    });

    // Log the action
    await logSuperAdminAction(
      {
        action: 'List Organizations',
        operationType: 'READ',
        targetType: 'ORGANIZATION',
        details: { count: filteredCustomers.length, filters: { search, status, plan } },
        result: 'SUCCESS',
        ...clientInfo,
      },
      validation.userId!,
      validation.email!
    );

    console.log('[superadmin-list-organizations] SUCCESS - Returning organizations');
    return createSuperAdminSuccessResponse({ customers: filteredCustomers });
  } catch (error: any) {
    console.error('[superadmin-list-organizations] EXCEPTION:', {
      error: error.message,
      stack: error.stack,
      name: error.name
    });
    return createSuperAdminErrorResponse(
      'Internal server error: ' + error.message,
      500,
      { function: 'superadmin-list-organizations', error: error.message }
    );
  }
});
