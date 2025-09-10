// supabase/functions/health-check/index.ts
import { serve } from "serve";
import { corsHeaders } from "../shared/cors.ts";

console.log("Health check function initialized");

serve(async (_req) => {
  // Rispondi a qualsiasi richiesta, inclusi OPTIONS, con un successo.
  // Questo è un semplice endpoint per verificare se le funzioni sono raggiungibili.
  try {
    return new Response(JSON.stringify({ status: 'ok', message: 'Supabase function endpoint is reachable.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
     return new Response(JSON.stringify({ status: 'error', message: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
