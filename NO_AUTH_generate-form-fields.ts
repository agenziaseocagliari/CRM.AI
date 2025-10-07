import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { 
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS"
      }
    });
  }

  try {
    const { prompt } = await req.json();
    const lowerPrompt = prompt?.toLowerCase() || "";
    
    const fields = [
      { name: "nome", label: "Nome", type: "text", required: true },
      { name: "email", label: "Email", type: "email", required: true }
    ];

    if (lowerPrompt.includes('telefono') || lowerPrompt.includes('contatto')) {
      fields.push({ name: "telefono", label: "Telefono", type: "tel", required: false });
    }

    if (lowerPrompt.includes('azienda') || lowerPrompt.includes('web agency')) {
      fields.push({ name: "azienda", label: "Azienda", type: "text", required: false });
    }

    if (lowerPrompt.includes('messaggio') || lowerPrompt.includes('richiesta')) {
      fields.push({ name: "messaggio", label: "Messaggio", type: "textarea", required: false });
    }

    if (lowerPrompt.includes('servizi') || lowerPrompt.includes('servizio')) {
      fields.push({ name: "servizi_interesse", label: "Servizi di Interesse", type: "textarea", required: false });
    }

    if (lowerPrompt.includes('budget')) {
      fields.push({ name: "budget", label: "Budget Indicativo", type: "text", required: false });
    }

    if (lowerPrompt.includes('evento') || lowerPrompt.includes('workshop')) {
      fields.push({ name: "data_evento", label: "Data Evento", type: "text", required: false });
    }

    if (lowerPrompt.includes('indirizzo') || lowerPrompt.includes('via')) {
      fields.push({ name: "indirizzo", label: "Indirizzo", type: "text", required: false });
    }

    return new Response(JSON.stringify({ 
      fields,
      meta: { 
        ai_generated: true, 
        prompt_analyzed: prompt,
        generated_at: new Date().toISOString(),
        version: "smart_fallback_v1.0"
      }
    }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });

  } catch (error) {
    return new Response(JSON.stringify({ 
      error: "Internal error",
      fields: [
        { name: "nome", label: "Nome", type: "text", required: true },
        { name: "email", label: "Email", type: "email", required: true },
        { name: "messaggio", label: "Messaggio", type: "textarea", required: false }
      ]
    }), {
      status: 200, // Restituisco sempre 200 con fallback
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
});