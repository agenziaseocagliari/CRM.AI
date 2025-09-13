// File: supabase/functions/generate-email-content/index.ts

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";
import { GoogleGenAI, GenerateContentResponse } from "https://esm.sh/@google/genai@1.19.0";
import { corsHeaders, handleCors } from "../_shared/cors.ts";

const ACTION_TYPE = 'ai_email_generation';

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { prompt, contact, organization_id } = await req.json();

    if (!prompt || !contact) {
      return new Response(JSON.stringify({ error: "I parametri 'prompt' e 'contact' sono obbligatori." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!organization_id) {
       return new Response(JSON.stringify({ error: "Il parametro 'organization_id' è obbligatorio per la verifica dei crediti." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // --- Integrazione Sistema a Crediti ---
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    const { data: creditData, error: creditError } = await supabaseClient.functions.invoke('consume-credits', {
        body: { organization_id, action_type: ACTION_TYPE },
    });

    if (creditError) throw new Error(`Errore di rete nella verifica dei crediti: ${creditError.message}`);
    if (creditData.error) throw new Error(`Errore nella verifica dei crediti: ${creditData.error}`);
    if (!creditData.success) throw new Error("Crediti insufficienti per generare un'email.");
    console.log(`[${ACTION_TYPE}] Crediti verificati. Rimanenti: ${creditData.remaining_credits}`);
    // --- Fine Integrazione ---


    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) {
      throw new Error("La variabile d'ambiente GEMINI_API_KEY non è stata impostata.");
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
      status: 500, 
    });
  }
});
