/**
 * Super Admin Utilities
 * Provides validation, authorization, and audit logging for Super Admin operations
 * 
 * UPDATED: Now uses centralized getUserIdFromJWT helper for consistent JWT validation
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.4';
import { getUserIdFromJWT, getUserFromJWT } from './supabase.ts';

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
 * ENHANCED: Uses JWT claim with database fallback for resilience
 * @param req The incoming request
 * @returns Validation result with user info or error
 */
export async function validateSuperAdmin(req: Request): Promise<SuperAdminValidationResult> {
  console.log('[validateSuperAdmin] START - Validating super admin access');
  
  try {
    // Step 1: Extract full user object from JWT with custom claims
    // The custom_access_token_hook adds user_role to the JWT
    const user = await getUserFromJWT(req);
    console.log('[validateSuperAdmin] User extracted from JWT:', {
      userId: user.id,
      email: user.email,
      userRole: (user as any).user_role,
      hasUserRoleClaim: !!(user as any).user_role
    });

    // Step 2: Check if user_role custom claim exists
    let userRole = (user as any).user_role;
    
    // FALLBACK MECHANISM: If JWT claim is missing, query the database
    if (!userRole) {
      console.warn('[validateSuperAdmin] WARNING: user_role claim not found in JWT - attempting database fallback', {
        userId: user.id,
        email: user.email,
        hint: 'This suggests custom_access_token_hook may not be configured or is failing'
      });
      
      // Query database as fallback
      const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { data: profile, error: dbError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (dbError) {
        console.error('[validateSuperAdmin] DATABASE FALLBACK FAILED:', {
          userId: user.id,
          email: user.email,
          error: dbError.message,
          code: dbError.code
        });
        return { 
          isValid: false, 
          error: 'JWT custom claim user_role not found and database fallback failed. Please logout and login again to refresh your session.',
          userId: user.id
        };
      }
      
      if (!profile || !profile.role) {
        console.error('[validateSuperAdmin] DATABASE FALLBACK: No profile or role found', {
          userId: user.id,
          email: user.email,
          hasProfile: !!profile
        });
        return { 
          isValid: false, 
          error: 'User profile or role not found in database. Please contact support.',
          userId: user.id
        };
      }
      
      userRole = profile.role;
      console.warn('[validateSuperAdmin] DATABASE FALLBACK SUCCESS: Retrieved role from database', {
        userId: user.id,
        email: user.email,
        userRole: userRole,
        warning: 'JWT should contain user_role claim - check custom_access_token_hook configuration'
      });
    } else {
      console.log('[validateSuperAdmin] user_role claim found in JWT:', {
        userId: user.id,
        email: user.email,
        userRole: userRole
      });
    }

    // Step 3: Verify the role is super_admin
    if (userRole !== 'super_admin') {
      console.warn('[validateSuperAdmin] UNAUTHORIZED: Access denied', {
        userId: user.id,
        email: user.email,
        userRole: userRole,
        requiredRole: 'super_admin',
        wasFromJWT: !!(user as any).user_role
      });
      return { 
        isValid: false, 
        error: `Access denied. Super Admin role required. Your current role is: ${userRole}. Please logout and login again if your role was recently changed.`,
        userId: user.id
      };
    }

    console.log('[validateSuperAdmin] SUCCESS - Super admin validated:', {
      userId: user.id,
      email: user.email,
      userRole: userRole,
      source: (user as any).user_role ? 'JWT' : 'Database Fallback'
    });

    return {
      isValid: true,
      userId: user.id,
      email: user.email,
    };
  } catch (error: any) {
    console.error('[validateSuperAdmin] EXCEPTION:', {
      error: error.message,
      stack: error.stack,
      name: error.name
    });
    return { 
      isValid: false, 
      error: `Internal validation error: ${error.message}` 
    };
  }
}

/**
 * Logs a super admin action to the audit trail
 * AGGIORNATO: Logging più dettagliato per debugging e audit
 * @param params Audit log parameters
 * @param userId The user ID performing the action
 * @param userEmail The email of the user performing the action
 */
export async function logSuperAdminAction(
  params: AuditLogParams,
  userId: string,
  userEmail: string
): Promise<void> {
  console.log('[logSuperAdminAction] START - Logging super admin action:', {
    action: params.action,
    operationType: params.operationType,
    targetType: params.targetType,
    targetId: params.targetId,
    result: params.result || 'SUCCESS',
    userId,
    userEmail
  });
  
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    const logEntry = {
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
    };

    console.log('[logSuperAdminAction] Inserting log entry:', logEntry);

    const { error } = await supabase
      .from('superadmin_logs')
      .insert(logEntry);

    if (error) {
      console.error('[logSuperAdminAction] ERROR: Failed to insert log:', {
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        logEntry
      });
    } else {
      console.log('[logSuperAdminAction] SUCCESS - Log entry created');
    }
  } catch (error: any) {
    console.error('[logSuperAdminAction] EXCEPTION:', {
      error: error.message,
      stack: error.stack,
      params
    });
  }
}

/**
 * Extracts client information from request for audit logging
 * AGGIORNATO: Logging migliorato per debugging
 * @param req The incoming request
 */
export function extractClientInfo(req: Request): { ipAddress?: string; userAgent?: string } {
  const ipAddress = req.headers.get('x-forwarded-for') || 
                    req.headers.get('x-real-ip') || 
                    req.headers.get('cf-connecting-ip') || 
                    undefined;
  const userAgent = req.headers.get('user-agent') || undefined;
  
  console.log('[extractClientInfo] Client information:', {
    ipAddress: ipAddress || 'N/A',
    userAgent: userAgent ? userAgent.substring(0, 50) + '...' : 'N/A'
  });
  
  return { ipAddress, userAgent };
}

/**
 * Creates a standardized super admin error response
 * AGGIORNATO: Include diagnostics dettagliati + CORS headers
 * @param message Error message
 * @param statusCode HTTP status code
 * @param diagnostics Optional diagnostic information
 */
export function createSuperAdminErrorResponse(
  message: string, 
  statusCode: number = 403,
  diagnostics?: Record<string, any>
): Response {
  console.error('[createSuperAdminErrorResponse] Creating error response:', {
    message,
    statusCode,
    diagnostics,
    timestamp: new Date().toISOString()
  });
  
  const responseBody: any = { error: message };
  
  if (diagnostics) {
    responseBody.diagnostics = {
      ...diagnostics,
      timestamp: new Date().toISOString(),
      suggestion: statusCode === 403 
        ? 'Verify you have super_admin role assigned in your profile'
        : statusCode === 401
        ? 'Check your JWT token is valid and not expired'
        : 'Contact support if the issue persists'
    };
  }
  
  // Import CORS headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-n8n-api-key",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  };
  
  return new Response(
    JSON.stringify(responseBody),
    {
      status: statusCode,
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders
      },
    }
  );
}

/**
 * Creates a standardized super admin success response
 * AGGIORNATO: Include metadata di debug + CORS headers
 * @param data Response data
 */
export function createSuperAdminSuccessResponse(data: any): Response {
  console.log('[createSuperAdminSuccessResponse] Creating success response:', {
    dataKeys: Object.keys(data),
    timestamp: new Date().toISOString()
  });
  
  // Import CORS headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-n8n-api-key",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  };
  
  return new Response(
    JSON.stringify(data),
    {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders
      },
    }
  );
}
