// File: supabase/functions/update-google-event/index.ts

declare const Deno: {
  env: { get(key: string): string | undefined; };
};

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";
import { getGoogleAccessToken } from "../_shared/google.ts";
import { getOrganizationId } from "../_shared/supabase.ts";

// CORS Headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
};

function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: corsHeaders,
      status: 200 
    });
  }
  return null;
}

function createResponse(body: string, status: number = 200): Response {
  return new Response(body, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
    status,
  });
}

serve(async (req) => {
  console.log(`[${new Date().toISOString()}] [UPDATE-GOOGLE-EVENT] Request received`);
  
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  let diagnostic = {
    timestamp: new Date().toISOString(),
    stage: 'INITIALIZATION',
    success: false,
    diagnostics: {
      request: {
        method: req.method,
        url: req.url,
        headers: {
          authorization: req.headers.get('authorization') ? '[PRESENT]' : null,
          contentType: req.headers.get('content-type'),
        },
      },
      authentication: null,
      googleIntegration: null,
      error: null,
    },
  };

  try {
    // 1. Parse and validate request body
    console.log(`[${new Date().toISOString()}] [UPDATE-GOOGLE-EVENT] Parsing request body...`);
    diagnostic.stage = 'PARAMETER_VALIDATION';
    
    const eventData = await req.json();
    console.log(`[${new Date().toISOString()}] [UPDATE-GOOGLE-EVENT] Event data received:`, eventData);

    // Validate required fields
    if (!eventData.eventId || !eventData.summary || !eventData.start || !eventData.end) {
      const errorMsg = "Required fields missing: eventId, summary, start, and end are required";
      diagnostic.diagnostics.error = {
        message: errorMsg,
        code: 'MISSING_REQUIRED_FIELDS',
        context: { eventData }
      };
      console.error(`[${new Date().toISOString()}] [UPDATE-GOOGLE-EVENT] ERROR - Required fields missing:`, diagnostic.diagnostics.error);
      return createResponse(JSON.stringify({ 
        error: errorMsg,
        diagnostic 
      }), 400);
    }

    // 2. Extract organization_id from JWT
    console.log(`[${new Date().toISOString()}] [UPDATE-GOOGLE-EVENT] Extracting organization_id from JWT...`);
    diagnostic.stage = 'ORGANIZATION_EXTRACTION';
    
    let organization_id;
    try {
      organization_id = await getOrganizationId(req);
      diagnostic.diagnostics.authentication = {
        hasAuthHeader: !!req.headers.get('authorization'),
        organizationFound: !!organization_id,
        organizationId: organization_id || null,
      };
      console.log(`[${new Date().toISOString()}] [UPDATE-GOOGLE-EVENT] Organization ID extracted:`, { organization_id });
    } catch (authError) {
      diagnostic.diagnostics.authentication = {
        hasAuthHeader: !!req.headers.get('authorization'),
        organizationFound: false,
        organizationId: null,
        error: authError.message
      };
      diagnostic.diagnostics.error = {
        message: authError.message,
        code: 'ORGANIZATION_EXTRACTION_FAILED',
        context: {
          hasAuthHeader: !!req.headers.get('authorization'),
        }
      };
      console.error(`[${new Date().toISOString()}] [UPDATE-GOOGLE-EVENT] ERROR - Organization ID extraction failed:`, diagnostic.diagnostics.error);
      return createResponse(JSON.stringify({ 
        error: authError.message,
        diagnostic 
      }), 401);
    }

    // 3. Get Google access token
    console.log(`[${new Date().toISOString()}] [UPDATE-GOOGLE-EVENT] Getting Google access token...`);
    diagnostic.stage = 'GOOGLE_TOKEN_RETRIEVAL';
    
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!serviceRoleKey) {
      const errorMsg = "SUPABASE_SERVICE_ROLE_KEY is not set.";
      diagnostic.diagnostics.error = {
        message: errorMsg,
        code: 'MISSING_SERVICE_ROLE_KEY',
        context: {}
      };
      console.error(`[${new Date().toISOString()}] [UPDATE-GOOGLE-EVENT] ERROR - Service role key missing`);
      return createResponse(JSON.stringify({ 
        error: errorMsg,
        diagnostic 
      }), 500);
    }

    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, serviceRoleKey);
    let googleAccessToken;
    
    try {
      // This will use the robust token parsing from _shared/google.ts
      googleAccessToken = await getGoogleAccessToken(supabaseAdmin, organization_id);
      diagnostic.diagnostics.googleIntegration = {
        tokenRetrieved: !!googleAccessToken,
        organizationId: organization_id,
      };
      console.log(`[${new Date().toISOString()}] [UPDATE-GOOGLE-EVENT] Google token retrieved successfully for org:`, organization_id);
    } catch (googleError) {
      diagnostic.diagnostics.googleIntegration = {
        tokenRetrieved: false,
        organizationId: organization_id,
        error: googleError.message
      };
      diagnostic.diagnostics.error = {
        message: googleError.message,
        code: 'GOOGLE_TOKEN_RETRIEVAL_FAILED',
        context: {
          organizationId: organization_id
        }
      };
      console.error(`[${new Date().toISOString()}] [UPDATE-GOOGLE-EVENT] ERROR - Google token retrieval failed:`, diagnostic.diagnostics.error);
      return createResponse(JSON.stringify({ 
        error: googleError.message,
        diagnostic 
      }), 401);
    }

    // 4. Update Google Calendar event
    console.log(`[${new Date().toISOString()}] [UPDATE-GOOGLE-EVENT] Updating Google Calendar event...`);
    diagnostic.stage = 'GOOGLE_API_CALL';
    
    // Build the Google Calendar event object for update
    const googleEvent = {
      summary: eventData.summary,
      description: eventData.description || '',
      start: {
        dateTime: eventData.start,
        timeZone: eventData.timeZone || 'UTC',
      },
      end: {
        dateTime: eventData.end,
        timeZone: eventData.timeZone || 'UTC',
      },
      attendees: eventData.attendees || [],
      reminders: {
        useDefault: false,
        overrides: eventData.reminders || [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 10 },
        ],
      },
    };

    console.log(`[${new Date().toISOString()}] [UPDATE-GOOGLE-EVENT] Google event object:`, googleEvent);
    console.log(`[${new Date().toISOString()}] [UPDATE-GOOGLE-EVENT] Updating event ID:`, eventData.eventId);

    const updateResponse_google = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventData.eventId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${googleAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(googleEvent),
    });

    const updateResponseData = await updateResponse_google.json();
    console.log(`[${new Date().toISOString()}] [UPDATE-GOOGLE-EVENT] Google API response:`, {
      status: updateResponse_google.status,
      ok: updateResponse_google.ok,
      eventId: updateResponseData.id
    });

    if (!updateResponse_google.ok) {
      diagnostic.diagnostics.error = {
        message: `Failed to update Google Calendar event: ${updateResponseData.error?.message || 'Unknown error'}`,
        code: 'GOOGLE_API_ERROR',
        context: {
          googleApiStatus: updateResponse_google.status,
          googleApiError: updateResponseData.error || updateResponseData,
          eventId: eventData.eventId
        }
      };
      console.error(`[${new Date().toISOString()}] [UPDATE-GOOGLE-EVENT] ERROR - Google API call failed:`, diagnostic.diagnostics.error);
      return createResponse(JSON.stringify({ 
        error: `Failed to update calendar event: ${updateResponseData.error?.message || 'Unknown error'}`,
        diagnostic 
      }), 500);
    }

    // 5. Success
    diagnostic.success = true;
    diagnostic.stage = 'SUCCESS';
    
    console.log(`[${new Date().toISOString()}] [UPDATE-GOOGLE-EVENT] Success - Event updated:`, {
      eventId: updateResponseData.id,
      organizationId: organization_id
    });

    return createResponse(JSON.stringify({
      success: true,
      event: updateResponseData,
      diagnostic
    }));

  } catch (error) {
    diagnostic.diagnostics.error = {
      message: error.message,
      stack: error.stack,
      name: error.name
    };
    
    console.error(`[${new Date().toISOString()}] [UPDATE-GOOGLE-EVENT] GENERAL ERROR:`, {
      stage: diagnostic.stage,
      error: error.message,
      stack: error.stack,
      diagnostic
    });
    
    return createResponse(JSON.stringify({ 
      error: error.message,
      diagnostic
    }), 500);
  }
});