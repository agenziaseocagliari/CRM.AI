// FIX: Switched to unpkg.com for type definitions to resolve issues where the Deno global object was not being recognized.
/// <reference types="https://unpkg.com/@supabase/functions-js@2.4.1/src/edge-runtime.d.ts" />

// supabase/functions/generate-n8n-workflow/index.ts

import { serve } from "std/http/server.ts";
import { GoogleGenAI } from '@google/genai';
import { corsHeaders } from 'shared/cors.ts';

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
    
    // NUOVA GESTIONE ROBUSTA DELLA RISPOSTA
    // 1. Controlla se la richiesta è stata bloccata per motivi di sicurezza/policy.
    // L'accesso a `response.text` lancerebbe un errore, quindi lo controlliamo prima.
    if (response.promptFeedback?.blockReason) {
      const blockReason = response.promptFeedback.blockReason;
      console.error(`Richiesta a Gemini bloccata. Motivo: ${blockReason}`);
      throw new Error(`La tua richiesta non può essere processata per motivi di policy (${blockReason}). Prova a riformulare il prompt.`);
    }

    // 2. Estrai il testo in modo sicuro.
    const workflowJsonString = response.text;
    
    // 3. Controlla che il testo non sia vuoto.
    if (!workflowJsonString) {
        console.error("Risposta vuota da Gemini AI.");
        throw new Error("L'AI ha restituito una risposta vuota. Riprova con un prompt più specifico.");
    }

    console.log("JSON grezzo ricevuto da Gemini. Tentativo di parsing...");
    const workflowData = cleanAndParseJson(workflowJsonString);
    console.log(`Workflow "${workflowData.name}" parsato con successo.`);

    // Step 2: Creare il workflow in N8N
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

    // Step 3: Attivare il workflow
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
