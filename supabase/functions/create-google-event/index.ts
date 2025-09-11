// File: supabase/functions/create-google-event/index.ts

declare const Deno: {
  env: { get(key: string): string | undefined; };
};

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";
import { handleCors, corsHeaders } from "../shared/cors.ts";

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

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
    const accessToken = tokenData.access_token;
    
    // 2. Prepara i dati dell'evento per l'API di Google Calendar
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
        } : undefined, // Usa undefined invece di null
        reminders: {
            useDefault: true,
        },
    };

    // 3. Chiama l'API di Google Calendar
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
      status: 200, 
    });
  }
});