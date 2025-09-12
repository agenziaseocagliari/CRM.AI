// File: supabase/functions/google-auth-url/index.ts

declare const Deno: {
  env: { get(key: string): string | undefined; };
};

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

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
    const { state } = await req.json();
    if (!state) {
      throw new Error("Il parametro 'state' è obbligatorio per la protezione CSRF.");
    }

    const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
    const redirectUri = Deno.env.get("GOOGLE_REDIRECT_URI");

    if (!clientId || !redirectUri) {
        throw new Error("Configurazione Incompleta: GOOGLE_CLIENT_ID o GOOGLE_REDIRECT_URI non sono impostati nei Secrets della funzione.");
    }

    // Costruiamo l'URL manualmente per massima affidabilità
    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", "https://www.googleapis.com/auth/calendar");
    authUrl.searchParams.set("state", state);
    authUrl.searchParams.set("access_type", "offline"); // Richiede un refresh_token
    authUrl.searchParams.set("prompt", "consent"); // Mostra sempre la schermata di consenso

    const urlString = authUrl.toString();

    if (!urlString.startsWith("https://accounts.google.com")) {
        throw new Error("La generazione manuale dell'URL di autorizzazione è fallita.");
    }

    return new Response(JSON.stringify({ url: urlString }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Errore critico nella funzione 'google-auth-url':", error.message);
    return new Response(JSON.stringify({ error: `Errore interno del server: ${error.message}` }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500, 
    });
  }
});
