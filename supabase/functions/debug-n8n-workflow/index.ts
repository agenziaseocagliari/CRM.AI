// FIX: Updated reference path to use npm specifier for better tooling compatibility and to resolve Deno types.
/// <reference types="npm:@supabase/functions-js@2.4.1/src/edge-runtime.d.ts" />

// FIX: Using full URL for Deno standard library imports as no import_map is specified.
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
// FIX: Using npm specifier for imports to ensure they are resolved correctly in the Deno environment.
import { GoogleGenAI } from 'npm:@google/genai';
// FIX: Corrected relative path for shared module import.
import { corsHeaders } from '../shared/cors.ts';

interface CheckResult {
  name: string;
  status: 'OK' | 'ERRORE' | 'AVVISO';
  message: string;
  details?: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const results: CheckResult[] = [];
  let overallSuccess = true;

  // --- Test 1: Verifica Variabili d'Ambiente ---
  const geminiApiKey = Deno.env.get('API_KEY');
  const n8nUrl = Deno.env.get('VITE_N8N_URL');
  const n8nApiKey = Deno.env.get('VITE_N8N_API_KEY');

  if (geminiApiKey && n8nUrl && n8nApiKey) {
    results.push({ name: 'Variabili d\'ambiente', status: 'OK', message: 'Tutte le chiavi e gli URL necessari sono stati trovati.' });
  } else {
    overallSuccess = false;
    const missing = [
        !geminiApiKey ? 'API_KEY (per Gemini)' : null,
        !n8nUrl ? 'VITE_N8N_URL' : null,
        !n8nApiKey ? 'VITE_N8N_API_KEY' : null,
    ].filter(Boolean).join(', ');
    results.push({ name: 'Variabili d\'ambiente', status: 'ERRORE', message: `Mancano le seguenti variabili nei secrets di Supabase: ${missing}` });
  }

  // --- Test 2: Connessione a Gemini AI ---
  if (geminiApiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey: geminiApiKey });
      const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: 'Ciao' });
      const text = response.text;
      if (text) {
        results.push({ name: 'Connessione a Gemini AI', status: 'OK', message: 'La chiamata a Gemini AI ha avuto successo.' });
      } else {
         overallSuccess = false;
         results.push({ name: 'Connessione a Gemini AI', status: 'ERRORE', message: 'La chiamata a Gemini AI è riuscita ma non ha restituito testo. Potrebbe essere un problema di policy.', details: response.promptFeedback });
      }
    } catch (error) {
      overallSuccess = false;
      results.push({ name: 'Connessione a Gemini AI', status: 'ERRORE', message: 'Impossibile connettersi a Gemini AI. Controlla che la API_KEY sia corretta e non scaduta.', details: error.message });
    }
  } else {
     results.push({ name: 'Connessione a Gemini AI', status: 'AVVISO', message: 'Test saltato perché la API_KEY di Gemini è mancante.' });
  }

  // --- Test 3: Connessione a N8N ---
  if (n8nUrl && n8nApiKey) {
    try {
        const n8nTestUrl = `${n8nUrl.replace(/\/$/, '')}/api/v1/workflows?limit=1`;
        const response = await fetch(n8nTestUrl, {
            method: 'GET',
            headers: { 'X-N8N-API-KEY': n8nApiKey },
        });

        if (response.ok) {
            results.push({ name: 'Connessione a N8N', status: 'OK', message: 'La chiamata all\'API di N8N ha avuto successo.' });
        } else {
            overallSuccess = false;
            const errorBody = await response.text();
            results.push({ name: 'Connessione a N8N', status: 'ERRORE', message: `L'API di N8N ha risposto con un errore (Status: ${response.status}).`, details: `URL testato: ${n8nTestUrl}. Risposta: ${errorBody.substring(0, 200)}...` });
        }
    } catch (error) {
        overallSuccess = false;
        results.push({ name: 'Connessione a N8N', status: 'ERRORE', message: 'Impossibile connettersi all\'URL di N8N. Controlla che l\'URL sia corretto, raggiungibile pubblicamente e che non ci siano problemi di firewall o CORS sul server N8N.', details: error.message });
    }
  } else {
    results.push({ name: 'Connessione a N8N', status: 'AVVISO', message: 'Test saltato perché l\'URL o la API key di N8N sono mancanti.' });
  }

  const conclusion = overallSuccess
    ? 'Tutti i test sono stati superati con successo. Il problema potrebbe essere nel prompt specifico che stai usando.'
    : 'Uno o più test sono falliti. Controlla i dettagli sopra per identificare e risolvere il problema di configurazione.';

  const reportData = {
      timestamp: new Date().toISOString(),
      overallStatus: overallSuccess ? 'SUCCESSO' : 'FALLITO',
      conclusion,
      checks: results,
  };

  return new Response(JSON.stringify(reportData, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200,
  });
});
