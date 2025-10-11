// Test Edge Function con business type Palestra
const SUPABASE_URL = 'https://qjtaqrlpronohgpfdxsi.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjgzNzk5NDIsImV4cCI6MjA0Mzk1NTk0Mn0.YDGBqDo5NJ3E3NqhEILDfLqKfXIy9z2DhtZY9_zM3ss';

const testPayload = {
  prompt: `Crea un form registrazione per Palestra che si rivolge a: potenziali clienti

CONTESTO BUSINESS:
- Tipo di business: Palestra
- Target audience: potenziali clienti
- Scopo del form: Raccolta contatti interessati

CAMPI RICHIESTI dall'utente:
- nome: Campo per il nome completo
- email: Indirizzo email
- telefono: Numero di telefono
- servizi_interesse: Campo select con servizi di interesse
- privacy_consent: Checkbox per GDPR privacy policy
- marketing_consent: Checkbox per marketing consent

PERSONALIZZAZIONE COLORI:
- Colore primario (bottoni, link): #ef4444
- Colore background: #ffffff
- Colore testo: #1f2937

PRIVACY POLICY:
- URL: https://example.com/privacy`,
  required_fields: ['nome', 'email', 'telefono', 'servizi_interesse', 'privacy_consent', 'marketing_consent'],
  customization: {
    colors: {
      primary: '#ef4444',
      background: '#ffffff',
      text: '#1f2937'
    },
    privacy_policy_url: 'https://example.com/privacy'
  }
};

console.log('🧪 TEST EDGE FUNCTION - Business: Palestra\n');
console.log('📤 Payload inviato:');
console.log(JSON.stringify(testPayload, null, 2));
console.log('\n🚀 Chiamata in corso...\n');

const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-form-fields`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${ANON_KEY}`
  },
  body: JSON.stringify(testPayload)
});

const data = await response.json();

console.log('📥 RESPONSE STATUS:', response.status);
console.log('📥 RESPONSE DATA:\n');
console.log(JSON.stringify(data, null, 2));

// Validazione
console.log('\n✅ VALIDAZIONE:\n');

if (!data.fields) {
  console.error('❌ ERROR: Nessun campo generato!');
  process.exit(1);
}

console.log(`📊 Campi generati: ${data.fields.length}`);

// Trova servizi_interesse
const serviziField = data.fields.find(f => f.name === 'servizi_interesse');

if (!serviziField) {
  console.error('❌ ERROR: Campo servizi_interesse NON TROVATO!');
  console.log('Campi presenti:', data.fields.map(f => f.name).join(', '));
  process.exit(1);
}

console.log('\n🎯 Campo servizi_interesse:');
console.log(`   Type: ${serviziField.type}`);
console.log(`   Options count: ${serviziField.options?.length || 0}`);

if (serviziField.type !== 'select') {
  console.error(`❌ ERROR: Type dovrebbe essere 'select', trovato '${serviziField.type}'`);
  process.exit(1);
}

if (!serviziField.options || serviziField.options.length === 0) {
  console.error('❌ ERROR: Options MANCANTI o vuote!');
  process.exit(1);
}

console.log('\n   Options:');
serviziField.options.forEach((opt, i) => {
  console.log(`   ${i + 1}. ${opt}`);
});

// Verifica opzioni specifiche palestra
const palestraOptions = ['Personal Training', 'Abbonamento', 'Corsi'];
const hasGymOptions = serviziField.options.some(opt => 
  palestraOptions.some(gymOpt => opt.includes(gymOpt))
);

if (!hasGymOptions) {
  console.warn('⚠️  WARNING: Options non sembrano specifiche per Palestra');
  console.warn('   Attese: Personal Training, Abbonamento, Corsi Gruppo');
  console.warn(`   Trovate: ${serviziField.options.join(', ')}`);
}

// Verifica privacy
const privacyField = data.fields.find(f => f.name === 'privacy_consent');
const marketingField = data.fields.find(f => f.name === 'marketing_consent');

if (privacyField) {
  console.log(`\n✅ privacy_consent: ${privacyField.type} (required: ${privacyField.required})`);
} else {
  console.error('❌ ERROR: privacy_consent MANCANTE!');
}

if (marketingField) {
  console.log(`✅ marketing_consent: ${marketingField.type} (required: ${marketingField.required})`);
} else {
  console.error('❌ ERROR: marketing_consent MANCANTE!');
}

// Verifica meta
console.log('\n🎨 METADATA:');
console.log(`   Colors: ${JSON.stringify(data.meta?.colors || {})}`);
console.log(`   Privacy URL: ${data.meta?.privacy_policy_url || 'MANCANTE'}`);

if (data.meta?.colors?.primary === '#ef4444') {
  console.log('✅ Colori personalizzati presenti');
} else {
  console.error(`❌ ERROR: Colore primario dovrebbe essere #ef4444, trovato ${data.meta?.colors?.primary || 'MANCANTE'}`);
}

if (data.meta?.privacy_policy_url === 'https://example.com/privacy') {
  console.log('✅ Privacy URL presente');
} else {
  console.error('❌ ERROR: Privacy URL mancante o errato');
}

console.log('\n🎉 TEST COMPLETATO!');
