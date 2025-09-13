// File: supabase/functions/create-crm-event/index.ts

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";
import { corsHeaders, handleCors } from "../_shared/cors.ts";

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // 1. Validazione dell'input
    const { 
        organization_id, 
        contact_id, 
        event_summary, 
        event_start_time, 
        event_end_time 
    } = await req.json();
    
    if (!organization_id || !contact_id || !event_summary || !event_start_time || !event_end_time) {
        throw new Error("I parametri `organization_id`, `contact_id`, `event_summary`, `event_start_time` e `event_end_time` sono obbligatori.");
    }

    // 2. Setup del client Supabase con privilegi di amministratore
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!serviceRoleKey) {
        throw new Error("La chiave SUPABASE_SERVICE_ROLE_KEY non è impostata.");
    }
    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, serviceRoleKey);

    // 3. Inserimento del nuovo evento nel database
    // L'evento è creato solo nel CRM, quindi `google_event_id` sarà null.
    const { data: newEvent, error } = await supabaseAdmin
        .from('crm_events')
        .insert({
            organization_id,
            contact_id,
            event_summary,
            event_start_time,
            event_end_time,
            status: 'confirmed', // Lo stato di default per un evento creato manualmente
            google_event_id: null, // Nessun ID Google associato
        })
        .select('id') // Restituisce solo l'ID del nuovo evento creato
        .single();

    if (error) {
        console.error("Errore durante l'inserimento dell'evento nel CRM:", error);
        throw new Error(`Errore database: ${error.message}`);
    }

    // 4. Risposta di successo
    return new Response(JSON.stringify({ success: true, newEventId: newEvent.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Errore nella funzione `create-crm-event`:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
