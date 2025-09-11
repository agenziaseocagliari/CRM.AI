// File: supabase/functions/google-auth-url/index.ts

declare const Deno: {
  env: { get(key: string): string | undefined; };
};

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { handleCors, corsHeaders } from "../_shared/cors.ts";
import { OAuth2Client } from "https://deno.land/x/oauth2_client@v1.0.2/mod.ts";

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

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

    const authUrl = await oauth2Client.code.getAuthorizationUri({
      state,
      // 'access_type: "offline"' è cruciale per ottenere un refresh token
      accessType: "offline",
      // 'prompt: "consent"' forza la schermata di consenso, assicurando che un refresh token venga sempre rilasciato.
      prompt: "consent", 
    });

    return new Response(JSON.stringify({ url: authUrl.toString() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200, // Restituisce 200 per una gestione pulita dell'errore lato client
    });
  }
});