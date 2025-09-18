// File: supabase/functions/_shared/supabase.ts

declare const Deno: {
  env: { get(key: string): string | undefined; };
};

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";

/**
 * Helper function to safely decode JWT payload for logging
 */
function decodeJwtPayload(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = atob(parts[1]);
    return JSON.parse(payload);
  } catch (error) {
    return null;
  }
}

/**
 * Create detailed authentication context for logging and error responses
 */
function createAuthContext(req: Request, authHeader: string | null, user: any = null, profile: any = null) {
  const timestamp = new Date().toISOString();
  
  // Extract JWT payload if available
  let jwtPayload = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    jwtPayload = decodeJwtPayload(token);
  }

  return {
    timestamp,
    request: {
      method: req.method,
      url: req.url,
      headers: {
        authorization: authHeader ? `Bearer ${authHeader.substring(7).substring(0, 20)}...` : null,
        contentType: req.headers.get('Content-Type'),
        userAgent: req.headers.get('User-Agent'),
      }
    },
    jwt: {
      present: !!authHeader,
      valid: !!jwtPayload,
      payload: jwtPayload ? {
        sub: jwtPayload.sub,
        email: jwtPayload.email,
        role: jwtPayload.role,
        exp: jwtPayload.exp,
        iat: jwtPayload.iat
      } : null
    },
    user: {
      found: !!user,
      id: user?.id || null,
      email: user?.email || null
    },
    profile: {
      found: !!profile,
      organizationId: profile?.organization_id || null
    }
  };
}

/**
 * Retrieves the organization ID for the authenticated user making the request.
 * This is a secure way to identify which organization a user belongs to
 * based on their JWT.
 * 
 * Enhanced with:
 * - Comprehensive logging of authentication flow
 * - Optional fallback to organization_id from request body (DEBUG mode only)
 * - Detailed error responses with authentication context
 * 
 * @param req The incoming request object.
 * @param requestBody Optional request body for fallback organization_id extraction
 * @returns A promise that resolves to the user's organization ID.
 * @throws An error if the user is not authenticated or their profile is not found.
 */
export async function getOrganizationId(req: Request, requestBody?: any): Promise<string> {
  const timestamp = new Date().toISOString();
  const authHeader = req.headers.get("Authorization");
  const debugMode = Deno.env.get("DEBUG_ORG_ID_FALLBACK") === "true";
  
  // Initial request logging
  console.log(`[${timestamp}] [getOrganizationId] Starting organization ID extraction`, {
    hasAuthHeader: !!authHeader,
    debugMode,
    requestMethod: req.method,
    requestUrl: req.url
  });

  let authContext: any;
  let user: any = null;
  let profile: any = null;
  
  try {
    // Step 1: Validate Authorization header
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      authContext = createAuthContext(req, authHeader);
      console.error(`[${timestamp}] [getOrganizationId] Missing or invalid Authorization header`, authContext);
      
      throw new Error(JSON.stringify({
        error: "Accesso negato: header Authorization mancante o non valido.",
        code: "MISSING_AUTH_HEADER",
        context: authContext
      }));
    }

    // Step 2: Create Supabase client and attempt user authentication
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    console.log(`[${timestamp}] [getOrganizationId] Attempting user authentication via JWT`);
    
    const { data: { user: authUser }, error: userError } = await supabaseClient.auth.getUser();
    user = authUser;
    
    authContext = createAuthContext(req, authHeader, user);
    
    if (userError) {
      console.error(`[${timestamp}] [getOrganizationId] User authentication failed`, {
        error: userError,
        context: authContext
      });
      
      throw new Error(JSON.stringify({
        error: "Accesso negato: errore nell'autenticazione utente.",
        code: "AUTH_USER_ERROR",
        details: userError.message,
        context: authContext
      }));
    }
    
    if (!user) {
      console.error(`[${timestamp}] [getOrganizationId] No user found in JWT`, { context: authContext });
      
      throw new Error(JSON.stringify({
        error: "Accesso negato: utente non trovato nel token JWT.",
        code: "NO_USER_IN_JWT",
        context: authContext
      }));
    }

    console.log(`[${timestamp}] [getOrganizationId] User authenticated successfully`, {
      userId: user.id,
      userEmail: user.email
    });

    // Step 3: Fetch user profile to get organization_id
    console.log(`[${timestamp}] [getOrganizationId] Fetching user profile for organization_id`);
    
    const { data: userProfile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();
      
    profile = userProfile;
    authContext = createAuthContext(req, authHeader, user, profile);

    if (profileError) {
      console.error(`[${timestamp}] [getOrganizationId] Profile lookup failed`, {
        error: profileError,
        userId: user.id,
        context: authContext
      });

      // Fallback: try to get organization_id from request body if DEBUG mode is enabled
      if (debugMode && requestBody?.organization_id) {
        console.warn(`[${timestamp}] [getOrganizationId] Using fallback organization_id from request body`, {
          organizationId: requestBody.organization_id,
          userId: user.id
        });
        
        return requestBody.organization_id;
      }
      
      throw new Error(JSON.stringify({
        error: "Impossibile recuperare il profilo utente dal database.",
        code: "PROFILE_LOOKUP_ERROR",
        details: profileError.message,
        context: authContext
      }));
    }
    
    if (!profile) {
      console.error(`[${timestamp}] [getOrganizationId] Profile not found`, {
        userId: user.id,
        context: authContext
      });

      // Fallback: try to get organization_id from request body if DEBUG mode is enabled
      if (debugMode && requestBody?.organization_id) {
        console.warn(`[${timestamp}] [getOrganizationId] Using fallback organization_id from request body (profile not found)`, {
          organizationId: requestBody.organization_id,
          userId: user.id
        });
        
        return requestBody.organization_id;
      }
      
      throw new Error(JSON.stringify({
        error: "Profilo utente non trovato nel database.",
        code: "PROFILE_NOT_FOUND",
        context: authContext
      }));
    }

    if (!profile.organization_id) {
      console.error(`[${timestamp}] [getOrganizationId] No organization_id in profile`, {
        userId: user.id,
        profileData: profile,
        context: authContext
      });

      // Fallback: try to get organization_id from request body if DEBUG mode is enabled
      if (debugMode && requestBody?.organization_id) {
        console.warn(`[${timestamp}] [getOrganizationId] Using fallback organization_id from request body (missing in profile)`, {
          organizationId: requestBody.organization_id,
          userId: user.id
        });
        
        return requestBody.organization_id;
      }
      
      throw new Error(JSON.stringify({
        error: "ID organizzazione non presente nel profilo utente.",
        code: "MISSING_ORGANIZATION_ID",
        context: authContext
      }));
    }

    // Success!
    console.log(`[${timestamp}] [getOrganizationId] Successfully extracted organization_id`, {
      organizationId: profile.organization_id,
      userId: user.id,
      userEmail: user.email
    });

    return profile.organization_id;
    
  } catch (error) {
    // Re-throw if error is already formatted as JSON
    if (error.message.startsWith('{')) {
      throw error;
    }
    
    // Handle unexpected errors
    const finalAuthContext = authContext || createAuthContext(req, authHeader, user, profile);
    
    console.error(`[${timestamp}] [getOrganizationId] Unexpected error occurred`, {
      error: error.message,
      stack: error.stack,
      context: finalAuthContext
    });
    
    throw new Error(JSON.stringify({
      error: "Errore interno durante l'estrazione dell'ID organizzazione.",
      code: "INTERNAL_ERROR",
      details: error.message,
      context: finalAuthContext
    }));
  }
}