// FIX: Updated the Supabase edge-runtime type reference to a specific versioned URL. This resolves issues where the types were not found, which in turn caused errors about the 'Deno' global object not being defined.
/// <reference types="https://esm.sh/v135/@supabase/functions-js@2.4.1/src/edge-runtime.d.ts" />
// @deno-types="https://esm.sh/@google/genai@1.19.0/dist/index.d.ts"
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { GoogleGenAI, GenerateContentResponse } from "https://esm.sh/@google/genai@1.19.0";
import { handleCors, corsHeaders } from "../shared/cors.ts";

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) {
    return corsResponse;
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
      throw new Error(`Configurazione Incompleta: Mancano le seguenti variabili d'ambiente: ${missing}.`);
    }

    // 2. Validazione del body della richiesta
    const { prompt } = await req.json();
    if (!prompt) {
      throw new Error("La descrizione dell'automazione non può essere vuota.");
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
    
    let workflowJson;
    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: fullPrompt,
            config: {
                responseMimeType: "application/json",
            }
        });
        const cleanedText = response.text.trim().replace(/^```json/, '').replace(/```$/, '').trim();
        workflowJson = JSON.parse(cleanedText);
    } catch (e) {
        console.error("Gemini error:", e);
        throw new Error(`Errore durante la generazione del workflow con l'AI. Riprova. Dettagli: ${e.message}`);
    }
    
    // 4. Creazione del workflow su N8N
    let workflowId;
    try {
        const createUrl = `${n8nUrl.replace(/\/$/, '')}/api/v1/workflows`;
        const n8nResponse = await fetch(createUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-N8N-API-KEY': n8nApiKey },
            body: JSON.stringify(workflowJson),
        });

        if (n8nResponse.status === 401) {
            throw new Error("Autenticazione N8N fallita. Controlla che la N8N_API_KEY sia corretta.");
        }
        if (!n8nResponse.ok) {
            const errorBody = await n8nResponse.text();
            throw new Error(`N8N ha risposto con un errore (${n8nResponse.status}): ${errorBody}`);
        }
        const n8nData = await n8nResponse.json();
        workflowId = n8nData.id;
        if (!workflowId) throw new Error("N8N non ha restituito un ID per il workflow creato.");

    } catch (e) {
        if (e.message.includes('Failed to fetch')) {
             throw new Error(`Impossibile connettersi a N8N. Controlla che N8N_INSTANCE_URL (${n8nUrl}) sia corretto e raggiungibile.`);
        }
        throw e;
    }

    // 5. Attivazione del workflow
    const activateUrl = `${n8nUrl.replace(/\/$/, '')}/api/v1/workflows/${workflowId}/activate`;
    const activationResponse = await fetch(activateUrl, {
        method: 'POST',
        headers: { 'X-N8N-API-KEY': n8nApiKey },
    });
    if (!activationResponse.ok) {
        throw new Error("Workflow creato ma impossibile attivarlo su N8N.");
    }

    return new Response(JSON.stringify({
      message: `Workflow "${workflowJson.name}" creato e attivato con successo!`,
      workflowId: workflowId,
      n8nLink: `${n8nUrl.replace(/\/$/, '')}/workflow/${workflowId}`
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("ERRORE in generate-n8n-workflow:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200, 
    });
  }
});