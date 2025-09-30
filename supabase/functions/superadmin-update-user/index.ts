/**
 * Super Admin Update User
 * Updates user profile and settings
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
    const { userId, updates } = await req.json();

    if (!userId) {
      return createSuperAdminErrorResponse('userId is required', 400);
    }

    if (!updates || typeof updates !== 'object') {
      return createSuperAdminErrorResponse('updates object is required', 400);
    }

    // Get client info for audit logging
    const clientInfo = extractClientInfo(req);

    // Validate allowed fields for update
    const allowedFields = ['full_name', 'role', 'organization_id'];
    const updateData: Record<string, any> = {};
    
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateData[field] = updates[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return createSuperAdminErrorResponse('No valid fields to update', 400);
    }

    // Fetch current user data for logging
    const { data: currentUser } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    // Update user profile
    const { data: updatedUser, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('[Super Admin Update User] Error:', error);
      await logSuperAdminAction(
        {
          action: 'Update User',
          operationType: 'UPDATE',
          targetType: 'USER',
          targetId: userId,
          details: { updates: updateData, error: error.message },
          result: 'FAILURE',
          errorMessage: error.message,
          ...clientInfo,
        },
        validation.userId!,
        validation.email!
      );
      return createSuperAdminErrorResponse('Failed to update user', 500);
    }

    // Log the action with before/after data
    await logSuperAdminAction(
      {
        action: 'Update User',
        operationType: 'UPDATE',
        targetType: 'USER',
        targetId: userId,
        details: {
          before: currentUser,
          after: updatedUser,
          updates: updateData,
        },
        result: 'SUCCESS',
        ...clientInfo,
      },
      validation.userId!,
      validation.email!
    );

    return createSuperAdminSuccessResponse({ user: updatedUser });
  } catch (error) {
    console.error('[Super Admin Update User] Error:', error);
    return createSuperAdminErrorResponse('Internal server error', 500);
  }
});
