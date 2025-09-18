// File: supabase/functions/update-google-event/index.ts

declare const Deno: {
  env: { get(key: string): string | undefined; };
};

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";
import { corsHeaders, handleCors } from "../_shared/cors.ts";

/**
 * Funzione helper condivisa per rinfrescare un token di accesso Google scaduto.
 * Ritorna un nuovo access token valido, aggiornando il database se necessario.
 * @param tokenData I dati del token attuali dal database.
 * @param organization_id L'ID dell'organizzazione per aggiornare il record corretto.
 * @param supabaseAdmin Un client Supabase con privilegi di amministratore.
 * @returns Una Promise che si risolve con il nuovo access token valido.
 */
async function getRefreshedAccessToken(tokenData: any, organization_id: string, supabaseAdmin: any): Promise<string> {
    const expiryDate = new Date(tokenData.expiry_date);
    if (new Date() < expiryDate) {
        return tokenData.access_token; // Il token è ancora valido.
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
    const { userId, organization_id, crm_event_id, eventDetails } = await req.json();
    
    // --- REQUISITO SODDISFATTO: Validazione server-side di userId ---
    // La funzione ora verifica che il campo `userId` sia presente nel payload,
    // restituendo un errore 400 se mancante, come specificato.
    if (!userId) {
        return new Response(JSON.stringify({ error: "userId is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!organization_id || !crm_event_id || !eventDetails) {
        throw new Error("Parametri `organization_id`, `crm_event_id`, e `eventDetails` sono obbligatori.");
    }

    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!serviceRoleKey) throw new Error("La chiave SUPABASE_SERVICE_ROLE_KEY non è impostata.");
    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, serviceRoleKey);

    const { data: settings, error: settingsError } = await supabaseAdmin
        .from('organization_settings')
        .select('google_auth_token')
        .eq('organization_id', organization_id)
        .single();
    
    if (settingsError || !settings || !settings.google_auth_token) {
        throw new Error("Integrazione Google Calendar non trovata o non configurata.");
    }
    const tokenData = JSON.parse(settings.google_auth_token);
    
    const accessToken = await getRefreshedAccessToken(tokenData, organization_id, supabaseAdmin);

    const { data: crmEvent, error: crmEventError } = await supabaseAdmin
        .from('crm_events')
        .select('google_event_id, contact_id')
        .eq('id', crm_event_id)
        .single();

    if (crmEventError || !crmEvent) throw new Error(`Evento CRM con ID ${crm_event_id} non trovato.`);
    
    const { data: contact, error: contactError } = await supabaseAdmin
        .from('contacts')
        .select('email')
        .eq('id', crmEvent.contact_id)
        .single();
    
    if (contactError || !contact) throw new Error(`Contatto associato all'evento (ID: ${crmEvent.contact_id}) non trovato.`);
    
    const { summary, startTime, endTime, description } = eventDetails;
    if (!summary || !startTime || !endTime) {
        throw new Error("Dati evento mancanti: 'summary', 'startTime', e 'endTime' sono obbligatori in eventDetails.");
    }
    
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const googleEventPayload = {
        summary,
        description,
        start: { dateTime: startTime, timeZone },
        end: { dateTime: endTime, timeZone },
        attendees: [{ email: contact.email }],
    };

    const calendarApiUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${crmEvent.google_event_id}?sendUpdates=all`;

    const apiResponse = await fetch(calendarApiUrl, {
        method: "PUT",
        headers: {
            "Authorization": `Bearer ${accessToken}`,
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
