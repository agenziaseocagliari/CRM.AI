// FIX: Updated the Supabase edge-runtime type reference to a more stable, version-pinned URL from esm.sh. This resolves type definition errors for the Deno environment, ensuring globals like 'Deno' are correctly recognized.
/// <reference types="https://esm.sh/v135/@supabase/functions-js@2.4.1/src/edge-runtime.d.ts" />
// @deno-types="https://esm.sh/@google/genai@1.19.0/dist/index.d.ts"
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { GoogleGenAI, GenerateContentResponse } from "https://esm.sh/@google/genai@1.19.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  let lastError: Error | undefined;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < retries - 1) {
        const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Validazione delle variabili d'ambiente
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    const n8nUrl = Deno.env.get("N8N_INSTANCE_URL");
    const n8nApiKey = Deno.env.get("N8N_API_KEY");

    if (!geminiApiKey || !n8nUrl || !n8nApiKey) {
      const missing = [
        !geminiApiKey && "GEMINI_API_KEY",
        !n8nUrl && "N8N_INSTANCE_URL",
        !n8nApiKey && "N8N_API_KEY",
      ].filter(Boolean).join(", ");
      throw new Error(`Le seguenti variabili d'ambiente mancano: ${missing}`);
    }

    // 2. Validazione del body della richiesta
    const { prompt } = await req.json();
    if (!prompt) {
      return new Response(JSON.stringify({ error: "Il parametro 'prompt' è obbligatorio." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Generazione del workflow JSON con Gemini
    const ai = new GoogleGenAI({ apiKey: geminiApiKey });
    const fullPrompt = `
      Agisci come un esperto di automazione e specialista di n8n.
      Il tuo compito è convertire la richiesta dell'utente in un workflow n8n JSON valido e completo.
      Il JSON deve includere "name", "nodes", "connections", e "settings".
      Ogni nodo deve avere "id", "name", "type", "typeVersion", "position", e "parameters".
      Assicurati che le connessioni tra i nodi siano corrette.
      **Rispondi solo ed esclusivamente con il codice JSON del workflow, senza commenti o testo aggiuntivo.**

      Esempio di struttura di base:
      {
        "name": "Nome Workflow",
        "nodes": [
          {
            "parameters": {},
            "id": "e4585e4b-4f6c-4b5b-8f7b-6a1e2d9b3c5d",
            "name": "Start",
            "type": "n8n-nodes-base.manualTrigger",
            "typeVersion": 1,
            "position": [240, 300]
          }
        ],
        "connections": {},
        "active": false,
        "settings": {},
        "versionId": "1"
      }
      
      Richiesta utente: "${prompt}"
    `;

    const response: GenerateContentResponse = await withRetry(() => 
        ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: fullPrompt,
            config: {
                responseMimeType: "application/json",
            }
        })
    );
    
    let workflowJson;
    try {
        const cleanedText = response.text.trim().replace(/^```json/, '').replace(/```$/, '').trim();
        workflowJson = JSON.parse(cleanedText);
    } catch (e) {
        throw new Error(`L'output dell'AI non è un JSON valido: ${e.message}`);
    }
    
    // 4. Creazione del workflow su N8N
    const n8nResponse = await withRetry(() => 
        fetch(`${n8nUrl.replace(/\/$/, '')}/api/v1/workflows`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-N8N-API-KEY': n8nApiKey,
            },
            body: JSON.stringify(workflowJson),
        })
    );

    if (!n8nResponse.ok) {
        const errorBody = await n8nResponse.text();
        throw new Error(`Errore da N8N (${n8nResponse.status}): ${errorBody}`);
    }

    const n8nData = await n8nResponse.json();
    const workflowId = n8nData.id;
    
    if (!workflowId) {
        throw new Error("N8N non ha restituito un ID per il workflow creato.");
    }
    
    // 5. Attivazione del workflow
    await withRetry(() => 
        fetch(`${n8nUrl.replace(/\/$/, '')}/api/v1/workflows/${workflowId}/activate`, {
            method: 'POST',
            headers: { 'X-N8N-API-KEY': n8nApiKey },
        })
    );

    return new Response(JSON.stringify({
      message: `Workflow "${workflowJson.name}" creato e attivato con successo!`,
      workflowId: workflowId,
      n8nLink: `${n8nUrl.replace(/\/$/, '')}/workflow/${workflowId}`
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("ERRORE DETTAGLIATO in generate-n8n-workflow:", error);
    // Restituisce uno status 200 ma con un payload di errore
    // Questo permette al client Supabase di leggere il messaggio di errore specifico
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }
});