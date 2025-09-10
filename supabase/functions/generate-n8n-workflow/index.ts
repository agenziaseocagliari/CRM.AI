// @deno-types="https://esm.sh/@google/genai@1.19.0/dist/index.d.ts"
import { serve } from "serve";
import { corsHeaders } from "../shared/cors.ts";
import { GoogleGenAI, Type } from "@google/genai";

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING, description: "Un nome descrittivo per il workflow, basato sulla richiesta dell'utente." },
        nodes: {
            type: Type.ARRAY,
            description: "Un array di nodi che rappresentano i passaggi del workflow.",
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING, description: "Il nome del servizio o dell'azione (es. 'Guardian Trigger', 'Slack', 'Filter')." },
                    type: { type: Type.STRING, description: "Il tipo di nodo secondo la nomenclatura n8n (es. 'n8n-nodes-base.if', 'n8n-nodes-base.slack')." },
                    typeVersion: { type: Type.NUMBER, description: "La versione del tipo di nodo (es. 1)." },
                    position: { type: Type.ARRAY, items: { type: Type.NUMBER }, description: "Le coordinate [x, y] per la posizione del nodo nell'editor di n8n." },
                    parameters: { 
                        type: Type.OBJECT, 
                        description: "Parametri di configurazione per il nodo. Ad esempio, per Slack, potrebbe includere 'channel' e 'text'." 
                    },
                },
                required: ["name", "type", "typeVersion", "position", "parameters"],
            },
        },
        connections: {
            type: Type.OBJECT,
            description: "Definisce come i nodi sono connessi. La chiave è il nome del nodo di output, e il valore è un oggetto le cui chiavi sono gli output (es. 'main') e i valori sono array di connessioni di input.",
        },
    },
    required: ["name", "nodes", "connections"],
};


serve(async (req) => {
  // Gestione della richiesta preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Estrazione e validazione degli input
    const { prompt } = await req.json();
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    const n8nUrl = Deno.env.get('N8N_INSTANCE_URL');
    const n8nApiKey = Deno.env.get('N8N_API_KEY');

    if (!geminiApiKey) throw new Error("La variabile d'ambiente GEMINI_API_KEY non è impostata.");
    if (!n8nUrl || !n8nApiKey) throw new Error("Le variabili d'ambiente N8N_INSTANCE_URL e N8N_API_KEY sono necessarie.");
    if (!prompt) throw new Error("Il 'prompt' è richiesto per descrivere l'automazione.");

    // 2. Generazione del workflow JSON con Gemini AI
    const ai = new GoogleGenAI({ apiKey: geminiApiKey });
    const fullPrompt = `
      Sei un esperto di n8n. Converti la richiesta dell'utente in un workflow JSON valido per n8n.
      Servizi disponibili:
      - "Guardian CRM Trigger": tipo 'guardian-crm-trigger.guardianCrmTrigger', trigger per "Nuovo Contatto" o "Score Contatto Aggiornato".
      - "Slack": tipo 'n8n-nodes-base.slack', action per "Invia Messaggio". Parametri: 'channel', 'text'.
      - "IF Node": tipo 'n8n-nodes-base.if', per condizioni.
      - "Guardian CRM Action": tipo 'guardian-crm.guardianCrm', action per "Crea Opportunità".
      Posiziona i nodi in modo ordinato da sinistra a destra, incrementando la coordinata x di circa 250 per ogni passo.
      Richiesta: "${prompt}"
    `;

    const geminiResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: fullPrompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: responseSchema,
        },
    });
    
    const workflowJson = JSON.parse(geminiResponse.text);

    // 3. Creazione del workflow sull'istanza N8N
    const n8nApiResponse = await fetch(`${n8nUrl}/api/v1/workflows`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-N8N-API-KEY': n8nApiKey,
        },
        body: JSON.stringify(workflowJson),
    });

    if (!n8nApiResponse.ok) {
        const errorBody = await n8nApiResponse.text();
        throw new Error(`Errore da N8N (${n8nApiResponse.status}): ${errorBody}`);
    }

    const n8nWorkflowData = await n8nApiResponse.json();
    const workflowId = n8nWorkflowData.id;

    // 4. Invio della risposta di successo al client
    return new Response(JSON.stringify({ 
        message: `Workflow "${workflowJson.name}" creato con successo su N8N!`,
        workflowId: workflowId,
        n8nLink: `${n8nUrl}/workflow/${workflowId}`
    }), {
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
