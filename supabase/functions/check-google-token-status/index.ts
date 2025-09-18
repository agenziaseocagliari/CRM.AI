// File: supabase/functions/check-google-token-status/index.ts

declare const Deno: {
  env: { get(key: string): string | undefined; };
};

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";

// Target organization_id for diagnostics
const TARGET_ORG_ID = 'a4a71877-bddf-44ee-9f3a-c3c36c53c24e';

interface GoogleTokenData {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
  expiry_date: string;
}

interface DiagnosticResponse {
  organization_id: string;
  record_exists: boolean;
  token_status: 'missing' | 'null' | 'empty' | 'corrupted' | 'valid' | 'expired';
  token_data_preview?: string;
  expiry_date?: string;
  needs_reconnection: boolean;
  suggested_action: string;
  raw_token_type?: string;
  raw_token_value?: any;
  timestamp: string;
}

serve(async (req) => {
  console.log(`[CHECK-TOKEN-STATUS] Request received at ${new Date().toISOString()}`);
  
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    
    if (!serviceRoleKey || !supabaseUrl) {
      throw new Error("Missing Supabase configuration");
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    
    console.log(`[CHECK-TOKEN-STATUS] Checking token status for organization: ${TARGET_ORG_ID}`);
    
    // Step 1: Check if record exists
    const { data: settings, error: settingsError } = await supabaseAdmin
      .from('organization_settings')
      .select('google_auth_token')
      .eq('organization_id', TARGET_ORG_ID)
      .single();

    const diagnostic: DiagnosticResponse = {
      organization_id: TARGET_ORG_ID,
      record_exists: false,
      token_status: 'missing',
      needs_reconnection: true,
      suggested_action: 'Record not found - create organization settings first',
      timestamp: new Date().toISOString()
    };

    // Step 2: Handle record not found
    if (settingsError || !settings) {
      console.log(`[CHECK-TOKEN-STATUS] No record found for organization ${TARGET_ORG_ID}`);
      diagnostic.suggested_action = 'Organization settings record not found. Please ensure the organization exists and has been properly initialized.';
      
      return new Response(JSON.stringify(diagnostic), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404
      });
    }

    // Step 3: Record exists, now check token
    diagnostic.record_exists = true;
    const rawToken = settings.google_auth_token;
    diagnostic.raw_token_value = rawToken;
    diagnostic.raw_token_type = typeof rawToken;

    console.log(`[CHECK-TOKEN-STATUS] Raw token type: ${typeof rawToken}`);
    console.log(`[CHECK-TOKEN-STATUS] Raw token preview: ${String(rawToken).substring(0, 100)}...`);

    // Step 4: Check token status
    if (rawToken === null) {
      diagnostic.token_status = 'null';
      diagnostic.suggested_action = 'Google auth token is null - user needs to connect Google account';
      diagnostic.token_data_preview = 'null';
    } else if (rawToken === '' || rawToken === undefined) {
      diagnostic.token_status = 'empty';
      diagnostic.suggested_action = 'Google auth token is empty - user needs to connect Google account';
      diagnostic.token_data_preview = 'empty string';
    } else {
      // ROBUST TOKEN PARSING LOGIC - PATCH APPLIED
      let tokenData: GoogleTokenData;
      try {
        if (typeof rawToken === "string") {
          tokenData = JSON.parse(rawToken);
          diagnostic.token_data_preview = rawToken.substring(0, 50) + '...';
        } else {
          tokenData = rawToken;
          diagnostic.token_data_preview = JSON.stringify(rawToken).substring(0, 50) + '...';
        }

        // Step 5: Validate token structure
        if (!tokenData || !tokenData.access_token || !tokenData.refresh_token || !tokenData.expiry_date) {
          diagnostic.token_status = 'corrupted';
          diagnostic.suggested_action = 'Token exists but is missing required fields (access_token, refresh_token, expiry_date) - user needs to reconnect Google account';
        } else {
          // Step 6: Check if token is expired
          diagnostic.expiry_date = tokenData.expiry_date;
          const isExpired = new Date(tokenData.expiry_date).getTime() < Date.now();
          
          if (isExpired) {
            diagnostic.token_status = 'expired';
            diagnostic.suggested_action = 'Token is valid but expired - automatic refresh should handle this, if it fails user needs to reconnect';
            diagnostic.needs_reconnection = false; // Let auto-refresh try first
          } else {
            diagnostic.token_status = 'valid';
            diagnostic.suggested_action = 'Token is valid and not expired - Google integration should work';
            diagnostic.needs_reconnection = false;
          }
        }
      } catch (parseError) {
        console.error(`[CHECK-TOKEN-STATUS] JSON parse error:`, parseError);
        diagnostic.token_status = 'corrupted';
        diagnostic.suggested_action = `Token parsing failed: ${parseError.message} - user needs to reconnect Google account`;
        diagnostic.token_data_preview = `Parse error: ${String(rawToken).substring(0, 50)}...`;
      }
    }

    console.log(`[CHECK-TOKEN-STATUS] Final diagnostic:`, diagnostic);
    
    return new Response(JSON.stringify(diagnostic, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error(`[CHECK-TOKEN-STATUS] Error:`, error);
    
    const errorResponse: DiagnosticResponse = {
      organization_id: TARGET_ORG_ID,
      record_exists: false,
      token_status: 'missing',
      needs_reconnection: true,
      suggested_action: `System error: ${error.message}`,
      timestamp: new Date().toISOString()
    };
    
    return new Response(JSON.stringify(errorResponse), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    });
  }
});