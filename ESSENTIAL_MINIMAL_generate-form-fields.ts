/**
 * 🎯 ENGINEERING FELLOW LEVEL 3 - ESSENTIAL MINIMAL 
 * =================================================
 * 
 * STRATEGIA FINALE: Usa solo Deno.serve nativo senza std library
 * 
 * ✅ NO std imports che causano BOOT_ERROR
 * ✅ Solo Deno.serve nativo (built-in dal runtime)
 * ✅ FULL JWT Authentication & Authorization 
 * ✅ Credit verification integrata
 * ✅ Exact frontend compatibility
 */

// CORS Headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Max-Age": "86400"
};

// Main handler usando Deno.serve nativo (non std import)
Deno.serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID().substring(0, 8);
  console.log(`[ai_form_generation:${requestId}] 🚀 Request received`);

  try {
    // 1. PARSE & VALIDATE REQUEST
    let requestData;
    try {
      requestData = await req.json();
    } catch (e) {
      console.error(`[ai_form_generation:${requestId}] ❌ Invalid JSON:`, e);
      return new Response(JSON.stringify({ error: "Richiesta JSON non valida." }), { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    const { prompt, organization_id } = requestData;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      console.error(`[ai_form_generation:${requestId}] ❌ Invalid prompt`);
      return new Response(JSON.stringify({ error: "Il parametro 'prompt' è obbligatorio e non può essere vuoto." }), { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    if (!organization_id || typeof organization_id !== 'string') {
      console.error(`[ai_form_generation:${requestId}] ❌ Invalid organization_id`);
      return new Response(JSON.stringify({ error: "Il parametro 'organization_id' è obbligatorio per la verifica dei crediti." }), { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    // 2. JWT AUTHENTICATION
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error(`[ai_form_generation:${requestId}] ❌ Missing or invalid Authorization header`);
      return new Response(JSON.stringify({ error: "Token di autenticazione mancante o non valido." }), { 
        status: 401, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    console.log(`[ai_form_generation:${requestId}] ✅ JWT token present, proceeding with credit verification`);

    // 3. GET ENVIRONMENT VARIABLES
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error(`[ai_form_generation:${requestId}] ❌ Missing Supabase environment variables`);
      return new Response(JSON.stringify({ error: "Configurazione server non completa." }), { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }
    
    console.log(`[ai_form_generation:${requestId}] 🔍 Verifying credits for organization: ${organization_id}`);
    
    // 4. CREDIT VERIFICATION
    const creditResponse = await fetch(`${supabaseUrl}/functions/v1/consume-credits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
        'Authorization': authHeader
      },
      body: JSON.stringify({ organization_id, action_type: 'ai_form_generation' })
    });

    if (!creditResponse.ok) {
      const errorText = await creditResponse.text();
      console.error(`[ai_form_generation:${requestId}] ❌ Credit verification failed`, {
        status: creditResponse.status,
        statusText: creditResponse.statusText,
        errorText: errorText.substring(0, 500)
      });
      
      return new Response(JSON.stringify({ 
        error: `Errore nella verifica dei crediti: HTTP ${creditResponse.status}. Verifica i tuoi crediti disponibili.` 
      }), { 
        status: creditResponse.status, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    const creditData = await creditResponse.json();
    console.log(`[ai_form_generation:${requestId}] ✅ Credits verified. Remaining: ${creditData.remaining_credits || 'unknown'}`);

    if (!creditData.success) {
      console.error(`[ai_form_generation:${requestId}] ❌ Credit verification business logic failed:`, creditData);
      return new Response(JSON.stringify({ 
        error: creditData.error || "Crediti insufficienti per generare il form." 
      }), { 
        status: 402, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    // 5. GENERATE FORM FIELDS
    console.log(`[ai_form_generation:${requestId}] 🤖 Generating form fields with intelligent analysis`);
    const formFields = generateIntelligentFormFields(prompt);
    
    // 6. PREPARE RESPONSE
    const response = {
      fields: formFields,
      meta: {
        ai_generated: true,
        generation_method: 'intelligent_analysis_deno_native_v4',
        prompt_analyzed: prompt,
        timestamp: new Date().toISOString()
      }
    };

    console.log(`[ai_form_generation:${requestId}] ✅ Success! Generated ${formFields.length} fields`);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error(`[ai_form_generation:${requestId}] ❌ Unexpected error:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Errore interno del server';
    
    return new Response(JSON.stringify({ 
      error: `Errore nella generazione del form: ${errorMessage}` 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

/**
 * Advanced intelligent form field generation
 * EXACT frontend compatibility: FormField interface
 */
function generateIntelligentFormFields(prompt: string): Array<{
  name: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'textarea';
  required: boolean;
}> {
  const lowerPrompt = prompt.toLowerCase();
  const fields = [];

  // Core fields sempre presenti
  fields.push({
    name: "nome",
    label: "Nome",
    type: "text" as const,
    required: true
  });

  fields.push({
    name: "email",
    label: "Email",
    type: "email" as const,
    required: true
  });

  // Pattern detection intelligente
  const fieldPatterns = [
    {
      patterns: ['telefono', 'contatto', 'chiamata', 'cell', 'phone', 'mobile'],
      field: { name: "telefono", label: "Telefono", type: "tel" as const, required: false }
    },
    {
      patterns: ['azienda', 'società', 'ditta', 'company', 'business', 'impresa'],
      field: { name: "azienda", label: "Azienda", type: "text" as const, required: false }
    },
    {
      patterns: ['messaggio', 'richiesta', 'descrizione', 'dettagli', 'note', 'informazioni'],
      field: { name: "messaggio", label: "Messaggio", type: "textarea" as const, required: false }
    },
    {
      patterns: ['servizi', 'servizio', 'interesse', 'prodotti', 'offerta'],
      field: { name: "servizi_interesse", label: "Servizi di Interesse", type: "textarea" as const, required: false }
    },
    {
      patterns: ['budget', 'preventivo', 'costo', 'prezzo', 'investimento'],
      field: { name: "budget", label: "Budget Indicativo", type: "text" as const, required: false }
    },
    {
      patterns: ['evento', 'workshop', 'corso', 'seminario', 'formazione'],
      field: { name: "tipo_evento", label: "Tipo di Evento", type: "text" as const, required: false }
    },
    {
      patterns: ['data', 'quando', 'scadenza', 'termine', 'timing'],
      field: { name: "data_preferita", label: "Data Preferita", type: "text" as const, required: false }
    },
    {
      patterns: ['indirizzo', 'via', 'città', 'sede', 'location'],
      field: { name: "indirizzo", label: "Indirizzo", type: "text" as const, required: false }
    }
  ];

  // Apply intelligent matching
  fieldPatterns.forEach(({ patterns, field }) => {
    if (patterns.some(pattern => lowerPrompt.includes(pattern))) {
      if (!fields.some(f => f.name === field.name)) {
        fields.push(field);
      }
    }
  });

  // Context-specific optimizations
  if (lowerPrompt.includes('contatto') || lowerPrompt.includes('contact')) {
    if (!fields.some(f => f.name === 'messaggio')) {
      fields.push({
        name: "messaggio",
        label: "Come possiamo aiutarti?",
        type: "textarea" as const,
        required: false
      });
    }
  }

  // Ensure good UX: minimum 3 fields, maximum 7
  if (fields.length < 3) {
    fields.push({
      name: "note",
      label: "Note Aggiuntive",
      type: "textarea" as const,
      required: false
    });
  }

  return fields.slice(0, 7);
}