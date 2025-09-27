// File: supabase/functions/google-token-exchange/index.ts

declare const Deno: any;

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";
import { corsHeaders, handleCors } from "../_shared/cors.ts";

// Helper to extract user_id and organization_id from the JWT.
async function getAuthContext(req: Request, supabase: SupabaseClient): Promise<{ userId: string, organizationId: string }> {
    console.log('[getAuthContext] Helper invoked.');
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization header.");

    const jwt = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(jwt);
    if (userError) throw new Error(`Authentication failed: ${userError.message}`);
    if (!user) throw new Error("User not found for the provided token.");

    console.log(`[getAuthContext] Auth context: User ID ${user.id}, Email: ${user.email}`);
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    console.log('[getAuthContext] Profile select result:', { data: profile, error: profileError });

    if (profileError) throw new Error(`Could not retrieve user profile: ${profileError.message}`);
    if (!profile || !profile.organization_id) throw new Error("User profile is incomplete or not associated with an organization.");

    return { userId: user.id, organizationId: profile.organization_id };
}


serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  console.log('[google-token-exchange] Edge Function invoked.');

  let supabaseAdmin: SupabaseClient;
  let organizationIdForLogging: string | null = null;
  
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) throw new Error("Missing Supabase credentials in environment.");
    
    supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    
    // Get authenticated user and organization IDs
    const { userId: user_id, organizationId: organization_id } = await getAuthContext(req, supabaseAdmin);
    organizationIdForLogging = organization_id;
    
    const payload = await req.json();
    console.log('[google-token-exchange] Payload received:', payload);
    const { code } = payload;
    if (!code) throw new Error("Missing 'code' parameter in payload.");
    
    // Exchange authorization code for Google tokens
    const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
    const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
    const redirectUri = Deno.env.get("GOOGLE_REDIRECT_URI");
    if (!clientId || !clientSecret || !redirectUri) throw new Error("Missing Google OAuth credentials in environment.");

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-form-urlencoded" },
      body: new URLSearchParams({
        code, client_id: clientId, client_secret: clientSecret,
        redirect_uri: redirectUri, grant_type: 'authorization_code'
      }),
    });

    const tokens = await tokenResponse.json();
    if (!tokenResponse.ok) {
      throw new Error(`Error from Google (${tokenResponse.status}): ${tokens.error_description || tokens.error}`);
    }

    // 1. Verify, extract, and log all required fields
    const access_token = tokens.access_token;
    const refresh_token = tokens.refresh_token;
    const expiry_date = Math.floor(Date.now() / 1000) + tokens.expires_in;

    console.log('--- Mandatory Fields Verification ---');
    console.log({
        user_id,
        organization_id,
        access_token: access_token ? 'OK' : 'MISSING',
        refresh_token: refresh_token ? 'OK' : 'MISSING',
        expiry_date,
    });

    if (!user_id || !organization_id) {
        const errorMsg = 'CRITICAL: User ID or Organization ID could not be determined. Upsert aborted.';
        console.error(errorMsg, { user_id, organization_id });
        throw new Error(errorMsg);
    }
     if (!access_token || !refresh_token) {
        const errorMsg = "Risposta da Google incompleta. Il 'refresh_token' è mancante. Prova a revocare l'accesso e a riconnetterti.";
        console.error(errorMsg, { has_access_token: !!access_token, has_refresh_token: !!refresh_token });
        throw new Error(errorMsg);
    }
    
    // 2. Log the final payload passed to the upsert operation
    console.log('Payload upsert:', {
        user_id,
        organization_id,
        access_token,
        refresh_token,
        expiry_date
    });

    // 3. Correct the upsert call with schema-compliant field names
    const upsertData = {
      user_id,
      organization_id,
      google_access_token: access_token,
      google_refresh_token: refresh_token,
      expires_at: expiry_date,
      updated_at: new Date().toISOString()
      // `created_at` is omitted to let the database handle it with a default value.
    };
    
    const { data, error } = await supabaseAdmin
      .from('google_credentials')
      .upsert(upsertData, { onConflict: 'organization_id' })
      .select()
      .single();

    // 4. Handle response and return success/failure
    if (error) {
      console.error('Errore nell’upsert:', error);
      throw new Error(error.message || 'Errore upsert Google credentials');
    }

    if (data) {
        console.log('Upsert OK, data:', data);
    } else {
        console.warn('Upsert succeeded but returned no data. This is unexpected.');
    }

    // (Migration Action) Clean up the old field from organization_settings if it exists
    await supabaseAdmin
        .from('organization_settings')
        .update({ google_auth_token: null })
        .eq('organization_id', organization_id);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("[google-token-exchange] Final catch block error:", error.message);
    
    if (supabaseAdmin && organizationIdForLogging) {
        await supabaseAdmin.from('debug_logs').insert({
            function_name: 'google-token-exchange',
            organization_id: organizationIdForLogging,
            log_level: 'ERROR',
            content: { step: 'catch_block', error: error.message, stack: error.stack }
        }).catch(e => console.error("Failed to write to debug_logs:", e));
    }
    
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
