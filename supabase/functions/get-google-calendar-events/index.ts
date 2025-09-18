// File: supabase/functions/get-google-calendar-events/index.ts

declare const Deno: {
  env: { get(key: string): string | undefined; };
};

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { getGoogleAccessToken } from "../_shared/google.ts";
import { getOrganizationId } from '../_shared/supabase.ts';

// Diagnostics helper function
function createDiagnosticPayload(
  stage: string,
  success: boolean,
  headers: Record<string, string | null>,
  req: Request,
  error?: any,
  user?: any,
  profileData?: any,
  organizationId?: string,
  googleTokenInfo?: any
) {
  const timestamp = new Date().toISOString();
  const truncatedToken = headers.Authorization ? 
    `${headers.Authorization.substring(0, 20)}...${headers.Authorization.substring(headers.Authorization.length - 10)}` : 
    null;
  
  return {
    timestamp,
    stage,
    success,
    diagnostics: {
      request: {
        method: req.method,
        url: req.url,
        headers: {
          authorization: truncatedToken,
          contentType: headers['Content-Type'],
          userAgent: headers['User-Agent']
        }
      },
      authentication: {
        hasAuthHeader: !!headers.Authorization,
        user: user ? {
          id: user.id,
          email: user.email,
          role: user.role
        } : null,
        profileQuery: profileData ? {
          found: true,
          organizationId: organizationId
        } : null
      },
      googleIntegration: googleTokenInfo || null,
      error: error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : null
    }
  };
}

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [CALENDAR-API] Request initiated`, {
    method: req.method,
    url: req.url
  });

  // Extract headers for diagnostics
  const requestHeaders = {
    'Authorization': req.headers.get('Authorization'),
    'Content-Type': req.headers.get('Content-Type'),
    'User-Agent': req.headers.get('User-Agent')
  };

  try {
    // Step 1: Parse and validate request payload
    const { timeMin, timeMax } = await req.json();
    console.log(`[${timestamp}] [CALENDAR-API] Payload received:`, { timeMin, timeMax });

    if (!timeMin || !timeMax) {
      const diagnostic = createDiagnosticPayload(
        'PAYLOAD_VALIDATION',
        false,
        requestHeaders,
        req,
        new Error("I parametri `timeMin` e `timeMax` sono obbligatori.")
      );
      console.error(`[${timestamp}] [CALENDAR-API] Payload validation failed:`, diagnostic);
      
      return new Response(JSON.stringify({
        error: "I parametri `timeMin` e `timeMax` sono obbligatori.",
        diagnostic
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }
    
    // Step 2: Extract organization ID securely from JWT
    let organization_id: string;
    let user: any = null;
    let profileData: any = null;
    
    try {
      console.log(`[${timestamp}] [CALENDAR-API] Starting organization ID extraction...`);
      
      // Create supabase client for authentication
      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: requestHeaders.Authorization! } } }
      );

      // Get user from JWT
      const { data: { user: authUser }, error: userError } = await supabaseClient.auth.getUser();
      user = authUser;
      
      if (userError || !user) {
        const diagnostic = createDiagnosticPayload(
          'USER_AUTHENTICATION',
          false,
          requestHeaders,
          req,
          userError || new Error("User not found"),
          user
        );
        console.error(`[${timestamp}] [CALENDAR-API] User authentication failed:`, diagnostic);
        
        return new Response(JSON.stringify({
          error: "Accesso negato: utente non autenticato o sessione scaduta.",
          diagnostic
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        });
      }

      console.log(`[${timestamp}] [CALENDAR-API] User authenticated:`, {
        userId: user.id,
        email: user.email
      });

      // Get user profile and organization ID
      const { data: profile, error: profileError } = await supabaseClient
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      profileData = profile;
      
      if (profileError || !profile) {
        const diagnostic = createDiagnosticPayload(
          'PROFILE_LOOKUP',
          false,
          requestHeaders,
          req,
          profileError || new Error("Profile not found"),
          user,
          profileData
        );
        console.error(`[${timestamp}] [CALENDAR-API] Profile lookup failed:`, diagnostic);
        
        return new Response(JSON.stringify({
          error: "Impossibile determinare l'organizzazione: profilo utente non trovato.",
          diagnostic
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 403,
        });
      }

      organization_id = profile.organization_id;
      console.log(`[${timestamp}] [CALENDAR-API] Organization ID extracted:`, {
        organizationId: organization_id,
        userId: user.id
      });

    } catch (orgError) {
      const diagnostic = createDiagnosticPayload(
        'ORGANIZATION_EXTRACTION',
        false,
        requestHeaders,
        req,
        orgError,
        user,
        profileData
      );
      console.error(`[${timestamp}] [CALENDAR-API] Organization extraction error:`, diagnostic);
      
      return new Response(JSON.stringify({
        error: orgError.message,
        diagnostic
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    // Step 3: Get Google access token
    let googleAccessToken: string;
    let googleTokenInfo: any = null;
    
    try {
      console.log(`[${timestamp}] [CALENDAR-API] Starting Google token retrieval...`);
      
      const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      if (!serviceRoleKey) {
        throw new Error("La chiave SUPABASE_SERVICE_ROLE_KEY non è impostata.");
      }
      
      const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, serviceRoleKey);
      googleAccessToken = await getGoogleAccessToken(supabaseAdmin, organization_id);
      
      googleTokenInfo = {
        hasToken: !!googleAccessToken,
        tokenLength: googleAccessToken ? googleAccessToken.length : 0,
        organizationId: organization_id
      };
      
      console.log(`[${timestamp}] [CALENDAR-API] Google token retrieved successfully:`, googleTokenInfo);
      
    } catch (tokenError) {
      const diagnostic = createDiagnosticPayload(
        'GOOGLE_TOKEN_RETRIEVAL',
        false,
        requestHeaders,
        req,
        tokenError,
        user,
        profileData,
        organization_id,
        googleTokenInfo
      );
      console.error(`[${timestamp}] [CALENDAR-API] Google token retrieval failed:`, diagnostic);
      
      return new Response(JSON.stringify({
        error: `Errore nel recupero del token Google: ${tokenError.message}`,
        diagnostic
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }
    
    // Step 4: Call Google Calendar API
    try {
      console.log(`[${timestamp}] [CALENDAR-API] Calling Google Calendar API...`);
      
      const eventsListUrl = new URL("https://www.googleapis.com/calendar/v3/calendars/primary/events");
      eventsListUrl.searchParams.set("timeMin", timeMin);
      eventsListUrl.searchParams.set("timeMax", timeMax);
      eventsListUrl.searchParams.set("singleEvents", "true");
      eventsListUrl.searchParams.set("orderBy", "startTime");

      const eventsListResponse = await fetch(eventsListUrl.toString(), {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${googleAccessToken}`
        },
      });

      const eventsListData = await eventsListResponse.json();
      
      if (!eventsListResponse.ok) {
        const diagnostic = createDiagnosticPayload(
          'GOOGLE_CALENDAR_API',
          false,
          requestHeaders,
          req,
          new Error(`Google Calendar API error: ${eventsListData.error?.message || 'Unknown error'}`),
          user,
          profileData,
          organization_id,
          googleTokenInfo
        );
        console.error(`[${timestamp}] [CALENDAR-API] Google Calendar API error:`, {
          status: eventsListResponse.status,
          response: eventsListData,
          diagnostic
        });
        
        return new Response(JSON.stringify({
          error: `Impossibile recuperare i dettagli degli eventi: ${eventsListData.error?.message || 'Errore sconosciuto'}`,
          diagnostic
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        });
      }

      console.log(`[${timestamp}] [CALENDAR-API] Google Calendar API call successful:`, {
        eventsCount: eventsListData.items?.length || 0,
        organizationId: organization_id
      });

      // Success response with diagnostic info (for successful calls)
      const successDiagnostic = createDiagnosticPayload(
        'SUCCESS',
        true,
        requestHeaders,
        req,
        null,
        user,
        profileData,
        organization_id,
        googleTokenInfo
      );

      return new Response(JSON.stringify({ 
        events: eventsListData.items || [],
        diagnostic: successDiagnostic
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });

    } catch (apiError) {
      const diagnostic = createDiagnosticPayload(
        'GOOGLE_API_CALL',
        false,
        requestHeaders,
        req,
        apiError,
        user,
        profileData,
        organization_id,
        googleTokenInfo
      );
      console.error(`[${timestamp}] [CALENDAR-API] Google API call failed:`, diagnostic);
      
      return new Response(JSON.stringify({
        error: `Errore nella chiamata API Google: ${apiError.message}`,
        diagnostic
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

  } catch (error) {
    const diagnostic = createDiagnosticPayload(
      'GENERAL_ERROR',
      false,
      requestHeaders,
      req,
      error
    );
    console.error(`[${timestamp}] [CALENDAR-API] General error:`, diagnostic);
    
    return new Response(JSON.stringify({
      error: error.message,
      diagnostic
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});