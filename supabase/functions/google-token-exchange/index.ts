// File: supabase/functions/google-token-exchange/index.ts

declare const Deno: any;

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";
import { corsHeaders, handleCors } from "../_shared/cors.ts";

// Helper per estrarre in modo sicuro user_id e organization_id dal token JWT.
async function getAuthContext(req: Request, supabase: SupabaseClient): Promise<{ userId: string, organizationId: string }> {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization header.");

    const jwt = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(jwt);
    if (userError) throw new Error(`Authentication failed: ${userError.message}`);
    if (!user) throw new Error("User not found for the provided token.");

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (profileError) throw new Error(`Could not retrieve user profile: ${profileError.message}`);
    if (!profile || !profile.organization_id) throw new Error("User profile is incomplete or not associated with an organization.");

    return { userId: user.id, organizationId: profile.organization_id };
}


serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  let supabaseAdmin: SupabaseClient;
  let organizationId: string | null = null;
  
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) throw new Error("Missing Supabase credentials in environment.");
    
    // Utilizziamo un client con service_role per bypassare RLS in modo sicuro.
    // La sicurezza è garantita dal fatto che operiamo solo sull'organization_id
    // legato all'utente autenticato dal suo token JWT.
    supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    
    // 1. Autentica l'utente e ottieni ID utente e organizzazione
    const { userId, organizationId: orgId } = await getAuthContext(req, supabaseAdmin);
    organizationId = orgId; // Assegna all'ambito esterno per il logging degli errori

    const { code } = await req.json();
    if (!code) throw new Error("Missing 'code' parameter in payload.");
    
    // 2. Scambia il codice di autorizzazione con i token di Google
    const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
    const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
    const redirectUri = Deno.env.get("GOOGLE_REDIRECT_URI");
    if (!clientId || !clientSecret || !redirectUri) throw new Error("Missing Google OAuth credentials in environment.");

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-form-urlencoded" },
      body: new URLSearchParams({
        code, client_id: clientId, client_secret: clientSecret,
        redirect_uri: redirectUri, grant_type: 'authorization_code'
      }),
    });

    const tokens = await tokenResponse.json();
    if (!tokenResponse.ok) {
      throw new Error(`Error from Google (${tokenResponse.status}): ${tokens.error_description || tokens.error}`);
    }

    // 3. Validazione critica del payload ricevuto da Google
    if (!tokens.access_token || !tokens.refresh_token) {
        console.error(`[google-token-exchange] Incomplete token for org ${organizationId}:`, tokens);
        throw new Error("Risposta da Google incompleta. Il 'refresh_token' è mancante. Prova a revocare l'accesso e a riconnetterti.");
    }

    // 4. Prepara il record da salvare nella tabella `google_credentials`
    const credentialRecord = {
      organization_id: organizationId,
      user_id: userId, // Salva l'ID dell'utente che ha effettuato l'autorizzazione
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      scope: tokens.scope,
      expiry_date: Math.floor(Date.now() / 1000) + tokens.expires_in
    };

    // 5. Salva le credenziali nella tabella dedicata
    const { error: upsertError } = await supabaseAdmin
        .from('google_credentials')
        .upsert(credentialRecord, { onConflict: 'organization_id' });

    if (upsertError) throw upsertError;
    
    // 6. (Azione di migrazione) Pulisci il vecchio campo in organization_settings
    await supabaseAdmin
        .from('organization_settings')
        .update({ google_auth_token: null })
        .eq('organization_id', organizationId);


    return new Response(JSON.stringify({ success: true, message: "Token scambiato e salvato correttamente." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("[google-token-exchange] Error:", error.message);
    
    // Logga l'errore nel database per una diagnostica persistente
    if (supabaseAdmin && organizationId) {
        await supabaseAdmin.from('debug_logs').insert({
            function_name: 'google-token-exchange',
            organization_id: organizationId,
            log_level: 'ERROR',
            content: { step: 'catch_block', error: error.message, stack: error.stack }
        }).catch(e => console.error("Failed to write to debug_logs:", e));
    }
    
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});