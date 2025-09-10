// supabase/functions/health-check/index.ts

// **SOLUZIONE RADICALE**: Importiamo 'serve' direttamente dal suo URL completo.
// Questo elimina la dipendenza dal file `import_map.json`, che è la causa
// più probabile del fallimento silenzioso del processo di bundling.
// La funzione è ora completamente autonoma e robusta contro errori di configurazione.
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

console.log("Health check function initialized (v3 - direct URL import)");

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
