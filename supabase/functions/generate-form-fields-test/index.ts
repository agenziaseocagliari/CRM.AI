// Test version of generate-form-fields that bypasses credit verification
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { GoogleGenAI, Type } from "https://esm.sh/@google/genai@1.19.0";
import { corsHeaders, handleCors } from "../_shared/cors.ts";

const ACTION_TYPE = 'ai_form_generation';

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { prompt, organization_id } = await req.json();

    console.log(`[${ACTION_TYPE}] TEST VERSION - Received request:`, {
      prompt: prompt?.length,
      organization_id
    });

    if (!prompt) {
      return new Response(JSON.stringify({ error: "Il parametro 'prompt' è obbligatorio." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (!organization_id) {
      return new Response(JSON.stringify({ error: "Il parametro 'organization_id' è obbligatorio per la verifica dei crediti." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // BYPASS CREDIT VERIFICATION FOR TESTING
    console.log(`[${ACTION_TYPE}] BYPASSING credit verification for testing purposes`);

    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) {
      throw new Error("La variabile d'ambiente GEMINI_API_KEY non è stata impostata nei secrets di Supabase.");
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
    console.error("Errore nella funzione generate-form-fields-test:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});