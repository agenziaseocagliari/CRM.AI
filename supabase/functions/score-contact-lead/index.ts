// File: supabase/functions/score-contact-lead/index.ts

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

// @deno-types="https://esm.sh/@google/genai@1.19.0/dist/index.d.ts"
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";
import { GoogleGenAI, Type } from "https://esm.sh/@google/genai@1.19.0";
import { corsHeaders, handleCors } from "../_shared/cors.ts";

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!geminiApiKey || !supabaseUrl || !serviceRoleKey) {
      throw new Error("Mancano le variabili d'ambiente necessarie.");
    }

    const { record: contact } = await req.json();
    if (!contact || !contact.id) {
      return new Response(JSON.stringify({ error: "ID del contatto non fornito." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ai = new GoogleGenAI({ apiKey: geminiApiKey });
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const scoringPrompt = `
      Sei un analista di vendite esperto. Il tuo compito è valutare un nuovo lead e assegnargli un punteggio da 1 a 100, una categoria ('Hot', 'Warm', 'Cold') e una breve motivazione.
      Dettagli del lead:
      - Nome: ${contact.name || 'N/A'}
      - Email: ${contact.email || 'N/A'}
      - Azienda: ${contact.company || 'N/A'}
      - Telefono: ${contact.phone || 'N/A'}

      Considera un'email aziendale più preziosa di una generica (gmail, hotmail). Un'azienda con un nome suggerisce un lead B2B, che è di alto valore. La presenza di un telefono aumenta il punteggio.
      Fornisci solo il JSON.
    `;
    
    const schema = {
        type: Type.OBJECT,
        properties: {
            score: { type: Type.INTEGER, description: "Punteggio da 1 a 100." },
            category: { type: Type.STRING, description: "Categoria: 'Hot', 'Warm', or 'Cold'." },
            reasoning: { type: Type.STRING, description: "Breve motivazione della valutazione (massimo 150 caratteri)." }
        },
        required: ["score", "category", "reasoning"],
    };

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: scoringPrompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: schema,
        },
    });

    const scoreData = JSON.parse(response.text);

    const { error: updateError } = await supabaseAdmin
      .from('contacts')
      .update({
        lead_score: scoreData.score,
        lead_category: scoreData.category,
        lead_score_reasoning: scoreData.reasoning,
      })
      .eq('id', contact.id);

    if (updateError) throw updateError;

    return new Response(JSON.stringify({ success: true, message: `Contatto ${contact.id} valutato.` }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Errore nella funzione score-contact-lead:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});