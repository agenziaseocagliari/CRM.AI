// File: supabase/functions/get-google-calendar-events/index.ts

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
    const { date } = await req.json(); // La data è in formato "YYYY-MM-DD"

    if (!date) {
        throw new Error("Il parametro `date` è obbligatorio.");
    }
    
    // 1. Ottenere l'ID dell'organizzazione in modo sicuro dal token JWT.
    const organization_id = await getOrganizationId(req);
    
    // 2. Ottenere in modo sicuro il token di accesso a Google (gestendo il refresh se necessario).
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!serviceRoleKey) throw new Error("La chiave SUPABASE_SERVICE_ROLE_KEY non è impostata.");
    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, serviceRoleKey);
    const googleAccessToken = await getGoogleAccessToken(supabaseAdmin, organization_id);
    
    // 3. Interrogare l'API di Google Calendar per gli eventi.
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
            "Authorization": `Bearer ${googleAccessToken}`,
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