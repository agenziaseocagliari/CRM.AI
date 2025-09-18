// FIX: Added Deno global declaration to resolve TypeScript errors with Deno.env.get.
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders, handleCors } from '../_shared/cors.ts'
import { getGoogleTokens } from '../_shared/google.ts'
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";

serve(async (req) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Extensive logging as requested
    console.log("EDGE LOG: [START] - Function 'check-google-token-status' invoked.");

    // 1. Log all relevant Deno environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    console.log(`EDGE LOG: [ENV] - SUPABASE_URL: ${supabaseUrl ? 'Loaded' : 'MISSING!'}`);
    console.log(`EDGE LOG: [ENV] - SUPABASE_ANON_KEY: ${supabaseAnonKey ? 'Loaded' : 'MISSING!'}`);
    // Note: SERVICE_ROLE_KEY is not used here, as we use the user's token.

    // 2. Log received parameters
    const url = new URL(req.url);
    const organizationId = url.searchParams.get('organization_id');
    console.log(`EDGE LOG: [PARAMS] - Received organization_id: ${organizationId}`);

    if (!organizationId) {
      console.error('EDGE LOG: [ERROR] - Missing organization_id parameter');
      return new Response(
        JSON.stringify({ error: 'Missing organization_id parameter' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // 3. Log key type used for Supabase query
    const authHeader = req.headers.get("Authorization");
    console.log(`EDGE LOG: [AUTH] - Using user's JWT for query (Authorization header ${authHeader ? 'present' : 'missing'}). This will respect RLS.`);

    // Create a Supabase client to pass to the getGoogleTokens function.
    const supabaseClient = createClient(
        supabaseUrl!,
        supabaseAnonKey!,
        { global: { headers: { Authorization: authHeader! } } }
    );

    // Get tokens using the shared utility
    console.log(`EDGE LOG: [CALL] - Invoking getGoogleTokens for org: ${organizationId}`);
    const tokens = await getGoogleTokens(supabaseClient, organizationId);
    
    if (!tokens) {
      console.log('EDGE LOG: [RESULT] - No valid tokens found or tokens could not be retrieved.');
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
      );
    }

    // Check if token is expired
    const now = Math.floor(Date.now() / 1000);
    const expiryTimestamp = tokens.expiry_date || tokens.expires_at;
    const isExpired = expiryTimestamp ? expiryTimestamp < now : false;
    const timeUntilExpiry = expiryTimestamp ? expiryTimestamp - now : null;
    
    console.log('EDGE LOG: [RESULT] - Token status check complete:', {
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
      isExpired,
      timeUntilExpiry,
      expiresAt: expiryTimestamp ? new Date(expiryTimestamp * 1000).toISOString() : 'Not set'
    });

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
    );
    
  } catch (error) {
    console.error('EDGE LOG: [FATAL] - Unexpected error in check-google-token-status:', error);
    console.error('EDGE LOG: [FATAL] - Error stack:', error.stack);
    
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
    );
  }
});
