// FIX: Updated the Supabase edge-runtime type reference to use esm.sh, which is more reliable for Deno type definitions, resolving errors where the type file could not be found and the 'Deno' global was unrecognized.
/// <reference types="https://esm.sh/@supabase/functions-js@2.4.1/src/edge-runtime.d.ts" />

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { handleCors, corsHeaders } from "../shared/cors.ts";

serve(async (req) => {
    const corsResponse = handleCors(req);
    if (corsResponse) {
        return corsResponse;
    }

    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: "Method not allowed" }), {
            status: 405,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }

    try {
        const n8nUrl = Deno.env.get("N8N_INSTANCE_URL");
        const n8nApiKey = Deno.env.get("N8N_API_KEY");

        if (!n8nUrl || !n8nApiKey) {
            throw new Error("N8N_INSTANCE_URL and N8N_API_KEY are required.");
        }
        
        const workflowJson = await req.json();

        const baseUrl = n8nUrl.replace(/\/+$/, "");
        const createUrl = `${baseUrl}/api/v1/workflows`;
        
        const n8nResponse = await fetch(createUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-N8N-API-KEY': n8nApiKey },
            body: JSON.stringify(workflowJson),
        });

        const responseBody = await n8nResponse.json();

        return new Response(JSON.stringify(responseBody), {
            status: n8nResponse.status,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }
});