
// File: supabase/functions/delete-google-event/index.ts

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
    const { 
        organization_id, 
        google_event_id, 
        crm_event_id,
        googleProviderToken
    } = await req.json();
    
    if (!googleProviderToken) {
        return new Response(JSON.stringify({ error: "No valid access token found. User needs to re-authenticate with Google." }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!organization_id || !google_event_id || !crm_event_id) {
        throw new Error("Parametri organization_id, google_event_id e crm_event_id sono obbligatori.");
    }

    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!serviceRoleKey) throw new Error("La chiave SUPABASE_SERVICE_ROLE_KEY non è impostata.");
    
    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, serviceRoleKey);
    
    // Chiama l'API di Google Calendar per eliminare l'evento.
    // sendUpdates=all notifica i partecipanti della cancellazione.
    const calendarApiUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${google_event_id}?sendUpdates=all`;
    
    const apiResponse = await fetch(calendarApiUrl, {
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${googleProviderToken}`,
        },
    });
    
    // Google API restituisce 204 No Content in caso di successo.
    // Restituisce 410 Gone se l'evento è già stato cancellato. Entrambi sono casi di successo per noi.
    if (apiResponse.status !== 204 && apiResponse.status !== 410) {
        const errorBody = await apiResponse.json();
        console.error("Errore API Google durante la cancellazione:", errorBody);
        throw new Error(`Impossibile cancellare l'evento da Google Calendar: ${errorBody.error.message}`);
    }
    
    console.log(`Evento ${google_event_id} cancellato con successo da Google Calendar (Stato: ${apiResponse.status}).`);

    // Aggiorna lo stato dell'evento nel database CRM a 'cancelled'.
    // Usiamo crm_event_id per essere sicuri di aggiornare il record corretto.
    const { error: updateError } = await supabaseAdmin
        .from('crm_events')
        .update({ status: 'cancelled' })
        .eq('id', crm_event_id)
        .eq('organization_id', organization_id);

    if (updateError) {
        // Errore critico: l'evento è stato cancellato su Google ma non nel CRM.
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
