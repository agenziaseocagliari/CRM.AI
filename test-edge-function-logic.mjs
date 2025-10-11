// 🧪 TEST LOCALE EDGE FUNCTION LOGIC
// Simula la logica per capire il problema senza deploy

console.log('🧪 LOCAL EDGE FUNCTION LOGIC TEST');

// Simulate the exact input from frontend
const testInput = {
  prompt: `Genera un form di contatto per: Realizzazione siti web
Tipo di business: Agenzia Web
URL Privacy Policy: https://seo.cagliari.it/privacy-policy
Campi richiesti: Nome completo, Email, Telefono, Servizi di interesse`,
  required_fields: ["Nome completo", "Email", "Telefono", "Servizi interesse"],  // ⚠️ "Servizi interesse" (senza "di")
  style_customizations: {
    primaryColor: "#3B82F6",
    backgroundColor: "#FFFFFF",
    textColor: "#1F2937"
  }
};

console.log('📤 Test Input:', JSON.stringify(testInput, null, 2));

// Simulate detectGDPRRequirement function
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

// Simulate getIndustryServiceOptions function  
function getIndustryServiceOptions() {
  return [
    'Realizzazione Sito Web',
    'SEO e Posizionamento', 
    'Gestione Social Media',
    'E-commerce',
    'Consulenza Digitale',
    'Altro'
  ];
}

// Simulate the field processing logic from Edge Function
function processFields(requiredFields, prompt) {
  const fields = [];
  
  console.log('\n🔍 PROCESSING FIELDS:');
  
  requiredFields.forEach(fieldLabel => {
    const normalizedLabel = fieldLabel.toLowerCase();
    
    console.log(`📋 Processing: "${fieldLabel}" -> "${normalizedLabel}"`);
    
    // 🔒 Privacy Consent check
    if (normalizedLabel === 'privacy_consent' || normalizedLabel.includes('privacy consent')) {
      console.log(`✅ Matched PRIVACY CONSENT`);
      fields.push({
        name: "privacy_consent",
        label: "Accetto l'informativa sulla privacy e il trattamento dei miei dati personali",
        type: "checkbox",
        required: true
      });
      return;
    }
    
    // 📋 Servizi Interesse check - TUTTE LE VARIANTI
    const isServiziMatch = (
      normalizedLabel === 'servizi_interesse' ||
      normalizedLabel.includes('servizi di interesse') || 
      normalizedLabel.includes('servizi interesse') ||  // 🔧 Questo dovrebbe matchare "Servizi interesse"
      normalizedLabel === 'servizi'
    );
    
    console.log(`🔍 Servizi check for "${normalizedLabel}":`, {
      exact_servizi_interesse: normalizedLabel === 'servizi_interesse',
      includes_servizi_di_interesse: normalizedLabel.includes('servizi di interesse'),
      includes_servizi_interesse: normalizedLabel.includes('servizi interesse'),
      exact_servizi: normalizedLabel === 'servizi',
      final_match: isServiziMatch
    });
    
    if (isServiziMatch) {
      console.log(`✅ Matched SERVIZI INTERESSE - creating SELECT`);
      const serviceOptions = getIndustryServiceOptions();
      fields.push({
        name: "servizi_interesse",
        label: "Servizi di Interesse", 
        type: "select",
        required: false,
        options: serviceOptions
      });
      return;
    }
    
    // Email check
    if (normalizedLabel.includes('email')) {
      console.log(`✅ Matched EMAIL`);
      fields.push({
        name: "email",
        label: fieldLabel,
        type: "email",
        required: true
      });
      return;
    }
    
    // Phone check
    if (normalizedLabel.includes('telefono')) {
      console.log(`✅ Matched TELEFONO`);
      fields.push({
        name: "telefono",
        label: fieldLabel,
        type: "tel",
        required: false
      });
      return;
    }
    
    // Nome check
    if (normalizedLabel.includes('nome')) {
      console.log(`✅ Matched NOME`);
      fields.push({
        name: "nome_completo",
        label: fieldLabel,
        type: "text",
        required: true
      });
      return;
    }
    
    // Default fallback
    console.log(`⚠️ FALLBACK to text field`);
    fields.push({
      name: normalizedLabel.replace(/\s+/g, '_').toLowerCase(),
      label: fieldLabel,
      type: "text",
      required: false
    });
  });
  
  // Auto-add GDPR if detected and not present
  const hasPrivacyConsent = fields.some(f => f.name === 'privacy_consent');
  const gdprDetected = detectGDPRRequirement(prompt);
  
  console.log(`\n🔒 GDPR Check:`, {
    gdpr_detected: gdprDetected,
    has_privacy_consent: hasPrivacyConsent,
    should_add_gdpr: gdprDetected && !hasPrivacyConsent
  });
  
  if (gdprDetected && !hasPrivacyConsent) {
    console.log(`✅ Auto-adding GDPR field`);
    fields.push({
      name: "privacy_consent",
      label: "Accetto l'informativa sulla privacy e il trattamento dei miei dati personali",
      type: "checkbox",
      required: true
    });
  }
  
  return fields;
}

// Run the test
const resultFields = processFields(testInput.required_fields, testInput.prompt);

console.log('\n📥 FINAL RESULT:');
console.log(JSON.stringify(resultFields, null, 2));

// Check for specific issues
console.log('\n🚨 ISSUE CHECK:');
const hasGDPR = resultFields.some(f => f.name === 'privacy_consent');
const hasServizi = resultFields.some(f => f.name === 'servizi_interesse');
const serviziField = resultFields.find(f => f.name === 'servizi_interesse');

console.log('🔒 Has GDPR field:', hasGDPR ? '✅' : '❌');
console.log('📋 Has Servizi field:', hasServizi ? '✅' : '❌');
if (serviziField) {
  console.log('📋 Servizi type:', serviziField.type);
  console.log('📋 Servizi options:', serviziField.options?.length || 0, 'options');
} else {
  console.log('📋 Servizi field: NOT FOUND');
}