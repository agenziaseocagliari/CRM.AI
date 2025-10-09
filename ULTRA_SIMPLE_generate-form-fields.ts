import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

serve(async (req) => {
  // CORS handling
  if (req.method === "OPTIONS") {
    return new Response("ok", { 
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      }
    });
  }

  try {
    const { prompt, organization_id: _organization_id } = await req.json();

    if (!prompt) {
      return new Response(JSON.stringify({ error: "Prompt required" }), { 
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        }
      });
    }

    // Risposta test semplice
    const response = {
      fields: [
        {
          name: "nome",
          label: "Nome",
          type: "text",
          required: true
        },
        {
          name: "email", 
          label: "Email",
          type: "email",
          required: true
        }
      ]
    };

    return new Response(JSON.stringify(response), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        "Content-Type": "application/json", 
        "Access-Control-Allow-Origin": "*",
      }
    });
  }
});