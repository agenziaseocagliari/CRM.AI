// FIX: Corrected the Supabase edge-runtime type reference to point to the 'dist' directory, resolving issues with finding type definitions and the 'Deno' global.
/// <reference types="https://esm.sh/@supabase/functions-js@2.4.1/dist/edge-runtime.d.ts" />
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
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      // Return a 500 status code for server-side errors
      status: 500, 
    });
  }
});