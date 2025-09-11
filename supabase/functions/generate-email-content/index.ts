// FIX: Replaced the 'npm:' specifier with a direct URL from esm.sh for the Supabase Edge Runtime type definitions. This resolves the "Cannot find type definition file" and "Cannot find name 'Deno'" errors by ensuring the Deno-specific globals and types are correctly loaded.
/// <reference types="https://esm.sh/@supabase/functions-js@2.4.1/src/edge-runtime.d.ts" />
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
      throw new Error("La variabile d'ambiente GEMINI_API_KEY non è stata impostata.");
    }

    const { prompt, contact } = await req.json();
    if (!prompt || !contact) {
      return new Response(JSON.stringify({ error: "I parametri 'prompt' e 'contact' sono obbligatori." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ai = new GoogleGenAI({ apiKey: geminiApiKey });
    const fullPrompt = `
      Agisci come un esperto di vendite e marketing che scrive per un CRM chiamato Guardian AI.
      Il tuo compito è scrivere un'email professionale, persuasiva e concisa.
      **Non includere l'oggetto dell'email, solo il corpo del testo.**
      
      Obiettivo dell'email: "${prompt}"
      
      Informazioni sul contatto a cui ti rivolgi:
      - Nome: ${contact.name}
      - Email: ${contact.email}
      - Azienda: ${contact.company || 'Non specificata'}
      
      Scrivi solo e unicamente il corpo dell'email.
    `;

    const response: GenerateContentResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: fullPrompt,
    });
    
    const emailContent = response.text.trim();

    if (!emailContent) {
        throw new Error("L'API di Gemini ha restituito un risultato vuoto.");
    }
    
    return new Response(JSON.stringify({ email: emailContent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Errore nella funzione generate-email-content:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200, 
    });
  }
});