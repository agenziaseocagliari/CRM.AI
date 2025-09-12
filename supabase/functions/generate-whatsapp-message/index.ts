// File: supabase/functions/generate-whatsapp-message/index.ts

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

// @deno-types="https://esm.sh/@google/genai@1.19.0/dist/index.d.ts"
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { GoogleGenAI, GenerateContentResponse } from "https://esm.sh/@google/genai@1.19.0";
import { handleCors, corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

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
      Agisci come un assistente virtuale per un CRM. Il tuo compito è scrivere un messaggio WhatsApp breve, amichevole e professionale.
      **Scrivi solo e unicamente il corpo del messaggio, senza saluti iniziali come "Ciao [Nome]," a meno che non sia specificamente richiesto nel prompt.** Usa un tono informale ma rispettoso.
      Usa le emoji con parsimonia per rendere il messaggio più amichevole.
      
      Obiettivo del messaggio: "${prompt}"
      
      Informazioni sul contatto:
      - Nome: ${contact.name}
      
      Scrivi solo il testo del messaggio.
    `;

    const response: GenerateContentResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: fullPrompt,
    });
    
    const messageContent = response.text.trim();

    if (!messageContent) {
        throw new Error("L'API di Gemini ha restituito un risultato vuoto.");
    }
    
    return new Response(JSON.stringify({ message: messageContent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Errore nella funzione generate-whatsapp-message:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500, 
    });
  }
});