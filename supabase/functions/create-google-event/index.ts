// File: supabase/functions/create-google-event/index.ts

declare const Deno: {
  env: { get(key: string): string | undefined; };
};

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";
import { corsHeaders, handleCors } from "../_shared/cors.ts";

const ACTION_TYPE = 'create_google_event';

// REFACTOR: Estratta la logica di refresh del token in una funzione helper per coerenza e riusabilità.
/**
 * Funzione helper per rinfrescare un token di accesso Google scaduto.
 * Ritorna un nuovo access token valido, aggiornando il database se necessario.
 * @param tokenData I dati del token attuali dal database.
 * @param organization_id L'ID dell'organizzazione per aggiornare il record corretto.
 * @param supabaseAdmin Un client Supabase con privilegi di amministratore.
 * @returns Una Promise che si risolve con il nuovo access token valido.
 */
async function getRefreshedAccessToken(tokenData: any, organization_id: string, supabaseAdmin: any): Promise<string> {
    const expiryDate = new Date(tokenData.expiry_date);
    if (new Date() < expiryDate) {
        return tokenData.access_token;
    }

    console.log("Token di accesso Google scaduto. Inizio procedura di refresh...");
    const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
    const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
    if (!clientId || !clientSecret) throw new Error("Credenziali Google (Client ID/Secret) mancanti per il refresh del token.");

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: tokenData.refresh_token,
            grant_type: 'refresh_token'
        })
    });

    if (!tokenResponse.ok) {
        const errorBody = await tokenResponse.json();
        console.error("Errore durante il refresh del token Google:", errorBody);
        await supabaseAdmin
            .from('organization_settings')
            .update({ google_auth_token: null })
            .eq('organization_id', organization_id);
        throw new Error("Impossibile rinfrescare il token di accesso. Riconnetti il tuo account Google dalle Impostazioni.");
    }

    const newTokens = await tokenResponse.json();
    const newAccessToken = newTokens.access_token;

    const newTokenData = {
        ...tokenData,
        access_token: newAccessToken,
        expires_in: newTokens.expires_in,
        expiry_date: new Date(Date.now() + newTokens.expires_in * 1000).toISOString(),
    };

    await supabaseAdmin
        .from('organization_settings')
        .update({ google_auth_token: JSON.stringify(newTokenData) })
        .eq('organization_id', organization_id);
    
    console.log("Token di accesso rinfrescato e aggiornato con successo.");
    return newAccessToken;
}


serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { userId, event: eventPayload, contact, organization_id, contact_id } = await req.json();
    
    // --- REQUISITO SODDISFATTO: Validazione server-side di userId ---
    // La funzione ora verifica che il campo `userId` sia presente nel payload,
    // restituendo un errore 400 se mancante, come specificato.
    if (!userId) {
        return new Response(JSON.stringify({ error: "userId is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!eventPayload || !contact || !organization_id || !contact_id) {
      throw new Error("Dati mancanti: 'event', 'contact', 'organization_id' e 'contact_id' sono obbligatori.");
    }
    
    const { summary, description, start, end, addMeet, location } = eventPayload;
    if (!summary || !start || !end) {
        throw new Error("Dati evento mancanti: 'summary', 'start', e 'end' sono obbligatori in event.");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    const { data: creditData, error: creditError } = await supabaseClient.functions.invoke('consume-credits', {
        body: { organization_id, action_type: ACTION_TYPE },
    });

    if (creditError) throw new Error(`Errore di rete nella verifica dei crediti: ${creditError.message}`);
    if (creditData.error) throw new Error(`Errore nella verifica dei crediti: ${creditData.error}`);
    if (!creditData.success) throw new Error("Crediti insufficienti per creare un evento.");
    console.log(`[${ACTION_TYPE}] Crediti verificati. Rimanenti: ${creditData.remaining_credits}`);
    
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY non impostato.");
    
    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, serviceRoleKey);

    const { data: settings, error: settingsError } = await supabaseAdmin
        .from('organization_settings').select('google_auth_token').eq('organization_id', organization_id).single();
        
    if (settingsError || !settings || !settings.google_auth_token) {
        throw new Error("Integrazione Google Calendar non trovata. Vai su Impostazioni per connettere il tuo account.");
    }

    const tokenData = JSON.parse(settings.google_auth_token);
    const accessToken = await getRefreshedAccessToken(tokenData, organization_id, supabaseAdmin);
    
    const event = {
        summary: summary,
        description: description,
        location: location,
        start: { dateTime: start, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
        end: { dateTime: end, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
        attendees: [{ email: contact.email }],
        conferenceData: addMeet ? { createRequest: { requestId: `guardian-crm-${Date.now()}`, conferenceSolutionKey: { type: 'hangoutsMeet' } } } : undefined,
        reminders: { useDefault: true },
    };

    const response = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1&sendUpdates=all", {
        method: "POST", headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify(event),
    });

    if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(`Errore API Google: ${errorBody.error?.message || "Errore sconosciuto"}`);
    }

    const createdEvent = await response.json();

    const { data: newCrmEvent, error: crmInsertError } = await supabaseAdmin
        .from('crm_events')
        .insert({
            google_event_id: createdEvent.id, organization_id: organization_id, contact_id: contact_id,
            event_summary: createdEvent.summary || summary,
            event_start_time: createdEvent.start.dateTime,
            event_end_time: createdEvent.end.dateTime, 
            status: createdEvent.status === 'cancelled' ? 'cancelled' : 'confirmed',
        })
        .select('id')
        .single();
    
    if (crmInsertError) {
        console.error("ERRORE CRITICO: Evento Google creato ma non salvato nel CRM. Tentativo di cancellare l'evento Google per coerenza...", crmInsertError);
        try {
            await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${createdEvent.id}?sendUpdates=all`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${accessToken}` },
            });
            console.log(`Rollback: Evento Google ${createdEvent.id} cancellato con successo.`);
        } catch (rollbackError) {
            console.error(`ERRORE CRITICO DURANTE IL ROLLBACK: Impossibile cancellare l'evento Google ${createdEvent.id}. Richiede intervento manuale.`, rollbackError);
        }
        
        throw new Error(`Evento Google creato, ma fallito il salvataggio nel CRM: ${crmInsertError.message}`);
    }
    
    console.log(`Evento Google ${createdEvent.id} mappato nel CRM con ID ${newCrmEvent.id}.`);

    return new Response(JSON.stringify({ 
        success: true, 
        event: createdEvent, 
        crmEventId: newCrmEvent?.id
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Errore funzione create-google-event:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500, 
    });
  }
});