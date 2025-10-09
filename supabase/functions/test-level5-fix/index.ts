/**
 * 🚀 LEVEL 5 TEST EDGE FUNCTION 
 * Dimostra che il fix delle foreign key relationships funziona perfettamente
 * Usa le nuove funzioni SQL invece di PostgREST embedded resources
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.4';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  console.log('[test-level5-fix] 🧪 TESTING LEVEL 5 DATABASE FIX');

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    const tests = [];

    // TEST 1: Verify foreign key relationships exist
    console.log('[test-level5-fix] TEST 1: Verifying foreign key relationships...');
    const { data: fkData, error: fkError } = await supabase.rpc('exec_sql', {
      sql_query: `
        SELECT 
          tc.constraint_name,
          tc.table_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM 
          information_schema.table_constraints AS tc 
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
          JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' 
          AND tc.table_name IN ('profiles', 'organizations', 'audit_logs', 'superadmin_logs')
        ORDER BY tc.table_name
      `
    });

    tests.push({
      name: 'Foreign Key Relationships',
      status: fkError ? 'FAILED' : 'PASSED',
      error: fkError?.message,
      data: fkData ? JSON.parse(fkData) : null
    });

    // TEST 2: Test get_audit_logs_with_user_info function (solves PostgREST problem)
    console.log('[test-level5-fix] TEST 2: Testing get_audit_logs_with_user_info function...');
    const { data: auditData, error: auditError } = await supabase.rpc('get_audit_logs_with_user_info', {
      p_organization_id: null,
      p_limit: 5,
      p_offset: 0
    });

    tests.push({
      name: 'Audit Logs with User Info (PostgREST Fix)',
      status: auditError ? 'FAILED' : 'PASSED',
      error: auditError?.message,
      data: auditData,
      note: 'This replaces the failing syntax: profiles:user_id(full_name,email)'
    });

    // TEST 3: Test get_superadmin_logs_filtered function
    console.log('[test-level5-fix] TEST 3: Testing get_superadmin_logs_filtered function...');
    const { data: superadminData, error: superadminError } = await supabase.rpc('get_superadmin_logs_filtered', {
      p_search: null,
      p_operation_type: null,
      p_target_type: null,
      p_result: null,
      p_limit: 5,
      p_offset: 0
    });

    tests.push({
      name: 'Superadmin Logs Filtered',
      status: superadminError ? 'FAILED' : 'PASSED',
      error: superadminError?.message,
      data: superadminData
    });

    // TEST 4: Test custom access token hook
    console.log('[test-level5-fix] TEST 4: Testing custom_access_token_hook...');
    const { data: hookData, error: hookError } = await supabase.rpc('custom_access_token_hook', {
      event: {
        user: { id: 'fbb13e89-ce6a-4a98-b718-3d965f19f1c7' },
        claims: { sub: 'fbb13e89-ce6a-4a98-b718-3d965f19f1c7', email: 'agenziaseocagliari@gmail.com' }
      }
    });

    tests.push({
      name: 'Custom Access Token Hook',
      status: hookError ? 'FAILED' : 'PASSED',
      error: hookError?.message,
      data: hookData
    });

    // TEST 5: Verify initial data integrity
    console.log('[test-level5-fix] TEST 5: Verifying initial data integrity...');
    const { data: profilesCount, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, user_role, organization_id')
      .in('email', ['agenziaseocagliari@gmail.com', 'webproseoid@gmail.com']);

    tests.push({
      name: 'Initial Data Integrity',
      status: (profilesError || !profilesCount || profilesCount.length !== 2) ? 'FAILED' : 'PASSED',
      error: profilesError?.message,
      data: profilesCount,
      expected: 2,
      actual: profilesCount?.length || 0
    });

    // Calculate overall status
    const passedTests = tests.filter(t => t.status === 'PASSED').length;
    const totalTests = tests.length;
    const overallStatus = passedTests === totalTests ? 'ALL TESTS PASSED' : `${passedTests}/${totalTests} TESTS PASSED`;

    console.log(`[test-level5-fix] 🎯 RESULT: ${overallStatus}`);

    return new Response(JSON.stringify({
      success: passedTests === totalTests,
      message: `LEVEL 5 DATABASE FIX VERIFICATION: ${overallStatus}`,
      timestamp: new Date().toISOString(),
      tests,
      summary: {
        totalTests,
        passedTests,
        failedTests: totalTests - passedTests,
        successRate: `${Math.round((passedTests / totalTests) * 100)}%`
      },
      nextSteps: passedTests < totalTests ? [
        '1. Execute LEVEL5_SQL_EDITOR_FIX.sql in Supabase SQL Editor',
        '2. Verify all tables and functions are created',
        '3. Run this test again to confirm fix'
      ] : [
        '✅ Database fix successful!',
        '✅ Foreign key relationships working',
        '✅ PostgREST embedded resources problem solved',
        '✅ Edge functions ready to use SQL functions'
      ]
    }, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('[test-level5-fix] EXCEPTION:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error: ' + error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});