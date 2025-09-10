// @deno-types="https://esm.sh/@google/genai@1.19.0/dist/index.d.ts"
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
// FIX: Import GenerateContentResponse to correctly type the API call result.
import { GoogleGenAI, Type, GenerateContentResponse } from "https://esm.sh/@google/genai@1.19.0";

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// HELPER: Parsing JSON sicuro
function safeParseJson(text?: string) {
  if (!text) throw new Error("Risposta vuota dal modello AI.");
  const cleaned = text.trim().replace(/^```json\s*/i, '').replace(/```$/,'').trim();
  try { 
    return JSON.parse(cleaned);
  } catch (e) { 
    throw new Error("L'output del modello AI non è un JSON valido: " + (e as Error).message);
  }
}

// HELPER: Retry con backoff esponenziale
async function withRetry<T>(fn: () => Promise<T>, tries = 3, base = 500): Promise<T> {
  let lastError: any;
  for (let i = 0; i < tries; i++) {
    try {
      return await fn();
    } catch (e: any) {
      lastError = e;
      const msg = String(e.message || e);
      if (!/429|503|timeout|unavailable|network/i.test(msg) || i === tries - 1) {
        throw e;
      }
      const delay = base * Math.pow(2, i) + Math.floor(Math.random() * 250);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw lastError;
}

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING },
        nodes: { type: Type.ARRAY, items: { type: Type.OBJECT } },
        connections: { type: Type.OBJECT },
    },
    required: ["name", "nodes", "connections"],
};


serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // FIX C: Check variabili ambiente anticipato
    const missingVars = [];
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    const n8nUrl = Deno.env.get('N8N_INSTANCE_URL');
    const n8nApiKey = Deno.env.get('N8N_API_KEY');
    if (!geminiApiKey) missingVars.push("GEMINI_API_KEY");
    if (!n8nUrl) missingVars.push("N8N_INSTANCE_URL");
    if (!n8nApiKey) missingVars.push("N8N_API_KEY");
    if (missingVars.length > 0) {
      throw new Error(`Variabili d'ambiente mancanti: ${missingVars.join(', ')}`);
    }

    const { prompt } = await req.json();
    if (!prompt) throw new Error("Il 'prompt' è richiesto per descrivere l'automazione.");

    const ai = new GoogleGenAI({ apiKey: geminiApiKey });

    // FIX 3D: Prompt potenziato con "few-shot" example
    const fullPrompt = `
      Sei un esperto di n8n. Converti la richiesta dell'utente in un workflow JSON valido per n8n.
      Servizi disponibili:
      - "Guardian CRM Trigger": tipo 'guardian-crm-trigger.guardianCrmTrigger', trigger per "Nuovo Contatto" o "Score Contatto Aggiornato".
      - "Slack": tipo 'n8n-nodes-base.slack', action per "Invia Messaggio". Parametri: 'channel', 'text'.
      - "IF Node": tipo 'n8n-nodes-base.if', per condizioni.
      - "Guardian CRM Action": tipo 'guardian-crm.guardianCrm', action per "Crea Opportunità".
      Posiziona i nodi in modo ordinato da sinistra a destra, incrementando la coordinata x di circa 250 per ogni passo.
      
      Richiesta utente: "${prompt}"

      RESTITUISCI ESCLUSIVAMENTE JSON valido per n8n. Ecco un esempio della struttura richiesta:
      {
        "name": "Nome del Workflow",
        "nodes": [
          {
            "id": "22d1a644-0589-4848-a720-94395e968132",
            "name": "Guardian Trigger",
            "type": "guardian-crm-trigger.guardianCrmTrigger",
            "typeVersion": 1,
            "position": [900, 300],
            "parameters": { "event": "contact.score.updated" }
          },
          {
            "id": "2d50ad41-4357-4b73-a81d-27c191a35a4d",
            "name": "IF Score is Hot",
            "type": "n8n-nodes-base.if",
            "typeVersion": 1,
            "position": [1150, 300],
            "parameters": {
              "conditions": {
                "string": [ { "value1": "{{$json.category}}", "operation": "equal", "value2": "Hot" } ]
              }
            }
          }
        ],
        "connections": {
          "Guardian Trigger": {
            "main": [ [ { "node": "IF Score is Hot", "type": "main", "index": 0 } ] ]
          }
        }
      }
    `;

    // FIX D: Applica retry
    // FIX: Explicitly type the API response to resolve the type error on `geminiResponse.text`.
    const geminiResponse = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: fullPrompt,
        config: {
            responseMimeType: "application/json",
            responseSchema, // schema base, la validazione completa è sotto
        },
    }));
    
    // FIX A: Usa safeParseJson
    const workflowJson = safeParseJson(geminiResponse.text);

    // FIX B: Validazione e arricchimento del workflow JSON
    workflowJson.name = workflowJson.name || "AI Generated Workflow";
    workflowJson.active = false; // Sempre inattivo di default per sicurezza
    workflowJson.nodes = (workflowJson.nodes || []).map((n: any, i: number) => ({
      id: crypto.randomUUID(), // Genera sempre un nuovo ID per evitare conflitti
      ...n,
      position: n.position || [900 + i * 250, 300] // Assicura una posizione
    }));
    workflowJson.connections = workflowJson.connections || {};

    if (!Array.isArray(workflowJson.nodes) || workflowJson.nodes.length === 0) {
      throw new Error("Il workflow generato dall'AI è privo di nodi. Prova un prompt più specifico.");
    }

    // Crea un body completo per l'API di n8n
    const n8nPayload = {
        name: workflowJson.name,
        active: workflowJson.active,
        nodes: workflowJson.nodes,
        connections: workflowJson.connections,
        settings: {}, // Aggiungi settings vuoto per compatibilità
        staticData: null,
    };

    // FIX D: Applica retry anche alla chiamata a n8n
    const n8nApiResponse = await withRetry(() => fetch(`${n8nUrl}/api/v1/workflows`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-N8N-API-KEY': n8nApiKey,
        },
        body: JSON.stringify(n8nPayload),
    }));

    if (!n8nApiResponse.ok) {
        const errorBody = await n8nApiResponse.text();
        throw new Error(`Errore da N8N (${n8nApiResponse.status}): ${errorBody}`);
    }

    const n8nWorkflowData = await n8nApiResponse.json();
    const workflowId = n8nWorkflowData.id;

    return new Response(JSON.stringify({ 
        message: `Workflow "${workflowJson.name}" creato con successo su N8N!`,
        workflowId: workflowId,
        n8nLink: `${n8nUrl}/workflow/${workflowId}`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Errore in generate-n8n-workflow:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
