declare const Deno: any;

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { getOrganizationId } from "../_shared/supabase.ts";

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  let supabaseAdmin;
  let organization_id;
  
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) throw new Error("Missing Supabase credentials in environment.");
    supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    
    // 1. Authenticate user and get organization_id securely from JWT
    organization_id = await getOrganizationId(req);

    const { code, organization_id: payload_org_id } = await req.json();
    if (!code) throw new Error("Missing 'code' parameter.");
    if (payload_org_id !== organization_id) {
        throw new Error("Authorization mismatch: Organization ID in payload does not match authenticated user.");
    }

    await supabaseAdmin.from('debug_logs').insert({
        function_name: 'google-token-exchange', organization_id,
        content: { step: 'start', message: 'Payload validated. Starting token exchange.' }
    });
    
    // 2. Exchange authorization code for tokens with Google
    const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
    const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
    const redirectUri = Deno.env.get("GOOGLE_REDIRECT_URI");
    if (!clientId || !clientSecret || !redirectUri) throw new Error("Missing Google OAuth credentials in environment.");

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code, client_id: clientId, client_secret: clientSecret,
        redirect_uri: redirectUri, grant_type: 'authorization_code'
      }),
    });

    const tokens = await tokenResponse.json();
    
    await supabaseAdmin.from('debug_logs').insert({
        function_name: 'google-token-exchange', organization_id,
        log_level: tokenResponse.ok ? 'INFO' : 'ERROR',
        content: { step: 'google_api_call', status: tokenResponse.status, response: tokens }
    });

    if (!tokenResponse.ok) {
      throw new Error(`Error from Google (${tokenResponse.status}): ${tokens.error_description || tokens.error}`);
    }

    // 3. Save tokens to the database
    const tokenDataToStore = {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_in: tokens.expires_in,
      scope: tokens.scope,
      token_type: tokens.token_type,
      expiry_date: Math.floor(Date.now() / 1000) + tokens.expires_in
    };

    const { error: dbError } = await supabaseAdmin
        .from('organization_settings')
        .upsert({ organization_id, google_auth_token: tokenDataToStore }, { onConflict: 'organization_id' });

    await supabaseAdmin.from('debug_logs').insert({
        function_name: 'google-token-exchange', organization_id,
        log_level: dbError ? 'ERROR' : 'INFO',
        content: { step: 'db_upsert', success: !dbError, error: dbError?.message }
    });

    if (dbError) throw dbError;

    return new Response(JSON.stringify({ success: true, message: "Token exchanged and saved successfully." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    if (supabaseAdmin && organization_id) {
        await supabaseAdmin.from('debug_logs').insert({
            function_name: 'google-token-exchange', organization_id,
            log_level: 'ERROR', content: { step: 'catch_block', error: error.message, stack: error.stack }
        });
    }
    console.error("[google-token-exchange] Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
