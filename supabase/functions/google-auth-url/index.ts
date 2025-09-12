// File: supabase/functions/google-auth-url/index.ts

declare const Deno: {
  env: { get(key: string): string | undefined; };
};

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { OAuth2Client } from "https://deno.land/x/oauth2_client@v1.0.2/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { state } = await req.json();
    if (!state) throw new Error("Il parametro 'state' è obbligatorio per la protezione CSRF.");
    
    const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
    const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
    const redirectUri = Deno.env.get("GOOGLE_REDIRECT_URI");

    if (!clientId || !clientSecret || !redirectUri) {
        throw new Error("Mancano le variabili d'ambiente di Google (CLIENT_ID, CLIENT_SECRET, REDIRECT_URI).");
    }

    const oauth2Client = new OAuth2Client({
        clientId,
        clientSecret,
        authorizationEndpointUri: "https://accounts.google.com/o/oauth2/v2/auth",
        tokenUri: "https://oauth2.googleapis.com/token",
        redirectUri,
        defaults: {
            scope: "https://www.googleapis.com/auth/calendar",
        },
    });

    const authUrl = oauth2Client.code.getAuthorizationUri({
      state,
      accessType: "offline",
      prompt: "consent", 
    });
    
    // FIX: Replaced instanceof check with a more robust check on the .href property to prevent '[object Object]' errors.
    if (!authUrl || typeof authUrl.href !== 'string') {
        console.error("getAuthorizationUri non ha restituito un oggetto URL-like. Risposta ricevuta:", authUrl);
        throw new Error("Impossibile generare l'URL di autorizzazione. Controlla che i secrets GOOGLE_CLIENT_ID e GOOGLE_REDIRECT_URI siano corretti e ri-distribuisci la funzione.");
    }

    return new Response(JSON.stringify({ url: authUrl.href }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Errore in google-auth-url:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }
});