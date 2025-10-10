// FIX: Added Deno type declaration to resolve errors when accessing environment variables.
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

// Import required modules
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

// Create Supabase client with service role key
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
export const supabase = createClient(supabaseUrl, supabaseKey)

/**
 * Estrae e valida l'user ID dal JWT token nell'header Authorization.
 * @param req - The request object
 * @returns Promise<string> - The user ID from JWT (sub claim)
 * @throws Error se il token è mancante, invalido o l'utente non è autenticato
 * 
 * BEST PRACTICE: Usare sempre questo helper per estrarre userId dal JWT
 * invece di prendere parametri da form/URL/storage che possono essere manipolati.
 */
export async function getUserIdFromJWT(req: Request): Promise<string> {
  console.log('[getUserIdFromJWT] START - Extracting user from JWT')

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    console.error('[getUserIdFromJWT] ERROR: Authorization header missing')
    throw new Error('Authorization header is required. Please ensure you are logged in.')
  }

  const token = authHeader.replace('Bearer ', '')
  console.log('[getUserIdFromJWT] Token extracted (first 20 chars):', token.substring(0, 20) + '...')

  // Usa il client con anon key per verificare il JWT (RLS-aware)
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const supabaseClient = createClient(supabaseUrl, supabaseAnonKey)

  const { data: { user }, error } = await supabaseClient.auth.getUser(token)

  if (error || !user) {
    console.error('[getUserIdFromJWT] JWT verification failed:', {
      error: error?.message,
      hasUser: !!user,
      tokenPreview: token.substring(0, 20) + '...'
    })
    throw new Error(`Invalid or expired JWT token: ${error?.message || 'User not found'}`)
  }

  console.log('[getUserIdFromJWT] SUCCESS - User verified from JWT:', {
    userId: user.id,
    email: user.email,
    jwtSub: user.id,
    timestamp: new Date().toISOString()
  })

  return user.id
}

/**
 * Estrae il full user object dal JWT token con custom claims inclusi.
 * @param req - The request object
 * @returns Promise<User> - The full user object from JWT with custom claims
 * @throws Error se il token è mancante, invalido o l'utente non è autenticato
 * 
 * NOTA: Questa funzione ritorna l'intero oggetto User dal JWT, includendo
 * i custom claims come user_role e organization_id aggiunti dal custom_access_token_hook.
 * Accedi ai custom claims tramite: user.user_role, user.organization_id
 * 
 * ENHANCED: Now includes comprehensive diagnostics for JWT claim debugging
 */
