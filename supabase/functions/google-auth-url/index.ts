// File: supabase/functions/google-auth-url/index.ts

declare const Deno: {
  env: { get(key: string): string | undefined; };
};

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { OAuth2Client } from "https://deno.land/x/oauth2_client@v1.0.2/mod.ts";
import { corsHeaders, handleCors } from "../_shared/cors.ts";

serve(async (req) => {
  console.log("--- Funzione 'google-auth-url' invocata ---");
  const corsResponse = handleCors(req);
  if (corsResponse) {
    console.log("Risposta CORS preflight inviata.");
    return corsResponse;
  }

  try {
    console.log("Parsing del corpo della richiesta...");
    const { state } = await req.json();
    if (!state) {
      throw new Error("Il parametro 'state' è obbligatorio per la protezione CSRF.");
    }
    console.log(`Stato CSRF ricevuto: ${state}`);

    console.log("Lettura delle variabili d'ambiente di Google...");
    const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
    const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
    const redirectUri = Deno.env.get("GOOGLE_REDIRECT_URI");

    // Log per verificare l'esistenza di ogni variabile
    console.log(`GOOGLE_CLIENT_ID: ${clientId ? 'Trovato' : 'NON TROVATO'}`);
    console.log(`GOOGLE_CLIENT_SECRET: ${clientSecret ? 'Trovato' : 'NON TROVATO'}`);
    console.log(`GOOGLE_REDIRECT_URI: ${redirectUri ? 'Trovato' : 'NON TROVATO'}`);

    if (!clientId || !clientSecret || !redirectUri) {
        throw new Error("Configurazione Incompleta: Una o più variabili d'ambiente Google (CLIENT_ID, CLIENT_SECRET, REDIRECT_URI) non sono state impostate. Controlla i Secrets di questa funzione nella dashboard di Supabase.");
    }
    console.log("Tutte le variabili d'ambiente sono state caricate correttamente.");

    console.log("Inizializzazione del client OAuth2...");
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
    console.log("Client OAuth2 inizializzato.");

    console.log("Generazione dell'URL di autorizzazione...");
    const authUri = oauth2Client.code.getAuthorizationUri({
      state,
      accessType: "offline",
      prompt: "consent", 
    });
    const urlString = authUri.href;
    console.log(`URL generato: ${urlString.substring(0, 80)}...`);

    if (typeof urlString !== 'string' || !urlString.startsWith("https://accounts.google.com")) {
        console.error("Generazione URL fallita. Risultato inatteso:", authUri);
        throw new Error("Impossibile generare l'URL di autorizzazione. La libreria ha restituito un formato non valido.");
    }
    console.log("URL generato con successo. Invio della risposta...");

    return new Response(JSON.stringify({ url: urlString }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("--- ERRORE CRITICO NELLA FUNZIONE ---");
    console.error("Messaggio di errore:", error.message);
    console.error("Stack trace:", error.stack);
    console.error("------------------------------------");
    return new Response(JSON.stringify({ error: `Errore interno del server: ${error.message}` }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500, 
    });
  }
});
