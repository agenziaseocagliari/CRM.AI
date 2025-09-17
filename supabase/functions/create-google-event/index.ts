// File: supabase/functions/create-google-event/index.ts
// SYNC: Aligned with src/lib/eventUtils.ts validation structure (September 2025)
declare const Deno: {
  env: { get(key: string): string | undefined; };
};
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";
import { corsHeaders, handleCors } from "../_shared/cors.ts";

const ACTION_TYPE = 'create_google_event';

/**
 * SYNC: Validate event payload using same structure as frontend eventUtils.ts
 * Mirrors validateEventPayload() function from src/lib/eventUtils.ts
 * @param payload The request payload to validate
 * @returns validation result with detailed error message
 */
function validateEventPayload(payload: any): { isValid: boolean, error: string | null } {
    // SYNC: Root-level null check (matches frontend)
    if (!payload) {
        return { isValid: false, error: "Il payload dell'evento è nullo." };
    }
    
    // SYNC: organization_id validation (snake_case, root-level)
    if (!payload.organization_id) {
        return { isValid: false, error: "ID Organizzazione mancante nel payload." };
    }
    
    // SYNC: contact_id validation for create operation (snake_case, root-level)
    if (!payload.contact_id) {
        return { isValid: false, error: "ID Contatto mancante nel payload." };
    }
    
    // SYNC: contact object validation (root-level)
    if (!payload.contact) {
        return { isValid: false, error: "Oggetto 'contact' mancante nel payload." };
    }
    
    // SYNC: eventDetails object validation (root-level)
    if (!payload.eventDetails) {
        return { isValid: false, error: "Dettagli dell'evento ('eventDetails') mancanti." };
    }
    
    // SYNC: eventDetails internal structure validation (matches frontend exactly)
    const { summary, startTime, endTime } = payload.eventDetails;
    if (!summary || typeof summary !== 'string' || summary.trim() === '') {
        return { isValid: false, error: "Il titolo (summary) dell'evento è obbligatorio." };
    }
    
    if (!startTime || !endTime) {
        return { isValid: false, error: "Le date di inizio e fine sono obbligatorie." };
    }
    
    // SYNC: Date validation logic (matches frontend)
    try {
        if (new Date(startTime) >= new Date(endTime)) {
            return { isValid: false, error: "L'orario di fine deve essere successivo a quello di inizio." };
        }
    } catch (e) {
        return { isValid: false, error: "Formato data/ora non valido." };
    }
    
    return { isValid: true, error: null };
}

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;
  
  try {
    // SYNC: Parse payload using root-level snake_case fields (matches buildCreateEventPayload)
    const payload = await req.json();
    const { eventDetails, contact, organization_id, contact_id } = payload;
    
    // SYNC: Apply frontend validation logic exactly
    const validation = validateEventPayload(payload);
    if (!validation.isValid) {
        console.error("[create-google-event] Validation failed:", validation.error, "Payload:", payload);
        throw new Error(validation.error!);
    }
    
    console.log(`[${ACTION_TYPE}] Payload validation successful. Root-level fields confirmed.`);
    
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );
    
    // Credit validation
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
    
    // Get Google auth token
    const { data: settings, error: settingsError } = await supabaseAdmin
        .from('organization_settings')
        .select('google_auth_token')
        .eq('organization_id', organization_id)
        .single();
        
    if (settingsError || !settings || !settings.google_auth_token) {
        throw new Error("Integrazione Google Calendar non trovata. Vai su Impostazioni per connettere il tuo account.");
    }
    
    const tokenData = JSON.parse(settings.google_auth_token);
    let accessToken = tokenData.access_token;
    
    // Token refresh logic
    if (new Date() > new Date(tokenData.expiry_date)) {
        console.log("Token scaduto. Richiesta di uno nuovo...");
        const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
        const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
        
        if (!clientId || !clientSecret) {
            throw new Error("Mancano le credenziali Google per il refresh del token.");
        }
        
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
            throw new Error(`Impossibile aggiornare il token: ${errorBody.error_description || 'errore sconosciuto'}. Prova a riconnettere il tuo account.`);
        }
        
        const newTokens = await tokenResponse.json();
        accessToken = newTokens.access_token;
        
        const newTokenData = {
            ...tokenData,
            access_token: accessToken,
            expiry_date: new Date(Date.now() + newTokens.expires_in * 1000).toISOString()
        };
        
        await supabaseAdmin
            .from('organization_settings')
            .update({ google_auth_token: JSON.stringify(newTokenData) })
            .eq('organization_id', organization_id);
    }
    
    // SYNC: Extract eventDetails using same field names as frontend (summary, startTime, endTime, etc.)
    const { summary, description, startTime, endTime, addMeet, location } = eventDetails;
    
    // Create Google Calendar event
    const event = {
        summary: summary,
        description: description,
        location: location,
        start: {
            dateTime: startTime,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        end: {
            dateTime: endTime,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        attendees: [{ email: contact.email }],
        conferenceData: addMeet ? {
            createRequest: {
                requestId: `guardian-crm-${Date.now()}`,
                conferenceSolutionKey: { type: 'hangoutsMeet' }
            }
        } : undefined,
        reminders: { useDefault: true },
    };
    
    const response = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1&sendUpdates=all", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(event),
    });
    
    if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(`Errore API Google: ${errorBody.error?.message || "Errore sconosciuto"}`);
    }
    
    const createdEvent = await response.json();
    
    // SYNC: Build CRM event data using snake_case root-level fields (matches payload structure)
    const crmEventData = {
        google_event_id: createdEvent.id,
        organization_id: organization_id, // SYNC: Use root-level organization_id
        contact_id: contact_id, // SYNC: Use root-level contact_id  
        event_summary: createdEvent.summary || summary,
        event_start_time: createdEvent.start.dateTime,
        event_end_time: createdEvent.end.dateTime,
        status: createdEvent.status === 'cancelled' ? 'cancelled' : 'confirmed',
    };
    
    // Debug logging for insert object
    console.log('[DEBUG INSERT OBJECT] crmEventData:', JSON.stringify(crmEventData, null, 2));
    
    // Insert event into CRM with enhanced error handling
    const { data: newCrmEvent, error: crmInsertError } = await supabaseAdmin
        .from('crm_events')
        .insert(crmEventData)
        .select('id')
        .single();
    
    if (crmInsertError) {
        console.error("ERRORE CRITICO: Evento Google creato ma non salvato nel CRM. Dettagli errore DB:", {
            code: crmInsertError.code,
            message: crmInsertError.message,
            details: crmInsertError.details,
            hint: crmInsertError.hint
        });
        
        // Rollback: delete Google event for consistency
        try {
            await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${createdEvent.id}?sendUpdates=all`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${accessToken}` },
            });
            console.log(`Rollback: Evento Google ${createdEvent.id} cancellato con successo.`);
        } catch (rollbackError) {
            console.error(`ERRORE CRITICO DURANTE IL ROLLBACK: Impossibile cancellare l'evento Google ${createdEvent.id}. Richiede intervento manuale.`, rollbackError);
        }
        
        // Enhanced error message with DB details
        const errorMessage = crmInsertError.code 
            ? `Errore database (${crmInsertError.code}): ${crmInsertError.message}${crmInsertError.hint ? '. Suggerimento: ' + crmInsertError.hint : ''}` 
            : `Evento Google creato, ma fallito il salvataggio nel CRM: ${crmInsertError.message}`;
            
        throw new Error(errorMessage);
    }
    
    console.log(`[${ACTION_TYPE}] Evento Google ${createdEvent.id} mappato nel CRM con ID ${newCrmEvent.id}. Validation sync completed.`);
    
    return new Response(JSON.stringify({ 
        success: true, 
        event: createdEvent, 
        crmEventId: newCrmEvent?.id
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
    
  } catch (error) {
    console.error(`[${ACTION_TYPE}] Errore con validazione sincronizzata:`, error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500, 
    });
  }
});
