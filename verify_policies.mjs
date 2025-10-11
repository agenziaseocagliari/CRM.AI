#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = `https://qjtaqrlpronohgpfdxsi.supabase.co`;
const SERVICE_ROLE_KEY = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzQzODY2NCwiZXhwIjoyMDczMDE0NjY0fQ.Z5i-lxQGKtKtVbATTd_9uB_Q3HhF5in-kvLW8Tym4z0`;

// ✅ NUOVO: Usa MCP Supabase Server per query SQL dirette
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
  db: {
    schema: 'public'
  }
});

async function verifyPolicies() {
  console.log('\n🔍 VERIFYING FORMS TABLE POLICIES VIA SQL...\n');
  
  // ✅ METODO 1: Query SQL diretta tramite supabase.rpc
  const sqlQuery = `
    SELECT 
      schemaname,
      tablename,
      policyname,
      permissive,
      cmd,
      qual::text as condition
    FROM pg_policies 
    WHERE tablename = 'forms'
    ORDER BY policyname;
  `;
  
  console.log('📝 Executing SQL query via Supabase RPC...\n');
  
  const { data, error } = await supabase.rpc('exec_sql', {
    query: sqlQuery
  });
  
  if (error) {
    console.log('⚠️ RPC method failed, trying direct REST API...\n');
    console.error('Error details:', error);
    
    // ✅ METODO 2: Query REST API con postgrest
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({ query: sqlQuery })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('✅ REST API query successful!\n');
      console.table(result);
      
      // Verifica policy pubblica
      const publicPolicy = result?.find(p => p.policyname?.includes('Public'));
      
      if (publicPolicy) {
        console.log('\n✅ PUBLIC POLICY FOUND:');
        console.log(`   Name: ${publicPolicy.policyname}`);
        console.log(`   Command: ${publicPolicy.cmd}`);
        console.log(`   Condition: ${publicPolicy.condition}`);
      } else {
        console.log('\n❌ PUBLIC POLICY NOT FOUND!');
        console.log(`   Total policies found: ${result?.length || 0}`);
      }
      
      return;
    } catch (restError) {
      console.error('❌ REST API method also failed:', restError);
    }
    
    return;
  }
  
  // Success con RPC
  console.log('✅ RPC query successful!\n');
  
  if (Array.isArray(data)) {
    console.table(data);
    
    // Verifica policy pubblica
    const publicPolicy = data.find(p => p.policyname?.includes('Public'));
    
    if (publicPolicy) {
      console.log('\n✅ PUBLIC POLICY FOUND:');
      console.log(`   Name: ${publicPolicy.policyname}`);
      console.log(`   Command: ${publicPolicy.cmd}`);
      console.log(`   Condition: ${publicPolicy.condition}`);
    } else {
      console.log('\n❌ PUBLIC POLICY NOT FOUND!');
      console.log(`   Total policies found: ${data.length}`);
    }
  } else {
    console.log('Data:', data);
  }
}

async function testAnonymousAccess() {
  console.log('\n\n🧪 TESTING ANONYMOUS ACCESS TO FORMS...\n');
  
  // Client con ANON key (simula accesso pubblico)
  const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
  const anonClient = createClient(SUPABASE_URL, ANON_KEY);
  
  const { data, error } = await anonClient
    .from('forms')
    .select('id, name, title')
    .limit(1);
  
  if (error) {
    console.log('❌ ANONYMOUS ACCESS FAILED:');
    console.log(`   Error: ${error.message}`);
    console.log(`   Code: ${error.code}`);
    console.log('\n   → Policy NOT working correctly\n');
    return false;
  }
  
  if (data && data.length > 0) {
    console.log('✅ ANONYMOUS ACCESS SUCCESS:');
    console.log(`   Retrieved ${data.length} form(s)`);
    console.log(`   Form ID: ${data[0].id}`);
    console.log(`   Form Name: ${data[0].name}`);
    console.log('\n   → Policy is ACTIVE and working!\n');
    return true;
  } else {
    console.log('⚠️ No forms found in database (expected if empty)');
    return true;
  }
}

// Run verification
(async () => {
  try {
    await verifyPolicies();
    await testAnonymousAccess();
  } catch (err) {
    console.error('\n❌ FATAL ERROR:', err);
  }
})();
