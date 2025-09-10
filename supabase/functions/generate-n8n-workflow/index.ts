// @deno-types="https://esm.sh/@google/genai@1.19.0/dist/index.d.ts"
import { serve } from "serve";
import { corsHeaders } from "cors";
import { GoogleGenAI, Type } from "@google/genai";

// FIX: Add declaration for Deno to resolve TypeScript error.
// The Deno global is available in the Supabase Edge Function runtime.
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const workflowSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING, description: "Un nome descrittivo per il workflow." },
        nodes: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    parameters: { type: Type.OBJECT },
                    name: { type: Type.STRING },
                    type: { type: Type.STRING },
                    typeVersion: { type: Type.NUMBER },
                    position: { type: Type.ARRAY, items: { type: Type.NUMBER } },
                },
            },
        },
        connections: { type: Type.OBJECT },
        active: { type: Type.BOOLEAN, description: "Imposta il workflow come attivo." },
    },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    const n8nWebhookUrl = Deno.env.get('N8N_WEBHOOK_URL');
    const n8nApiKey = Deno.env.get('N8N_API_KEY');

    if (!geminiApiKey || !n8nWebhookUrl || !n8nApiKey) {
      throw new Error("Mancano le variabili d'ambiente necessarie (GEMINI, N8N).");
    }

    const ai = new GoogleGenAI({ apiKey: geminiApiKey });
    
    const fullPrompt = `
      Sei un esperto di N8N. Converti la seguente richiesta in un JSON valido per un workflow N8N.
      Il workflow deve iniziare con un trigger 'When a contact is created in Guardian AI CRM'.
      
      Esempio di output per un nodo trigger:
      { "name": "Guardian AI Trigger", "type": "n8n-nodes-base.webhook", "typeVersion": 1, "position": [ 800, 500 ], "parameters": { "httpMethod": "POST", "path": "guardian-ai-contact-created", "responseMode": "onReceived", "options": {} } }

      Richiesta utente: "${prompt}"
      
      Assicurati che la struttura JSON sia perfettamente valida e segua lo schema richiesto.
    `;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: fullPrompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: workflowSchema,
        },
    });

    const workflowJson = JSON.parse(response.text);
    
    // Invia il workflow a N8N
    const n8nBaseUrl = new URL(n8nWebhookUrl).origin;
    const createWorkflowUrl = `${n8nBaseUrl}/api/v1/workflows`;
    
    const n8nResponse = await fetch(createWorkflowUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-N8N-API-KEY': n8nApiKey,
        },
        body: JSON.stringify(workflowJson),
    });

    if (!n8nResponse.ok) {
        const errorBody = await n8nResponse.text();
        throw new Error(`Errore da N8N: ${n8nResponse.status} - ${errorBody}`);
    }

    return new Response(JSON.stringify({ message: "Workflow creato con successo in N8N!" }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Errore in generate-n8n-workflow:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
