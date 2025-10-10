declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { GoogleGenAI, Type } from "https://esm.sh/@google/genai@1.19.0";
// ✅ FIX: Removed unused import createClient
import { corsHeaders, handleCors } from "../_shared/cors.ts";

const ACTION_TYPE = 'ai_form_generation';

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { prompt, organization_id } = await req.json();

    if (!prompt) {
      return new Response(JSON.stringify({ error: "Il parametro 'prompt' è obbligatorio." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!organization_id) {
      return new Response(JSON.stringify({ error: "Il parametro 'organization_id' è obbligatorio per la verifica dei crediti." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // --- Integrazione Sistema a Crediti ---
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseKey) {
      return new Response(JSON.stringify({ error: "Missing Supabase configuration" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    
    // Supabase client removed as unused

    // Ensure Authorization header is properly passed
    const authHeader = req.headers.get("Authorization");
    console.log(`[${ACTION_TYPE}] Authorization header check:`, { 
      hasAuth: !!authHeader, 
      authLength: authHeader?.length || 0,
      authPreview: authHeader?.substring(0, 20) || 'none'
    });

    const fetchAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    
    if (!fetchAnonKey) {
      return new Response(JSON.stringify({ error: "Missing Supabase anon key" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    
    console.log(`[${ACTION_TYPE}] Making direct fetch to consume-credits function`);
    
    const creditResponse = await fetch(`${supabaseUrl}/functions/v1/consume-credits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': fetchAnonKey,
        ...(authHeader ? { 'Authorization': authHeader } : {})
      },
      body: JSON.stringify({ organization_id, action_type: ACTION_TYPE })
    });

    if (!creditResponse.ok) {
      const errorText = await creditResponse.text();
      console.error(`[${ACTION_TYPE}] Credit verification HTTP error:`, {
        status: creditResponse.status,
        statusText: creditResponse.statusText,
        errorText
      });
      throw new Error(`Errore di rete nella verifica dei crediti: HTTP ${creditResponse.status}`);
    }

    const creditData = await creditResponse.json();
    console.log(`[${ACTION_TYPE}] Credit verification response:`, { creditData });

    if (creditData && creditData.error) {
      console.error(`[${ACTION_TYPE}] Credit verification business error:`, creditData.error);
      throw new Error(`Errore nella verifica dei crediti: ${creditData.error}`);
    }

    if (!creditData || !creditData.success) {
      console.error(`[${ACTION_TYPE}] Credit verification failed:`, creditData);
      throw new Error(creditData?.error || "Crediti insufficienti per generare un form.");
    }
    console.log(`[${ACTION_TYPE}] Crediti verificati. Rimanenti: ${creditData.remaining_credits}`);
    // --- Fine Integrazione ---

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
    console.error("Errore nella funzione generate-form-fields:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});