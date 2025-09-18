// File: supabase/functions/get-google-calendar-events/index.ts

declare const Deno: {
  env: { get(key: string): string | undefined; };
};

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { getGoogleAccessToken } from "../_shared/google.ts";
import { getOrganizationId } from '../_shared/supabase.ts';

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { timeMin, timeMax } = await req.json();

    if (!timeMin || !timeMax) {
      throw new Error("I parametri `timeMin` e `timeMax` sono obbligatori.");
    }
    
    // 1. Ottenere l'ID dell'organizzazione in modo sicuro dal token JWT.
    const organization_id = await getOrganizationId(req);

    // 2. Ottenere il token di accesso Google in modo sicuro.
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!serviceRoleKey) throw new Error("La chiave SUPABASE_SERVICE_ROLE_KEY non è impostata.");
    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, serviceRoleKey);
    const googleAccessToken = await getGoogleAccessToken(supabaseAdmin, organization_id);
    
    // 3. Chiamata all'API di Google Calendar per ottenere la lista degli eventi.
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
        console.error("Errore dall'API di Google Calendar (events.list):", eventsListData);
        throw new Error(`Impossibile recuperare i dettagli degli eventi: ${eventsListData.error?.message || 'Errore sconosciuto'}`);
    }


    return new Response(JSON.stringify({ events: eventsListData.items || [] }), {
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
