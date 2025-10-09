import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Max-Age": "86400"
};

function handleCors(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  return null;
}

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { prompt, organization_id: _organization_id } = await req.json();

    if (!prompt) {
      return new Response(JSON.stringify({ error: "Prompt required" }), { 
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Smart form generation basato sul prompt
    const lowerPrompt = prompt.toLowerCase();
    const smartFields = [];

    // Campi base sempre presenti
    smartFields.push({
      name: "nome",
      label: "Nome",
      type: "text",
      required: true
    });

    smartFields.push({
      name: "email",
      label: "Email",
      type: "email",  
      required: true
    });

    // Logica intelligente per aggiungere campi basati sul prompt
    if (lowerPrompt.includes('telefono') || lowerPrompt.includes('contatto') || lowerPrompt.includes('chiamata')) {
      smartFields.push({
        name: "telefono",
        label: "Telefono",
        type: "tel",
        required: false
      });
    }

    if (lowerPrompt.includes('azienda') || lowerPrompt.includes('società') || lowerPrompt.includes('ditta') || lowerPrompt.includes('web agency')) {
      smartFields.push({
        name: "azienda",
        label: "Azienda",
        type: "text",
        required: false
      });
    }

    if (lowerPrompt.includes('messaggio') || lowerPrompt.includes('richiesta') || lowerPrompt.includes('descrizione') || lowerPrompt.includes('dettagli')) {
      smartFields.push({
        name: "messaggio",
        label: "Messaggio",
        type: "textarea",
        required: false
      });
    }

    if (lowerPrompt.includes('indirizzo') || lowerPrompt.includes('via') || lowerPrompt.includes('città')) {
      smartFields.push({
        name: "indirizzo",
        label: "Indirizzo",
        type: "text",
        required: false
      });
    }

    if (lowerPrompt.includes('data') || lowerPrompt.includes('evento') || lowerPrompt.includes('appuntamento') || lowerPrompt.includes('workshop')) {
      smartFields.push({
        name: "data_preferita",
        label: "Data Preferita",
        type: "text",
        required: false
      });
    }

    if (lowerPrompt.includes('servizi') || lowerPrompt.includes('servizio') || lowerPrompt.includes('web agency')) {
      smartFields.push({
        name: "servizi_interesse",
        label: "Servizi di Interesse",
        type: "textarea",
        required: false
      });
    }

    if (lowerPrompt.includes('budget') || lowerPrompt.includes('preventivo') || lowerPrompt.includes('costo')) {
      smartFields.push({
        name: "budget",
        label: "Budget Indicativo",
        type: "text",
        required: false
      });
    }

    const response = {
      fields: smartFields,
      meta: {
        ai_generated: true,
        smart_fallback: true,
        prompt_analyzed: prompt,
        fields_count: smartFields.length
      }
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : String(error) 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});