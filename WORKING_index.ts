/**
 * FormMaster Level 5 - GDPR Compliance Ready
 * Version 12.1 - Complete and Working
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { prompt, organization_id } = await req.json()
    
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
    
    const fields = generateFormFields(prompt)
    
    return new Response(
      JSON.stringify({ 
        fields,
        meta: {
          version: "12.1",
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

function detectGDPRRequirement(prompt) {
  const gdprKeywords = [
    'gdpr', 'privacy', 'consenso', 'consent', 'trattamento dati', 
    'data processing', 'privacy policy', 'informativa privacy',
    'dati personali', 'personal data', 'protezione dati',
    'data protection', 'cookie', 'cookies', 'marketing',
    'newsletter', 'mailing list', 'commercial', 'commerciale'
  ];
  
  return gdprKeywords.some(keyword => prompt.toLowerCase().includes(keyword));
}

function generateFormFields(prompt) {
  const lowerPrompt = prompt.toLowerCase();
  const fields = [];

  console.log(`🧠 Level 5 Analysis: "${lowerPrompt}"`);

  // Core fields
  fields.push({
    name: "nome",
    label: "Nome",
    type: "text", 
    required: true
  });

  fields.push({
    name: "email",
    label: "Email",
    type: "email",
    required: true
  });

  // Smart pattern detection
  if (lowerPrompt.includes('telefono') || lowerPrompt.includes('phone') || lowerPrompt.includes('contatto')) {
    fields.push({
      name: "telefono",
      label: "Telefono",
      type: "tel",
      required: false
    });
  }

  if (lowerPrompt.includes('azienda') || lowerPrompt.includes('company') || lowerPrompt.includes('agency')) {
    fields.push({
      name: "azienda",
      label: "Azienda",
      type: "text",
      required: false
    });
  }

  if (lowerPrompt.includes('budget') || lowerPrompt.includes('preventivo')) {
    fields.push({
      name: "budget",
      label: "Budget Indicativo",
      type: "text",
      required: false
    });
  }

  // GDPR Compliance
  const needsGDPR = detectGDPRRequirement(lowerPrompt);
  console.log(`🛡️ GDPR Required: ${needsGDPR}`);

  if (needsGDPR) {
    fields.push({
      name: "privacy_consent",
      label: "Accetto l'informativa sulla privacy e il trattamento dei miei dati personali",
      type: "checkbox",
      required: true
    });
    
    if (lowerPrompt.includes('newsletter') || lowerPrompt.includes('marketing')) {
      fields.push({
        name: "marketing_consent",
        label: "Accetto di ricevere comunicazioni commerciali e newsletter",
        type: "checkbox",
        required: false
      });
    }
  }

  // Message field
  const hasMessage = fields.some(f => f.type === 'textarea');
  if (!hasMessage && (lowerPrompt.includes('contatto') || lowerPrompt.includes('contact'))) {
    fields.push({
      name: "messaggio",
      label: "Come possiamo aiutarti?",
      type: "textarea",
      required: false
    });
  }

  console.log(`🎯 Generated ${fields.length} fields for prompt: "${prompt}"`);
  return fields;
}

console.log('🚀 FormMaster Level 5 - VERSION 12.1 - Ready for deployment');