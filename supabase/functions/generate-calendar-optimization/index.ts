// File: supabase/functions/generate-calendar-optimization/index.ts

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { GenerateContentResponse, GoogleGenAI } from "https://esm.sh/@google/genai@1.19.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";
import { corsHeaders, handleCors } from "../_shared/cors.ts";

const ACTION_TYPE = 'ai_calendar_optimization';

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { prompt, calendar_data, organization_id } = await req.json();

    if (!prompt) {
      throw new Error("Il campo 'prompt' è obbligatorio per l'ottimizzazione calendario.");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Configurazione Supabase mancante nei secrets.");
    }
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // --- Integrazione Sistema Crediti ---
    const creditResponse = await supabaseAdmin.functions.invoke('consume-credits', {
      body: {
        organization_id,
        action_type: ACTION_TYPE,
        credits_required: 1 // Calendar optimization costa 1 credito
      }
    });

    const { data: creditData, error: creditError } = creditResponse;
    if (creditError) throw new Error(`Errore di rete nella verifica dei crediti: ${creditError.message}`);
    if (creditData.error) throw new Error(`Errore nella verifica dei crediti: ${creditData.error}`);
    if (!creditData.success) throw new Error("Crediti insufficienti per ottimizzare il calendario.");
    console.log(`[${ACTION_TYPE}] Crediti verificati. Rimanenti: ${creditData.remaining_credits}`);
    // --- Fine Integrazione ---

    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) {
      throw new Error("La variabile d'ambiente GEMINI_API_KEY non è stata impostata nei secrets di Supabase.");
    }

    const ai = new GoogleGenAI({ apiKey: geminiApiKey });
    const fullPrompt = `
      Sei un Assistente AI specializzato in ottimizzazione calendario per un CRM chiamato Guardian AI.
      Il tuo compito è analizzare i dati del calendario e fornire ottimizzazioni intelligenti per la gestione del tempo.
      
      Dati Calendario:
      ${JSON.stringify(calendar_data, null, 2)}
      
      Richiesta di Ottimizzazione:
      ${prompt}
      
      Fornisci suggerimenti per:
      1. Ottimizzazione slots di disponibilità
      2. Configurazione booking page intelligente
      3. Analisi pattern temporali dei clienti
      4. Suggerimenti per ridurre no-shows
      5. Ottimizzazione durata meeting
      6. Time blocking strategico
      
      Rispondi in formato JSON con questa struttura:
      {
        "optimized_schedule": [
          {
            "time_slot": "09:00-10:00",
            "availability": "Available/Busy/Preferred",
            "reason": "Motivo della raccomandazione",
            "booking_type": "consultation/demo/follow-up"
          }
        ],
        "booking_page_config": {
          "recommended_duration": "30/60/90 minuti",
          "buffer_time": "15 minuti",
          "advance_booking": "24-48 ore",
          "cancellation_policy": "Politica cancellazione suggerita",
          "custom_questions": ["Domande pre-meeting suggerite"]
        },
        "availability_insights": [
          {
            "pattern": "Pattern identificato",
            "description": "Descrizione insight",
            "optimization": "Suggerimento ottimizzazione"
          }
        ],
        "no_show_prevention": [
          {
            "strategy": "Strategia prevenzione",
            "implementation": "Come implementare",
            "expected_reduction": "% riduzione prevista"
          }
        ],
        "time_blocking_suggestions": [
          {
            "block_type": "Focus time/Admin/Prospecting",
            "recommended_time": "Orario consigliato",
            "duration": "Durata suggerita",
            "frequency": "Frequenza"
          }
        ]
      }
    `;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: fullPrompt,
    });

    const generatedText = response.text.trim();
    if (!generatedText) {
      throw new Error("L'API di Gemini ha restituito un risultato vuoto.");
    }

    // Try to parse as JSON, fallback to structured text response
    let optimizationResult;
    try {
      optimizationResult = JSON.parse(generatedText);
    } catch {
      // If JSON parsing fails, structure the text response
      optimizationResult = {
        optimized_schedule: [{
          time_slot: "09:00-17:00",
          availability: "Available",
          reason: "Orario lavorativo standard ottimizzato",
          booking_type: "consultation"
        }],
        booking_page_config: {
          recommended_duration: "30 minuti",
          buffer_time: "15 minuti",
          advance_booking: "24 ore",
          cancellation_policy: "Cancellazione gratuita fino a 2 ore prima",
          custom_questions: ["Qual è l'obiettivo principale del meeting?"]
        },
        availability_insights: [{
          pattern: "AI Generated Insights",
          description: generatedText,
          optimization: "Rivedi le raccomandazioni AI e implementa gradualmente"
        }],
        no_show_prevention: [{
          strategy: "Reminder automatici",
          implementation: "Email 24h e 2h prima del meeting",
          expected_reduction: "30-40%"
        }],
        time_blocking_suggestions: [{
          block_type: "Focus time",
          recommended_time: "09:00-11:00",
          duration: "2 ore",
          frequency: "Giornaliera"
        }]
      };
    }

    return new Response(JSON.stringify(optimizationResult), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Errore nella funzione generate-calendar-optimization:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});