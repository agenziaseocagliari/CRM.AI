// File: supabase/functions/check-google-token-status/index.ts

// FIX: Added a Deno type declaration to resolve "Cannot find name 'Deno'" errors, which is necessary for TypeScript to recognize the Deno runtime environment globals in Supabase Edge Functions.
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { getOrganizationId } from "../_shared/supabase.ts"; // For auth

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;
  
  try {
    // Authenticate the user calling the function
    const authenticated_org_id = await getOrganizationId(req);

    const { organization_id } = await req.json();
    if (!organization_id) {
      throw new Error("Il parametro 'organization_id' è obbligatorio.");
    }
    
    // For security, a user can only check their own org's token status
    if (authenticated_org_id !== organization_id) {
        throw new Error("Autorizzazione negata. Puoi controllare solo lo stato della tua organizzazione.");
    }
    
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY not set.");
    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, serviceRoleKey);
    
    const { data: settings, error } = await supabaseAdmin
      .from('organization_settings')
      .select('google_auth_token')
      .eq('organization_id', organization_id)
      .single();

    if (error) throw error;
    
    const token = settings?.google_auth_token;
    let diagnostics = {};

    if (!token) {
        diagnostics = { status: 'NOT_FOUND', message: 'Nessun token Google trovato per questa organizzazione.' };
    } else {
        diagnostics = {
            status: 'FOUND',
            has_access_token: !!token.access_token,
            has_refresh_token: !!token.refresh_token,
            scope: token.scope,
            token_type: token.token_type,
            is_expired: token.expiry_date ? new Date(token.expiry_date * 1000) < new Date() : 'unknown',
            expiry_date_utc: token.expiry_date ? new Date(token.expiry_date * 1000).toISOString() : 'not_set'
        };
    }

    return new Response(JSON.stringify({ success: true, diagnostics }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
    
  } catch (err) {
    console.error("Errore in check-google-token-status:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
