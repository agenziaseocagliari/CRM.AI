// File: supabase/functions/send-whatsapp-message/index.ts

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
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
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Mancano le variabili d'ambiente SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.");
    }

    const { contact_phone, message, organization_id } = await req.json();
    if (!contact_phone || !message || !organization_id) {
        return new Response(JSON.stringify({ error: "I parametri 'contact_phone', 'message' e 'organization_id' sono obbligatori." }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const { data: settings, error: settingsError } = await supabaseAdmin
        .from('organization_settings')
        .select('twilio_account_sid, twilio_auth_token')
        .eq('organization_id', organization_id)
        .single();

    if (settingsError) throw new Error(`Impossibile recuperare le impostazioni: ${settingsError.message}`);
    if (!settings || !settings.twilio_account_sid || !settings.twilio_auth_token) {
        throw new Error(`Le credenziali Twilio non sono configurate per questa organizzazione. Vai su Impostazioni per aggiungerle.`);
    }
    
    const { twilio_account_sid: accountSid, twilio_auth_token: authToken } = settings;

    const twilioApiUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const twilioSandboxNumber = "+14155238886";

    const body = new URLSearchParams();
    body.append('To', `whatsapp:${contact_phone}`);
    body.append('From', `whatsapp:${twilioSandboxNumber}`);
    body.append('Body', message);

    const twilioResponse = await fetch(twilioApiUrl, {
        method: "POST",
        headers: {
            "Authorization": `Basic ${btoa(accountSid + ':' + authToken)}`,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body,
    });

    if (!twilioResponse.ok) {
        const errorBody = await twilioResponse.json();
        console.error("Errore da Twilio:", errorBody);
        throw new Error(`Errore API Twilio: ${errorBody.message} (Codice: ${errorBody.code}). Assicurati che il numero del destinatario (${contact_phone}) sia verificato per la sandbox.`);
    }

    return new Response(JSON.stringify({ success: true, message: `Messaggio inviato a ${contact_phone}.` }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
    });

  } catch (error) {
    console.error("Errore nella funzione send-whatsapp-message:", error);
    return new Response(JSON.stringify({ error: error.message }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
    });
  }
});