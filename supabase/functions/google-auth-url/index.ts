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
    if (!state) {
      throw new Error("Il parametro 'state' è obbligatorio per la protezione CSRF.");
    }
    
    const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
    const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
    const redirectUri = Deno.env.get("GOOGLE_REDIRECT_URI");

    if (!clientId || !clientSecret || !redirectUri) {
        throw new Error("Mancano le variabili d'ambiente di Google (CLIENT_ID, CLIENT_SECRET, REDIRECT_URI). Controlla i secrets della funzione in Supabase.");
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

    const authUri = oauth2Client.code.getAuthorizationUri({
      state,
      accessType: "offline",
      prompt: "consent", 
    });
    
    const urlString = authUri.href;

    if (typeof urlString !== 'string' || !urlString.startsWith("https://accounts.google.com")) {
        console.error("Generazione URL fallita. Risultato inatteso:", authUri);
        throw new Error("Impossibile generare l'URL di autorizzazione. La libreria ha restituito un formato non valido.");
    }

    // Restituiamo l'URL all'interno di un oggetto JSON per massima compatibilità.
    return new Response(JSON.stringify({ url: urlString }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Errore critico in google-auth-url:", error.message);
    // In caso di errore, restituiamo un JSON per una gestione strutturata lato client.
    return new Response(JSON.stringify({ error: `Errore interno del server: ${error.message}` }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500, 
    });
  }
});