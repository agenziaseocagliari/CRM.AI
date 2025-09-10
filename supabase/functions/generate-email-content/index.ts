// FIX: Add Deno types reference to resolve "Cannot find name 'Deno'" error.
/// <reference types="https://esm.sh/@supabase/functions-js@2.4.1/src/edge-runtime.d.ts" />
// @deno-types="https://esm.sh/@google/genai@1.19.0/dist/index.d.ts"
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { GoogleGenAI, GenerateContentResponse } from "https://esm.sh/@google/genai@1.19.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function withRetry<T>(fn: () => Promise<T>, tries = 3, base = 500): Promise<T> {
  let last: unknown;
  for (let i = 0; i < tries; i++) {
    try { return await fn(); } catch (e) {
      last = e;
      const msg = String((e as Error).message || e);
      if (!/429|503|timeout|unavailable|network/i.test(msg) || i === tries - 1) throw e;
      const delay = base * (2 ** i) + Math.floor(Math.random() * 250);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw last;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) throw new Error("Variabile mancante: GEMINI_API_KEY");

    const { prompt, contact } = await req.json();
    if (!prompt || !contact) throw new Error("Richiesti 'prompt' e 'contact'.");

    const ai = new GoogleGenAI({ apiKey: geminiApiKey });
    const fullPrompt = `
      Sei un assistente di vendita esperto per un CRM chiamato Guardian AI.
      Scrivi SOLO il corpo email, tono professionale e conciso.
      Obiettivo: "${prompt}"
      Contatto: nome=${contact.name}, email=${contact.email}, azienda=${contact.company || 'N/D'}
    `;

    const res = await withRetry<GenerateContentResponse>(() =>
      ai.models.generateContent({ model: "gemini-2.5-flash", contents: fullPrompt })
    );

    const email = (res.text || "").trim();
    if (!email) throw new Error("Output AI vuoto.");

    return new Response(JSON.stringify({ email }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("generate-email-content:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 });
  }
});