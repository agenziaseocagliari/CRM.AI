// File: supabase/functions/update-google-event/index.ts

declare const Deno: {
  env: { get(key: string): string | undefined; };
};

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, handleCors } from "../_shared/cors.ts";

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
        googleProviderToken,
    } = await req.json();

    if (!googleProviderToken) {
        return new Response(JSON.stringify({ error: "No valid access token found." }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!google_event_id || !event_summary || !event_start_time || !event_end_time || !attendee_email) {
        throw new Error("Tutti i parametri dell'evento sono obbligatori.");
    }
    
    const eventBody = {
        summary: event_summary,
        description: event_description || '',
        start: { dateTime: event_start_time, timeZone: 'Europe/Rome' },
        end: { dateTime: event_end_time, timeZone: 'Europe/Rome' },
        attendees: [{ email: attendee_email }],
    };

    const calendarApiUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${google_event_id}?sendUpdates=all`;

    const apiResponse = await fetch(calendarApiUrl, {
        method: "PUT", // o PATCH se si aggiornano solo alcuni campi
        headers: {
            "Authorization": `Bearer ${googleProviderToken}`,
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
