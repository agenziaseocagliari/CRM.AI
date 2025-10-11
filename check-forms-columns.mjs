#!/usr/bin/env node

// Verifica colonne forms table nel database remote Supabase

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qjtaqrlpronohgpfdxsi.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzQzODY2NCwiZXhwIjoyMDczMDE0NjY0fQ.Z5i-lxQGKtKtVbATTd_9uB_Q3HhF5in-kvLW8Tym4z0';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkColumns() {
  console.log('🔍 Verifico colonne tabella forms...\n');

  // Query per ottenere informazioni colonne
  const { data, error } = await supabase
    .rpc('exec_sql', {
      sql: `
        SELECT 
          column_name, 
          data_type, 
          is_nullable,
          column_default
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'forms' 
          AND column_name IN ('styling', 'privacy_policy_url')
        ORDER BY column_name;
      `
    });

  if (error) {
    console.error('❌ Errore query:', error.message);
    
    // Fallback: prova con query diretta forms
    console.log('\n🔄 Tentativo alternativo: query diretta forms...\n');
    
    const { data: formData, error: formError } = await supabase
      .from('forms')
      .select('styling, privacy_policy_url')
      .limit(1);

    if (formError) {
      console.error('❌ Errore fallback:', formError.message);
      process.exit(1);
    }

    if (formData && formData.length > 0) {
      console.log('✅ COLONNE ESISTONO! Esempio record:');
      console.log(JSON.stringify(formData[0], null, 2));
    } else {
      console.log('⚠️ Nessun record forms trovato');
    }
    
    return;
  }

  if (data && data.length > 0) {
    console.log('✅ COLONNE TROVATE NEL DATABASE REMOTE:\n');
    data.forEach(col => {
      console.log(`📌 ${col.column_name}`);
      console.log(`   Type: ${col.data_type}`);
      console.log(`   Nullable: ${col.is_nullable}`);
      console.log(`   Default: ${col.column_default || 'NULL'}`);
      console.log('');
    });
  } else {
    console.log('❌ COLONNE NON TROVATE');
    console.log('   La migration 20251010_add_form_styling.sql NON è stata applicata al remote!');
  }
}

checkColumns().catch(console.error);
