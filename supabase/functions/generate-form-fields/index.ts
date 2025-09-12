// File: supabase/functions/generate-form-fields/index.ts

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};
// @deno-types="https://esm.sh/@google/genai@1.19.0/dist/index.d.ts"
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { GoogleGenAI, Type } from "https://esm.sh/@google/genai@1.19.0";
import { handleCors, corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

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

    const schema = {
        type: Type.OBJECT,
        properties: {
            fields: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: {
                            type: Type.STRING,
                            description: "Un nome per il campo, leggibile dalla macchina, in snake_case (es. 'nome_completo').",
                        },
                        label: {
                            type: Type.STRING,
                            description: "Un'etichetta per il campo, leggibile dall'utente (es. 'Nome Completo').",
                        },
                        type: {
                            type: Type.STRING,
                            description: "Il tipo di input HTML. Valori possibili: 'text', 'email', 'tel', 'textarea'.",
                        },
                        required: {
                            type: Type.BOOLEAN,
                            description: "Indica se il campo è obbligatorio.",
                        },
                    },
                    required: ["name", "label", "type", "required"],
                },
            },
        },
        required: ["fields"],
    };
    
    const fullPrompt = `Basandoti sulla seguente descrizione, genera una struttura JSON con i campi per un form web. Descrizione: "${prompt}"`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: fullPrompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: schema,
        },
    });
    
    const generatedJson = JSON.parse(response.text);

    return new Response(JSON.stringify(generatedJson), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Errore nella funzione generate-form-fields:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});