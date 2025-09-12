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

  try {
    const { code, organization_id } = await req.json();
    if (!code || !organization_id) {
      throw new Error("I parametri 'code' e 'organization_id' sono obbligatori.");
    }
    
    // Recupera tutte le credenziali necessarie dai secrets
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
    const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
    const redirectUri = Deno.env.get("GOOGLE_REDIRECT_URI");

    if (!serviceRoleKey || !clientId || !clientSecret || !redirectUri) {
        throw new Error("Configurazione Incompleta: una o più variabili d'ambiente (SERVICE_ROLE_KEY, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI) non sono impostate nei Secrets.");
    }

    // Effettua la chiamata diretta all'endpoint del token di Google
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code: code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });
    
    if (!tokenResponse.ok) {
        const errorBody = await tokenResponse.json();
        console.error("Errore durante lo scambio del codice con Google:", errorBody);
        throw new Error(`Errore API Google: ${errorBody.error_description || "Impossibile scambiare il codice di autorizzazione."}`);
    }

    const tokens = await tokenResponse.json();

    const tokenData = {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token, // Il refresh_token è cruciale per l'accesso offline
        expiry_date: new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString(),
    };
    
    // Salva i token nel database
    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, serviceRoleKey);

    const { error: upsertError } = await supabaseAdmin
        .from('organization_settings')
        .upsert({
            organization_id: organization_id,
            google_auth_token: JSON.stringify(tokenData),
        }, { onConflict: 'organization_id' });
        
    if (upsertError) throw upsertError;

    return new Response(JSON.stringify({ success: true, message: "Token scambiati e salvati con successo." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Errore critico nella funzione 'google-token-exchange':", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500, 
    });
  }
});
