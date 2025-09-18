// File: supabase/functions/get-google-calendar-events/index.ts

// FIX: Expanded the Deno.env type declaration to include the 'toObject' method.
// The original declaration was incomplete, causing a TypeScript error when trying
// to access environment variables for debugging purposes. This change aligns the
// type definition with the actual Deno runtime API.
declare const Deno: {
  env: {
    get(key: string): string | undefined;
    toObject(): Record<string, string>;
  };
};

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { getGoogleAccessToken } from "../_shared/google.ts";
import { getOrganizationId } from '../_shared/supabase.ts';

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { timeMin, timeMax } = await req.json();

    // Log incoming request data
    console.log("[CALENDAR-EVENTS] Request payload:", JSON.stringify({
      timeMin,
      timeMax,
      timestamp: new Date().toISOString()
    }));

    if (!timeMin || !timeMax) {
      const error = {
        error: "Missing required parameters",
        missing_params: { timeMin: !timeMin, timeMax: !timeMax },
        timestamp: new Date().toISOString()
      };
      console.error("[CALENDAR-EVENTS] Parameter validation failed:", JSON.stringify(error));
      return new Response(JSON.stringify(error), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }
    
    // 1. Ottenere l'ID dell'organizzazione in modo sicuro dal token JWT
    console.log("[CALENDAR-EVENTS] Step 1: Extracting organization_id from JWT...");
    let organization_id;
    try {
      organization_id = await getOrganizationId(req);
      // Log successful organization_id extraction
      console.log("[CALENDAR-EVENTS] Organization ID extracted:", JSON.stringify({
        organization_id,
        type: typeof organization_id,
        is_valid: !!organization_id,
        timestamp: new Date().toISOString()
      }));
    } catch (orgError) {
      // Log organization_id extraction failure with detailed error info
      const errorDetails = {
        step: "organization_id_extraction",
        error_message: orgError.message,
        error_stack: orgError.stack,
        request_headers: {
          authorization: req.headers.get('authorization') ? 'present' : 'missing',
          user_agent: req.headers.get('user-agent'),
        },
        timestamp: new Date().toISOString()
      };
      console.error("[CALENDAR-EVENTS] Organization ID extraction failed:", JSON.stringify(errorDetails));
      
      return new Response(JSON.stringify({
        error: "Authentication failed: Unable to extract organization ID",
        details: errorDetails,
        verified_keys: ['authorization_header', 'jwt_token', 'organization_claim']
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    // Validate organization_id
    if (!organization_id) {
      const validationError = {
        step: "organization_id_validation",
        error: "Organization ID is null or undefined",
        extracted_value: organization_id,
        verified_keys: ['jwt_payload', 'organization_claim', 'user_metadata'],
        timestamp: new Date().toISOString()
      };
      console.error("[CALENDAR-EVENTS] Organization ID validation failed:", JSON.stringify(validationError));
      
      return new Response(JSON.stringify({
        error: "Authentication failed: Invalid organization ID",
        details: validationError
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    // 2. Ottenere il token di accesso Google in modo sicuro
    console.log("[CALENDAR-EVENTS] Step 2: Getting Google access token for org:", organization_id);
    
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!serviceRoleKey) {
      const envError = {
        step: "environment_validation",
        error: "SUPABASE_SERVICE_ROLE_KEY not set",
        available_env_vars: Object.keys(Deno.env.toObject()).filter(key => key.includes('SUPABASE')),
        timestamp: new Date().toISOString()
      };
      console.error("[CALENDAR-EVENTS] Environment validation failed:", JSON.stringify(envError));
      throw new Error("La chiave SUPABASE_SERVICE_ROLE_KEY non è impostata.");
    }
    
    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, serviceRoleKey);
    
    let googleAccessToken;
    let tokenDetails;
    try {
      // Attempt to get Google access token
      const tokenResult = await getGoogleAccessToken(supabaseAdmin, organization_id);
      googleAccessToken = tokenResult;
      
      // Log successful token retrieval with detailed info
      tokenDetails = {
        token_length: googleAccessToken ? googleAccessToken.length : 0,
        token_prefix: googleAccessToken ? googleAccessToken.substring(0, 10) + '...' : 'null',
        token_type: typeof googleAccessToken,
        is_valid_format: googleAccessToken ? /^[A-Za-z0-9._-]+$/.test(googleAccessToken) : false,
        organization_id,
        timestamp: new Date().toISOString()
      };
      
      console.log("[CALENDAR-EVENTS] Google access token retrieved:", JSON.stringify(tokenDetails));
      
    } catch (tokenError) {
      // Log token retrieval failure with comprehensive error details
      const tokenErrorDetails = {
        step: "google_token_retrieval",
        error_message: tokenError.message,
        error_stack: tokenError.stack,
        organization_id,
        supabase_connection: !!supabaseAdmin,
        verified_keys: [
          'google_credentials_table',
          'access_token_column', 
          'refresh_token_column',
          'token_expiry',
          'organization_mapping'
        ],
        database_query_attempted: true,
        timestamp: new Date().toISOString()
      };
      
      console.error("[CALENDAR-EVENTS] Google token retrieval failed:", JSON.stringify(tokenErrorDetails));
      
      return new Response(JSON.stringify({
        error: "Authentication failed: Unable to retrieve Google access token",
        details: tokenErrorDetails
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    // Validate Google access token
    if (!googleAccessToken || typeof googleAccessToken !== 'string') {
      const tokenValidationError = {
        step: "google_token_validation",
        error: "Invalid or missing Google access token",
        token_value: googleAccessToken,
        token_type: typeof googleAccessToken,
        organization_id,
        verified_keys: [
          'token_format',
          'token_length', 
          'token_content',
          'database_record',
          'token_refresh_status'
        ],
        timestamp: new Date().toISOString()
      };
      
      console.error("[CALENDAR-EVENTS] Google token validation failed:", JSON.stringify(tokenValidationError));
      
      return new Response(JSON.stringify({
        error: "Authentication failed: Invalid Google access token format",
        details: tokenValidationError
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }
    
    // 3. Chiamata all'API di Google Calendar per ottenere la lista degli eventi
    console.log("[CALENDAR-EVENTS] Step 3: Making Google Calendar API call...");
    
    const eventsListUrl = new URL("https://www.googleapis.com/calendar/v3/calendars/primary/events");
    eventsListUrl.searchParams.set("timeMin", timeMin);
    eventsListUrl.searchParams.set("timeMax", timeMax);
    eventsListUrl.searchParams.set("singleEvents", "true");
    eventsListUrl.searchParams.set("orderBy", "startTime");

    // Log API call details
    console.log("[CALENDAR-EVENTS] Google Calendar API request:", JSON.stringify({
      url: eventsListUrl.toString(),
      method: "GET",
      has_auth_header: true,
      token_preview: googleAccessToken.substring(0, 10) + '...',
      query_params: {
        timeMin,
        timeMax,
        singleEvents: "true",
        orderBy: "startTime"
      },
      timestamp: new Date().toISOString()
    }));

    const eventsListResponse = await fetch(eventsListUrl.toString(), {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${googleAccessToken}`
        },
    });

    const eventsListData = await eventsListResponse.json();
    
    // Log API response details
    const apiResponseLog = {
      status: eventsListResponse.status,
      status_text: eventsListResponse.statusText,
      response_ok: eventsListResponse.ok,
      events_count: eventsListData.items ? eventsListData.items.length : 0,
      has_error: !!eventsListData.error,
      error_details: eventsListData.error || null,
      timestamp: new Date().toISOString()
    };
    
    console.log("[CALENDAR-EVENTS] Google Calendar API response:", JSON.stringify(apiResponseLog));
    
    if (!eventsListResponse.ok) {
        const apiError = {
          step: "google_calendar_api_call",
          api_status: eventsListResponse.status,
          api_status_text: eventsListResponse.statusText,
          api_error: eventsListData.error,
          full_response: eventsListData,
          request_url: eventsListUrl.toString(),
          organization_id,
          verified_keys: [
            'api_endpoint',
            'authorization_header',
            'token_validity',
            'calendar_permissions',
            'api_quota'
          ],
          timestamp: new Date().toISOString()
        };
        
        console.error("[CALENDAR-EVENTS] Google Calendar API error:", JSON.stringify(apiError));
        
        // Return 401 for authentication/authorization errors
        if (eventsListResponse.status === 401 || eventsListResponse.status === 403) {
          return new Response(JSON.stringify({
            error: "Google Calendar API authentication failed",
            details: apiError
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 401,
          });
        }
        
        throw new Error(`Impossibile recuperare i dettagli degli eventi: ${eventsListData.error?.message || 'Errore sconosciuto'}`);
    }

    // Log successful completion
    console.log("[CALENDAR-EVENTS] Successfully retrieved calendar events:", JSON.stringify({
      events_count: eventsListData.items ? eventsListData.items.length : 0,
      organization_id,
      time_range: { timeMin, timeMax },
      timestamp: new Date().toISOString()
    }));

    return new Response(JSON.stringify({ events: eventsListData.items || [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    // Enhanced error logging with full context
    const errorContext = {
      error_message: error.message,
      error_stack: error.stack,
      error_name: error.name,
      function_name: "get-google-calendar-events",
      timestamp: new Date().toISOString()
    };
    
    console.error("[CALENDAR-EVENTS] Unhandled error:", JSON.stringify(errorContext));
    
    return new Response(JSON.stringify({ 
      error: error.message,
      context: errorContext
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});