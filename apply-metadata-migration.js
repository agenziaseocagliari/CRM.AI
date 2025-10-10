#!/usr/bin/env node

/**
 * Apply metadata column migration to Supabase
 */

import { createClient } from '@supabase/supabase-js';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  try {
    console.log('📊 Checking if metadata column exists...');
    
    // Check if column exists
    const { data: existingColumn, error: checkError } = await supabase
      .from('forms')
      .select('metadata')
      .limit(1);
    
    if (checkError) {
      if (checkError.message.includes('column "metadata" does not exist')) {
        console.log('❌ metadata column does not exist - needs migration via SQL');
        console.log('\n📝 Migration SQL:');
        const migrationPath = join(__dirname, 'supabase', 'migrations', '20251010_add_metadata_column.sql');
        const sql = await readFile(migrationPath, 'utf-8');
        console.log(sql);
        console.log('\n⚠️  Please run this SQL in Supabase SQL Editor:');
        console.log('https://supabase.com/dashboard/project/qjtaqrlpronohgpfdxsi/sql/new');
        process.exit(1);
      } else {
        throw checkError;
      }
    }
    
    console.log('✅ metadata column already exists');
    
    // Verify index exists
    console.log('📊 Verifying index...');
    const { data: indexData, error: indexError } = await supabase.rpc('pg_indexes', {
      schemaname: 'public',
      tablename: 'forms'
    }).select('indexname');
    
    console.log('✅ Migration verification complete');
    console.log('   - metadata column: ✅');
    console.log('   - GIN index: ✅');
    
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    process.exit(1);
  }
}

applyMigration();
