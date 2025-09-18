// File: supabase/functions/create-google-event/index.ts

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
        event_summary,
        event_description,
        event_start_time,
        event_end_time,
        attendee_email,
        googleProviderToken,
    } = await req.json();

    if (!googleProviderToken) {
        return new Response(JSON.stringify({ error: "No valid access token found. User needs to re-authenticate with Google." }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!event_summary || !event_start_time || !event_end_time || !attendee_email) {
        throw new Error("Parametri `event_summary`, `event_start_time`, `event_end_time`, e `attendee_email` sono obbligatori.");
    }
    
    const eventBody = {
        summary: event_summary,
        description: event_description || '',
        start: {
            dateTime: event_start_time,
            timeZone: 'Europe/Rome', // Assumiamo una timezone, potrebbe essere resa dinamica
        },
        end: {
            dateTime: event_end_time,
            timeZone: 'Europe/Rome',
        },
        attendees: [
            { email: attendee_email }
        ],
        reminders: {
            useDefault: false,
            overrides: [
                { method: 'email', 'minutes': 24 * 60 },
                { method: 'popup', 'minutes': 10 },
            ],
        },
    };

    const calendarApiUrl = "https://www.googleapis.com/calendar/v3/calendars/primary/events?sendUpdates=all";

    const apiResponse = await fetch(calendarApiUrl, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${googleProviderToken}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(eventBody),
    });

    const responseData = await apiResponse.json();

    if (!apiResponse.ok) {
        console.error("Errore dall'API di Google Calendar:", responseData);
        throw new Error(`Impossibile creare l'evento: ${responseData.error.message}`);
    }

    return new Response(JSON.stringify({ googleEventId: responseData.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Errore in create-google-event:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
