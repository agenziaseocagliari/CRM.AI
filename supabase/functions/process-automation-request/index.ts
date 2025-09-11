// FIX: Explicitly declare the Deno global type to resolve "Cannot find name 'Deno'"
// and "Cannot find lib definition for 'deno.ns'" errors in environments
// where Deno's standard libraries are not automatically recognized.
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};
// @deno-types="https://esm.sh/@google/genai@1.19.0/dist/index.d.ts"
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { GoogleGenAI, GenerateContentResponse } from "https://esm.sh/@google/genai@1.19.0";

// --- CORS Handling (inlined to fix deployment error) ---
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-n8n-api-key",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Max-Age": "86400"
};

function handleCors(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  return null;
}
// --- End of CORS Handling ---


serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) {
    return corsResponse;
  }

  try {
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) {
      throw new Error("La variabile d'ambiente GEMINI_API_KEY non è stata impostata nei secrets di Supabase.");
    }

    const { prompt } = await req.json();
    if (!prompt) {
      return new Response(JSON.stringify({ error: "Il parametro 'prompt' è obbligatorio." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ai = new GoogleGenAI({ apiKey: geminiApiKey });
    const fullPrompt = `
      Sei un Agente AI specializzato in automazione per un CRM chiamato Guardian AI.
      Il tuo ruolo è aiutare l'utente a definire e comprendere le automazioni che può creare.
      Rispondi in modo conciso, amichevole e utile.
      Se la richiesta è vaga, fai domande per chiarire.
      Se la richiesta è chiara, riassumi i passaggi che l'automazione dovrebbe compiere.
      
      Richiesta dell'utente: "${prompt}"
    `;

    const response: GenerateContentResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: fullPrompt,
    });
    
    const reply = response.text.trim();

    if (!reply) {
        throw new Error("L'API di Gemini ha restituito un risultato vuoto.");
    }
    
    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Errore nella funzione process-automation-request:", error);
    // FIX: Changed status code from 500 to 200.
    // The Supabase client library treats non-200 responses as network-level
    // errors, which prevents the frontend from receiving the actual error message
    // in the JSON payload. By always returning 200 and including an `error`
    // property in the body, we ensure the client-side logic can correctly
    // parse and display the specific error.
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200, 
    });
  }
});
