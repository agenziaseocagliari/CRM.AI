// File: supabase/functions/get-all-crm-events/index.ts

declare const Deno: {
  env: { get(key: string): string | undefined; };
};

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";
import { corsHeaders, handleCors } from "../_shared/cors.ts";

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { organization_id } = await req.json();
    if (!organization_id) {
      throw new Error("Il parametro 'organization_id' è obbligatorio.");
    }

    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!serviceRoleKey) {
        throw new Error("La chiave SUPABASE_SERVICE_ROLE_KEY non è impostata.");
    }

    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, serviceRoleKey);
    
    // --- FIX STRATEGICO: Eseguiamo query separate per evitare errori di relazione in PostgREST ---
    // 1. Recupera tutti gli eventi per l'organizzazione.
    const { data: rawEvents, error: eventsError } = await supabaseAdmin
        .from('crm_events')
        .select('*')
        .eq('organization_id', organization_id)
        .order('event_start_time', { ascending: false });

    if (eventsError) throw eventsError;
    
    // Gestisce il caso in cui non ci siano eventi, restituendo un array vuoto.
    if (!rawEvents) {
         return new Response(JSON.stringify({ events: [] }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });
    }
    
    // 2. Recupera tutti i promemoria per l'organizzazione.
    const { data: reminders, error: remindersError } = await supabaseAdmin
        .from('event_reminders')
        .select('*')
        .eq('organization_id', organization_id);
    
    if (remindersError) throw remindersError;

    // 3. Unisci i dati manualmente in JavaScript per massima robustezza.
    // Crea una mappa per un accesso efficiente agli eventi.
    const eventsMap = new Map(rawEvents.map(event => [event.id, { ...event, event_reminders: [] }]));

    // Se ci sono promemoria, li assegna all'evento corrispondente.
    if (reminders) {
        for (const reminder of reminders) {
            const event = eventsMap.get(reminder.crm_event_id);
            // FIX: The value retrieved from the map was being inferred as 'unknown'.
            // By getting the event first and checking for its existence, we create a type guard.
            // We then cast it to 'any' to safely access the 'event_reminders' property.
            if (event) {
                (event as any).event_reminders.push(reminder);
            }
        }
    }
    
    // Converte la mappa in un array per la risposta.
    const events = Array.from(eventsMap.values());

    return new Response(JSON.stringify({ events }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Errore in get-all-crm-events:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});