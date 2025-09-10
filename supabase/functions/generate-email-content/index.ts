// FIX: Updated the Supabase edge-runtime type reference to a more stable, version-pinned URL from esm.sh. This resolves type definition errors for the Deno environment, ensuring globals like 'Deno' are correctly recognized.
/// <reference types="https://esm.sh/v135/@supabase/functions-js@2.4.1/src/edge-runtime.d.ts" />
// @deno-types="https://esm.sh/@google/genai@1.19.0/dist/index.d.ts"
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { GoogleGenAI, GenerateContentResponse } from "https://esm.sh/@google/genai@1.19.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  let lastError: Error | undefined;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < retries - 1) {
        const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
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

    const response: GenerateContentResponse = await withRetry(() => 
        ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: fullPrompt,
        })
    );
    
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
    // Restituisce uno status 200 ma con un payload di errore
    // Questo permette al client Supabase di leggere il messaggio di errore specifico
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200, 
    });
  }
});