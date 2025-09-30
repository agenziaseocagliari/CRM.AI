/**
 * Super Admin Utilities
 * Provides validation, authorization, and audit logging for Super Admin operations
 * 
 * UPDATED: Now uses centralized getUserIdFromJWT helper for consistent JWT validation
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.4';
import { getUserIdFromJWT } from './supabase.ts';

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
 * AGGIORNATO: Usa getUserIdFromJWT per estrazione sicura dell'user ID dal JWT
 * @param req The incoming request
 * @returns Validation result with user info or error
 */
export async function validateSuperAdmin(req: Request): Promise<SuperAdminValidationResult> {
  console.log('[validateSuperAdmin] START - Validating super admin access');
  
  try {
    // Step 1: Estrai userId dal JWT usando helper centralizzato
    // Questo garantisce validazione coerente con tutte le altre edge functions
    const userId = await getUserIdFromJWT(req);
    console.log('[validateSuperAdmin] User ID extracted from JWT:', userId);

    // Step 2: Crea client Supabase con service role per query RLS-bypassing
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('[validateSuperAdmin] ERROR: Missing Supabase configuration');
      return { isValid: false, error: 'Server configuration error' };
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Step 3: Verifica ruolo super_admin dal profilo utente
    console.log('[validateSuperAdmin] Querying profile for user:', userId);
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, id, email, full_name')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('[validateSuperAdmin] ERROR: Failed to fetch user profile:', {
        error: profileError,
        userId: userId,
        code: profileError.code,
        message: profileError.message,
        hint: profileError.hint
      });
      return { isValid: false, error: 'Failed to verify user permissions' };
    }

    if (!profile) {
      console.error('[validateSuperAdmin] ERROR: Profile not found for user:', userId);
      return { 
        isValid: false, 
        error: 'User profile not found. Please contact support with your user ID: ' + userId 
      };
    }

    console.log('[validateSuperAdmin] Profile found:', {
      userId: profile.id,
      email: profile.email,
      role: profile.role,
      fullName: profile.full_name
    });

    // Step 4: Verifica che il ruolo sia super_admin
    if (profile.role !== 'super_admin') {
      console.warn('[validateSuperAdmin] UNAUTHORIZED: Access denied', {
        userId: profile.id,
        email: profile.email,
        role: profile.role,
        requiredRole: 'super_admin'
      });
      return { 
        isValid: false, 
        error: `Insufficient permissions. Super Admin role required. Current role: ${profile.role}` 
      };
    }

    console.log('[validateSuperAdmin] SUCCESS - Super admin validated:', {
      userId: profile.id,
      email: profile.email
    });

    return {
      isValid: true,
      userId: profile.id,
      email: profile.email,
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
 * AGGIORNATO: Include diagnostics dettagliati
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
  
  return new Response(
    JSON.stringify(responseBody),
    {
      status: statusCode,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

/**
 * Creates a standardized super admin success response
 * AGGIORNATO: Include metadata di debug
 * @param data Response data
 */
export function createSuperAdminSuccessResponse(data: any): Response {
  console.log('[createSuperAdminSuccessResponse] Creating success response:', {
    dataKeys: Object.keys(data),
    timestamp: new Date().toISOString()
  });
  
  return new Response(
    JSON.stringify(data),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
