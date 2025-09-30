/**
 * Super Admin List Users
 * Lists all users with filtering and pagination
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

  console.log('[superadmin-list-users] START - Function invoked');

  try {
    // Step 1: Validate super admin access
    const validation = await validateSuperAdmin(req);
    if (!validation.isValid) {
      console.error('[superadmin-list-users] Validation failed:', validation.error);
      return createSuperAdminErrorResponse(
        validation.error || 'Unauthorized', 
        403,
        { function: 'superadmin-list-users' }
      );
    }

    console.log('[superadmin-list-users] Super admin validated:', {
      userId: validation.userId,
      email: validation.email
    });

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body for filters
    const { search, role, organizationId, limit = 50, offset = 0 } = await req.json().catch(() => ({}));

    console.log('[superadmin-list-users] Query parameters:', {
      search,
      role,
      organizationId,
      limit,
      offset
    });

    // Get client info for audit logging
    const clientInfo = extractClientInfo(req);

    // Build query
    let query = supabase
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        role,
        organization_id,
        created_at,
        updated_at,
        organizations:organization_id (
          id,
          name
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (search) {
      query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
    }
    if (role) {
      query = query.eq('role', role);
    }
    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }

    console.log('[superadmin-list-users] Executing query...');
    const { data: users, error } = await query;

    if (error) {
      console.error('[superadmin-list-users] Database error:', {
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      
      await logSuperAdminAction(
        {
          action: 'List Users',
          operationType: 'READ',
          targetType: 'USER',
          details: { search, role, organizationId },
          result: 'FAILURE',
          errorMessage: error.message,
          ...clientInfo,
        },
        validation.userId!,
        validation.email!
      );
      return createSuperAdminErrorResponse(
        'Failed to fetch users: ' + error.message, 
        500,
        { function: 'superadmin-list-users', dbError: error.code }
      );
    }

    console.log('[superadmin-list-users] Query successful:', {
      usersCount: users?.length || 0,
      filters: { search, role, organizationId }
    });

    // Log the action
    await logSuperAdminAction(
      {
        action: 'List Users',
        operationType: 'READ',
        targetType: 'USER',
        details: { count: users?.length || 0, filters: { search, role, organizationId } },
        result: 'SUCCESS',
        ...clientInfo,
      },
      validation.userId!,
      validation.email!
    );

    console.log('[superadmin-list-users] SUCCESS - Returning users');
    return createSuperAdminSuccessResponse({ users: users || [] });
  } catch (error: any) {
    console.error('[superadmin-list-users] EXCEPTION:', {
      error: error.message,
      stack: error.stack,
      name: error.name
    });
    return createSuperAdminErrorResponse(
      'Internal server error: ' + error.message, 
      500,
      { function: 'superadmin-list-users', error: error.message }
    );
  }
});
