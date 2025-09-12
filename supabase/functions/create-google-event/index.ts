// File: supabase/functions/create-google-event/index.ts

declare const Deno: {
  env: { get(key: string): string | undefined; };
};

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { eventDetails, contact, organization_id } = await req.json();
    if (!eventDetails || !contact || !organization_id) throw new Error("Dati mancanti per creare l'evento.");

    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY non impostato.");
    
    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, serviceRoleKey);

    // 1. Recupera i token dal database
    const { data: settings, error: settingsError } = await supabaseAdmin
        .from('organization_settings')
        .select('google_auth_token')
        .eq('organization_id', organization_id)
        .single();
        
    if (settingsError || !settings || !settings.google_auth_token) {
        throw new Error("Integrazione Google Calendar non trovata o non configurata. Vai su Impostazioni per connettere il tuo account.");
    }

    const tokenData = JSON.parse(settings.google_auth_token);
    let accessToken = tokenData.access_token;
    
    // 2. Controlla se il token è scaduto e usa il refresh token se necessario
    const expiryDate = new Date(tokenData.expiry_date);
    if (new Date() > expiryDate) {
        console.log("Token di accesso scaduto. Richiesta di uno nuovo...");
        const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
        const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
        if (!clientId || !clientSecret) throw new Error("Mancano le credenziali Google per il refresh del token.");

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
            throw new Error("Impossibile aggiornare il token di accesso. Prova a disconnettere e riconnettere il tuo account Google.");
        }

        const newTokens = await tokenResponse.json();
        accessToken = newTokens.access_token; // Aggiorna l'access token da usare
        
        // Aggiorna i nuovi token nel database
        const newTokenData = {
            ...tokenData,
            access_token: accessToken,
            expiry_date: new Date(Date.now() + newTokens.expires_in * 1000).toISOString(),
        };

        await supabaseAdmin
            .from('organization_settings')
            .update({ google_auth_token: JSON.stringify(newTokenData) })
            .eq('organization_id', organization_id);
    }
    
    // 3. Prepara i dati dell'evento per l'API di Google Calendar
    const startDateTime = new Date(`${eventDetails.date}T${eventDetails.time}:00`).toISOString();
    const endDateTime = new Date(new Date(startDateTime).getTime() + eventDetails.duration * 60000).toISOString();

    const event = {
        summary: eventDetails.title,
        description: eventDetails.description,
        start: {
            dateTime: startDateTime,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        end: {
            dateTime: endDateTime,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        attendees: [
            { email: contact.email }
        ],
        conferenceData: eventDetails.addMeet ? {
            createRequest: {
                requestId: `guardian-crm-${Date.now()}`,
                conferenceSolutionKey: {
                    type: 'hangoutsMeet'
                }
            }
        } : undefined,
        reminders: {
            useDefault: true,
        },
    };

    // 4. Chiama l'API di Google Calendar
    const googleApiUrl = "https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1&sendUpdates=all";

    const response = await fetch(googleApiUrl, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
    });

    if (!response.ok) {
        const errorBody = await response.json();
        console.error("Errore API Google:", errorBody);
        const errorMessage = errorBody.error?.message || "Errore sconosciuto dall'API di Google Calendar.";
        if (response.status === 401) {
             throw new Error("Token di accesso non valido o scaduto. Prova a disconnettere e riconnettere il tuo account Google dalle Impostazioni.");
        }
        throw new Error(`Errore API Google: ${errorMessage}`);
    }

    const createdEvent = await response.json();

    return new Response(JSON.stringify({ success: true, event: createdEvent }), {
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