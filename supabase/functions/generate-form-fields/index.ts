// FIX: Updated the Supabase edge-runtime type reference to a more stable, version-pinned URL from esm.sh. This resolves type definition errors for the Deno environment, ensuring globals like 'Deno' are correctly recognized.
/// <reference types="https://esm.sh/v135/@supabase/functions-js@2.4.1/src/edge-runtime.d.ts" />
// @deno-types="https://esm.sh/@google/genai@1.19.0/dist/index.d.ts"
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { GoogleGenAI, Type, GenerateContentResponse } from "https://esm.sh/@google/genai@1.19.0";

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

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        fields: {
            type: Type.ARRAY,
            description: "Un array di oggetti, dove ogni oggetto rappresenta un campo del form.",
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING, description: 'Un nome programmatico per il campo, in formato snake_case (es. "nome_completo").' },
                    label: { type: Type.STRING, description: 'L\'etichetta visibile all\'utente (es. "Nome Completo").' },
                    type: { type: Type.STRING, description: 'Il tipo di input HTML. Valori permessi: "text", "email", "tel", "textarea".' },
                    required: { type: Type.BOOLEAN, description: 'Indica se il campo è obbligatorio (true) o facoltativo (false).' },
                },
                required: ["name", "label", "type", "required"],
            },
        },
    },
    required: ["fields"],
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) {
      throw new Error("La variabile d'ambiente GEMINI_API_KEY non è stata impostata.");
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
        Analizza la seguente richiesta per creare un form e genera la struttura dei campi corrispondente.
        Rispetta rigorosamente lo schema JSON fornito.
        Richiesta utente: "${prompt}"
    `;
    
    const response: GenerateContentResponse = await withRetry(() => 
        ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: fullPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            }
        })
    );

    let parsedResponse;
    try {
        parsedResponse = JSON.parse(response.text);
    } catch (e) {
        throw new Error("L'output dell'AI non è un JSON valido.");
    }

    if (!parsedResponse.fields || !Array.isArray(parsedResponse.fields)) {
        throw new Error("La struttura JSON restituita dall'AI non è valida o manca la proprietà 'fields'.");
    }

    return new Response(JSON.stringify({ fields: parsedResponse.fields }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Errore nella funzione generate-form-fields:", error);
    // Restituisce uno status 200 ma con un payload di errore
    // Questo permette al client Supabase di leggere il messaggio di errore specifico
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }
});