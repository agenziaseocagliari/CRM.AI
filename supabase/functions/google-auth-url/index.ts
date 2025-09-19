// File: supabase/functions/google-auth-url/index.ts
declare const Deno: any;

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { getOrganizationId } from "../_shared/supabase.ts";

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;
  
  try {
    // Security enhancement: ensure user is authenticated before proceeding.
    await getOrganizationId(req);

    const { state } = await req.json();
    if (!state) {
      throw new Error("The 'state' parameter is required for CSRF protection.");
    }

    const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
    const redirectUri = Deno.env.get("GOOGLE_REDIRECT_URI");
    if (!clientId || !redirectUri) {
        const errorDetail = `GOOGLE_CLIENT_ID: ${clientId ? 'OK' : 'MISSING'}, GOOGLE_REDIRECT_URI: ${redirectUri ? 'OK' : 'MISSING'}`;
        console.error(`Configuration error in google-auth-url: ${errorDetail}`);
        throw new Error(`Server configuration error. Please contact support. Details: ${errorDetail}`);
    }

    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", "https://www.googleapis.com/auth/calendar");
    authUrl.searchParams.set("state", state);
    authUrl.searchParams.set("access_type", "offline");
    authUrl.searchParams.set("prompt", "consent");
    
    return new Response(JSON.stringify({ url: authUrl.toString() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in 'google-auth-url':", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: error.message.includes("Authentication") ? 401 : 500,
    });
  }
});
