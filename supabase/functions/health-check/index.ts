// supabase/functions/health-check/index.ts
import { serve } from "serve";

// **FIX RADICALE: Gli header sono ora definiti localmente.**
// Questo elimina la dipendenza dal file `../shared/cors.ts`,
// che era la causa più probabile del fallimento del bundler e del deployment.
// La funzione è ora 100% autonoma e non può fallire per problemi di import locali.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

console.log("Health check function initialized (v2 - self-contained)");

serve(async (req) => {
  // Gestione esplicita della richiesta preflight OPTIONS.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    return new Response(JSON.stringify({ status: 'ok', message: 'Endpoint della funzione Supabase raggiungibile con successo.' }), {
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
