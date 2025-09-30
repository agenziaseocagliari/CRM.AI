// FIX: Added Deno type declaration to resolve errors when accessing environment variables.
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

// Import required modules
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

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

