// File: supabase/functions/get-google-calendar-events/index.ts

declare const Deno: {
  env: { get(key: string): string | undefined; };
};

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";
import { getGoogleTokens } from "../_shared/google.ts";
import { getOrganizationId } from '../_shared/supabase.ts';
import { corsHeaders, handleCors } from "../_shared/cors.ts";

// Helper function to write debug logs to the database
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

// Helper for creating consistent JSON responses
function createResponse(body: object, status: number = 200): Response {
  return new Response(JSON.stringify(body, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  });
}

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!serviceRoleKey) {
    console.error("CRITICAL ERROR: SUPABASE_SERVICE_ROLE_KEY is not set.");
    return createResponse({ error: "Server configuration error." }, 500);
  }
  const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, serviceRoleKey);
  const functionName = 'get-google-calendar-events';
  
  let organization_id: string | null = null;
  let requestPayload: any = {};

  try {
    // 1. Log Start & Validate Parameters
    requestPayload = await req.json();
    await writeDebugLog(supabaseAdmin, functionName, null, 'function-start', {
      request_payload: requestPayload,
      extra: { headers: Object.fromEntries(req.headers.entries()) }
    });

    const { timeMin, timeMax } = requestPayload;
    if (!timeMin || !timeMax) {
      throw new Error("Parameters `timeMin` and `timeMax` are required.");
    }

    // 2. Extract Organization ID from JWT
    organization_id = await getOrganizationId(req);
    await writeDebugLog(supabaseAdmin, functionName, organization_id, 'organization-extraction-success', {
      request_payload: requestPayload,
      extra: { organization_id }
    });

    // 3. Retrieve Google Access Token
    let googleAccessToken: string;
    await writeDebugLog(supabaseAdmin, functionName, organization_id, 'get-google-token-start', { request_payload: requestPayload });
    
    const tokens = await getGoogleTokens(supabaseAdmin, organization_id);
    if (!tokens || !tokens.access_token) {
      await writeDebugLog(supabaseAdmin, functionName, organization_id, 'get-google-token-failure', { 
          request_payload: requestPayload, 
          google_auth_token_value: tokens 
      }, new Error("Failed to retrieve a valid Google access token."));
      throw new Error("Could not retrieve a valid Google access token. Please re-authenticate.");
    }
    googleAccessToken = tokens.access_token;

    await writeDebugLog(supabaseAdmin, functionName, organization_id, 'get-google-token-success', { 
        request_payload: requestPayload,
        extra: { accessTokenPresent: !!googleAccessToken }
    });
    
    // 4. Call Google Calendar API
    const eventsListUrl = new URL("https://www.googleapis.com/calendar/v3/calendars/primary/events");
    eventsListUrl.searchParams.set("timeMin", timeMin);
    eventsListUrl.searchParams.set("timeMax", timeMax);
    eventsListUrl.searchParams.set("singleEvents", "true");
    eventsListUrl.searchParams.set("orderBy", "startTime");

    await writeDebugLog(supabaseAdmin, functionName, organization_id, 'google-api-call-start', {
      request_payload: requestPayload,
      extra: { apiUrl: eventsListUrl.toString() }
    });

    const eventsListResponse = await fetch(eventsListUrl.toString(), {
      method: "GET",
      headers: { "Authorization": `Bearer ${googleAccessToken}` },
    });

    const responseBodyText = await eventsListResponse.text();
    let eventsListData;
    try {
        eventsListData = JSON.parse(responseBodyText);
    } catch {
        eventsListData = { error: { message: "Invalid JSON response from Google" }, raw_body: responseBodyText };
    }

    await writeDebugLog(supabaseAdmin, functionName, organization_id, 'google-api-call-response', {
      request_payload: requestPayload,
      extra: { 
        status: eventsListResponse.status,
        ok: eventsListResponse.ok,
        response: eventsListData
      }
    });

    if (!eventsListResponse.ok) {
      throw new Error(`Google API Error (${eventsListResponse.status}): ${eventsListData.error?.message || responseBodyText}`);
    }

    // 5. Success
    await writeDebugLog(supabaseAdmin, functionName, organization_id, 'function-success', {
      request_payload: requestPayload,
      extra: { itemCount: eventsListData.items?.length || 0 }
    });

    return createResponse({ events: eventsListData.items || [] });

  } catch (error) {
    console.error(`[${functionName}] Error:`, error.message);
    
    // Log the final error to the database
    await writeDebugLog(supabaseAdmin, functionName, organization_id, 'function-error', { 
      request_payload: requestPayload,
      extra: { caught_error: error.message }
    }, error);
    
    return createResponse({ error: error.message }, 500);
  }
});