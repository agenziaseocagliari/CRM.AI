// File: supabase/functions/check-google-token-status/index.ts

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { getOrganizationId } from "../_shared/supabase.ts";
import { createErrorResponse } from "../_shared/diagnostics.ts";
import { GoogleCredential } from "../_shared/google.ts";

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;
  
  const reqClone = req.clone();
  const body = await reqClone.json().catch(() => ({}));

  try {
    const authenticated_org_id = await getOrganizationId(req);

    const { organization_id } = body;
    if (!organization_id) {
      throw new Error("Il parametro 'organization_id' è obbligatorio.");
    }
    
    // Security check: a user can only query their own organization's status.
    if (authenticated_org_id !== organization_id) {
        throw new Error("Autorizzazione negata. Puoi controllare solo lo stato della tua organizzazione.");
    }
    
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY not set.");
    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, serviceRoleKey);
    
    // Query sulla nuova tabella `google_credentials`
    const { data: credential, error } = await supabaseAdmin
      .from('google_credentials')
      .select('*')
      .eq('organization_id', organization_id)
      .single<GoogleCredential>();

    // 'PGRST116' means 'exact one row not found', which is not a fatal DB error here.
    if (error && error.code !== 'PGRST116') throw error;
    
    let diagnostics = {};

    if (!credential) {
        diagnostics = { status: 'NOT_FOUND', message: 'Nessuna credenziale Google trovata per questa organizzazione.' };
    } else {
        diagnostics = {
            status: 'FOUND',
            has_access_token: !!credential.access_token,
            has_refresh_token: !!credential.refresh_token,
            scope: credential.scope,
            is_expired: credential.expiry_date ? new Date(credential.expiry_date * 1000) < new Date() : 'unknown',
            expiry_date_utc: credential.expiry_date ? new Date(credential.expiry_date * 1000).toISOString() : 'not_set'
        };
    }

    return new Response(JSON.stringify({ success: true, diagnostics }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
    
  } catch (err) {
    return await createErrorResponse(err, 'check-google-token-status', req, body);
  }
});