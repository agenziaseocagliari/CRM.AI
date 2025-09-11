// FIX: Updated the Supabase edge-runtime type reference from esm.sh to a more reliable CDN (jsdelivr) to fix type resolution errors for the Deno environment.
/// <reference types="https://cdn.jsdelivr.net/npm/@supabase/functions-js@2.4.1/src/edge-runtime.d.ts" />
// @deno-types="https://esm.sh/@google/genai@1.19.0/dist/index.d.ts"
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { GoogleGenAI, GenerateContentResponse } from "https://esm.sh/@google/genai@1.19.0";
import { handleCors, corsHeaders } from "../shared/cors.ts";

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) {
    return corsResponse;
  }

  let step = "init"; // For diagnostics

  try {
    // Payload guard
    step = "payload";
    const body = await req.json().catch(() => ({}));
    const payload = typeof body === "string" ? (()=>{ try { return JSON.parse(body);} catch { return {}; } })() : body || {};
    const prompt = payload?.prompt || payload?.instruction || payload?.command || payload?.query;
    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      throw new Error("Richiesto 'prompt' (o 'instruction'/'command'/'query') non trovato nel payload.");
    }
    
    // Env validation
    step = "env";
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
    
    // URL normalization and reachability check
    step = "reach";
    const baseUrl = (n8nUrl || "").replace(/\/+$/, "");
    if (!/^https?:\/\//i.test(baseUrl)) {
      throw new Error("N8N_INSTANCE_URL deve includere il protocollo http(s). Valore attuale non valido.");
    }
    try {
      await fetch(`${baseUrl}/api/v1/workflows`, {
        method: "GET",
        headers: { "X-N8N-API-KEY": n8nApiKey! }
      });
    } catch (e) {
      throw new Error("Impossibile raggiungere N8N_INSTANCE_URL dal runtime Edge: " + String((e as Error).message || e));
    }

    // Gemini call
    step = "gemini";
    const ai = new GoogleGenAI({ apiKey: geminiApiKey });
    const fullPrompt = `
      Agisci come un esperto di automazione e specialista di n8n.
      Il tuo compito è convertire la richiesta dell'utente in un workflow n8n JSON valido e completo.
      Il JSON deve includere solo le seguenti proprietà a livello radice: "name", "nodes", "connections", e "settings".
      Non includere proprietà come "active", "id", "versionId", "createdAt", o "updatedAt" nell'oggetto JSON principale.
      Ogni nodo all'interno dell'array "nodes" deve avere "id", "name", "type", "typeVersion", "position", e "parameters".
      Assicurati che le connessioni tra i nodi siano corrette.
      **Rispondi solo ed esclusivamente con il codice JSON del workflow, senza commenti o testo aggiuntivo.**

      Esempio di struttura di base corretta:
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
        "settings": {}
      }
      
      Richiesta utente: "${prompt}"
    `;
    
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: fullPrompt,
        config: {
            responseMimeType: "application/json",
        }
    });

    // Harden JSON parsing
    step = "parse";
    const raw = (response.text || "").trim();
    if (!raw) throw new Error("Gemini ha restituito testo vuoto o è stato bloccato dal safety system.");

    let wf: any;
    function extractJsonBlock(s: string) {
      const m = s.match(/```json\s*([\s\S]*?)```/i) || s.match(/\{[\s\S]*\}/);
      return m ? (m[1] || m[0]) : s;
    }
    try { wf = JSON.parse(raw); }
    catch {
      const justJson = extractJsonBlock(raw).trim();
      try { wf = JSON.parse(justJson); }
      catch (e) { throw new Error("Output AI non è JSON valido. Dettaglio: " + (e as Error).message); }
    }

    // Sanitize the workflow object to remove read-only/invalid properties for creation.
    // This makes the function resilient to the AI including extra fields.
    delete wf.active;
    delete wf.id;
    delete wf.createdAt;
    delete wf.updatedAt;
    delete wf.versionId;
    
    // N8N POST call with diagnostics
    step = "n8n";
    const createUrl = `${baseUrl}/api/v1/workflows`;
    const n8nResponse = await fetch(createUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-N8N-API-KEY': n8nApiKey },
        body: JSON.stringify(wf),
    });

    const textBody = await n8nResponse.text().catch(()=> "");
    if (!n8nResponse.ok) {
      throw new Error(`Errore N8N ${n8nResponse.status}: ${textBody.substring(0, 800)}`);
    }

    const n8nData = JSON.parse(textBody);
    const workflowId = n8nData.id;
    if (!workflowId) throw new Error("N8N non ha restituito un ID per il workflow creato.");
    
    const activateUrl = `${baseUrl}/api/v1/workflows/${workflowId}/activate`;
    const activationResponse = await fetch(activateUrl, {
        method: 'POST',
        headers: { 'X-N8N-API-KEY': n8nApiKey },
    });
    if (!activationResponse.ok) {
        throw new Error("Workflow creato ma impossibile attivarlo su N8N.");
    }

    return new Response(JSON.stringify({
      message: `Workflow "${wf.name}" creato e attivato con successo!`,
      workflowId: workflowId,
      n8nLink: `${baseUrl}/workflow/${workflowId}`
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error(`ERRORE [${step}]:`, error);
    const hints: Record<string, string> = {
        payload: "Il body della richiesta non conteneva un prompt valido.",
        env: "Controlla le variabili d'ambiente su Supabase (GEMINI_API_KEY, N8N_INSTANCE_URL, N8N_API_KEY).",
        reach: "La funzione Edge non riesce a connettersi a N8N. Controlla DNS, firewall, o se l'istanza N8N è attiva.",
        gemini: "L'API di Gemini ha restituito un errore. Controlla la tua API key e i safety settings.",
        parse: "L'AI ha restituito un formato non-JSON. Prova a riformulare il prompt per essere più specifico.",
        n8n: "N8N ha rifiutato la richiesta. Controlla la API key di N8N, e che il workflow generato sia valido."
    };
    return new Response(JSON.stringify({
      error: error.message,
      diag: {
        step: step,
        hint: hints[step] || "Errore non classificato.",
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500, 
    });
  }
});