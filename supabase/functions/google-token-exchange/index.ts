// File: supabase/functions/google-token-exchange/index.ts

// OTTIMIZZAZIONE: Aggiunta la dichiarazione Deno per la compatibilità dell'IDE.
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

  try {
    // --- 1. VALIDAZIONE E SETUP ---
    console.log("[google-token-exchange] Funzione invocata.");
    const { code, organization_id, redirectUri: redirectUriFromFrontend } = await req.json();
    console.log(`[google-token-exchange] Payload ricevuto: code=${code ? 'Presente' : 'MANCANTE'}, organization_id=${organization_id}`);

    // OTTIMIZZAZIONE: Validazione robusta e granulare di tutti i parametri e secrets.
    if (!code) throw new Error("Parametro 'code' mancante nella richiesta.");
    if (!organization_id) throw new Error("Parametro 'organization_id' mancante nella richiesta.");

    const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
    const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const redirectUriFromEnv = Deno.env.get("GOOGLE_REDIRECT_URI");

    if (!clientId) throw new Error("Secret 'GOOGLE_CLIENT_ID' non impostato.");
    if (!clientSecret) throw new Error("Secret 'GOOGLE_CLIENT_SECRET' non impostato.");
    if (!supabaseUrl) throw new Error("Secret 'SUPABASE_URL' non impostato.");
    if (!serviceRoleKey) throw new Error("Secret 'SUPABASE_SERVICE_ROLE_KEY' non impostato.");

    const redirectUri = redirectUriFromFrontend || redirectUriFromEnv;
    if (!redirectUri) throw new Error("L'URI di reindirizzamento non è configurato (né nel frontend né nel secret 'GOOGLE_REDIRECT_URI').");
    
    // OTTIMIZZAZIONE: Log esplicito dell'URI utilizzato per facilitare il debug.
    console.log(`[google-token-exchange] Validazione completata. Verrà usato redirectUri: ${redirectUri}`);

    // --- 2. CHIAMATA A GOOGLE PER SCAMBIO TOKEN ---
    console.log("[google-token-exchange] Preparazione chiamata a Google per lo scambio del token.");
    
    // OTTIMIZZAZIONE: Il body viene costruito con URLSearchParams per garantire il corretto encoding.
    const body = new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    });

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      // FIX CRITICO: Header corretto per rispettare lo standard OAuth 2.0.
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body,
    });

    console.log(`[google-token-exchange] Risposta da Google ricevuta con stato: ${tokenResponse.status}`);
    const responseBodyText = await tokenResponse.text(); // Leggiamo il corpo come testo per un logging sicuro

    if (!tokenResponse.ok) {
        // OTTIMIZZAZIONE: Log dettagliato dell'errore da Google prima di lanciare l'eccezione.
        console.error("[google-token-exchange] Errore API da Google. Corpo della risposta:", responseBodyText);
        // Tentiamo di parsare il JSON per un messaggio più leggibile, altrimenti usiamo il testo grezzo.
        try {
            const errorJson = JSON.parse(responseBodyText);
            throw new Error(`Errore da Google (${tokenResponse.status}): ${errorJson.error_description || errorJson.error || responseBodyText}`);
        } catch {
             throw new Error(`Errore da Google (${tokenResponse.status}): ${responseBodyText}`);
        }
    }
    
    const tokens = JSON.parse(responseBodyText);
    console.log("[google-token-exchange] Scambio del token riuscito.");

    // --- 3. PREPARAZIONE E SALVATAGGIO SU SUPABASE ---
    const tokenDataToStore = {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_in: tokens.expires_in,
      scope: tokens.scope,
      token_type: tokens.token_type,
      // OTTIMIZZAZIONE: Calcolo preciso della data di scadenza per gestire il refresh.
      expiry_date: new Date(Date.now() + tokens.expires_in * 1000).toISOString(), 
    };
    
    console.log("[google-token-exchange] Inizio operazione di upsert su Supabase.");
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    const { error: dbError } = await supabaseAdmin
      .from('organization_settings')
      .upsert({
          organization_id: organization_id,
          google_auth_token: JSON.stringify(tokenDataToStore),
      }, { onConflict: 'organization_id' });

    if (dbError) {
        console.error("[google-token-exchange] Errore durante l'upsert su Supabase:", dbError);
        throw dbError;
    }
    
    console.log("[google-token-exchange] Upsert su Supabase completato con successo.");
    
    // --- 4. RISPOSTA DI SUCCESSO ---
    return new Response(JSON.stringify({ success: true, message: "Token scambiato e salvato correttamente." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    // OTTIMIZZAZIONE: Gestione centralizzata degli errori con log dettagliato e risposta HTTP 500.
    console.error("[google-token-exchange] Errore nel blocco catch finale:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
