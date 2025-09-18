// File: supabase/functions/get-google-calendar-events/index.ts

declare const Deno: {
  env: { get(key: string): string | undefined; };
};

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, handleCors } from "../_shared/cors.ts";

serve(async (req) => {
  // NOTA: La logica di sicurezza (autenticazione JWT tramite header) non viene rimossa
  // ma questa funzione ora si basa sui parametri espliciti passati dal client per la
  // chiamata a Google, come richiesto per il debug e l'allineamento.
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { accessToken, calendarId, timeMin, timeMax } = await req.json();

    // Validazione robusta del payload come da contratto
    if (!accessToken || !calendarId || !timeMin || !timeMax) {
        throw new Error("Contratto API violato: i parametri `accessToken`, `calendarId`, `timeMin`, e `timeMax` sono tutti obbligatori.");
    }
    
    // Usa i parametri forniti per interrogare l'API di Google Calendar
    const calendarApiUrl = new URL(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`);
    calendarApiUrl.searchParams.set("timeMin", timeMin);
    calendarApiUrl.searchParams.set("timeMax", timeMax);
    calendarApiUrl.searchParams.set("singleEvents", "true"); 
    calendarApiUrl.searchParams.set("orderBy", "startTime");
    calendarApiUrl.searchParams.set("fields", "items(start,end)");

    const apiResponse = await fetch(calendarApiUrl.toString(), {
        headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
        },
    });

    const responseData = await apiResponse.json();

    if (!apiResponse.ok) {
        console.error("Errore dall'API di Google Calendar:", responseData);
        throw new Error(`Impossibile recuperare gli eventi: ${responseData.error.message}`);
    }

    const busySlots = (responseData.items || []).map((event: any) => {
        if (event.start.date) { 
            // Gestisce eventi che durano tutto il giorno
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
    // Restituisce 400 per errori di payload o validazione, come da richiesta.
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});