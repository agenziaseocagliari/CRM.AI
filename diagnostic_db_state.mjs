#!/usr/bin/env node

/**
 * 🔍 DATABASE STATE DIAGNOSTIC - Engineering Fellow Edition
 * 
 * Verifica completa stato database:
 * 1. Colonne forms table (styling, privacy_policy_url)
 * 2. Policies forms table
 * 3. Migration history
 * 4. Test accesso anon
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !ANON_KEY) {
  console.error('❌ Missing env vars: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
  console.error('SUPABASE_URL:', SUPABASE_URL ? '✅' : '❌');
  console.error('ANON_KEY:', ANON_KEY ? '✅' : '❌');
  process.exit(1);
}

// Use ANON_KEY (sufficiente per read operations)
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function checkColumns() {
  console.log('\n📋 1️⃣ VERIFICA COLONNE FORMS TABLE');
  console.log('─'.repeat(80));
  
  const { data, error } = await supabase
    .from('forms')
    .select('id, name, styling, privacy_policy_url')
    .limit(1);
  
  if (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
  
  console.log('✅ Colonne accessibili:');
  if (data && data.length > 0) {
    console.log('   - id: ✅');
    console.log('   - name: ✅');
    console.log('   - styling:', data[0].styling ? '✅ (exists)' : '❌ (null)');
    console.log('   - privacy_policy_url:', data[0].privacy_policy_url ? '✅ (exists)' : 'ℹ️  (null - normale se mai impostato)');
  } else {
    console.log('ℹ️  Nessun form nel database (normale se appena creato)');
  }
  
  return true;
}

async function checkPolicies() {
  console.log('\n🔒 2️⃣ VERIFICA RLS POLICIES');
  console.log('─'.repeat(80));
  
  // Non possiamo query pg_policies direttamente da client
  // Usiamo test indiretto: prova SELECT con anon key
  
  const anonClient = createClient(
    SUPABASE_URL, 
    process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );
  
  const { data: anonData, error: anonError } = await anonClient
    .from('forms')
    .select('id, name')
    .limit(1);
  
  if (anonError) {
    if (anonError.code === 'PGRST301' || anonError.message.includes('RLS')) {
      console.log('❌ POLICY "Public forms can be viewed by anyone" MANCANTE');
      console.log('   Errore RLS:', anonError.message);
      return false;
    }
    console.log('⚠️  Errore query anon:', anonError.message);
    return false;
  }
  
  console.log('✅ Policy pubblica FUNZIONANTE');
  console.log(`   Anon client può leggere ${anonData?.length || 0} forms`);
  return true;
}

async function checkMigrations() {
  console.log('\n📝 3️⃣ MIGRATION HISTORY');
  console.log('─'.repeat(80));
  
  const { data, error } = await supabase
    .from('schema_migrations')
    .select('version, name')
    .order('version', { ascending: false })
    .limit(10);
  
  if (error) {
    console.log('⚠️  Cannot access schema_migrations:', error.message);
    return;
  }
  
  console.log('📊 Ultime 10 migrations applicate:');
  data.forEach((m, idx) => {
    const isOurs = m.version === '20251010' || m.version === '20251010150000';
    const marker = isOurs ? '🎯' : '  ';
    console.log(`${marker} ${idx + 1}. ${m.version} - ${m.name || 'unnamed'}`);
  });
  
  const has20251010 = data.some(m => m.version === '20251010');
  const has20251010150000 = data.some(m => m.version === '20251010150000');
  
  console.log('\n🔍 Status nostre migrations:');
  console.log(`   20251010 (add_form_styling): ${has20251010 ? '✅ APPLICATA' : '❌ MANCANTE'}`);
  console.log(`   20251010150000 (fix_public_form_access): ${has20251010150000 ? '✅ APPLICATA' : '❌ MANCANTE'}`);
}

async function diagnostic() {
  console.log('🔬 DATABASE STATE DIAGNOSTIC');
  console.log('='.repeat(80));
  console.log(`📍 Project: ${SUPABASE_URL}`);
  console.log(`🕒 Timestamp: ${new Date().toISOString()}`);
  
  const columnsOk = await checkColumns();
  const policiesOk = await checkPolicies();
  await checkMigrations();
  
  console.log('\n' + '='.repeat(80));
  console.log('📊 SUMMARY');
  console.log('='.repeat(80));
  console.log(`Columns (styling, privacy_policy_url): ${columnsOk ? '✅ OK' : '❌ FAIL'}`);
  console.log(`Public access policy:                  ${policiesOk ? '✅ OK' : '❌ FAIL'}`);
  
  if (!policiesOk) {
    console.log('\n🔧 AZIONE RICHIESTA:');
    console.log('Policy "Public forms can be viewed by anyone" NON trovata.');
    console.log('\n📝 Esegui questo SQL nel Dashboard:');
    console.log('─'.repeat(80));
    console.log(`
DROP POLICY IF EXISTS "Public forms can be viewed by anyone" ON public.forms;

CREATE POLICY "Public forms can be viewed by anyone" ON public.forms
    FOR SELECT
    USING (true);

COMMENT ON POLICY "Public forms can be viewed by anyone" ON public.forms 
IS 'Allows anonymous users to view forms via public sharing links';
    `.trim());
    console.log('─'.repeat(80));
    console.log('\n🔗 Link: https://supabase.com/dashboard/project/qjtaqrlpronohgpfdxsi/sql/new');
  } else {
    console.log('\n✅ DATABASE STATO CORRETTO - PRONTO PER TESTING');
    console.log('\n📋 Test checklist:');
    console.log('  1. Crea form con questionario AI');
    console.log('  2. Seleziona colori custom (es. #ef4444)');
    console.log('  3. Aggiungi privacy URL');
    console.log('  4. Salva e copia link pubblico');
    console.log('  5. Apri in incognito → verifica rendering');
  }
}

diagnostic().catch(console.error);
