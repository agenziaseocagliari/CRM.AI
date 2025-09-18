// File: supabase/functions/get-google-calendar-events/index.ts

declare const Deno: {
  env: { get(key: string): string | undefined; };
};

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";
import { getGoogleAccessToken } from "../_shared/google.ts";
import { getOrganizationId } from '../_shared/supabase.ts';

// CORS Headers centralizzati per TUTTE le risposte
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

// Gestione delle richieste OPTIONS (preflight)
function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: corsHeaders,
      status: 200 
    });
  }
  return null;
}

// Helper per creare risposte con CORS sempre inclusi
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
  console.log(`[${new Date().toISOString()}] [CALENDAR-EVENTS] Richiesta ricevuta:`, {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries()),
  });

  // Gestione CORS per richieste OPTIONS
  const corsResponse = handleCors(req);
  if (corsResponse) {
    console.log(`[${new Date().toISOString()}] [CALENDAR-EVENTS] Risposta CORS OPTIONS inviata`);
    return corsResponse;
  }

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
          userAgent: req.headers.get('user-agent'),
        },
      },
      authentication: null,
      googleIntegration: null,
      error: null,
    },
  };

  try {
    // 1. Validazione parametri
    console.log(`[${new Date().toISOString()}] [CALENDAR-EVENTS] Estrazione payload dalla richiesta...`);
    diagnostic.stage = 'PARAMETER_VALIDATION';
    
    const { timeMin, timeMax } = await req.json();
    console.log(`[${new Date().toISOString()}] [CALENDAR-EVENTS] Parametri estratti:`, { timeMin, timeMax });

    if (!timeMin || !timeMax) {
      const errorMsg = "I parametri `timeMin` e `timeMax` sono obbligatori.";
      diagnostic.diagnostics.error = {
        message: errorMsg,
        code: 'MISSING_REQUIRED_PARAMETERS',
        context: { timeMin, timeMax }
      };
      console.error(`[${new Date().toISOString()}] [CALENDAR-EVENTS] ERRORE - Parametri mancanti:`, diagnostic.diagnostics.error);
      return createResponse(JSON.stringify({ 
        error: errorMsg,
        diagnostic 
      }), 400);
    }

    // 2. Estrazione organization_id dal JWT
    console.log(`[${new Date().toISOString()}] [CALENDAR-EVENTS] Estrazione organization_id dal token JWT...`);
    diagnostic.stage = 'ORGANIZATION_EXTRACTION';
    
    let organization_id;
    try {
      organization_id = await getOrganizationId(req);
      diagnostic.diagnostics.authentication = {
        hasAuthHeader: !!req.headers.get('authorization'),
        organizationFound: !!organization_id,
        organizationId: organization_id || null,
      };
      console.log(`[${new Date().toISOString()}] [CALENDAR-EVENTS] Organization ID estratto:`, { organization_id });
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
          authHeaderValue: req.headers.get('authorization') ? '[REDACTED]' : null
        }
      };
      console.error(`[${new Date().toISOString()}] [CALENDAR-EVENTS] ERRORE - Estrazione organization_id fallita:`, diagnostic.diagnostics.error);
      return createResponse(JSON.stringify({ 
        error: authError.message,
        diagnostic 
      }), 401);
    }

    // 3. Recupero token Google
    console.log(`[${new Date().toISOString()}] [CALENDAR-EVENTS] Recupero token di accesso Google...`);
    diagnostic.stage = 'GOOGLE_TOKEN_RETRIEVAL';
    
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!serviceRoleKey) {
      const errorMsg = "La chiave SUPABASE_SERVICE_ROLE_KEY non è impostata.";
      diagnostic.diagnostics.error = {
        message: errorMsg,
        code: 'MISSING_SERVICE_ROLE_KEY',
        context: {}
      };
      console.error(`[${new Date().toISOString()}] [CALENDAR-EVENTS] ERRORE - Service role key mancante`);
      return createResponse(JSON.stringify({ 
        error: errorMsg,
        diagnostic 
      }), 500);
    }

    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, serviceRoleKey);
    let googleAccessToken;
    try {
      googleAccessToken = await getGoogleAccessToken(supabaseAdmin, organization_id);
      diagnostic.diagnostics.googleIntegration = {
        tokenRetrieved: !!googleAccessToken,
        organizationId: organization_id,
      };
      console.log(`[${new Date().toISOString()}] [CALENDAR-EVENTS] Token Google recuperato con successo per org:`, organization_id);
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
      console.error(`[${new Date().toISOString()}] [CALENDAR-EVENTS] ERRORE - Recupero token Google fallito:`, diagnostic.diagnostics.error);
      return createResponse(JSON.stringify({ 
        error: googleError.message,
        diagnostic 
      }), 401);
    }

    // 4. Chiamata API Google Calendar
    console.log(`[${new Date().toISOString()}] [CALENDAR-EVENTS] Chiamata API Google Calendar...`);
    diagnostic.stage = 'GOOGLE_API_CALL';
    
    const eventsListUrl = new URL("https://www.googleapis.com/calendar/v3/calendars/primary/events");
    eventsListUrl.searchParams.set("timeMin", timeMin);
    eventsListUrl.searchParams.set("timeMax", timeMax);
    eventsListUrl.searchParams.set("singleEvents", "true");
    eventsListUrl.searchParams.set("orderBy", "startTime");

    console.log(`[${new Date().toISOString()}] [CALENDAR-EVENTS] URL chiamata:`, eventsListUrl.toString());

    const eventsListResponse = await fetch(eventsListUrl.toString(), {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${googleAccessToken}`,
      },
    });

    const eventsListData = await eventsListResponse.json();
    console.log(`[${new Date().toISOString()}] [CALENDAR-EVENTS] Risposta Google API:`, {
      status: eventsListResponse.status,
      ok: eventsListResponse.ok,
      itemsCount: eventsListData.items?.length || 0
    });

    if (!eventsListResponse.ok) {
      diagnostic.diagnostics.error = {
        message: `Impossibile recuperare gli eventi: ${eventsListData.error?.message || 'Errore sconosciuto'}`,
        code: 'GOOGLE_API_ERROR',
        context: {
          googleApiStatus: eventsListResponse.status,
          googleApiError: eventsListData.error || eventsListData
        }
      };
      console.error(`[${new Date().toISOString()}] [CALENDAR-EVENTS] ERRORE - Chiamata Google API fallita:`, diagnostic.diagnostics.error);
      return createResponse(JSON.stringify({ 
        error: `Impossibile recuperare i dettagli degli eventi: ${eventsListData.error?.message || 'Errore sconosciuto'}`,
        diagnostic 
      }), 500);
    }

    // 5. Successo
    diagnostic.success = true;
    diagnostic.stage = 'SUCCESS';
    
    console.log(`[${new Date().toISOString()}] [CALENDAR-EVENTS] Successo - Eventi recuperati:`, {
      count: eventsListData.items?.length || 0,
      organizationId: organization_id
    });

    return createResponse(JSON.stringify({
      events: eventsListData.items || [],
      diagnostic
    }));

  } catch (error) {
    diagnostic.diagnostics.error = {
      message: error.message,
      stack: error.stack,
      name: error.name
    };
    
    console.error(`[${new Date().toISOString()}] [CALENDAR-EVENTS] ERRORE GENERALE:`, {
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