// @deno-types="https://esm.sh/@google/genai@1.19.0/dist/index.d.ts"
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { GoogleGenAI, Type } from "https://esm.sh/@google/genai@1.19.0";

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

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        fields: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING, description: 'Un nome univoco per il campo in formato snake_case (es. "nome_completo").' },
                    label: { type: Type.STRING, description: 'L\'etichetta leggibile per l\'utente (es. "Nome Completo").' },
                    type: { type: Type.STRING, description: 'Il tipo di input HTML (es. "text", "email", "tel", "textarea").' },
                    required: { type: Type.BOOLEAN, description: 'Indica se il campo è obbligatorio.' },
                },
                required: ["name", "label", "type", "required"],
            },
        },
    },
    required: ["fields"],
};


serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) throw new Error("GEMINI_API_KEY non è impostata.");
    if (!prompt) throw new Error("Il 'prompt' è richiesto.");

    const ai = new GoogleGenAI({ apiKey: geminiApiKey });

    const fullPrompt = `
      Analizza la seguente richiesta per un form e genera la struttura dei campi corrispondente.
      Richiesta: "${prompt}"
    `;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: fullPrompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: responseSchema,
        },
    });
    
    const parsedResponse = JSON.parse(response.text);

    return new Response(JSON.stringify(parsedResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Errore in generate-form-fields:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
