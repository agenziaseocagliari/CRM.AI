import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { corsHeaders } from '../_shared/cors.ts';

// Helper function to write debug logs to database
async function writeDebugLog(supabase: any, functionName: string, organizationId: string | null, step: string, data: any, error?: Error) {
  try {
    await supabase.from('debug_logs').insert({
      function_name: functionName,
      organization_id: organizationId,
      request_payload: data.request_payload || null,
      google_auth_token_value: data.google_auth_token_value || null,
      step: step,
      error_message: error?.message || null,
      error_stack: error?.stack || null,
      extra: data.extra || null
    });
  } catch (dbError) {
    console.error(`FAILED TO WRITE DEBUG LOG for ${step}:`, dbError);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const projectRef = Deno.env.get('SUPABASE_PROJECT_REF');
  
  console.log('EDGE LOG: env-vars-check - URL:', supabaseUrl?.substring(0, 30) + '...');
  console.log('EDGE LOG: env-vars-check - ServiceRole:', supabaseServiceRoleKey ? 'SET' : 'MISSING');
  console.log('EDGE LOG: env-vars-check - AnonKey:', supabaseAnonKey ? 'SET' : 'MISSING');
  console.log('EDGE LOG: env-vars-check - ProjectRef:', projectRef);

  const supabase = createClient(supabaseUrl!, supabaseServiceRoleKey!);

  try {
    const { organization_id, action } = await req.json();
    console.log('EDGE LOG: request-params - OrgId:', organization_id);
    console.log('EDGE LOG: request-params - Action:', action);
    console.log('EDGE LOG: request-params - FullPayload:', JSON.stringify({ organization_id, action }));

    await writeDebugLog(supabase, 'check-google-token-status', organization_id, 'function-start', {
      request_payload: { organization_id, action },
      extra: {
        env_vars: {
          supabase_url_exists: !!supabaseUrl,
          service_role_key_exists: !!supabaseServiceRoleKey,
          anon_key_exists: !!supabaseAnonKey,
          project_ref: projectRef
        }
      }
    });

    // Test organization_settings query with real org_id
    console.log('EDGE LOG: db-test-real - Starting query with real org_id:', organization_id);
    
    try {
      const { data: realOrgData, error: realOrgError } = await supabase
        .from('organization_settings')
        .select('*')
        .eq('organization_id', organization_id)
        .single();
      
      console.log('EDGE LOG: db-test-real - Success:', !!realOrgData);
      console.log('EDGE LOG: db-test-real - Error:', realOrgError);
      console.log('EDGE LOG: db-test-real - Data:', JSON.stringify(realOrgData));
      
      await writeDebugLog(supabase, 'check-google-token-status', organization_id, 'db-test-real', {
        request_payload: { organization_id, action },
        extra: {
          query_success: !!realOrgData,
          query_error: realOrgError,
          returned_data: realOrgData
        }
      });

    } catch (realQueryError) {
      console.log('EDGE LOG: db-test-real - Exception:', realQueryError.message);
      await writeDebugLog(supabase, 'check-google-token-status', organization_id, 'db-test-real-exception', {
        request_payload: { organization_id, action },
        extra: { query_exception: realQueryError.message }
      }, realQueryError);
    }

    // Test organization_settings query with fake org_id
    const fakeOrgId = 'fake-org-id-12345';
    console.log('EDGE LOG: db-test-fake - Starting query with fake org_id:', fakeOrgId);
    
    try {
      const { data: fakeOrgData, error: fakeOrgError } = await supabase
        .from('organization_settings')
        .select('*')
        .eq('organization_id', fakeOrgId)
        .single();
      
      console.log('EDGE LOG: db-test-fake - Success:', !!fakeOrgData);
      console.log('EDGE LOG: db-test-fake - Error:', fakeOrgError);
      console.log('EDGE LOG: db-test-fake - Data:', JSON.stringify(fakeOrgData));
      
      await writeDebugLog(supabase, 'check-google-token-status', organization_id, 'db-test-fake', {
        request_payload: { organization_id, action },
        extra: {
          fake_org_id: fakeOrgId,
          query_success: !!fakeOrgData,
          query_error: fakeOrgError,
          returned_data: fakeOrgData
        }
      });

    } catch (fakeQueryError) {
      console.log('EDGE LOG: db-test-fake - Exception:', fakeQueryError.message);
      await writeDebugLog(supabase, 'check-google-token-status', organization_id, 'db-test-fake-exception', {
        request_payload: { organization_id, action },
        extra: { fake_org_id: fakeOrgId, query_exception: fakeQueryError.message }
      }, fakeQueryError);
    }

    // Main logic: Get organization settings
    console.log('EDGE LOG: main-query-start - Fetching organization settings');
    const { data: orgSettings, error: orgError } = await supabase
      .from('organization_settings')
      .select('*')
      .eq('organization_id', organization_id)
      .single();

    console.log('EDGE LOG: main-query-result - OrgSettings:', JSON.stringify(orgSettings));
    console.log('EDGE LOG: main-query-result - Error:', orgError);

    if (orgError) {
      console.log('EDGE LOG: main-query-error - Organization not found or error:', orgError.message);
      await writeDebugLog(supabase, 'check-google-token-status', organization_id, 'main-query-error', {
        request_payload: { organization_id, action },
        extra: { org_query_error: orgError }
      }, new Error(orgError.message));
      
      return new Response(
        JSON.stringify({ 
          error: 'Organization not found', 
          details: orgError,
          debug_info: {
            organization_id,
            action,
            timestamp: new Date().toISOString()
          }
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get Google auth token
    console.log('EDGE LOG: google-token-query-start - Looking for google_auth_token');
    const googleAuthToken = orgSettings.google_auth_token;
    console.log('EDGE LOG: google-token-raw - Raw token value:', JSON.stringify(googleAuthToken));
    console.log('EDGE LOG: google-token-type - Token type:', typeof googleAuthToken);
    console.log('EDGE LOG: google-token-exists - Token exists:', !!googleAuthToken);

    await writeDebugLog(supabase, 'check-google-token-status', organization_id, 'google-token-analysis', {
      request_payload: { organization_id, action },
      google_auth_token_value: googleAuthToken,
      extra: {
        token_type: typeof googleAuthToken,
        token_exists: !!googleAuthToken,
        organization_settings_full: orgSettings
      }
    });

    if (!googleAuthToken) {
      console.log('EDGE LOG: no-token - Google auth token not found');
      await writeDebugLog(supabase, 'check-google-token-status', organization_id, 'no-token', {
        request_payload: { organization_id, action },
        extra: { message: 'No google_auth_token found' }
      });
      
      return new Response(
        JSON.stringify({ 
          connected: false, 
          error: 'No Google auth token found',
          debug_info: {
            organization_id,
            action,
            organization_settings: orgSettings
          }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse token if it's a string
    let tokenObj = googleAuthToken;
    if (typeof googleAuthToken === 'string') {
      try {
        console.log('EDGE LOG: token-parse-start - Attempting to parse token string');
        tokenObj = JSON.parse(googleAuthToken);
        console.log('EDGE LOG: token-parse-success - Parsed token:', JSON.stringify(tokenObj));
      } catch (parseError) {
        console.log('EDGE LOG: token-parse-error - Failed to parse token:', parseError.message);
        await writeDebugLog(supabase, 'check-google-token-status', organization_id, 'token-parse-error', {
          request_payload: { organization_id, action },
          google_auth_token_value: googleAuthToken,
          extra: { parse_error: parseError.message }
        }, parseError);
        
        return new Response(
          JSON.stringify({ 
            connected: false, 
            error: 'Invalid token format',
            debug_info: {
              organization_id,
              action,
              raw_token: googleAuthToken,
              parse_error: parseError.message
            }
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Check token expiry
    console.log('EDGE LOG: token-expiry-check - Token object:', JSON.stringify(tokenObj));
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = tokenObj.expires_at || (tokenObj.created_at + tokenObj.expires_in);
    const isExpired = now >= expiresAt;
    
    console.log('EDGE LOG: token-expiry-details - Now:', now, 'ExpiresAt:', expiresAt, 'IsExpired:', isExpired);

    await writeDebugLog(supabase, 'check-google-token-status', organization_id, 'token-expiry-check', {
      request_payload: { organization_id, action },
      google_auth_token_value: tokenObj,
      extra: {
        now_timestamp: now,
        expires_at: expiresAt,
        is_expired: isExpired,
        token_details: tokenObj
      }
    });

    console.log('EDGE LOG: function-complete - Returning result');
    return new Response(
      JSON.stringify({ 
        connected: !isExpired, 
        expires_at: expiresAt,
        is_expired: isExpired,
        debug_info: {
          organization_id,
          action,
          token_analysis: {
            now,
            expiresAt,
            isExpired
          }
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.log('EDGE LOG: function-error - Unhandled error:', error.message);
    console.log('EDGE LOG: function-error - Stack:', error.stack);
    
    try {
      await writeDebugLog(supabase, 'check-google-token-status', null, 'function-error', {
        request_payload: null,
        extra: { 
          error_message: error.message,
          error_stack: error.stack 
        }
      }, error);
    } catch (logError) {
      console.error('Failed to log main error:', logError);
    }
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message,
        debug_info: {
          error_stack: error.stack,
          timestamp: new Date().toISOString()
        }
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});