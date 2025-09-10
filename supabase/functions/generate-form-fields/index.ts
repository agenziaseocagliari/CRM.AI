// FIX: Updated reference path to use npm specifier for better tooling compatibility and to resolve Deno types.
/// <reference types="npm:@supabase/functions-js@2.4.1/src/edge-runtime.d.ts" />

// FIX: Using full URL for Deno standard library imports as no import_map is specified.
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
// FIX: Using npm specifier for imports to ensure they are resolved correctly in the Deno environment.
import { GoogleGenAI, Type } from 'npm:@google/genai';
// FIX: Corrected relative path for shared module import.
import { corsHeaders } from '../shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();
    const apiKey = Deno.env.get('API_KEY');

    if (!apiKey) {
      throw new Error("La variabile d'ambiente API_KEY non è impostata nei secrets di Supabase.");
    }
     if (!prompt) {
        return new Response(JSON.stringify({ error: "Il prompt per la descrizione del form è obbligatorio." }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `You are an expert system that translates Italian natural language descriptions into a structured JSON object for a form builder. Based on the user's request, generate an array of form fields. For the 'type' property, you must choose one of the following values: 'text', 'email', 'tel', 'textarea'. For the 'name' property, generate a value in snake_case format.`;
        
    const responseSchema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING, description: 'Unique identifier for the field in snake_case format (e.g., "nome_completo").' },
                label: { type: Type.STRING, description: 'User-friendly label for the field (e.g., "Nome Completo").' },
                type: { type: Type.STRING, description: "The type of the field. Must be one of: 'text', 'email', 'tel', 'textarea'." },
                required: { type: Type.BOOLEAN, description: 'Whether the field is required or not.' }
            },
            required: ['name', 'label', 'type', 'required']
        }
    };
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema,
        }
    });

    const jsonText = response.text;
    if (!jsonText) { 
        throw new Error("La risposta dell'AI era vuota o è stata bloccata. Riprova con un prompt diverso."); 
    }
            
    const fields = JSON.parse(jsonText);
    
    return new Response(JSON.stringify({ fields }), {
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
