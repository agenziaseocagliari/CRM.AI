// DEPLOY EDGE FUNCTION - MANUAL UPDATE
// Copy this content to Supabase Dashboard > Edge Functions > generate-form-fields

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  // CORS headers per tutte le richieste
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { prompt, industryContext, platformContext } = await req.json()
    
    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`🚀 FormMaster Level 5 Processing: "${prompt}"`)
    
    const fields = generateFormFields(prompt, industryContext, platformContext)
    
    return new Response(
      JSON.stringify({ 
        fields,
        meta: {
          version: "12.0",
          level: 5,
          gdpr_enabled: true,
          timestamp: new Date().toISOString()
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
    
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

/**
 * 🛡️ GDPR Compliance Detection - NUOVO LIVELLO 5
 */
function detectGDPRRequirement(prompt: string): boolean {
  const gdprKeywords = [
    'gdpr', 'privacy', 'consenso', 'consent', 'trattamento dati', 
    'data processing', 'privacy policy', 'informativa privacy',
    'dati personali', 'personal data', 'protezione dati',
    'data protection', 'cookie', 'cookies', 'marketing',
    'newsletter', 'mailing list', 'commercial', 'commerciale'
  ];
  
  return gdprKeywords.some(keyword => prompt.toLowerCase().includes(keyword));
}

/**
 * Detect Industry Context from prompt
 */
function detectIndustryContext(prompt: string): IndustryContext {
  const lowerPrompt = prompt.toLowerCase();
  
  // Healthcare
  if (lowerPrompt.includes('medic') || lowerPrompt.includes('salute') || lowerPrompt.includes('doctor') || lowerPrompt.includes('clinic')) {
    return {
      industry: 'healthcare',
      confidence: 0.9,
      characteristics: ['privacy-critical', 'appointment-based', 'professional']
    };
  }
  
  // Legal
  if (lowerPrompt.includes('legal') || lowerPrompt.includes('avvocat') || lowerPrompt.includes('law') || lowerPrompt.includes('giuridic')) {
    return {
      industry: 'legal',
      confidence: 0.9,
      characteristics: ['privacy-critical', 'consultation-based', 'formal']
    };
  }
  
  // Tech/Digital Agency
  if (lowerPrompt.includes('web') || lowerPrompt.includes('digital') || lowerPrompt.includes('agency') || lowerPrompt.includes('agenzia') || lowerPrompt.includes('tech')) {
    return {
      industry: 'tech',
      confidence: 0.8,  
      characteristics: ['project-based', 'budget-focused', 'timeline-sensitive']
    };
  }
  
  // Real Estate
  if (lowerPrompt.includes('immobil') || lowerPrompt.includes('real estate') || lowerPrompt.includes('property') || lowerPrompt.includes('casa')) {
    return {
      industry: 'real-estate',
      confidence: 0.9,
      characteristics: ['location-based', 'budget-sensitive', 'personal']
    };
  }
  
  // Finance
  if (lowerPrompt.includes('financ') || lowerPrompt.includes('bank') || lowerPrompt.includes('invest') || lowerPrompt.includes('prestit')) {
    return {
      industry: 'finance',
      confidence: 0.9,
      characteristics: ['privacy-critical', 'amount-focused', 'verification-heavy']
    };
  }
  
  return {
    industry: 'generic',
    confidence: 0.5,
    characteristics: ['general-purpose']
  };
}

/**
 * Detect Platform Context from prompt  
 */
function detectPlatformContext(prompt: string): PlatformContext {
  const lowerPrompt = prompt.toLowerCase();
  
  if (lowerPrompt.includes('wordpress') || lowerPrompt.includes('wp')) {
    if (lowerPrompt.includes('kadence')) {
      return {platform: 'wordpress', theme: 'kadence'};
    }
    return {platform: 'wordpress'};
  }
  
  if (lowerPrompt.includes('react') || lowerPrompt.includes('next')) {
    return {platform: 'react'};
  }
  
  if (lowerPrompt.includes('vue')) {
    return {platform: 'vue'};
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
function getAdaptiveLabel(
  fieldType: 'name' | 'email' | 'phone' | 'company' | 'message',
  industryContext: IndustryContext,
  platformContext: PlatformContext
): string {
  const baseLabels = {
    name: "Nome",
    email: "Email", 
    phone: "Telefono",
    company: "Azienda",
    message: "Messaggio"
  };
  
  // Industry-specific adaptations
  if (industryContext.industry === 'healthcare') {
    const healthLabels = {
      name: "Nome Completo",
      email: "Email di Contatto",
      phone: "Telefono (per appuntamenti)",
      company: "Struttura Sanitaria",
      message: "Descrivi il tuo problema"
    };
    return healthLabels[fieldType] || baseLabels[fieldType];
  }
  
  if (industryContext.industry === 'legal') {
    const legalLabels = {
      name: "Nome e Cognome",
      email: "Indirizzo Email",
      phone: "Recapito Telefonico", 
      company: "Azienda/Ente",
      message: "Descrivi la questione legale"
    };
    return legalLabels[fieldType] || baseLabels[fieldType];
  }
  
  if (industryContext.industry === 'tech') {
    const techLabels = {
      name: "Nome",
      email: "Email Aziendale",
      phone: "Telefono",
      company: "Nome Azienda", 
      message: "Descrivi il progetto"
    };
    return techLabels[fieldType] || baseLabels[fieldType];
  }
  
  return baseLabels[fieldType];
}

/**
 * Generate form fields with Level 5 AI Context Analysis
 */
function generateFormFields(
  prompt: string,
  industryContext?: IndustryContext,
  platformContext?: PlatformContext
): Array<{
  name: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'textarea' | 'checkbox';
  required: boolean;
}> {
  const lowerPrompt = prompt.toLowerCase();
  const fields: Array<{name: string; label: string; type: 'text' | 'email' | 'tel' | 'textarea' | 'checkbox'; required: boolean;}> = [];

  console.log(`🧠 Level 5 Analysis: "${lowerPrompt}"`);

  // Use provided context or detect if not provided
  const detectedIndustryContext = industryContext || detectIndustryContext(lowerPrompt);
  const detectedPlatformContext = platformContext || detectPlatformContext(lowerPrompt);
  
  console.log(`🏢 Industry: ${detectedIndustryContext.industry} (confidence: ${detectedIndustryContext.confidence})`);
  console.log(`💻 Platform: ${detectedPlatformContext.platform} (theme: ${detectedPlatformContext.theme || 'none'})`);

  // 🛡️ GDPR COMPLIANCE DETECTION - AGGIUNTO PER FIX LIVELLO 5
  const needsGDPRCompliance = detectGDPRRequirement(lowerPrompt);
  console.log(`🛡️ GDPR Required: ${needsGDPRCompliance}`);

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
      patterns: ['urgente', 'urgency', 'emergency', 'asap', 'subito'],
      field: { name: "urgenza", label: "Livello di Urgenza", type: "text" as const, required: false },
      priority: 1
    },
    {
      patterns: ['timeline', 'tempi', 'scadenza', 'deadline', 'quando'],
      field: { name: "timeline", label: "Timeline del Progetto", type: "text" as const, required: false },
      priority: 2
    },
    {
      patterns: ['servizio', 'service', 'tipo', 'categoria'],
      field: { name: "servizio", label: "Tipo di Servizio", type: "text" as const, required: false },
      priority: 1
    }
  ];

  // Smart pattern matching with deduplication
  const usedGroups = new Set();
  
  fieldPatterns
    .sort((a, b) => b.priority - a.priority)
    .forEach(({ patterns, field, priority, group }) => {
      if (group && usedGroups.has(group)) return; // Skip if group already used
      
      const matches = patterns.filter(pattern => lowerPrompt.includes(pattern));
      if (matches.length > 0) {
        
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

  // 🛡️ GDPR COMPLIANCE FIELDS - IMPLEMENTAZIONE LIVELLO 5
  if (needsGDPRCompliance) {
    console.log(`🛡️ Adding GDPR compliance fields`);
    
    // Privacy Consent - sempre required per GDPR
    fields.push({
      name: "privacy_consent",
      label: "Accetto l'informativa sulla privacy e il trattamento dei miei dati personali",
      type: "checkbox",
      required: true
    });
    
    // Marketing Consent - opzionale
    if (lowerPrompt.includes('newsletter') || lowerPrompt.includes('marketing') || lowerPrompt.includes('commercial')) {
      fields.push({
        name: "marketing_consent",
        label: "Accetto di ricevere comunicazioni commerciali e newsletter",
        type: "checkbox",
        required: false
      });
    }
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

  // Limit to 6 fields for good UX
  if (fields.length > 6) {
    console.log(`⚠️ Limiting to 6 fields for better UX`);
    return fields.slice(0, 6);
  }

  console.log(`🎯 Generated ${fields.length} fields for prompt: "${prompt}"`);
  return fields;
}