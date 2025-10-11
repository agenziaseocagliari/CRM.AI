const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://qjtaqrlpronohgpfdxsi.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjg1NjM3OTMsImV4cCI6MjA0NDEzOTc5M30.gGPaJXeayAsuBZdJwfRCqVXiSE6TaJDtKfr-5JjvTSU'
);

(async () => {
  console.log('🔍 Verifico ULTIMO FORM salvato in database...\n');
  
  const { data, error } = await supabase
    .from('forms')
    .select('id, name, title, styling, privacy_policy_url, fields, created_at')
    .order('created_at', { ascending: false })
    .limit(1);
    
  if (error) {
    console.error('❌ ERRORE:', error.message);
    process.exit(1);
  }
  
  if (!data || data.length === 0) {
    console.log('⚠️  Nessun form trovato nel database');
    process.exit(0);
  }
  
  const form = data[0];
  
  console.log('📋 ULTIMO FORM SALVATO:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('ID:', form.id);
  console.log('Nome:', form.name);
  console.log('Created:', form.created_at);
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎨 STYLING:');
  console.log(JSON.stringify(form.styling, null, 2));
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔒 PRIVACY URL:');
  console.log(form.privacy_policy_url || 'NULL');
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 FIELDS (' + (form.fields?.length || 0) + ' totali):');
  
  if (form.fields && form.fields.length > 0) {
    form.fields.forEach((field, idx) => {
      console.log('');
      console.log(`  [${idx + 1}] ${field.name}`);
      console.log(`      Type: ${field.type}`);
      console.log(`      Label: ${field.label}`);
      console.log(`      Required: ${field.required}`);
      if (field.options) {
        console.log(`      Options: [${field.options.length}] ${field.options.join(', ')}`);
      }
    });
  } else {
    console.log('  ⚠️  NESSUN CAMPO!');
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 PROBLEMI RILEVATI:\n');
  
  const problemi = [];
  
  // Check styling
  if (!form.styling || form.styling.primary_color === '#6366f1') {
    problemi.push('❌ STYLING: Colore primario è default #6366f1 (non custom)');
  } else {
    console.log('✅ STYLING: Colore custom presente:', form.styling.primary_color);
  }
  
  // Check privacy
  if (!form.privacy_policy_url) {
    problemi.push('❌ PRIVACY: privacy_policy_url è NULL');
  } else {
    console.log('✅ PRIVACY: Privacy URL presente:', form.privacy_policy_url);
  }
  
  // Check privacy_consent field
  const privacyField = form.fields?.find(f => f.name === 'privacy_consent');
  if (!privacyField) {
    problemi.push('❌ GDPR: Campo privacy_consent MANCANTE');
  } else if (privacyField.type !== 'checkbox') {
    problemi.push(`❌ GDPR: privacy_consent type è '${privacyField.type}' invece di 'checkbox'`);
  } else {
    console.log('✅ GDPR: privacy_consent checkbox presente');
  }
  
  // Check marketing_consent field
  const marketingField = form.fields?.find(f => f.name === 'marketing_consent');
  if (!marketingField) {
    problemi.push('❌ GDPR: Campo marketing_consent MANCANTE');
  } else if (marketingField.type !== 'checkbox') {
    problemi.push(`❌ GDPR: marketing_consent type è '${marketingField.type}' invece di 'checkbox'`);
  } else {
    console.log('✅ GDPR: marketing_consent checkbox presente');
  }
  
  // Check servizi_interesse field
  const serviziField = form.fields?.find(f => f.name === 'servizi_interesse' || f.name.includes('servizi'));
  if (!serviziField) {
    problemi.push('⚠️  SERVIZI: Campo servizi_interesse non trovato');
  } else if (serviziField.type !== 'select') {
    problemi.push(`❌ SERVIZI: ${serviziField.name} type è '${serviziField.type}' invece di 'select'`);
  } else if (!serviziField.options || serviziField.options.length === 0) {
    problemi.push(`❌ SERVIZI: ${serviziField.name} è select ma senza options`);
  } else {
    console.log(`✅ SERVIZI: ${serviziField.name} select con ${serviziField.options.length} options`);
  }
  
  if (problemi.length > 0) {
    console.log('');
    problemi.forEach(p => console.log(p));
    process.exit(1);
  } else {
    console.log('\n✅ TUTTI I CONTROLLI PASSATI!');
  }
})();
