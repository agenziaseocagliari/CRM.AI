
// File: supabase/functions/get-google-calendar-events/index.ts

declare const Deno: {
  env: { get(key: string): string | undefined; };
};

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, handleCors } from "../_shared/cors.ts";

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { organization_id, date, googleProviderToken } = await req.json(); // La data è in formato "YYYY-MM-DD"

    if (!googleProviderToken) {
        return new Response(JSON.stringify({ error: "No valid access token found. User needs to re-authenticate with Google." }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!organization_id || !date) {
        throw new Error("I parametri organization_id e date sono obbligatori.");
    }
    
    // Interroga l'API di Google Calendar per gli eventi nella data specificata.
    const timeMin = new Date(`${date}T00:00:00.000Z`).toISOString();
    const timeMax = new Date(`${date}T23:59:59.999Z`).toISOString();
    
    const calendarApiUrl = new URL("https://www.googleapis.com/calendar/v3/calendars/primary/events");
    calendarApiUrl.searchParams.set("timeMin", timeMin);
    calendarApiUrl.searchParams.set("timeMax", timeMax);
    calendarApiUrl.searchParams.set("singleEvents", "true"); 
    calendarApiUrl.searchParams.set("orderBy", "startTime");
    calendarApiUrl.searchParams.set("fields", "items(start,end)");

    const apiResponse = await fetch(calendarApiUrl.toString(), {
        headers: {
            "Authorization": `Bearer ${googleProviderToken}`,
            "Content-Type": "application/json",
        },
    });

    if (!apiResponse.ok) {
        const errorBody = await apiResponse.json();
        console.error("Errore dall'API di Google Calendar:", errorBody);
        throw new Error(`Impossibile recuperare gli eventi: ${errorBody.error.message}`);
    }

    const calendarData = await apiResponse.json();

    const busySlots = calendarData.items.map((event: any) => {
        if (event.start.date) { 
            return {
                start: new Date(`${event.start.date}T00:00:00.000Z`).toISOString(),
                end: new Date(`${event.start.date}T23:59:59.999Z`).toISOString(),
            };
        }
        return {
            start: event.start.dateTime,
            end: event.end.dateTime,
        };
    });

    return new Response(JSON.stringify({ busySlots }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Errore in get-google-calendar-events:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500, 
    });
  }
});
