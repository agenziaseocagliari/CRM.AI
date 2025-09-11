// File: supabase/functions/generate-whatsapp-message/index.ts
// VERSIONE DI DEBUG PER TESTARE LA CONNESSIONE

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

// Header CORS minimi e necessari per il test
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // Gestione esplicita e immediata della richiesta preflight OPTIONS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Per le richieste POST, proviamo a leggere il corpo
    // e restituiamo una risposta di test fissa.
    const body = await req.json();
    const mockMessage = `✅ Messaggio di test generato con successo! L'obiettivo era: "${body.prompt}"`;
    
    return new Response(
      JSON.stringify({ message: mockMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    // Se c'è un errore (es. JSON malformato), lo restituiamo
    return new Response(JSON.stringify({ error: `Errore nel server di test: ${error.message}` }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
