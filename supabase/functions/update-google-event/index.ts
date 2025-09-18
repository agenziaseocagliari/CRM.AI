
// File: supabase/functions/update-google-event/index.ts

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
        crm_event_id, 
        event: eventPayload,
        googleProviderToken
    } = await req.json();
    
    if (!googleProviderToken) {
        return new Response(JSON.stringify({ error: "No valid access token found. User needs to re-authenticate with Google." }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    
    if (!organization_id || !crm_event_id || !eventPayload) {
        throw new Error("Parametri `organization_id`, `crm_event_id`, e `event` sono obbligatori.");
    }

    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!serviceRoleKey) throw new Error("La chiave SUPABASE_SERVICE_ROLE_KEY non è impostata.");
    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, serviceRoleKey);

    const { data: crmEvent, error: crmEventError } = await supabaseAdmin
        .from('crm_events')
        .select('google_event_id, contact_id')
        .eq('id', crm_event_id)
        .single();

    if (crmEventError || !crmEvent) throw new Error(`Evento CRM con ID ${crm_event_id} non trovato.`);
    if (!crmEvent.google_event_id) throw new Error("Questo evento non è sincronizzato con Google Calendar e non può essere aggiornato.");
    
    const { data: contact, error: contactError } = await supabaseAdmin
        .from('contacts')
        .select('email')
        .eq('id', crmEvent.contact_id)
        .single();
    
    if (contactError || !contact) throw new Error(`Contatto associato all'evento (ID: ${crmEvent.contact_id}) non trovato.`);
    
    const { summary, start, end, description } = eventPayload;
    if (!summary || !start || !end) {
        throw new Error("Dati evento mancanti: 'summary', 'start', e 'end' sono obbligatori in event.");
    }
    
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const googleEventPayload = {
        summary,
        description,
        start: { dateTime: start, timeZone },
        end: { dateTime: end, timeZone },
        attendees: [{ email: contact.email }],
    };

    const calendarApiUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${crmEvent.google_event_id}?sendUpdates=all`;

    const apiResponse = await fetch(calendarApiUrl, {
        method: "PUT",
        headers: {
            "Authorization": `Bearer ${googleProviderToken}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(googleEventPayload),
    });

    if (!apiResponse.ok) {
        const errorBody = await apiResponse.json();
        throw new Error(`Errore API Google: ${errorBody.error?.message || "Errore sconosciuto"}`);
    }

    const updatedGoogleEvent = await apiResponse.json();
    console.log(`Evento ${crmEvent.google_event_id} aggiornato con successo su Google Calendar.`);

    const { error: updateError } = await supabaseAdmin
        .from('crm_events')
        .update({
            event_summary: updatedGoogleEvent.summary || summary,
            event_start_time: updatedGoogleEvent.start.dateTime,
            event_end_time: updatedGoogleEvent.end.dateTime,
            status: updatedGoogleEvent.status === 'cancelled' ? 'cancelled' : 'confirmed',
        })
        .eq('id', crm_event_id);

    if (updateError) {
        console.error("ERRORE CRITICO: Impossibile aggiornare l'evento nel CRM dopo la modifica su Google.", updateError);
        throw new Error("L'evento è stato aggiornato su Google, ma non è stato possibile sincronizzare il CRM.");
    }

    return new Response(JSON.stringify({ success: true, message: "Evento aggiornato e sincronizzato." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Errore in update-google-event:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500, 
    });
  }
});
