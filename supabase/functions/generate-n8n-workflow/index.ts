// FIX: Pinned the version for @supabase/functions-js to resolve issues with type definition discovery. This ensures the correct Deno and Supabase Edge Function types are loaded.
/// <reference types="https://esm.sh/@supabase/functions-js@2.4.1/dist/edge-runtime.d.ts" />

// supabase/functions/generate-n8n-workflow/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenAI } from 'https://esm.sh/@google/genai@1.19.0';
import { corsHeaders } from '../shared/cors.ts';

interface N8nWorkflowCreationResponse {
    id: string;
}

// Funzione helper per pulire e parsare in modo sicuro la stringa JSON dall'AI
function cleanAndParseJson(jsonString: string): any {
  // Rimuove i backtick e la parola "json" se presenti (comuni nei code block di markdown)
  const cleanedString = jsonString.replace(/^```json\s*|```$/g, '').trim();
  
  try {
    return JSON.parse(cleanedString);
  } catch (parseError) {
    console.error("Errore di parsing JSON:", parseError);
    console.error("Stringa originale ricevuta dall'AI:", jsonString);
    throw new Error("L'AI ha restituito un JSON non valido. Riprova con un prompt diverso o controlla i log della funzione.");
  }
}


serve(async (req) => {
  // Gestisce la richiesta preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();
    const geminiApiKey = Deno.env.get('API_KEY');
    const n8nUrl = Deno.env.get('VITE_N8N_URL');
    const n8nApiKey = Deno.env.get('VITE_N8N_API_KEY');

    if (!geminiApiKey || !n8nUrl || !n8nApiKey) {
      throw new Error("Una o più variabili d'ambiente (API_KEY, VITE_N8N_URL, VITE_N8N_API_KEY) non sono impostate nei secrets di Supabase.");
    }
    if (!prompt) {
        return new Response(JSON.stringify({ error: "Il prompt per la descrizione dell'automazione è obbligatorio." }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }

    // Step 1: Chiamare Gemini per generare il JSON del workflow N8N
    const ai = new GoogleGenAI({ apiKey: geminiApiKey });
    const generationPrompt = `
        You are an expert n8n workflow designer. Your task is to convert the following user request into a valid n8n workflow JSON object.
        Output ONLY the raw JSON object, without any markdown formatting or explanations. The user's language is Italian.
        User Request: "${prompt}"
        Workflow Requirements:
        1. The workflow should start with a Webhook trigger ('n8n-nodes-base.webhook').
           - The webhook must listen for POST requests.
           - Generate a unique path for the webhook (e.g., a UUID).
           - Name the node "CRM Trigger".
        2. Based on the user request, add subsequent nodes.
        3. For actions like sending a Slack message, use 'n8n-nodes-base.slack'. Use a placeholder 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL' for 'webhookUrl'. Message text can use expressions like "{{$json.body.name}}".
        4. Connect the nodes sequentially in the 'connections' object.
        5. Set 'active' status to false. Name the workflow appropriately.
        6. The response must be a valid JSON object.
    `;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: generationPrompt,
        config: { responseMimeType: 'application/json' },
    });
    const workflowJsonString = response.text;
    if (!workflowJsonString) throw new Error("L'AI non ha generato una risposta valida.");
    
    // Utilizziamo la funzione helper per un parsing sicuro
    const workflowData = cleanAndParseJson(workflowJsonString);

    // Step 2: Creare il workflow in N8N
    const createResponse = await fetch(`${n8nUrl}/api/v1/workflows`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-N8N-API-KEY': n8nApiKey,
        },
        body: JSON.stringify(workflowData),
    });
    if (!createResponse.ok) {
        const errorBody = await createResponse.text();
        throw new Error(`Errore nella creazione del workflow N8N: ${errorBody}`);
    }
    const newWorkflow = (await createResponse.json()) as N8nWorkflowCreationResponse;
    const workflowId = newWorkflow.id;

    // Step 3: Attivare il workflow
    const activateResponse = await fetch(`${n8nUrl}/api/v1/workflows/${workflowId}/activate`, {
        method: 'POST',
        headers: { 'X-N8N-API-KEY': n8nApiKey },
    });
    if (!activateResponse.ok) {
        throw new Error("Workflow creato ma impossibile attivarlo.");
    }
    
    return new Response(JSON.stringify({ message: `Workflow "${workflowData.name}" creato e attivato con successo!` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Errore completo nella funzione:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});