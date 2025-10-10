#!/usr/bin/env node

/**
 * Check Forms RLS Policies
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://qjtaqrlpronohgpfdxsi.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('❌ Missing VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRLS() {
  console.log('🔍 Checking Forms RLS Policies...\n');
  
  // Get current session
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    console.error('❌ No active session');
    process.exit(1);
  }
  
  console.log('✅ Session active');
  console.log('User ID:', session.user.id);
  console.log('User Email:', session.user.email);
  console.log('User Role:', session.user.role);
  
  // Try to get user's organization
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', session.user.id)
    .single();
  
  if (profileError) {
    console.error('\n❌ Profile Error:', profileError);
  } else {
    console.log('Organization ID:', profile?.organization_id);
  }
  
  // Try to select from forms
  console.log('\n🔍 Testing SELECT from forms...');
  const { data: forms, error: selectError } = await supabase
    .from('forms')
    .select('*')
    .limit(5);
  
  if (selectError) {
    console.error('❌ SELECT Error:', selectError);
  } else {
    console.log(`✅ SELECT works - ${forms?.length || 0} forms found`);
  }
  
  // Try to insert a test form
  console.log('\n🔍 Testing INSERT into forms...');
  const testForm = {
    name: 'TEST_FORM_DELETE_ME',
    title: 'Test Form',
    fields: [{ name: 'test', label: 'Test', type: 'text', required: false }],
    organization_id: profile?.organization_id
  };
  
  const { data: insertData, error: insertError } = await supabase
    .from('forms')
    .insert(testForm)
    .select()
    .single();
  
  if (insertError) {
    console.error('❌ INSERT Error:', insertError);
    console.error('\nError Details:');
    console.error('Code:', insertError.code);
    console.error('Message:', insertError.message);
    console.error('Details:', insertError.details);
    console.error('Hint:', insertError.hint);
  } else {
    console.log('✅ INSERT works - Form created:', insertData.id);
    
    // Clean up test form
    await supabase.from('forms').delete().eq('id', insertData.id);
    console.log('✅ Test form deleted');
  }
  
  console.log('\n📋 SOLUTION:');
  console.log('Run this SQL in Supabase SQL Editor:');
  console.log('https://supabase.com/dashboard/project/qjtaqrlpronohgpfdxsi/sql/new\n');
  console.log(`
-- Enable RLS
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;

-- DROP existing policies if any
DROP POLICY IF EXISTS "forms_select_policy" ON public.forms;
DROP POLICY IF EXISTS "forms_insert_policy" ON public.forms;
DROP POLICY IF EXISTS "forms_update_policy" ON public.forms;
DROP POLICY IF EXISTS "forms_delete_policy" ON public.forms;

-- SELECT: Users can view forms from their organization
CREATE POLICY "forms_select_policy" ON public.forms
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
);

-- INSERT: Users can create forms for their organization
CREATE POLICY "forms_insert_policy" ON public.forms
FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
);

-- UPDATE: Users can update forms from their organization
CREATE POLICY "forms_update_policy" ON public.forms
FOR UPDATE
USING (
  organization_id IN (
    SELECT organization_id 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
)
WITH CHECK (
  organization_id IN (
    SELECT organization_id 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
);

-- DELETE: Users can delete forms from their organization
CREATE POLICY "forms_delete_policy" ON public.forms
FOR DELETE
USING (
  organization_id IN (
    SELECT organization_id 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
);
  `);
}

checkRLS().catch(console.error);
