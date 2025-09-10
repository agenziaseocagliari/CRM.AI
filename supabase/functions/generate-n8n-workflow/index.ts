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
                    type: { type: Type.STRING, description: "Il tipo di nodo (es. 'trigger', 'action', 'condition')." },
                    parameters: { 
                        type: Type.OBJECT, 
                        description: "Parametri di configurazione per il nodo. Ad esempio, per Slack, potrebbe includere 'channel' e 'message'." 
                    },
                },
                required: ["name", "type", "parameters"],
            },
        },
        connections: {
            type: Type.OBJECT,
            description: "Definisce come i nodi sono connessi. La chiave è il nome del nodo di output e il valore è un array di nomi di nodi di input.",
        },
    },
    required: ["name", "nodes", "connections"],
};


serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) throw new Error("La variabile d'ambiente GEMINI_API_KEY non è impostata.");
    if (!prompt) throw new Error("Il 'prompt' è richiesto.");

    const ai = new GoogleGenAI({ apiKey: geminiApiKey });

    const fullPrompt = `
      Sei un esperto di automazione di workflow. Il tuo compito è convertire la descrizione in linguaggio naturale di un utente in un workflow JSON in stile n8n semplificato.

      Servizi disponibili e loro funzionalità:
      - "Guardian CRM": Può essere un 'trigger' per "Nuovo Contatto" o "Score Contatto Aggiornato". Può essere un''action' per "Crea Opportunità".
      - "Slack": Può essere un''action' per "Invia Messaggio". I parametri includono 'channel' (es. '#vendite') e 'message'.
      - "Filter": È un nodo di tipo 'condition' per creare rami nel workflow in base a condizioni sui dati (es. 'lead_score equals Hot').
      
      Richiesta utente: "${prompt}"

      Genera un oggetto JSON che rappresenta il workflow basato su questa richiesta, seguendo lo schema fornito. Assicurati che le connessioni tra i nodi siano logiche.
    `;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: fullPrompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: responseSchema,
        },
    });
    
    const workflow = JSON.parse(response.text);

    return new Response(JSON.stringify({ workflow }), {
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
