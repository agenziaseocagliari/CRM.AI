import { serve } from "serve";
import { corsHeaders } from "cors";

// FIX: Add declaration for Deno to resolve TypeScript error.
// The Deno global is available in the Supabase Edge Function runtime.
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const n8nWebhookUrl = Deno.env.get('N8N_WEBHOOK_URL');
    const n8nApiKey = Deno.env.get('N8N_API_KEY');
    
    if (!n8nWebhookUrl || !n8nApiKey) {
      throw new Error("Le variabili d'ambiente N8N_WEBHOOK_URL o N8N_API_KEY non sono impostate.");
    }

    // L'endpoint di health check si trova solitamente alla radice dell'URL dell'istanza N8N
    const n8nBaseUrl = new URL(n8nWebhookUrl).origin;
    const healthCheckUrl = `${n8nBaseUrl}/healthz`;
    
    let n8nStatus = {};
    let connectionError = null;

    try {
        const response = await fetch(healthCheckUrl, {
          method: 'GET',
          headers: { 'X-N8N-API-KEY': n8nApiKey },
        });
        
        if (!response.ok) {
           throw new Error(`Connessione a N8N fallita. Status: ${response.status} ${response.statusText}. Dettagli: ${await response.text()}`);
        }
        n8nStatus = await response.json();

    } catch(e) {
        connectionError = e.message;
    }


    const responsePayload = {
        message: "Diagnostica completata.",
        checks: {
            environmentVariables: {
                N8N_WEBHOOK_URL: n8nWebhookUrl ? `Impostato (${n8nBaseUrl})` : "NON IMPOSTATO",
                N8N_API_KEY: n8nApiKey ? "Impostato" : "NON IMPOSTATO",
            },
            n8nConnection: {
                healthCheckUrl: healthCheckUrl,
                status: connectionError ? "FALLITO" : "SUCCESSO",
                details: connectionError || n8nStatus
            }
        }
    };


    return new Response(JSON.stringify(responsePayload), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Errore nella funzione di diagnostica:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
