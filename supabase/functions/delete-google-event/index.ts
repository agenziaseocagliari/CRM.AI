// File: supabase/functions/delete-google-event/index.ts

declare const Deno: {
  env: { get(key: string): string | undefined; };
};

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";
import { corsHeaders, handleCors } from "../_shared/cors.ts";

/**
 * Funzione helper per rinfrescare un token di accesso Google scaduto.
 * Ritorna un nuovo access token valido.
 */
async function getRefreshedAccessToken(tokenData: any, organization_id: string, supabaseAdmin: any): Promise<string> {
    const expiryDate = new Date(tokenData.expiry_date);
    if (new Date() < expiryDate) {
        return tokenData.access_token;
    }

    console.log("Token Google scaduto, avvio refresh...");
    const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
    const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
    if (!clientId || !clientSecret) throw new Error("Credenziali Google mancanti per il refresh.");

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
        console.error("Errore refresh token Google:", errorBody);
        await supabaseAdmin
            .from('organization_settings')
            .update({ google_auth_token: null })
            .eq('organization_id', organization_id);
        throw new Error("Impossibile aggiornare il token. Riconnetti il tuo account Google.");
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
    
    console.log("Token rinfrescato con successo.");
    return newAccessToken;
}


serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { organization_id, google_event_id, crm_event_id } = await req.json();
    if (!organization_id || !google_event_id || !crm_event_id) {
        throw new Error("Parametri organization_id, google_event_id e crm_event_id sono obbligatori.");
    }

    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!serviceRoleKey) throw new Error("La chiave SUPABASE_SERVICE_ROLE_KEY non è impostata.");
    
    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, serviceRoleKey);

    // 1. Recupera i token Google dell'organizzazione.
    const { data: settings, error: settingsError } = await supabaseAdmin
        .from('organization_settings')
        .select('google_auth_token')
        .eq('organization_id', organization_id)
        .single();
        
    if (settingsError || !settings || !settings.google_auth_token) {
        throw new Error("Integrazione Google Calendar non trovata o non configurata.");
    }

    const tokenData = JSON.parse(settings.google_auth_token);

    // 2. Assicura che il token di accesso sia valido.
    const accessToken = await getRefreshedAccessToken(tokenData, organization_id, supabaseAdmin);

    // 3. Chiama l'API di Google Calendar per eliminare l'evento.
    // sendUpdates=all notifica i partecipanti della cancellazione.
    const calendarApiUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${google_event_id}?sendUpdates=all`;
    
    const apiResponse = await fetch(calendarApiUrl, {
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${accessToken}`,
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

    // 4. Aggiorna lo stato dell'evento nel database CRM a 'cancelled'.
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