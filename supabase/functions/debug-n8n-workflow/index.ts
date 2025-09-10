// supabase/functions/debug-n8n-workflow/index.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

// Header CORS direttamente nel file per eliminare dipendenze esterne.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

console.log("Funzione 'debug-n8n-workflow' inizializzata (versione semplificata).");

serve(async (req) => {
  console.log(`[debug-n8n-workflow] Richiesta ricevuta: ${req.method}`);

  // Gestione della richiesta preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const responseData = {
      message: "Risposta di base dalla funzione di diagnostica. Il deployment ha avuto successo!",
      timestamp: new Date().toISOString(),
      status: "OK",
    };

    return new Response(JSON.stringify(responseData, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("[debug-n8n-workflow] Errore:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