export async function getUserFromJWT(req: Request): Promise<any> {
  console.log('[getUserFromJWT] START - Extracting full user object from JWT')

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    console.error('[getUserFromJWT] ERROR: Authorization header missing')
    throw new Error('Authorization header is required. Please ensure you are logged in.')
  }

  const token = authHeader.replace('Bearer ', '')
  console.log('[getUserFromJWT] Token extracted (first 20 chars):', token.substring(0, 20) + '...')

  // Decode JWT payload for diagnostics (without verification)
  try {
    const parts = token.split('.')
    if (parts.length === 3) {
      const payload = parts[1]
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
      const jsonPayload = JSON.parse(atob(base64))

      console.log('[getUserFromJWT] JWT Payload Diagnostics:', {
        hasUserRole: 'user_role' in jsonPayload,
        hasOrganizationId: 'organization_id' in jsonPayload,
        userRole: jsonPayload.user_role || 'NOT_FOUND',
        organizationId: jsonPayload.organization_id || 'NOT_FOUND',
        exp: jsonPayload.exp,
        iat: jsonPayload.iat,
        tokenAge: jsonPayload.iat ? Math.floor((Date.now() / 1000) - jsonPayload.iat) : 'UNKNOWN',
        isExpired: jsonPayload.exp ? (jsonPayload.exp < Date.now() / 1000) : 'UNKNOWN'
      })

      // Warning if custom claims are missing
      if (!jsonPayload.user_role) {
        console.warn('[getUserFromJWT] ⚠️  WARNING: user_role custom claim is MISSING from JWT')
        console.warn('[getUserFromJWT] This indicates custom_access_token_hook may not be properly configured')
        console.warn('[getUserFromJWT] To fix: Configure hook in Supabase Dashboard > Authentication > Hooks')
      }
    }
  } catch (decodeError) {
    console.warn('[getUserFromJWT] Could not decode JWT for diagnostics:', decodeError)
  }

  // Usa il client con anon key per verificare il JWT (RLS-aware)
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const supabaseClient = createClient(supabaseUrl, supabaseAnonKey)

  const { data: { user }, error } = await supabaseClient.auth.getUser(token)

  if (error || !user) {
    console.error('[getUserFromJWT] JWT verification failed:', {
      error: error?.message,
      hasUser: !!user,
      tokenPreview: token.substring(0, 20) + '...'
    })
    throw new Error(`Invalid or expired JWT token: ${error?.message || 'User not found'}`)
  }

  // FALLBACK: Extract custom claims from user_metadata if not in top-level
  // Supabase includes user_metadata in JWT but doesn't auto-promote to top-level
  const userRole = (user as any).user_role || (user as any).user_metadata?.user_role;
  const organizationId = (user as any).organization_id || (user as any).user_metadata?.organization_id;
  const isSuperAdmin = (user as any).is_super_admin || (user as any).user_metadata?.is_super_admin || userRole === 'super_admin';

  console.log('[getUserFromJWT] SUCCESS - User verified from JWT:', {
    userId: user.id,
    email: user.email,
    userRole: userRole,
    organizationId: organizationId,
    isSuperAdmin: isSuperAdmin,
    hasUserRoleClaim: !!(user as any).user_role,
    hasUserRoleInMetadata: !!(user as any).user_metadata?.user_role,
    hasOrganizationIdClaim: !!(user as any).organization_id,
    usedFallback: !(user as any).user_role && !!(user as any).user_metadata?.user_role,
    timestamp: new Date().toISOString()
  })

  // Additional diagnostic warning
  if (!(user as any).user_role && !(user as any).user_metadata?.user_role) {
    console.error('[getUserFromJWT] 🚨 CRITICAL: User object does NOT contain user_role in top-level OR user_metadata')
    console.error('[getUserFromJWT] 🔧 ACTION REQUIRED: Verify custom_access_token_hook is configured')
    console.error('[getUserFromJWT] 📖 See: JWT_CUSTOM_CLAIMS_IMPLEMENTATION.md for setup instructions')
  }

  // Enrich user object with extracted claims (ensures consistent access)
  const enrichedUser = {
    ...user,
    user_role: userRole,
    organization_id: organizationId,
    is_super_admin: isSuperAdmin
  };

  return enrichedUser
}

/**
 * Helper function to get organization_id for a given user
 * @param userId - The user ID from authentication (JWT 'sub' claim)
 * @returns Promise<string> - The organization_id
 * 
 * IMPORTANTE: Questo helper usa SEMPRE il service role per la query,
 * bypassando RLS. L'userId deve provenire dal JWT decodificato, mai
 * da parametri form/URL/storage per garantire sicurezza.
 */
export async function getOrganizationId(userId: string): Promise<string> {
  console.log(`[getOrganizationId] START - Fetching organization for user: ${userId}`)
  console.log(`[getOrganizationId] Using service role for query (bypasses RLS)`)
  console.log(`[getOrganizationId] Timestamp: ${new Date().toISOString()}`)

  // Query usando service role (bypassa RLS)
  const { data, error } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', userId)

  console.log('[getOrganizationId] Query executed:', {
    query: `SELECT organization_id FROM profiles WHERE id = '${userId}'`,
    resultCount: data?.length || 0,
    hasError: !!error,
    timestamp: new Date().toISOString()
  })

  console.log('[getOrganizationId] Profile query result:', {
    data: data,
    error: error,
    dataType: typeof data,
    dataLength: Array.isArray(data) ? data.length : 'not an array'
  })

  if (error) {
    console.error(`[getOrganizationId] DATABASE ERROR:`, {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      userId: userId
    })
    throw new Error(`Could not retrieve user profile: ${error.message} (user_id: ${userId})`)
  }

  if (!data || data.length === 0) {
    console.error('[getOrganizationId] NO PROFILE FOUND:', {
      userId: userId,
      queryResult: data,
      suggestion: 'Check if profile exists in database with this user_id'
    })
    throw new Error(`User profile not found (user_id: ${userId}). Il profilo potrebbe non essere stato creato correttamente durante la registrazione.`)
  }

  const profile = data[0]

  if (!profile.organization_id) {
    console.error('[getOrganizationId] PROFILE INCOMPLETE:', {
      userId: userId,
      profile: profile,
      issue: 'organization_id field is null or undefined'
    })
    throw new Error(`User profile is incomplete or not associated with an organization (user_id: ${userId}).`)
  }

  console.log(`[getOrganizationId] SUCCESS - Organization found:`, {
    userId: userId,
    organizationId: profile.organization_id,
    timestamp: new Date().toISOString()
  })

  return profile.organization_id
}

