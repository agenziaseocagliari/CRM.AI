// File: supabase/functions/google-token-exchange/index.ts

declare const Deno: {
  env: { get(key: string): string | undefined; };
};

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";

// --- CORS Helper ---
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-n8n-api-key",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Max-Age": "86400"
};

function handleCors(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  return null;
}
// --- End CORS Helper ---

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  console.log("[google-token-exchange] Funzione invocata.");

  try {
    const { code, organization_id, redirectUri: payloadRedirectUri } = await req.json();
    console.log(`[google-token-exchange] Payload ricevuto per organization_id: ${organization_id}`);
    
    if (!code || !organization_id) {
      throw new Error("I parametri 'code' e 'organization_id' sono obbligatori.");
    }
    
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
    const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
    const fallbackRedirectUri = Deno.env.get("GOOGLE_REDIRECT_URI");

    // Usa il redirectUri dal payload se fornito, altrimenti usa quello dai secrets
    const finalRedirectUri = payloadRedirectUri || fallbackRedirectUri;

    if (!serviceRoleKey || !clientId || !clientSecret || !finalRedirectUri) {
        console.error("[google-token-exchange] ERRORE: Variabili d'ambiente mancanti.");
        let missingVars = [];
        if (!serviceRoleKey) missingVars.push("SUPABASE_SERVICE_ROLE_KEY");
        if (!clientId) missingVars.push("GOOGLE_CLIENT_ID");
        if (!clientSecret) missingVars.push("GOOGLE_CLIENT_SECRET");
        if (!finalRedirectUri) missingVars.push("GOOGLE_REDIRECT_URI (nel payload o nei secrets)");
        throw new Error(`Configurazione Incompleta: mancano i seguenti secrets: ${missingVars.join(', ')}.`);
    }

    console.log(`[google-token-exchange] Preparazione della richiesta di token a Google con redirect_uri: ${finalRedirectUri}`);
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code: code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: finalRedirectUri,
        grant_type: "authorization_code",
      }),
    });
    
    console.log(`[google-token-exchange] L'endpoint del token di Google ha risposto con lo stato: ${tokenResponse.status}`);

    if (!tokenResponse.ok) {
        const errorBody = await tokenResponse.json();
        console.error("[google-token-exchange] Errore durante lo scambio del codice con Google:", JSON.stringify(errorBody, null, 2));
        throw new Error(`Errore API Google: ${errorBody.error_description || "Impossibile scambiare il codice di autorizzazione."}`);
    }

    const tokens = await tokenResponse.json();
    console.log("[google-token-exchange] Token ricevuti con successo da Google.");

    const tokenData = {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry_date: new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString(),
    };
    
    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, serviceRoleKey);

    console.log(`[google-token-exchange] Esecuzione dell'upsert dei token per organization_id: ${organization_id}`);
    const { error: upsertError } = await supabaseAdmin
        .from('organization_settings')
        .upsert({
            organization_id: organization_id,
            google_auth_token: JSON.stringify(tokenData),
        }, { onConflict: 'organization_id' });
        
    if (upsertError) {
        console.error(`[google-token-exchange] L'upsert su Supabase è fallito:`, upsertError);
        throw upsertError;
    }

    console.log(`[google-token-exchange] Token salvati con successo per organization_id: ${organization_id}`);

    return new Response(JSON.stringify({ success: true, message: "Token scambiati e salvati con successo." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("[google-token-exchange] ERRORE CRITICO nel gestore:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500, 
    });
  }
});