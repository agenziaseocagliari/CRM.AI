// @deno-types="https://esm.sh/@google/genai@1.19.0/dist/index.d.ts"
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { GoogleGenAI, GenerateContentResponse } from "https://esm.sh/@google/genai@1.19.0";

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function safeParseJson(text?: string) {
  if (!text) throw new Error("Risposta vuota dal modello AI.");
  const cleaned = text.trim().replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  try { 
    return JSON.parse(cleaned);
  } catch (e) { 
    throw new Error("L'output del modello AI non è un JSON valido: " + (e as Error).message);
  }
}

function normalizeWorkflow(wf: any) {
  wf.name ??= "AI Generated Workflow";
  wf.active ??= false;
  wf.version ??= 1;
  wf.settings ??= {};
  wf.connections ??= {};
  wf.nodes = (wf.nodes ?? []).map((n: any, i: number) => ({
    id: n.id ?? crypto.randomUUID?.() ?? String(i + 1),
    position: (Array.isArray(n.position) && n.position.length === 2) ? n.position : [100 + i * 300, 200],
    typeVersion: n.typeVersion ?? 1,
    parameters: n.parameters ?? {},
    ...n
  }));
  if (!Array.isArray(wf.nodes) || wf.nodes.length === 0) throw new Error("Il workflow generato dall'AI è privo di 'nodes'.");
  return wf;
}

async function withRetry<T>(fn: () => Promise<T>, tries = 3, base = 500): Promise<T> {
  let last: unknown;
  for (let i = 0; i < tries; i++) {
    try { 
      return await fn(); 
    } catch (e) {
      last = e;
      const msg = String((e as Error).message || e);
      if (!/429|503|timeout|unavailable|network/i.test(msg) || i === tries - 1) throw e;
      const delay = base * (2 ** i) + Math.floor(Math.random() * 250);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw last;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { prompt } = await req.json();
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    const n8nUrl = Deno.env.get("N8N_INSTANCE_URL");
    const n8nApiKey = Deno.env.get("N8N_API_KEY");
    
    const missing = [];
    if (!geminiApiKey) missing.push("GEMINI_API_KEY");
    if (!n8nUrl) missing.push("N8N_INSTANCE_URL");
    if (!n8nApiKey) missing.push("N8N_API_KEY");
    if (missing.length) throw new Error("Variabili d'ambiente mancanti: " + missing.join(", "));
    if (!prompt) throw new Error("Il 'prompt' è richiesto.");

    const ai = new GoogleGenAI({ apiKey: geminiApiKey });

    const fewShotExample = `{
      "name": "Example Workflow",
      "version": 1,
      "active": false,
      "nodes": [
        { "id": "1", "name": "Start", "type": "n8n-nodes-base.manualTrigger", "typeVersion": 1, "position": [100,200], "parameters": {} },
        { "id": "2", "name": "Set Data", "type": "n8n-nodes-base.set", "typeVersion": 1, "position": [400,200], "parameters": { "values": { "string": [{ "name": "message", "value": "it works" }] } } }
      ],
      "connections": { "Start": { "main": [[{ "node":"Set Data", "type":"main", "index":0 }]] } },
      "settings": {}
    }`;

    const fullPrompt = `
      Sei un esperto di n8n. Converti la richiesta dell'utente in un workflow JSON valido per n8n.
      Requisiti minimi per il JSON: "name", "version", "active", "nodes[]", "connections", "settings".
      Ogni node nell'array "nodes" deve avere: id, name, type, typeVersion, position [x,y], parameters.
      Restituisci ESCLUSIVAMENTE JSON valido, senza testo aggiuntivo o spiegazioni.
      
      Ecco un esempio (few-shot) della struttura che devi seguire:
      ${fewShotExample}
      
      Richiesta utente: "${prompt}"
    `;

    const geminiResponse = await withRetry<GenerateContentResponse>(() =>
      ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: fullPrompt,
        config: { responseMimeType: "application/json" }
      })
    );

    const workflowJson = normalizeWorkflow(safeParseJson(geminiResponse.text));

    const n8nApiResponse = await withRetry(() =>
      fetch(`${n8nUrl}/api/v1/workflows`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-N8N-API-KEY": n8nApiKey!,
        },
        body: JSON.stringify(workflowJson),
      })
    );

    if (!n8nApiResponse.ok) {
      const errorBody = await n8nApiResponse.text();
      throw new Error(`Errore da N8N (${n8nApiResponse.status}): ${errorBody}`);
    }

    const n8nData = await n8nApiResponse.json();
    const workflowId = n8nData.id ?? n8nData.data?.[0]?.id;
    if(!workflowId) throw new Error("ID del workflow non trovato nella risposta di N8N.");

    return new Response(JSON.stringify({
      message: `Workflow "${workflowJson.name}" creato con successo su N8N!`,
      workflowId,
      n8nLink: `${n8nUrl}/workflow/${workflowId}`
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("Errore in generate-n8n-workflow:", (error as Error).message);
    return new Response(JSON.stringify({ error: (error as Error).message }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" }, 
      status: 500 
    });
  }
});
