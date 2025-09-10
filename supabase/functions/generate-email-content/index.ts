// @deno-types="https://esm.sh/@google/genai@1.19.0/dist/index.d.ts"
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { GoogleGenAI } from "https://esm.sh/@google/genai@1.19.0";

// FIX: Add declaration for Deno to resolve TypeScript error.
// The Deno global is available in the Supabase Edge Function runtime.
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

// SOLUZIONE DEFINITIVA: Header CORS definiti localmente per rendere la funzione 100% autonoma
// e immune a fallimenti di bundling dovuti a import locali.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
