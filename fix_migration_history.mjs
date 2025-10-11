#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = `https://qjtaqrlpronohgpfdxsi.supabase.co`;
const SERVICE_ROLE_KEY = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzQzODY2NCwiZXhwIjoyMDczMDE0NjY0fQ.Z5i-lxQGKtKtVbATTd_9uB_Q3HhF5in-kvLW8Tym4z0`;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

console.log('\n🔧 FIXING MIGRATION HISTORY...\n');

// Verifica stato attuale
console.log('📊 Current migration status:');
console.log('   Remote has: 20251010 (form styling)');
console.log('   Local has: 20251010_add_form_styling.sql + 20251010150000_fix_public_form_access.sql');
console.log('   Problem: Ghost entry in local tracking\n');

// Soluzione: usa supabase db pull per force sync
console.log('✅ SOLUTION: Esegui questo comando nel terminal:');
console.log('\n   supabase db pull --schema public\n');
console.log('Questo aggiornerà i file locali con lo schema remoto reale.\n');

console.log('📝 Alternative MANUAL FIX:');
console.log('   Se db pull fallisce, esegui in Supabase SQL Editor:');
console.log('   ```sql');
console.log('   SELECT version FROM supabase_migrations.schema_migrations');
console.log('   WHERE version LIKE \'20251010%\'');
console.log('   ORDER BY version;');
console.log('   ```\n');

console.log('🎯 Expected result:');
console.log('   - 20251010 (form styling)');
console.log('   - 20251010150000 (public access policy)');
console.log('   Both should be marked as applied.\n');
