/**
 * Super Admin Utilities
 * Provides validation, authorization, and audit logging for Super Admin operations
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.4';

interface SuperAdminValidationResult {
  isValid: boolean;
  userId?: string;
  email?: string;
  error?: string;
}

interface AuditLogParams {
  action: string;
  operationType: 'CREATE' | 'UPDATE' | 'DELETE' | 'READ' | 'EXECUTE';
  targetType?: 'USER' | 'ORGANIZATION' | 'PAYMENT' | 'SYSTEM';
  targetId?: string;
  details?: Record<string, any>;
  result?: 'SUCCESS' | 'FAILURE' | 'PARTIAL';
  errorMessage?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Validates that the current user has super_admin role
 * @param req The incoming request
 * @returns Validation result with user info or error
 */
export async function validateSuperAdmin(req: Request): Promise<SuperAdminValidationResult> {
  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return { isValid: false, error: 'Missing authorization header' };
    }

    // Extract JWT token
    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      return { isValid: false, error: 'Invalid authorization token' };
    }

    // Create Supabase client with the user's token
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('[Super Admin] Missing Supabase configuration');
      return { isValid: false, error: 'Server configuration error' };
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Verify the JWT token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('[Super Admin] Authentication failed:', authError);
      return { isValid: false, error: 'Authentication failed' };
    }

    // Check if user has super_admin role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('[Super Admin] Failed to fetch user profile:', profileError);
      return { isValid: false, error: 'Failed to verify user permissions' };
    }

    if (profile.role !== 'super_admin') {
      console.warn(`[Super Admin] Access denied for user ${user.email} with role ${profile.role}`);
      return { isValid: false, error: 'Insufficient permissions. Super Admin role required.' };
    }

    return {
      isValid: true,
      userId: user.id,
      email: user.email,
    };
  } catch (error) {
    console.error('[Super Admin] Validation error:', error);
    return { isValid: false, error: 'Internal validation error' };
  }
}

/**
 * Logs a super admin action to the audit trail
 * @param params Audit log parameters
 * @param userId The user ID performing the action
 * @param userEmail The email of the user performing the action
 */
export async function logSuperAdminAction(
  params: AuditLogParams,
  userId: string,
  userEmail: string
): Promise<void> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error } = await supabase
      .from('superadmin_logs')
      .insert({
        admin_user_id: userId,
        admin_email: userEmail,
        action: params.action,
        operation_type: params.operationType,
        target_type: params.targetType || null,
        target_id: params.targetId || null,
        details: params.details || null,
        result: params.result || 'SUCCESS',
        error_message: params.errorMessage || null,
        ip_address: params.ipAddress || null,
        user_agent: params.userAgent || null,
      });

    if (error) {
      console.error('[Super Admin] Failed to log action:', error);
    }
  } catch (error) {
    console.error('[Super Admin] Error logging action:', error);
  }
}

/**
 * Extracts client information from request for audit logging
 * @param req The incoming request
 */
export function extractClientInfo(req: Request): { ipAddress?: string; userAgent?: string } {
  return {
    ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
    userAgent: req.headers.get('user-agent') || undefined,
  };
}

/**
 * Creates a standardized super admin error response
 * @param message Error message
 * @param statusCode HTTP status code
 */
export function createSuperAdminErrorResponse(message: string, statusCode: number = 403): Response {
  return new Response(
    JSON.stringify({ error: message }),
    {
      status: statusCode,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

/**
 * Creates a standardized super admin success response
 * @param data Response data
 */
export function createSuperAdminSuccessResponse(data: any): Response {
  return new Response(
    JSON.stringify(data),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
