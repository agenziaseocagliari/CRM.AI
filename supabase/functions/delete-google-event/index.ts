// File: supabase/functions/delete-google-event/index.ts

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
    const { google_event_id, crm_event_id } = await req.json();
    
    if (!crm_event_id) {
        throw new Error("Il parametro `crm_event_id` è obbligatorio.");
    }

    // 1. Ottenere l'ID dell'organizzazione in modo sicuro dal token JWT.
    const organization_id = await getOrganizationId(req);
    
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!serviceRoleKey) throw new Error("La chiave SUPABASE_SERVICE_ROLE_KEY non è impostata.");
    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, serviceRoleKey);

    // 2. Se esiste un ID evento Google, procedi con la cancellazione su Google Calendar.
    if (google_event_id) {
        const googleAccessToken = await getGoogleAccessToken(supabaseAdmin, organization_id);
        
        const calendarApiUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${google_event_id}?sendUpdates=all`;
        
        const apiResponse = await fetch(calendarApiUrl, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${googleAccessToken}` },
        });
        
        if (apiResponse.status !== 204 && apiResponse.status !== 410) {
            const errorBody = await apiResponse.json();
            console.error("Errore API Google durante la cancellazione:", errorBody);
            throw new Error(`Impossibile cancellare l'evento da Google Calendar: ${errorBody.error.message}`);
        }
        
        console.log(`Evento ${google_event_id} cancellato da Google Calendar (Stato: ${apiResponse.status}).`);
    } else {
        console.log(`Nessun google_event_id fornito. Annullamento solo nel CRM per l'evento ${crm_event_id}.`);
    }

    // 3. Aggiorna lo stato dell'evento nel database CRM a 'cancelled'.
    const { error: updateError } = await supabaseAdmin
        .from('crm_events')
        .update({ status: 'cancelled' })
        .eq('id', crm_event_id)
        .eq('organization_id', organization_id);

    if (updateError) {
        console.error("ERRORE CRITICO: Impossibile aggiornare lo stato dell'evento nel CRM.", updateError);
        throw new Error("L'evento è stato cancellato da Google, ma non è stato possibile aggiornare lo stato nel CRM.");
    }

    return new Response(JSON.stringify({ success: true, message: "Evento annullato e sincronizzato." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Errore in delete-google-event:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500, 
    });
  }
});