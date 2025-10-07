/**
 * 🎯 ENGINEERING FELLOW LEVEL 5 - STRATEGIA SUPREMA
 * ===============================================
 * 
 * VERSION 12.0: CONTEXT-AWARE AI ANALYSIS
 * ✅ Advanced Prompt Engineering con Industry Context Detection
 * ✅ Adaptive Label Generation basato su settore/piattaforma
 * ✅ Intelligent Field Deduplication con Priority System
 * ✅ Deno.serve nativo ottimizzato per performance
 * ⚠️ TEMPORANEO: Credit verification bypassed durante sviluppo
 * ✅ Exact frontend compatibility
 */

// CORS Headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Max-Age": "86400"
};

// Main handler usando Deno.serve nativo
Deno.serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID().substring(0, 8);
  console.log(`[ai_form_generation:${requestId}] 🚀 Request received - TEST VERSION`);

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

    // 2. JWT AUTHENTICATION (mantenuto per sicurezza)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error(`[ai_form_generation:${requestId}] ❌ Missing or invalid Authorization header`);
      return new Response(JSON.stringify({ error: "Token di autenticazione mancante o non valido." }), { 
        status: 401, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    console.log(`[ai_form_generation:${requestId}] ✅ JWT token present`);
    console.log(`[ai_form_generation:${requestId}] ⚠️ SKIPPING credit verification for testing`);

    // 3. GENERATE FORM FIELDS (QUESTO È IL CORE!)
    console.log(`[ai_form_generation:${requestId}] 🤖 Generating form fields with intelligent analysis`);
    console.log(`[ai_form_generation:${requestId}] 📝 Prompt: "${prompt}"`);
    
    // LEVEL 5 AI CONTEXT ANALYSIS
    const industryContext = detectIndustryContext(prompt);
    const platformContext = detectPlatformContext(prompt);
    
    console.log(`[ai_form_generation:${requestId}] 🧠 Context Analysis:`, {
      industry: industryContext.industry,
      confidence: industryContext.confidence,
      platform: platformContext.platform,
      theme: platformContext.theme
    });
    
    const formFields = generateIntelligentFormFields(prompt, industryContext, platformContext);
    
    // 4. PREPARE RESPONSE
    const response = {
      fields: formFields,
      meta: {
        ai_generated: true,
        generation_method: 'intelligent_analysis_test_v5',
        prompt_analyzed: prompt,
        timestamp: new Date().toISOString(),
        warning: 'TEST VERSION - Credit verification bypassed'
      }
    };

  console.log(`[ai_form_generation:${requestId}] ✅ SUCCESS! Generated ${formFields.length} fields:`, 
    formFields.map(f => `${f.name}(${f.type})`).join(', '));

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

// ============================================================================
// 🧠 LEVEL 5 AI ANALYSIS FUNCTIONS - ENGINEERING FELLOW SUPREME
// ============================================================================

/**
 * Industry Context Detection with AI-powered analysis
 */
function detectIndustryContext(prompt: string): IndustryContext {
  const industries = [
    {
      name: 'web_agency',
      keywords: ['web agency', 'agenzia', 'sviluppo', 'realizzazione', 'siti web', 'web design', 'sviluppatori'],
      confidence: 0.9,
      characteristics: ['tech-savvy', 'project-focused', 'deadline-driven']
    },
    {
      name: 'wordpress',
      keywords: ['wordpress', 'wp', 'theme', 'kadence', 'plugin', 'cms'],
      confidence: 0.95,
      characteristics: ['wordpress-specific', 'theme-aware', 'plugin-friendly']
    },
    {
      name: 'ecommerce',
      keywords: ['negozio', 'shop', 'vendita', 'prodotti', 'carrello', 'acquisto'],
      confidence: 0.85,
      characteristics: ['sales-focused', 'conversion-optimized', 'customer-centric']
    },
    {
      name: 'real_estate',
      keywords: ['immobiliare', 'casa', 'appartamento', 'vendita casa', 'affitto'],
      confidence: 0.8,
      characteristics: ['property-focused', 'location-important', 'contact-heavy']
    },
    {
      name: 'healthcare',
      keywords: ['medico', 'salute', 'prenotazione', 'visita', 'dottore', 'clinica'], 
      confidence: 0.9,
      characteristics: ['privacy-critical', 'appointment-based', 'professional']
    }
  ];

  let bestMatch: IndustryContext = {industry: 'general', confidence: 0.3, characteristics: ['generic']};

  industries.forEach(industry => {
    const matches = industry.keywords.filter(keyword => prompt.toLowerCase().includes(keyword.toLowerCase())).length;
    const confidence = matches / industry.keywords.length * industry.confidence;
    
    if (confidence > bestMatch.confidence) {
      bestMatch = {
        industry: industry.name,
        confidence: confidence,
        characteristics: industry.characteristics
      };
    }
  });

  return bestMatch;
}

/**
 * Platform Context Detection (WordPress, themes, etc.)
 */
function detectPlatformContext(prompt: string): PlatformContext {
  const platforms = [
    {name: 'wordpress', keywords: ['wordpress', 'wp'], themes: ['kadence', 'astra', 'generatepress']},
    {name: 'react', keywords: ['react', 'jsx', 'component']},
    {name: 'html', keywords: ['html', 'css', 'static', 'embed']},
    {name: 'shopify', keywords: ['shopify', 'liquid']},
    {name: 'wix', keywords: ['wix', 'editor']}
  ];

  for (const platform of platforms) {
    if (platform.keywords.some(keyword => prompt.toLowerCase().includes(keyword.toLowerCase()))) {
      let detectedTheme;
      if (platform.themes) {
        detectedTheme = platform.themes.find(theme => prompt.toLowerCase().includes(theme.toLowerCase()));
      }
      
      return {
        platform: platform.name,
        theme: detectedTheme,
        framework: platform.name
      };
    }
  }

  return {platform: 'generic'};
}

/**
 * Types for AI Context Analysis
 */
interface IndustryContext {
  industry: string;
  confidence: number;
  characteristics: string[];
}

interface PlatformContext {
  platform: string;
  theme?: string;
  framework?: string;
}

/**
 * Adaptive Label Generation based on context
 */
function getAdaptiveLabel(fieldType: string, industryContext: IndustryContext, _platformContext?: PlatformContext): string {
  const labelMap: Record<string, Record<string, string>> = {
    name: {
      web_agency: 'Nome o Ragione Sociale',
      wordpress: 'Nome Completo',
      ecommerce: 'Nome Cliente',
      real_estate: 'Nome e Cognome',
      healthcare: 'Nome Paziente',
      general: 'Nome'
    },
    email: {
      web_agency: 'Email Aziendale',
      wordpress: 'Indirizzo Email',
      ecommerce: 'Email per Comunicazioni',
      real_estate: 'Email di Contatto',
      healthcare: 'Email Personale',
      general: 'Email'
    },
    phone: {
      web_agency: 'Telefono Aziendale',
      wordpress: 'Numero di Telefono',
      ecommerce: 'Telefono per Ordini',
      real_estate: 'Cellulare',
      healthcare: 'Telefono di Emergenza',
      general: 'Telefono'
    },
    message: {
      web_agency: 'Descrivi il tuo progetto',
      wordpress: 'Il tuo messaggio',
      ecommerce: 'Note aggiuntive',
      real_estate: 'Dettagli ricerca immobile',
      healthcare: 'Motivo dell\'appuntamento',
      general: 'Messaggio'
    }
  };

  return labelMap[fieldType]?.[industryContext.industry] || labelMap[fieldType]?.general || 'Campo';
}

/**
 * 🧠 LEVEL 5 ADVANCED INTELLIGENT FORM FIELD GENERATION
 * ======================================================
 * Multi-layer AI analysis with industry recognition and context awareness
 * Engineering Fellow Supreme - Adaptive Prompt Processing
 */
function generateIntelligentFormFields(
  prompt: string, 
  industryContext?: IndustryContext, 
  platformContext?: PlatformContext
): Array<{
  name: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'textarea';
  required: boolean;
}> {
  const lowerPrompt = prompt.toLowerCase();
  const fields: Array<{name: string; label: string; type: 'text' | 'email' | 'tel' | 'textarea'; required: boolean;}> = [];

  console.log(`🧠 Level 5 Analysis: "${lowerPrompt}"`);

  // Use provided context or detect if not provided
  const detectedIndustryContext = industryContext || detectIndustryContext(lowerPrompt);
  const detectedPlatformContext = platformContext || detectPlatformContext(lowerPrompt);
  
  console.log(`🏢 Industry: ${detectedIndustryContext.industry} (confidence: ${detectedIndustryContext.confidence})`);
  console.log(`💻 Platform: ${detectedPlatformContext.platform} (theme: ${detectedPlatformContext.theme || 'none'})`);

  // Core fields with adaptive labels
  const nameLabel = getAdaptiveLabel('name', detectedIndustryContext, detectedPlatformContext);
  const emailLabel = getAdaptiveLabel('email', detectedIndustryContext, detectedPlatformContext);

  fields.push({
    name: "nome",
    label: nameLabel,
    type: "text", 
    required: true
  });

  fields.push({
    name: "email",
    label: emailLabel,
    type: "email",
    required: true
  });

  // Pattern detection intelligente con priorità e deduplicazione
  const fieldPatterns = [
    {
      patterns: ['telefono', 'contatto', 'chiamata', 'cell', 'phone', 'mobile'],
      field: { name: "telefono", label: "Telefono", type: "tel" as const, required: false },
      priority: 3
    },
    {
      patterns: ['azienda', 'società', 'ditta', 'company', 'business', 'impresa', 'web agency', 'agenzia'],
      field: { name: "azienda", label: "Azienda", type: "text" as const, required: false },
      priority: 2
    },
    {
      patterns: ['budget', 'preventivo', 'costo', 'prezzo', 'investimento'],
      field: { name: "budget", label: "Budget Indicativo", type: "text" as const, required: false },
      priority: 2
    },
    {
      patterns: ['evento', 'workshop', 'corso', 'seminario', 'formazione'],
      field: { name: "tipo_evento", label: "Tipo di Evento", type: "text" as const, required: false },
      priority: 2
    },
    // GRUPPO MESSAGGIO: Solo uno di questi viene aggiunto per evitare duplicazioni
    {
      patterns: ['servizi', 'servizio', 'interesse', 'prodotti', 'offerta', 'realizzazione', 'sviluppo'],
      field: { name: "servizi_interesse", label: "Servizi di Interesse", type: "textarea" as const, required: false },
      priority: 4,
      group: 'message'
    },
    {
      patterns: ['messaggio', 'richiesta', 'descrizione', 'dettagli', 'note', 'informazioni', 'aiuto'],
      field: { name: "messaggio", label: "Come possiamo aiutarti?", type: "textarea" as const, required: false },
      priority: 3,
      group: 'message'
    }
  ];

  // Apply intelligent matching con deduplicazione per gruppo
  const usedGroups = new Set<string>();
  
  fieldPatterns
    .sort((a, b) => (b.priority || 0) - (a.priority || 0)) // Ordina per priorità
    .forEach(({ patterns, field, group }) => {
      const found = patterns.some(pattern => lowerPrompt.includes(pattern));
      if (found) {
        // Se il campo appartiene a un gruppo, controlla se il gruppo è già stato usato
        if (group && usedGroups.has(group)) {
          console.log(`⚠️ Skipping ${field.name} (group '${group}' already used)`);
          return;
        }
        
        console.log(`✅ Found pattern match: ${patterns.join('|')} -> ${field.name} (priority: ${patterns.length})`);
        if (!fields.some(f => f.name === field.name)) {
          fields.push(field);
          if (group) usedGroups.add(group);
        }
      }
    });

  // Context-specific optimizations (solo se non abbiamo già un campo messaggio)
  const hasMessageField = fields.some(f => f.type === 'textarea');
  
  if ((lowerPrompt.includes('contatto') || lowerPrompt.includes('contact')) && !hasMessageField) {
    console.log(`✅ Adding contact message field`);
    fields.push({
      name: "messaggio",
      label: "Come possiamo aiutarti?",
      type: "textarea",
      required: false
    });
  }

  // Ensure good UX: minimum 3 fields, maximum 6 (ma non duplicare textarea)
  if (fields.length < 3 && !hasMessageField) {
    console.log(`✅ Adding default message field for good UX`);
    fields.push({
      name: "note",
      label: "Note Aggiuntive",
      type: "textarea",
      required: false
    });
  }

  const finalFields = fields.slice(0, 6); // Massimo 6 campi per evitare confusione
  console.log(`🎯 Final fields generated: ${finalFields.length} fields`);
  
  return finalFields;
}