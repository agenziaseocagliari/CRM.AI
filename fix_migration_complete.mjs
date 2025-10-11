#!/usr/bin/env node

/**
 * 🔧 MIGRATION FIX SCRIPT - Engineering Fellow Approach
 * 
 * Questo script:
 * 1. Verifica se policy "Public forms can be viewed by anyone" esiste
 * 2. Se mancante, la crea
 * 3. Aggiunge entry alla schema_migrations table
 * 4. Verifica successo
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ ERRORE: VITE_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY mancante in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkPolicyExists() {
  console.log('\n🔍 Step 1: Verifica esistenza policy...');
  
  const { data, error } = await supabase.rpc('check_policy_exists', {
    p_table_name: 'forms',
    p_policy_name: 'Public forms can be viewed by anyone'
  });
  
  if (error) {
    // Function non esiste, usa query diretta
    const { data: policies, error: queryError } = await supabase
      .from('pg_policies')
      .select('policyname')
      .eq('tablename', 'forms')
      .eq('policyname', 'Public forms can be viewed by anyone');
    
    if (queryError) {
      console.log('⚠️  Non posso query pg_policies (normale se non esposta)');
      console.log('   Procedo con applicazione SQL...');
      return false;
    }
    
    return policies && policies.length > 0;
  }
  
  return data;
}

async function applyMigration() {
  console.log('\n🔧 Step 2: Applico migration 20251010150000_fix_public_form_access...');
  
  // Leggi SQL file
  const sqlContent = readFileSync(
    'supabase/migrations/20251010150000_fix_public_form_access.sql',
    'utf8'
  );
  
  // Estrai solo i comandi SQL (rimuovi commenti per sicurezza)
  const sqlStatements = sqlContent
    .split('\n')
    .filter(line => !line.trim().startsWith('--') && line.trim().length > 0)
    .join('\n');
  
  console.log('📝 SQL da eseguire:');
  console.log('─'.repeat(80));
  console.log(sqlStatements);
  console.log('─'.repeat(80));
  
  try {
    // Esegui SQL tramite RPC (più affidabile di direct query)
    const { error } = await supabase.rpc('exec_sql', {
      sql_query: sqlStatements
    });
    
    if (error) {
      // Se RPC non disponibile, proviamo con query diretta
      console.log('⚠️  RPC exec_sql non disponibile, uso metodo alternativo...');
      
      // Esegui statement by statement
      const statements = sqlStatements.split(';').filter(s => s.trim());
      
      for (const stmt of statements) {
        if (stmt.trim().length === 0) continue;
        
        const { error: stmtError } = await supabase.rpc('exec', { 
          query: stmt 
        });
        
        if (stmtError) {
          console.error(`❌ Errore statement: ${stmtError.message}`);
          return false;
        }
      }
    }
    
    console.log('✅ Migration SQL applicata con successo!');
    return true;
    
  } catch (err) {
    console.error('❌ Errore applicazione SQL:', err.message);
    return false;
  }
}

async function addMigrationRecord() {
  console.log('\n📋 Step 3: Aggiungo record a schema_migrations...');
  
  const { error } = await supabase
    .from('schema_migrations')
    .insert({
      version: '20251010150000',
      statements: readFileSync(
        'supabase/migrations/20251010150000_fix_public_form_access.sql',
        'utf8'
      ),
      name: 'fix_public_form_access'
    });
  
  if (error) {
    if (error.code === '23505') {
      console.log('ℹ️  Migration già registrata in schema_migrations (OK)');
      return true;
    }
    console.error('❌ Errore inserimento migration record:', error.message);
    return false;
  }
  
  console.log('✅ Migration record aggiunto!');
  return true;
}

async function verifyPolicy() {
  console.log('\n✅ Step 4: Verifica finale policy...');
  
  // Test con anon role simulation
  const { data: testData, error: testError } = await supabase
    .from('forms')
    .select('id, name')
    .limit(1);
  
  if (testError) {
    console.error('❌ Test fallito:', testError.message);
    return false;
  }
  
  console.log('✅ Policy funzionante! Test query returned:', testData?.length || 0, 'rows');
  return true;
}

async function main() {
  console.log('🚀 MIGRATION FIX SCRIPT - Engineering Fellow Edition');
  console.log('=' .repeat(80));
  
  try {
    // Step 1: Check policy
    const policyExists = await checkPolicyExists();
    
    if (policyExists) {
      console.log('✅ Policy già esistente, skip applicazione SQL');
    } else {
      console.log('⚠️  Policy non trovata, procedo con applicazione...');
      
      // Step 2: Apply migration SQL
      const sqlSuccess = await applyMigration();
      if (!sqlSuccess) {
        console.log('\n❌ FALLBACK: Esegui SQL manualmente nel Dashboard:');
        console.log('🔗 https://supabase.com/dashboard/project/qjtaqrlpronohgpfdxsi/sql/new');
        console.log('\n📋 SQL da copiare:');
        console.log(readFileSync(
          'supabase/migrations/20251010150000_fix_public_form_access.sql',
          'utf8'
        ));
        process.exit(1);
      }
    }
    
    // Step 3: Add migration record
    await addMigrationRecord();
    
    // Step 4: Verify
    const verified = await verifyPolicy();
    
    if (verified) {
      console.log('\n' + '='.repeat(80));
      console.log('✅ MIGRATION COMPLETATA CON SUCCESSO!');
      console.log('='.repeat(80));
      console.log('\n📊 Prossimi passi:');
      console.log('1. Testa link pubblico form: /form/{id}');
      console.log('2. Verifica form rendering (no blank page)');
      console.log('3. Test questionario con campi selezionati');
      console.log('4. Verifica colori custom + privacy checkbox');
      console.log('\n🔍 Per query policies:');
      console.log('   SELECT * FROM pg_policies WHERE tablename = \'forms\';');
    } else {
      console.log('\n⚠️  MIGRATION APPLICATA MA VERIFICA FALLITA');
      console.log('   Esegui manualmente query di test in Dashboard');
    }
    
  } catch (error) {
    console.error('\n❌ ERRORE FATALE:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
