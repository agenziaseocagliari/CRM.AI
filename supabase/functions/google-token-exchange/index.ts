// File: supabase/functions/google-token-exchange/index.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-n8n-api-key",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Max-Age": "86400"
};

function handleCors(req: Request) {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  return null;
}

function safeLog(label: string, obj: unknown) {
  try {
    console.log(label, typeof obj === "string" ? obj : JSON.stringify(obj));
  } catch {
    console.log(label, "[Unserializable object]");
  }
}

serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  let parsedPayload: any = {};
  try {
    safeLog("[google-token-exchange] ✅ Funzione invocata. Metodo:", req.method);

    try { // parsing
      parsedPayload = await req.json();
      safeLog("[google-token-exchange] 📦 Payload JSON ricevuto:", parsedPayload);
    } catch (err) {
      safeLog("[google-token-exchange] ❌ Errore parsing JSON payload:", err?.message || String(err));
      throw new Error("Il body della richiesta non è un JSON valido.");
    }

    const { code, organization_id, redirectUri: redirectUriFromFrontend } = parsedPayload;

    // Validazioni
    if (!code) throw new Error("Parametro 'code' mancante nella richiesta.");
    if (!organization_id) throw new Error("Parametro 'organization_id' mancante nella richiesta.");

    // Segreti richiesti
    const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
    const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const redirectUriFromEnv = Deno.env.get("GOOGLE_REDIRECT_URI");
    if (!clientId) throw new Error("Secret 'GOOGLE_CLIENT_ID' non impostato.");
    if (!clientSecret) throw new Error("Secret 'GOOGLE_CLIENT_SECRET' non impostato.");
    if (!supabaseUrl) throw new Error("Secret 'SUPABASE_URL' non impostato.");
    if (!serviceRoleKey) throw new Error("Secret 'SUPABASE_SERVICE_ROLE_KEY' non impostato.");

    // Determina il redirect uri da frontend o da secret env
    const redirectUri = redirectUriFromFrontend || redirectUriFromEnv;
    if (!redirectUri) throw new Error("L'URI di reindirizzamento non è configurato (né nel frontend né nel secret 'GOOGLE_REDIRECT_URI').");
    safeLog("[google-token-exchange] 🔗 redirectUri selezionato:", redirectUri);

    // === [2] SCAMBIO CON GOOGLE ===
    safeLog("[google-token-exchange] 🏁 Preparazione chiamata a Google per scambio token.", "");
    const body = new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    });

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body
    });

    safeLog("[google-token-exchange] 🌐 Status risposta Google:", tokenResponse.status);
    const responseBodyText = await tokenResponse.text();
    safeLog("[google-token-exchange] 🌐 Corpo risposta Google:", responseBodyText);

    if (!tokenResponse.ok) {
      let errorDesc = responseBodyText;
      try {
        const errorJson = JSON.parse(responseBodyText);
        errorDesc = errorJson.error_description || errorJson.error || responseBodyText;
      } catch {/**/}
      throw new Error(`Errore da Google (${tokenResponse.status}): ${errorDesc}`);
    }

    let tokens: any = {};
    try {
      tokens = JSON.parse(responseBodyText);
    } catch (err) {
      safeLog("[google-token-exchange] ❌ Errore parsing JSON di risposta da Google:", err?.message || String(err));
      throw new Error("La risposta di Google non è un JSON valido.");
    }
    safeLog("[google-token-exchange] 🟢 Scambio token riuscito. Token:", tokens);

    // === [3] SALVATAGGIO SU SUPABASE ===
    const expiryDateIso = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
    const tokenDataToStore = {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_in: tokens.expires_in,
      scope: tokens.scope,
      token_type: tokens.token_type,
      expiry_date: expiryDateIso
    };

    safeLog("[google-token-exchange] 🗃️ Dati token da salvare su Supabase:", tokenDataToStore);

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    const { error: dbError, data: upsertResponse } = await supabaseAdmin
      .from('organization_settings')
      .upsert({
        organization_id,
        google_auth_token: JSON.stringify(tokenDataToStore)
      }, { onConflict: 'organization_id' });

    safeLog("[google-token-exchange] 🔄 Risposta upsert Supabase:", upsertResponse);
    if (dbError) {
      safeLog("[google-token-exchange] ❌ Errore upsert Supabase:", dbError);
      throw dbError;
    }
    safeLog("[google-token-exchange] 🟢 Upsert su Supabase completato.");

    // === [4] RISPOSTA ===
    const outObj = { success: true, message: "Token scambiato e salvato correttamente." };
    safeLog("[google-token-exchange] 📨 Risposta inviata al client:", outObj);
    return new Response(JSON.stringify(outObj), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200
    });

  } catch (error) {
    safeLog("[google-token-exchange] ⛔ Errore CATCH GENERALE:", error?.message || String(error));
    return new Response(JSON.stringify({
      error: error?.message || String(error),
      debug: {
        payload: parsedPayload
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500
    });
  }
});
