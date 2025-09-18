// File: supabase/functions/update-google-event/index.ts

declare const Deno: {
  env: { get(key: string): string | undefined; };
};

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { getGoogleAccessToken } from "../_shared/google.ts";
import { getOrganizationId } from "../_shared/supabase.ts";

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const {
        google_event_id,
        event_summary,
        event_description,
        event_start_time,
        event_end_time,
        attendee_email,
    } = await req.json();
    
    if (!google_event_id || !event_summary || !event_start_time || !event_end_time || !attendee_email) {
        throw new Error("Tutti i parametri dell'evento sono obbligatori.");
    }
    
    // 1. Ottenere l'ID dell'organizzazione in modo sicuro dal token JWT.
    const organization_id = await getOrganizationId(req);
    
    // 2. Ottenere il token di accesso Google in modo sicuro.
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!serviceRoleKey) throw new Error("La chiave SUPABASE_SERVICE_ROLE_KEY non è impostata.");
    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, serviceRoleKey);
    const googleAccessToken = await getGoogleAccessToken(supabaseAdmin, organization_id);
    
    const eventBody = {
        summary: event_summary,
        description: event_description || '',
        start: { dateTime: event_start_time, timeZone: 'Europe/Rome' },
        end: { dateTime: event_end_time, timeZone: 'Europe/Rome' },
        attendees: [{ email: attendee_email }],
    };

    const calendarApiUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${google_event_id}?sendUpdates=all`;

    const apiResponse = await fetch(calendarApiUrl, {
        method: "PUT",
        headers: {
            "Authorization": `Bearer ${googleAccessToken}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(eventBody),
    });

    const responseData = await apiResponse.json();
    if (!apiResponse.ok) {
        console.error("Errore API Google:", responseData);
        throw new Error(`Impossibile aggiornare l'evento: ${responseData.error.message}`);
    }

    return new Response(JSON.stringify({ success: true, updatedEvent: responseData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Errore in update-google-event:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});