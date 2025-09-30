/**
 * Super Admin Update User
 * Updates user profile and settings
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

  console.log('[superadmin-update-user] START - Function invoked');

  try {
    // Step 1: Validate super admin access
    const validation = await validateSuperAdmin(req);
    if (!validation.isValid) {
      console.error('[superadmin-update-user] Validation failed:', validation.error);
      return createSuperAdminErrorResponse(
        validation.error || 'Unauthorized', 
        403,
        { function: 'superadmin-update-user' }
      );
    }

    console.log('[superadmin-update-user] Super admin validated:', {
      adminUserId: validation.userId,
      adminEmail: validation.email
    });

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body
    const { userId, updates } = await req.json();

    console.log('[superadmin-update-user] Request parameters:', {
      targetUserId: userId,
      updateFields: updates ? Object.keys(updates) : []
    });

    if (!userId) {
      console.error('[superadmin-update-user] Missing userId parameter');
      return createSuperAdminErrorResponse('userId is required', 400);
    }

    if (!updates || typeof updates !== 'object') {
      console.error('[superadmin-update-user] Missing or invalid updates parameter');
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
      console.error('[superadmin-update-user] No valid fields to update');
      return createSuperAdminErrorResponse('No valid fields to update', 400);
    }

    console.log('[superadmin-update-user] Valid update data:', updateData);

    // Fetch current user data for logging
    const { data: currentUser } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    console.log('[superadmin-update-user] Current user data:', {
      userId: currentUser?.id,
      email: currentUser?.email,
      role: currentUser?.role
    });

    // Update user profile
    console.log('[superadmin-update-user] Executing update...');
    const { data: updatedUser, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('[superadmin-update-user] Database error:', {
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        userId
      });
      
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
      return createSuperAdminErrorResponse(
        'Failed to update user: ' + error.message, 
        500,
        { function: 'superadmin-update-user', dbError: error.code, userId }
      );
    }

    console.log('[superadmin-update-user] Update successful:', {
      userId: updatedUser.id,
      updatedFields: Object.keys(updateData)
    });

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

    console.log('[superadmin-update-user] SUCCESS - User updated');
    return createSuperAdminSuccessResponse({ user: updatedUser });
  } catch (error: any) {
    console.error('[superadmin-update-user] EXCEPTION:', {
      error: error.message,
      stack: error.stack,
      name: error.name
    });
    return createSuperAdminErrorResponse(
      'Internal server error: ' + error.message, 
      500,
      { function: 'superadmin-update-user', error: error.message }
    );
  }
});
