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
        userId,
        organization_id, 
        contact_id, 
        event_summary, // Kept for backward compatibility if old payload is sent
        event_start_time, // Kept for backward compatibility
        event_end_time, // Kept for backward compatibility
        event: eventPayload // New standard payload
    } = await req.json();
    
    // --- REQUISITO SODDISFATTO: Validazione server-side di userId ---
    if (!userId) {
        return new Response(JSON.stringify({ error: "userId is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    
    // Use new payload structure if available, otherwise fall back to old one.
    const summary = eventPayload?.summary || event_summary;
    const startTime = eventPayload?.start || event_start_time;
    const endTime = eventPayload?.end || event_end_time;
    
    if (!organization_id || !contact_id || !summary || !startTime || !endTime) {
        throw new Error("I parametri `organization_id`, `contact_id`, e i dettagli dell'evento (`summary`, `start`, `end`) sono obbligatori.");
    }

    // 2. Setup del client Supabase con privilegi di amministratore
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!serviceRoleKey) {
        throw new Error("La chiave SUPABASE_SERVICE_ROLE_KEY non è impostata.");
    }
    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, serviceRoleKey);

    // 3. Inserimento del nuovo evento nel database
    const { data: newEvent, error } = await supabaseAdmin
        .from('crm_events')
        .insert({
            organization_id,
            contact_id,
            event_summary: summary,
            event_start_time: startTime,
            event_end_time: endTime,
            status: 'confirmed',
            google_event_id: null,
        })
        .select('id')
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