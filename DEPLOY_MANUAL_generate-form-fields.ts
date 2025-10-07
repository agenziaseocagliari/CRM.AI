/**
 * ENGINEERING FELLOW - MANUAL DEPLOYMENT
 * =====================================
 * 
 * generate-form-fields Edge Function - CORRECTED VERSION
 * 
 * CRITICAL FIXES APPLIED:
 * - ❌ REMOVED: supabaseClient.functions.invoke (broken method)
 * - ✅ ADDED: Direct fetch() to consume-credits function  
 * - ✅ ADDED: Proper error handling and authorization forwarding
 * 
 * DEPLOYMENT INSTRUCTIONS:
 * 1. Copy the ENTIRE code below (from line after this comment to EOF)
 * 2. Go to: https://supabase.com/dashboard/project/qjtaqrlpronohgpfdxsi/functions
 * 3. Click on "generate-form-fields" function
 * 4. Click "Edit" or "Update Function"  
 * 5. Replace ALL existing code with the code below
 * 6. Click "Deploy" to save changes
 * 
 * Expected Result: FormMaster will work without 500 errors
 */

// File: supabase/functions/generate-form-fields/index.ts

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { GoogleGenAI, Type } from "https://esm.sh/@google/genai@1.19.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";
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
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Ensure Authorization header is properly passed
    const authHeader = req.headers.get("Authorization");
    console.log(`[${ACTION_TYPE}] Authorization header check:`, { 
      hasAuth: !!authHeader, 
      authLength: authHeader?.length || 0,
      authPreview: authHeader?.substring(0, 20) || 'none'
    });

    // CORRECTED: Use direct fetch instead of supabaseClient.functions.invoke
    // to bypass the same issues we had in AI Orchestrator
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    console.log(`[${ACTION_TYPE}] Making direct fetch to consume-credits function`);
    
    const creditResponse = await fetch(`${supabaseUrl}/functions/v1/consume-credits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
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