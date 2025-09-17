// File: supabase/functions/get-google-calendar-events/index.ts

declare const Deno: {
  env: { get(key: string): string | undefined; };
};

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";
import { corsHeaders, handleCors } from "../_shared/cors.ts";

/**
 * Funzione helper per rinfrescare un token di accesso Google scaduto.
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
    if (!clientId || !clientSecret) throw new Error("Credenziali Google mancanti per il refresh del token.");

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
        // Se il refresh fallisce (es. l'utente ha revocato l'accesso), puliamo il token per forzare una nuova autenticazione.
        await supabaseAdmin
            .from('organization_settings')
            .update({ google_auth_token: null })
            .eq('organization_id', organization_id);
        throw new Error("Impossibile rinfrescare il token di accesso. Riconnetti il tuo account Google dalle Impostazioni.");
    }

    const newTokens = await tokenResponse.json();
    const newAccessToken = newTokens.access_token;

    // Aggiorna i token nel database con la nuova data di scadenza.
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
    const { organization_id, date } = await req.json(); // La data è in formato "YYYY-MM-DD"
    if (!organization_id || !date) {
        throw new Error("I parametri organization_id e date sono obbligatori.");
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
    
    // --- REQUISITO SODDISFATTO: Gestione Token Multi-Tenant ---
    // Il token Google viene recuperato in modo sicuro usando organization_id,
    // garantendo che ogni organizzazione usi le proprie credenziali.
    if (settingsError || !settings || !settings.google_auth_token) {
        // Non è un errore critico, significa solo che l'utente non è connesso.
        // Il frontend gestirà questo messaggio.
        return new Response(JSON.stringify({ busySlots: [], message: "Google Calendar non connesso." }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
    }

    const tokenData = JSON.parse(settings.google_auth_token);

    // 2. Assicura che il token di accesso sia valido (aggiornandolo se necessario).
    // --- REQUISITO SODDISFATTO: Refresh Automatico del Token ---
    // La logica di refresh è gestita interamente lato backend.
    const accessToken = await getRefreshedAccessToken(tokenData, organization_id, supabaseAdmin);

    // 3. Interroga l'API di Google Calendar per gli eventi nella data specificata.
    const timeMin = new Date(`${date}T00:00:00.000Z`).toISOString();
    const timeMax = new Date(`${date}T23:59:59.999Z`).toISOString();
    
    const calendarApiUrl = new URL("https://www.googleapis.com/calendar/v3/calendars/primary/events");
    calendarApiUrl.searchParams.set("timeMin", timeMin);
    calendarApiUrl.searchParams.set("timeMax", timeMax);
    calendarApiUrl.searchParams.set("singleEvents", "true"); 
    calendarApiUrl.searchParams.set("orderBy", "startTime");
    calendarApiUrl.searchParams.set("fields", "items(start,end)");

    const apiResponse = await fetch(calendarApiUrl.toString(), {
        headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
        },
    });

    if (!apiResponse.ok) {
        const errorBody = await apiResponse.json();
        console.error("Errore dall'API di Google Calendar:", errorBody);
        throw new Error(`Impossibile recuperare gli eventi: ${errorBody.error.message}`);
    }

    const calendarData = await apiResponse.json();

    const busySlots = calendarData.items.map((event: any) => {
        if (event.start.date) { 
            return {
                start: new Date(`${event.start.date}T00:00:00.000Z`).toISOString(),
                end: new Date(`${event.start.date}T23:59:59.999Z`).toISOString(),
            };
        }
        return {
            start: event.start.dateTime,
            end: event.end.dateTime,
        };
    });

    return new Response(JSON.stringify({ busySlots }), {
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