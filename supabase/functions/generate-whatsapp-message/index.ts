// File: supabase/functions/generate-whatsapp-message/index.ts

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

// --- CORS Handling ---
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
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
      Agisci come un esperto di vendite che usa WhatsApp per comunicare con i clienti per conto di un CRM chiamato Guardian AI.
      Il tuo compito è scrivere un messaggio WhatsApp che sia **breve, conciso, amichevole ma professionale**.
      Usa le emoji in modo appropriato per rendere il tono più colloquiale, ma senza esagerare.
      
      **Regole importanti:**
      - **NON** includere saluti iniziali come "Ciao ${contact.name}," o simili. Vai dritto al punto.
      - **NON** includere una firma o il tuo nome. Il messaggio deve essere solo il corpo del testo.
      - Mantieni il messaggio il più breve possibile.
      
      Obiettivo del messaggio: "${prompt}"
      
      Informazioni sul contatto:
      - Nome: ${contact.name}
      - Azienda: ${contact.company || 'Non specificata'}
      
      Scrivi solo e unicamente il corpo del messaggio WhatsApp.
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
      status: 200, 
    });
  }
});