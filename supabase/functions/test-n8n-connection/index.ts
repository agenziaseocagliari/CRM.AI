// FIX: Updated the Supabase edge-runtime type reference to use esm.sh, which is more reliable for Deno type definitions, resolving errors where the type file could not be found and the 'Deno' global was unrecognized.
/// <reference types="https://esm.sh/@supabase/functions-js@2.4.1/src/edge-runtime.d.ts" />

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { handleCors, corsHeaders } from "../shared/cors.ts";

serve(async (_req) => {
  const corsResponse = handleCors(_req);
  if (corsResponse) {
    return corsResponse;
  }

  try {
    const n8nUrl = Deno.env.get("N8N_INSTANCE_URL");
    const n8nApiKey = Deno.env.get("N8N_API_KEY");

    if (!n8nUrl || !n8nApiKey) {
      throw new Error("N8N_INSTANCE_URL and N8N_API_KEY environment variables are required.");
    }
    
    const baseUrl = n8nUrl.replace(/\/+$/, "");
    const testUrl = `${baseUrl}/api/v1/workflows?limit=1`;
    
    const response = await fetch(testUrl, {
      method: "GET",
      headers: { "X-N8N-API-KEY": n8nApiKey },
    });
    
    if (!response.ok) {
        const body = await response.text();
        throw new Error(`Failed to connect to n8n. Status: ${response.status}. Body: ${body}`);
    }

    return new Response(JSON.stringify({ message: "Successfully connected to n8n instance." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});