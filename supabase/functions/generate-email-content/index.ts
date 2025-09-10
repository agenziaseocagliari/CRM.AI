import { serve } from "serve";
// FIX: Corrected import path for `corsHeaders` to point to the local shared module `../shared/cors.ts`.
import { corsHeaders } from "../shared/cors.ts";
import { GoogleGenAI } from "@google/genai";

// FIX: Add declaration for Deno to resolve TypeScript error.
// The Deno global is available in the Supabase Edge Function runtime.
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { prompt, contact } = await req.json();
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) throw new Error("GEMINI_API_KEY non è impostata.");
    if (!prompt || !contact) throw new Error("I dati 'prompt' e 'contact' sono richiesti.");

    const ai = new GoogleGenAI({ apiKey: geminiApiKey });

    const fullPrompt = `
      Sei un assistente di vendita esperto per un CRM chiamato Guardian AI.
      Il tuo compito è scrivere un'email professionale, concisa e amichevole.
      
      Obiettivo dell'email: "${prompt}"
      
      Informazioni sul contatto:
      - Nome: ${contact.name}
      - Email: ${contact.email}
      - Azienda: ${contact.company || 'Non specificata'}

      Scrivi solo il corpo dell'email, senza oggetto o saluti iniziali/finali formali come "Ciao [Nome]," o "Cordiali saluti,".
      Mantieni un tono positivo e orientato all'azione.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: fullPrompt,
    });
    
    const email = response.text;

    return new Response(JSON.stringify({ email }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Errore in generate-email-content:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});