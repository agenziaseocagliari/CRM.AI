// 🔍 DEBUG EDGE FUNCTION REQUEST
// Testa esattamente cosa riceve l'Edge Function

console.log('🚀 Testing Edge Function Input/Output...');

// Simula il payload che viene inviato da Forms.tsx
const testPayload = {
  prompt: `Genera un form di contatto per: Realizzazione siti web
Tipo di business: Agenzia Web
URL Privacy Policy: https://seo.cagliari.it/privacy-policy
Campi richiesti: Nome completo, Email, Telefono, Servizi di interesse
Descrizione: Form per raccogliere lead interessati ai nostri servizi di realizzazione siti web`,
  
  organization_id: "123e4567-e89b-12d3-a456-426614174000",
  
  // Questi sono i campi che l'utente ha selezionato nel form builder
  required_fields: ["Nome completo", "Email", "Telefono", "Servizi interesse"],
  
  // Personalizzazioni dall'editor
  style_customizations: {
    primaryColor: "#3B82F6",
    backgroundColor: "#FFFFFF", 
    textColor: "#1F2937"
  }
};

console.log('📤 Payload being sent to Edge Function:');
console.log(JSON.stringify(testPayload, null, 2));

// Simula la chiamata all'Edge Function
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

try {
  console.log('\n🌐 Calling Edge Function...');
  
  const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-form-fields`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(testPayload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Edge Function Error:', response.status, errorText);
    process.exit(1);
  }

  const result = await response.json();
  
  console.log('\n📥 Edge Function Response:');
  console.log(JSON.stringify(result, null, 2));
  
  // Analizza i problemi specifici
  console.log('\n🔍 ANALYSIS:');
  console.log('- Has fields:', result.fields?.length || 0);
  console.log('- Has GDPR field:', result.fields?.some(f => f.name === 'privacy_consent') ? '✅' : '❌');
  console.log('- Has servizi field:', result.fields?.some(f => f.name === 'servizi_interesse') ? '✅' : '❌');
  console.log('- Servizi options:', result.fields?.find(f => f.name === 'servizi_interesse')?.options || 'NONE');
  console.log('- Style customizations preserved:', result.style_customizations ? '✅' : '❌');
  console.log('- Colors:', {
    primary: result.style_customizations?.primaryColor || 'MISSING',
    background: result.style_customizations?.backgroundColor || 'MISSING',
    text: result.style_customizations?.textColor || 'MISSING'
  });

} catch (error) {
  console.error('💥 Network Error:', error.message);
}