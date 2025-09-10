// supabase/functions/health-check/index.ts
import { serve } from "serve";
import { corsHeaders } from "../shared/cors.ts";

console.log("Health check function initialized");

serve(async (req) => {
  // **FIX CRITICO: Aggiunto il gestore esplicito per le richieste preflight OPTIONS.**
  // Senza questo, il browser non può ottenere il permesso di inviare la richiesta effettiva,
  // causando un errore di rete generico prima che la logica della funzione venga eseguita.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // La logica principale viene eseguita solo per le altre richieste (es. POST, GET).
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
