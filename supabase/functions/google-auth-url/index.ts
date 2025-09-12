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
    // --- INIZIO BLOCCO DI DEBUG AVANZATO ---
    // Leggiamo i secrets e prepariamo un report di debug.
    const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
    const redirectUri = Deno.env.get("GOOGLE_REDIRECT_URI");

    // Se i secrets mancano, generiamo un errore dettagliato che verrà inviato al client.
    if (!clientId || !redirectUri) {
        const debugReport = `Report di Debug dalla Funzione: GOOGLE_CLIENT_ID: ${clientId ? 'Trovato' : 'NON TROVATO'}. GOOGLE_REDIRECT_URI: ${redirectUri ? 'Trovato' : 'NON TROVATO'}. Valore URI letto: "${redirectUri || 'Nessuno'}". Causa: I secrets non sono stati caricati correttamente dopo l'ultimo aggiornamento. Prova a ridistribuire questa funzione.`;
        
        // Lanciamo un errore che conterrà il report.
        throw new Error(debugReport);
    }
    // --- FINE BLOCCO DI DEBUG AVANZATO ---

    const { state } = await req.json();
    if (!state) {
      throw new Error("Il parametro 'state' è obbligatorio per la protezione CSRF.");
    }

    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", "https://www.googleapis.com/auth/calendar");
    authUrl.searchParams.set("state", state);
    authUrl.searchParams.set("access_type", "offline");
    authUrl.searchParams.set("prompt", "consent");

    const urlString = authUrl.toString();

    return new Response(JSON.stringify({ url: urlString }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    // Il messaggio di errore (incluso il nostro report di debug) sarà inviato al client.
    console.error("Errore nella funzione 'google-auth-url':", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500, 
    });
  }
});
