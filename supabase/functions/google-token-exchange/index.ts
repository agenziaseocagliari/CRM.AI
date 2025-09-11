// File: supabase/functions/google-token-exchange/index.ts

declare const Deno: {
  env: { get(key: string): string | undefined; };
};

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";
import { handleCors, corsHeaders } from "shared/cors.ts";
import { OAuth2Client } from "https://deno.land/x/oauth2_client@v1.0.2/mod.ts";

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { code, organization_id } = await req.json();
    if (!code || !organization_id) throw new Error("I parametri 'code' e 'organization_id' sono obbligatori.");
    
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!serviceRoleKey) throw new Error("La variabile d'ambiente SUPABASE_SERVICE_ROLE_KEY non è impostata.");
    
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
    });
    
    const tokens = await oauth2Client.code.getToken(code);
    
    const tokenData = {
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        expiry_date: new Date(Date.now() + (tokens.expiresIn || 0) * 1000).toISOString(),
    };
    
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
    console.error("Errore nello scambio di token Google:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200, 
    });
  }
});
