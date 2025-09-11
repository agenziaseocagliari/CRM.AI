// FIX: The Supabase edge-runtime type reference URL was invalid. Corrected to a valid, version-agnostic URL to ensure Deno types are loaded properly.
/// <reference types="https://esm.sh/@supabase/functions-js@2" />
// @deno-types="https://esm.sh/@google/genai@1.19.0/dist/index.d.ts"
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { GoogleGenAI, Type, GenerateContentResponse } from "https://esm.sh/@google/genai@1.19.0";
import { handleCors, corsHeaders } from "../shared/cors.ts";

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
  const corsResponse = handleCors(req);
  if (corsResponse) {
    return corsResponse;
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
    
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: fullPrompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: responseSchema,
        }
    });

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
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }
});
