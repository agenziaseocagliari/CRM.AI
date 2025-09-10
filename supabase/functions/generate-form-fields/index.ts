// @deno-types="https://esm.sh/@google/genai@1.19.0/dist/index.d.ts"
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
// FIX: Import GenerateContentResponse to correctly type the API call result.
import { GoogleGenAI, Type, GenerateContentResponse } from "https://esm.sh/@google/genai@1.19.0";

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// HELPER: Parsing JSON sicuro
function safeParseJson(text?: string) {
  if (!text) throw new Error("Risposta vuota dal modello AI.");
  // Rimuove eventuali delimitatori ```json ... ```
  const cleaned = text.trim().replace(/^```json\s*/i, '').replace(/```$/,'').trim();
  try { 
    return JSON.parse(cleaned);
  } catch (e) { 
    throw new Error("L'output del modello AI non è un JSON valido: " + (e as Error).message);
  }
}

// HELPER: Retry con backoff esponenziale
async function withRetry<T>(fn: () => Promise<T>, tries = 3, base = 500): Promise<T> {
  let lastError: any;
  for (let i = 0; i < tries; i++) {
    try {
      return await fn();
    } catch (e: any) {
      lastError = e;
      const msg = String(e.message || e);
      if (!/429|503|timeout|unavailable|network/i.test(msg) || i === tries - 1) {
        throw e;
      }
      const delay = base * Math.pow(2, i) + Math.floor(Math.random() * 250);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw lastError;
}


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
    // FIX C: Check variabili ambiente anticipato
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) throw new Error("Variabile d'ambiente mancante: GEMINI_API_KEY");

    const { prompt } = await req.json();
    if (!prompt) throw new Error("Il 'prompt' è richiesto.");

    const ai = new GoogleGenAI({ apiKey: geminiApiKey });
    const fullPrompt = `Analizza la seguente richiesta per un form e genera la struttura dei campi corrispondente. Richiesta: "${prompt}"`;

    // FIX D: Applica retry
    // FIX: Explicitly type the API response to resolve the type error on `response.text`.
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: fullPrompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: responseSchema,
        },
    }));
    
    // FIX A: Usa safeParseJson
    const parsedResponse = safeParseJson(response.text);

    // FIX E: Validazione e normalizzazione dell'output
    const seenNames = new Set<string>();
    const validTypes = ["text", "email", "tel", "textarea"];
    parsedResponse.fields = (parsedResponse.fields || [])
      .filter((f: any) => {
        if (!f || typeof f.name !== 'string' || f.name.trim() === '' || seenNames.has(f.name)) {
          return false; // Scarta campi senza nome, con nome non stringa, vuoto o duplicato
        }
        seenNames.add(f.name);
        return true;
      })
      .map((f: any) => ({
        ...f,
        type: validTypes.includes(f.type) ? f.type : "text", // Normalizza il tipo a 'text' se non valido
        label: f.label || f.name, // Assicura che esista una label
        required: typeof f.required === 'boolean' ? f.required : false, // Assicura che 'required' sia un booleano
      }));

    if (!parsedResponse.fields || parsedResponse.fields.length === 0) {
        throw new Error("L'AI non ha generato campi validi per il form.");
    }


    return new Response(JSON.stringify(parsedResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Errore in generate-form-fields:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
