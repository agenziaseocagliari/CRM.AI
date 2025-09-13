// File: supabase/functions/google-auth-url/index.ts

declare const Deno: {
  env: { get(key: string): string | undefined; };
};

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, handleCors } from "../_shared/cors.ts";

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
    const redirectUri = Deno.env.get("GOOGLE_REDIRECT_URI");

    if (!clientId || !redirectUri) {
        const debugReport = `Report di Debug dalla Funzione: GOOGLE_CLIENT_ID: ${clientId ? 'Trovato' : '*** NON TROVATO ***'}. GOOGLE_REDIRECT_URI: ${redirectUri ? `Trovato ("${redirectUri}")` : '*** NON TROVATO ***'}. Causa: I secrets non sono stati caricati. Soluzione: Esegui un nuovo deploy di questa funzione usando la CLI di Supabase per forzare l'aggiornamento dei secrets.`;
        
        // STRATEGIA AVANZATA: Ritorna sempre 200 OK ma con un payload di errore.
        return new Response(JSON.stringify({ error: debugReport }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200, 
        });
    }

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

    // Caso di successo: ritorna l'URL
    return new Response(JSON.stringify({ url: urlString }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Errore imprevisto nella funzione 'google-auth-url':", error.message);
    // STRATEGIA AVANZATA: Anche gli errori imprevisti ritornano 200 OK con un payload di errore.
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200, 
    });
  }
});