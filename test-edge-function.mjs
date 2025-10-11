const supabaseUrl = 'https://qjtaqrlpronohgpfdxsi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjg1NjM3OTMsImV4cCI6MjA0NDEzOTc5M30.gGPaJXeayAsuBZdJwfRCqVXiSE6TaJDtKfr-5JjvTSU';

const testPayload = {
    prompt: `form contatto agenzia web digitale
- URL Privacy Policy: https://example.com/privacy
- Consenso marketing richiesto
- Colore primario: #ef4444
- Colore sfondo: #ffffff`,
    required_fields: ['nome', 'email', 'telefono', 'servizi_interesse', 'privacy_consent', 'marketing_consent']
};

console.log('🧪 TEST EDGE FUNCTION');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📤 REQUEST PAYLOAD:');
console.log(JSON.stringify(testPayload, null, 2));
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

const response = await fetch(`${supabaseUrl}/functions/v1/generate-form-fields`, {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(testPayload)
});

console.log('📊 RESPONSE STATUS:', response.status, response.statusText);

const data = await response.json();

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📥 RESPONSE DATA:');
console.log(JSON.stringify(data, null, 2));
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');
console.log('🔍 VERIFICHE:');
console.log('✓ Fields generati:', data.fields?.length || 0);
console.log('✓ Meta presente:', !!data.meta);
console.log('✓ Colors in meta:', !!data.meta?.colors);
console.log('✓ Privacy URL in meta:', !!data.meta?.privacy_policy_url);
console.log('');

if (!data.fields || data.fields.length === 0) {
    console.log('❌ NESSUN FIELD GENERATO!');
    process.exit(1);
}

console.log('📋 FIELDS DETTAGLIO:');
data.fields.forEach(f => {
    const optionsInfo = f.options ? ` [${f.options.length} options]` : '';
    const requiredMark = f.required ? ' (required)' : '';
    console.log(`  - ${f.name} (type: ${f.type})${optionsInfo}${requiredMark}`);
});
console.log('');

if (data.meta?.colors) {
    console.log('🎨 COLORS:');
    console.log('  Primary:', data.meta.colors.primary_color);
    console.log('  Background:', data.meta.colors.background_color);
    console.log('  Text:', data.meta.colors.text_color);
} else {
    console.log('❌ COLORS NON PRESENTI IN META!');
}

if (data.meta?.privacy_policy_url) {
    console.log('🔒 Privacy URL:', data.meta.privacy_policy_url);
} else {
    console.log('❌ PRIVACY URL NON PRESENTE IN META!');
}

console.log('');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🎯 PROBLEMI RILEVATI:');

const problemi = [];

// Check privacy_consent
const privacyField = data.fields.find(f => f.name === 'privacy_consent');
if (!privacyField) {
    problemi.push('❌ privacy_consent field mancante');
} else if (privacyField.type !== 'checkbox') {
    problemi.push(`❌ privacy_consent è ${privacyField.type} invece di checkbox`);
} else {
    console.log('✅ privacy_consent checkbox presente');
}

// Check marketing_consent
const marketingField = data.fields.find(f => f.name === 'marketing_consent');
if (!marketingField) {
    problemi.push('❌ marketing_consent field mancante');
} else if (marketingField.type !== 'checkbox') {
    problemi.push(`❌ marketing_consent è ${marketingField.type} invece di checkbox`);
} else {
    console.log('✅ marketing_consent checkbox presente');
}

// Check servizi_interesse
const serviziField = data.fields.find(f => f.name === 'servizi_interesse');
if (!serviziField) {
    problemi.push('❌ servizi_interesse field mancante');
} else if (serviziField.type !== 'select') {
    problemi.push(`❌ servizi_interesse è ${serviziField.type} invece di select`);
} else if (!serviziField.options || serviziField.options.length === 0) {
    problemi.push('❌ servizi_interesse non ha options');
} else {
    console.log(`✅ servizi_interesse select con ${serviziField.options.length} options`);
}

// Check colors
if (!data.meta?.colors) {
    problemi.push('❌ Colors mancanti in meta');
} else if (data.meta.colors.primary_color !== '#ef4444') {
    problemi.push(`⚠️  Primary color è ${data.meta.colors.primary_color} invece di #ef4444 (richiesto nel prompt)`);
} else {
    console.log('✅ Colors corretti in meta');
}

// Check privacy URL
if (!data.meta?.privacy_policy_url) {
    problemi.push('❌ Privacy URL mancante in meta');
} else if (data.meta.privacy_policy_url !== 'https://example.com/privacy') {
    problemi.push(`⚠️  Privacy URL è ${data.meta.privacy_policy_url} invece di https://example.com/privacy (richiesto nel prompt)`);
} else {
    console.log('✅ Privacy URL corretto in meta');
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

if (problemi.length > 0) {
    console.log('');
    console.log('⚠️  PROBLEMI TROVATI:');
    problemi.forEach(p => console.log(p));
    process.exit(1);
} else {
    console.log('');
    console.log('✅ TUTTI I TEST PASSATI!');
}
