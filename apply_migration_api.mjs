/**
 * Script per applicare migration SQL via Supabase REST API
 * Workaround per problemi CLI authentication
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function applyMigrationViaAPI() {
  console.log('🔧 Applying migration via Supabase API (workaround)');
  console.log('📄 File: 20251010150000_fix_public_form_access.sql\n');
  
  try {
    // Leggi SQL file
    const migrationPath = path.join(__dirname, 'supabase/migrations/20251010150000_fix_public_form_access.sql');
    const sql = fs.readFileSync(migrationPath, 'utf-8');
    
    console.log('📝 SQL da eseguire:');
    console.log('─'.repeat(80));
    console.log(sql);
    console.log('─'.repeat(80));
    console.log('\n⚠️  NOTA: Supabase client non permette esecuzione diretta DDL.\n');
    console.log('✅ SOLUZIONE: Esegui MANUALMENTE nel Supabase SQL Editor:\n');
    console.log('🔗 https://supabase.com/dashboard/project/qjtaqrlpronohgpfdxsi/sql/new\n');
    console.log('📋 Copia il SQL sopra e clicca RUN\n');
    
    // Verifica connessione
    const { data, error } = await supabase.from('forms').select('id').limit(1);
    
    if (error) {
      console.error('❌ Errore connessione Supabase:', error.message);
      process.exit(1);
    }
    
    console.log('✅ Connessione Supabase OK');
    console.log('✅ Puoi procedere con esecuzione manuale SQL\n');
    
    // Verifica se policy esiste già
    console.log('🔍 Verifica policy esistenti...');
    const { data: policies } = await supabase.rpc('exec_sql', {
      sql: "SELECT policyname FROM pg_policies WHERE tablename = 'forms'"
    }).catch(() => ({ data: null, error: { message: 'RPC non disponibile' }}));
    
    if (policies) {
      console.log('📊 Policies attuali:', policies);
    } else {
      console.log('⚠️  Impossibile verificare policies via RPC');
    }
    
  } catch (err) {
    console.error('❌ Errore:', err);
    process.exit(1);
  }
}

applyMigrationViaAPI();
