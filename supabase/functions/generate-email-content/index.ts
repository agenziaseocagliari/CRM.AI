// FIX: Updated the Deno types reference to use esm.sh for better compatibility, resolving issues with 'Deno' global types.
/// <reference types="https://esm.sh/@supabase/functions-js@2.4.1/src/edge-runtime.d.ts" />

// supabase/functions/generate-email-content/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenAI } from 'https://esm.sh/@google/genai@1.19.0';
import { corsHeaders } from '../shared/cors.ts';

serve(async (req) => {
  // Gestisce la richiesta preflight CORS del browser
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { prompt, contact } = await req.json();
    const apiKey = Deno.env.get('API_KEY');
    
    if (!apiKey) {
      throw new Error("La variabile d'ambiente API_KEY non è impostata nei secrets di Supabase.");
    }
    if (!prompt || !contact) {
        return new Response(JSON.stringify({ error: "Il prompt e i dati del contatto sono obbligatori." }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const fullPrompt = `Sei un assistente professionale per le relazioni con i clienti. Scrivi un'email professionale e concisa a un contatto.
      
      Nome Contatto: ${contact.name}
      Azienda Contatto: ${contact.company}
      
      L'obiettivo dell'email è: "${prompt}"
      
      Genera solo il corpo del testo dell'email.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: fullPrompt,
    });
    
    // FIX: Simplified text extraction from the Gemini response to align with SDK guidelines. The 'text' property is a direct string, so optional chaining and nullish coalescing are not needed.
    const text = response.text.trim();

    return new Response(JSON.stringify({ email: text }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
