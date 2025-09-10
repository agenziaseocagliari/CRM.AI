// FIX: Add Deno types reference to resolve "Cannot find name 'Deno'" error.
/// <reference types="https://deno.land/x/deno/cli/types/deno.ns.d.ts" />

// Import diretti e versionati per massima robustezza
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { GoogleGenAI } from "https://esm.sh/@google/genai@1.19.0";
import { corsHeaders } from '../shared/cors.ts';

interface N8nWorkflowCreationResponse {
    id: string;
}

function cleanAndParseJson(jsonString: string): any {
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

    console.log("Step 1: Invocazione di Gemini AI per generare il workflow...");
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
    
    if (response.promptFeedback?.blockReason) {
      const blockReason = response.promptFeedback.blockReason;
      console.error(`Richiesta a Gemini bloccata. Motivo: ${blockReason}`);
      throw new Error(`La tua richiesta non può essere processata per motivi di policy (${blockReason}). Prova a riformulare il prompt.`);
    }

    const workflowJsonString = response.text;
    
    if (!workflowJsonString) {
        console.error("Risposta vuota da Gemini AI.");
        throw new Error("L'AI ha restituito una risposta vuota. Riprova con un prompt più specifico.");
    }

    console.log("JSON grezzo ricevuto da Gemini. Tentativo di parsing...");
    const workflowData = cleanAndParseJson(workflowJsonString);
    console.log(`Workflow "${workflowData.name}" parsato con successo.`);

    console.log("Step 2: Creazione del workflow in N8N...");
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
        console.error(`Errore N8N (Creazione): Status ${createResponse.status}, Body: ${errorBody}`);
        throw new Error(`Errore nella creazione del workflow N8N (Status: ${createResponse.status}). Controlla l'URL di N8N e la API Key.`);
    }
    const newWorkflow = (await createResponse.json()) as N8nWorkflowCreationResponse;
    const workflowId = newWorkflow.id;
    console.log(`Workflow creato con ID: ${workflowId}`);

    console.log("Step 3: Attivazione del workflow...");
    const activateResponse = await fetch(`${n8nUrl}/api/v1/workflows/${workflowId}/activate`, {
        method: 'POST',
        headers: { 'X-N8N-API-KEY': n8nApiKey },
    });
    if (!activateResponse.ok) {
         const errorBody = await activateResponse.text();
        console.error(`Errore N8N (Attivazione): Status ${activateResponse.status}, Body: ${errorBody}`);
        throw new Error(`Workflow creato (ID: ${workflowId}) ma impossibile attivarlo.`);
    }
    console.log("Workflow attivato con successo.");
    
    return new Response(JSON.stringify({ message: `Workflow "${workflowData.name}" creato e attivato con successo!` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Errore completo nella funzione:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});