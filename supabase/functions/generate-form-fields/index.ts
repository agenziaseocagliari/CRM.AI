// supabase/functions/generate-form-fields/index.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

console.log("Funzione 'generate-form-fields' inizializzata (versione semplificata).");

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Restituisce una struttura di campi fissa invece di chiamare l'AI
    const mockFields = [
        { name: "nome_completo", label: "Nome Completo (Test)", type: "text", required: true },
        { name: "email_address", label: "Indirizzo Email (Test)", type: "email", required: true }
    ];
    return new Response(JSON.stringify({ fields: mockFields }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
