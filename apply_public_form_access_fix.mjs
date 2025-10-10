/**
 * Script per applicare migration SQL direttamente a Supabase
 * Fix: Public form access policy
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurazione Supabase (usa variabili ambiente o .env)
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://qjtaqrlpronohgpfdxsi.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY non trovata nelle variabili ambiente');
  console.log('💡 Aggiungi al .env: SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function applyMigration() {
  console.log('🚀 Applicazione migration: fix_public_form_access');
  
  try {
    // Leggi file SQL
    const migrationPath = path.join(__dirname, 'supabase/migrations/20251010120000_fix_public_form_access.sql');
    const sql = fs.readFileSync(migrationPath, 'utf-8');
    
    console.log('📄 SQL Migration:');
    console.log(sql);
    console.log('\n🔄 Esecuzione...\n');
    
    // Esegui SQL tramite Supabase
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      // Fallback: esegui query diretta (richiede policy DROP/CREATE separate)
      console.log('⚠️ RPC exec_sql non disponibile, provo query diretta...\n');
      
      const policySQL = `
        CREATE POLICY IF NOT EXISTS "Public forms can be viewed by anyone" ON public.forms
          FOR SELECT
          USING (true);
      `;
      
      const { error: policyError } = await supabase.from('forms').select('id').limit(0); // Test connection
      
      if (policyError) {
        throw new Error(`Errore connessione Supabase: ${policyError.message}`);
      }
      
      console.log('✅ Connessione Supabase OK');
      console.log('📝 Per applicare manualmente, esegui nel Supabase SQL Editor:');
      console.log('\n' + policySQL + '\n');
      console.log('🔗 Link: https://supabase.com/dashboard/project/qjtaqrlpronohgpfdxsi/sql/new');
      
    } else {
      console.log('✅ Migration applicata con successo!');
      console.log('📊 Risultato:', data);
    }
    
  } catch (err) {
    console.error('❌ Errore durante migration:', err);
    process.exit(1);
  }
}

applyMigration();
