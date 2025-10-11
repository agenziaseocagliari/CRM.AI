// 🔬 FORENSIC ANALYSIS - Direct Edge Function Test
// Test diretto dell'Edge Function per analisi completa

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://icusfqpwhcnzjknmfhts.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImljdXNmcXB3aGNuemprb21maHRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU3MjU4MjQsImV4cCI6MjA0MTMwMTgyNH0.SmdpHQ-2IYLlYqJnGJKUH9VYZQQhw_lOJ_hfJMiF7aQ";

console.log('🔬 FORENSIC ANALYSIS - Testing Edge Function Directly');

// 1. Test con user reale autenticato
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Login con account di test
console.log('🔐 Attempting login...');
const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
  email: 'testuser@example.com',
  password: 'TestPassword123!'
});

if (authError) {
  console.error('❌ Auth failed:', authError.message);
  
  // Fallback: test con token anonimo
  console.log('🔄 Fallback: Using anon token...');
  await testEdgeFunctionDirect(SUPABASE_ANON_KEY, 'ANON');
} else {
  console.log('✅ Auth successful:', authData.user.email);
  await testEdgeFunctionDirect(authData.session.access_token, 'AUTHENTICATED');
}

async function testEdgeFunctionDirect(token, tokenType) {
  console.log(`\n🧪 Testing Edge Function with ${tokenType} token`);
  
  // Payload identico a quello che manda Forms.tsx
  const testPayload = {
    prompt: `Genera un form di contatto per: Realizzazione siti web
Tipo di business: Agenzia Web
URL Privacy Policy: https://seo.cagliari.it/privacy-policy
Campi richiesti: Nome completo, Email, Telefono, Servizi di interesse
Descrizione: Form per raccogliere lead interessati ai nostri servizi di realizzazione siti web`,
    
    organization_id: "123e4567-e89b-12d3-a456-426614174000",
    
    // Questi sono i campi che l'utente ha selezionato
    required_fields: ["Nome completo", "Email", "Telefono", "Servizi interesse"],
    
    // Personalizzazioni dall'editor
    style_customizations: {
      primaryColor: "#3B82F6",
      backgroundColor: "#FFFFFF", 
      textColor: "#1F2937"
    },
    
    privacy_policy_url: "https://seo.cagliari.it/privacy-policy"
  };

  console.log('📤 Request Payload:');
  console.log(JSON.stringify(testPayload, null, 2));

  try {
    console.log('\n🌐 Calling Edge Function...');
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-form-fields`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify(testPayload),
    });

    console.log('📊 Response Status:', response.status);
    console.log('📊 Response Headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Edge Function Error:');
      console.error('Status:', response.status);
      console.error('StatusText:', response.statusText);
      console.error('Body:', errorText);
      return;
    }

    const result = await response.json();
    
    console.log('\n📥 Edge Function SUCCESS Response:');
    console.log(JSON.stringify(result, null, 2));
    
    // ANALISI DETTAGLIATA
    console.log('\n🔍 DETAILED ANALYSIS:');
    console.log('✅ Response received successfully');
    console.log('📋 Fields count:', result.fields?.length || 0);
    console.log('🎨 Has style_customizations:', !!result.style_customizations);
    console.log('🔒 Has privacy_policy_url:', !!result.privacy_policy_url);
    console.log('🧠 Has meta:', !!result.meta);
    
    if (result.fields) {
      console.log('\n📋 FIELDS ANALYSIS:');
      result.fields.forEach((field, index) => {
        console.log(`${index + 1}. ${field.name} (${field.type}) - Required: ${field.required}`);
        if (field.options) {
          console.log(`   Options: ${field.options.join(', ')}`);
        }
      });
      
      // Check specifici per i problemi riportati
      const hasGDPR = result.fields.some(f => f.name === 'privacy_consent');
      const hasServizi = result.fields.some(f => f.name === 'servizi_interesse');
      const serviziField = result.fields.find(f => f.name === 'servizi_interesse');
      
      console.log('\n🚨 PROBLEM CHECK:');
      console.log('🔒 Has GDPR field (privacy_consent):', hasGDPR ? '✅' : '❌');
      console.log('📋 Has Servizi field (servizi_interesse):', hasServizi ? '✅' : '❌');
      if (serviziField) {
        console.log('📋 Servizi options count:', serviziField.options?.length || 0);
        console.log('📋 Servizi options:', serviziField.options || 'NONE');
      }
    }
    
    if (result.style_customizations) {
      console.log('\n🎨 STYLE CUSTOMIZATIONS:');
      console.log('Primary Color:', result.style_customizations.primaryColor);
      console.log('Background Color:', result.style_customizations.backgroundColor);
      console.log('Text Color:', result.style_customizations.textColor);
    }

  } catch (error) {
    console.error('💥 Network/Parse Error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
  }
}