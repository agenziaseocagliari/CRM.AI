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
    
    // Correzione definitiva: Assicuriamoci che l'URL sia una stringa prima di inviarlo.
    // Il metodo .href di un oggetto URL restituisce la stringa completa.
    const urlString = authUri.href;

    // Aggiungiamo un controllo di sicurezza per garantire che l'URL sia valido.
    if (typeof urlString !== 'string' || !urlString.startsWith("https://accounts.google.com")) {
        console.error("Generazione URL fallita. Risultato inatteso:", authUri);
        throw new Error("Impossibile generare l'URL di autorizzazione. L'oggetto restituito dalla libreria non era un URL valido.");
    }

    return new Response(JSON.stringify({ url: urlString }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Errore critico in google-auth-url:", error.message);
    // Usiamo uno status 500 per gli errori, che è una pratica migliore.
    return new Response(JSON.stringify({ error: `Errore interno del server: ${error.message}` }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500, 
    });
  }
});