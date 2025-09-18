import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// FIX: Replaced non-existent 'cors' import with 'corsHeaders' and 'handleCors' and will refactor to use them.
import { corsHeaders, handleCors } from '../_shared/cors.ts'
import { getGoogleTokens } from '../_shared/google.ts'
// FIX: Imported createClient to instantiate a Supabase client for the getGoogleTokens function.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";


serve(async (req) => {
  // Handle CORS
  // FIX: Switched to the standard handleCors function for preflight requests.
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    console.log('🔍 Starting Google token status check...')
    
    const url = new URL(req.url)
    const organizationId = url.searchParams.get('organization_id')

    if (!organizationId) {
      console.error('❌ Missing organization_id parameter')
      // FIX: Standardized response creation with CORS headers.
      return new Response(
        JSON.stringify({ error: 'Missing organization_id parameter' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('🏢 Organization ID:', organizationId)
    
    // FIX: Create a Supabase client to pass to the refactored getGoogleTokens function.
    // This function will likely be called with user authentication.
    const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    // Get tokens using the shared utility - this will include our detailed logging
    const tokens = await getGoogleTokens(supabaseClient, organizationId)
    
    if (!tokens) {
      console.log('⚠️  No valid tokens found or tokens could not be retrieved')
      // FIX: Standardized response creation with CORS headers.
      return new Response(
        JSON.stringify({ 
          connected: false, 
          error: 'No valid Google tokens found',
          debug_info: {
            organization_id: organizationId,
            timestamp: new Date().toISOString(),
            function: 'check-google-token-status'
          }
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Check if token is expired
    const now = Math.floor(Date.now() / 1000)
    const expiryTimestamp = tokens.expiry_date || tokens.expires_at;
    const isExpired = expiryTimestamp ? expiryTimestamp < now : false;
    const timeUntilExpiry = expiryTimestamp ? expiryTimestamp - now : null
    
    console.log('✅ Token status check complete:', {
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
      isExpired,
      timeUntilExpiry,
      expiresAt: expiryTimestamp ? new Date(expiryTimestamp * 1000).toISOString() : 'Not set'
    })

    // FIX: Standardized response creation with CORS headers.
    return new Response(
      JSON.stringify({ 
        connected: true,
        is_expired: isExpired,
        expires_at: expiryTimestamp,
        expires_at_iso: expiryTimestamp ? new Date(expiryTimestamp * 1000).toISOString() : null,
        time_until_expiry_seconds: timeUntilExpiry,
        has_access_token: !!tokens.access_token,
        has_refresh_token: !!tokens.refresh_token,
        debug_info: {
          organization_id: organizationId,
          timestamp: new Date().toISOString(),
          function: 'check-google-token-status'
        }
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
    
  } catch (error) {
    console.error('❌ Unexpected error in check-google-token-status:', error)
    console.error('🔬 Error stack:', error.stack)
    
    // FIX: Standardized response creation with CORS headers.
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message,
        debug_info: {
          timestamp: new Date().toISOString(),
          function: 'check-google-token-status',
          error_type: error.name
        }
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})