// FIX: Replaced the version-pinned esm.sh URL with the unversioned one from the official Supabase documentation to resolve type definition loading issues and correctly define Deno globals.
/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
};

serve(async (req) => {
   if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const results = {
    envVars: {
      GEMINI_API_KEY: "MISSING",
      N8N_INSTANCE_URL: "MISSING",
      N8N_API_KEY: "MISSING",
    },
    n8nConnection: {
      status: "NOT TESTED",
      message: "",
    },
  };

  // 1. Check Environment Variables
  const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
  const n8nUrl = Deno.env.get("N8N_INSTANCE_URL");
  const n8nApiKey = Deno.env.get("N8N_API_KEY");

  results.envVars.GEMINI_API_KEY = geminiApiKey ? `SET (ends with ...${geminiApiKey.slice(-4)})` : "MISSING";
  results.envVars.N8N_INSTANCE_URL = n8nUrl ? `SET (${n8nUrl})` : "MISSING";
  results.envVars.N8N_API_KEY = n8nApiKey ? `SET (ends with ...${n8nApiKey.slice(-4)})` : "MISSING";

  // 2. Test N8N Connection if credentials are set
  if (n8nUrl && n8nApiKey) {
    try {
      const testUrl = `${n8nUrl.replace(/\/$/, '')}/api/v1/workflows?limit=1`;
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'X-N8N-API-KEY': n8nApiKey,
        },
      });

      if (response.ok) {
        results.n8nConnection.status = "SUCCESS";
        results.n8nConnection.message = `Successfully connected to N8N and fetched workflows (Status: ${response.status}).`;
      } else {
        const errorText = await response.text();
        results.n8nConnection.status = "FAILED";
        results.n8nConnection.message = `Failed to connect to N8N. The instance returned status ${response.status}. Please check if the URL is correct and publicly accessible, and if the API key has read permissions for workflows. Response: ${errorText}`;
      }
    } catch (error) {
      results.n8nConnection.status = "ERROR";
      results.n8nConnection.message = `A network error occurred while trying to reach N8N. Please ensure the URL '${n8nUrl}' is correct and reachable from the internet. Error details: ${error.message}`;
    }
  } else {
      results.n8nConnection.message = "Skipping N8N connection test because N8N_INSTANCE_URL or N8N_API_KEY is missing.";
  }

  return new Response(JSON.stringify(results, null, 2), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
});
