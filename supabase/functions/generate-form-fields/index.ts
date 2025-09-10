// @deno-types="https://esm.sh/@google/genai@1.19.0/dist/index.d.ts"
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { GoogleGenAI, GenerateContentResponse, Type } from "https://esm.sh/@google/genai@1.19.0";

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function safeParseJson(text?: string) {
  if (!text) throw new Error("Risposta vuota dal modello AI.");
  const cleaned = text.trim().replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  try { 
    return JSON.parse(cleaned);
  } catch (e) { 
    throw new Error("L'output del modello AI non è un JSON valido: " + (e as Error).message);
  }
}

async function withRetry<T>(fn: () => Promise<T>, tries = 3, base = 500): Promise<T> {
  let last: unknown;
  for (let i = 0; i < tries; i++) {
    try { 
      return await fn(); 
    } catch (e) {
      last = e;
      const msg = String((e as Error).message || e);
      if (!/429|503|timeout|unavailable|network/i.test(msg) || i === tries - 1) throw e;
      const delay = base * (2 ** i) + Math.floor(Math.random() * 250);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw last;
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
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) throw new Error("Variabile d'ambiente mancante: GEMINI_API_KEY");

    const { prompt } = await req.json();
    if (!prompt) throw new Error("Il 'prompt' è richiesto.");

    const ai = new GoogleGenAI({ apiKey: geminiApiKey });
    const fullPrompt = `Analizza la seguente richiesta per un form e genera la struttura dei campi corrispondente. Richiesta: "${prompt}"`;

    const response = await withRetry<GenerateContentResponse>(() =>
      ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: fullPrompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: responseSchema,
        }
      })
    );

    const out = safeParseJson(response.text);
    const seen = new Set<string>();
    out.fields = (out.fields ?? [])
      .filter((f: any) => f && typeof f.name === "string" && f.name.trim() && !seen.has(f.name) && (seen.add(f.name), true))
      .map((f: any) => ({
        ...f,
        type: ["text", "email", "tel", "textarea"].includes(f.type) ? f.type : "text",
        required: Boolean(f.required),
        label: f.label || f.name
      }));

    if (!out.fields || !out.fields.length) throw new Error("L'AI non ha generato campi validi per il form.");

    return new Response(JSON.stringify(out), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Errore in generate-form-fields:", (error as Error).message);
    return new Response(JSON.stringify({ error: (error as Error).message }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" }, 
      status: 500 
    });
  }
});
