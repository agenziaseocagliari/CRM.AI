// File: supabase/functions/test-org-settings/index.ts

// FIX: Added Deno global declaration to resolve TypeScript errors with Deno.env.get.
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders, handleCors } from '../_shared/cors.ts'
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    console.log("EDGE LOG: [START] - Function 'test-org-settings' invoked.");

    // 1. Log all relevant Deno environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const projectRef = supabaseUrl ? new URL(supabaseUrl).hostname.split('.')[0] : 'N/A';
    console.log(`EDGE LOG: [ENV] - SUPABASE_URL: ${supabaseUrl ? `Loaded (Project Ref: ${projectRef})` : 'MISSING!'}`);
    console.log(`EDGE LOG: [ENV] - SUPABASE_SERVICE_ROLE_KEY: ${serviceRoleKey ? 'Loaded' : 'MISSING!'}`);
    
    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.");
    }

    // 2. Log received parameters
    const { organization_id } = await req.json();
    console.log(`EDGE LOG: [PARAMS] - Received organization_id: ${organization_id}`);

    if (!organization_id) {
      return new Response(JSON.stringify({ error: 'Missing organization_id in request body' }), { 
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 3. Log key type used for Supabase query
    console.log("EDGE LOG: [AUTH] - Using service_role_key for query. This will BYPASS RLS.");
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // 4. Test SELECT * FROM organization_settings
    console.log(`EDGE LOG: [QUERY] - Executing: SELECT * FROM organization_settings WHERE organization_id = '${organization_id}'`);
    const { data, error } = await supabaseAdmin
        .from('organization_settings')
        .select('*')
        .eq('organization_id', organization_id)
        .single();
        
    console.log("EDGE LOG: [RESULT] - Query finished.");
    console.log("EDGE LOG: [RESULT] - Data:", data);
    console.log("EDGE LOG: [RESULT] - Error:", error);

    if (error && !data) {
        return new Response(JSON.stringify({ success: false, message: "Query failed or no record found.", error: error }), {
            status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    return new Response(JSON.stringify({ success: true, data: data, error: error }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error("EDGE LOG: [FATAL] - Unexpected error in test-org-settings:", err);
    return new Response(JSON.stringify({ error: err.message }), { 
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
