#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

async function testRLSPolicies() {
    console.log('🔍 [RLS DIAGNOSIS] Testing RLS policies on forms table...\n');

    // Create two clients: service role (bypasses RLS) and anon (subject to RLS)
    const adminClient = createClient(
        process.env.VITE_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const frontendClient = createClient(
        process.env.VITE_SUPABASE_URL,
        process.env.VITE_SUPABASE_ANON_KEY
    );

    const testId = 'c17a651f-55a3-4432-8432-9353b2a75686';

    console.log('🧪 [TEST 1] Testing frontend client (anon key) update...');
    const frontendTestStyling = {
        text_color: "#FRONTEND",
        primary_color: "#FRONTEND",
        background_color: "#FRONTEND",
        frontend_test: Date.now()
    };

    const { data: frontendResult, error: frontendError } = await frontendClient
        .from('forms')
        .update({ styling: frontendTestStyling })
        .eq('id', testId)
        .select('styling');

    if (frontendError) {
        console.log('❌ [FRONTEND] Update failed:', frontendError.message);
        console.log('🔍 [ANALYSIS] Error details:', JSON.stringify(frontendError, null, 2));
    } else {
        console.log('✅ [FRONTEND] Update successful!');
        console.log('📊 [RESULT]:', JSON.stringify(frontendResult[0]?.styling, null, 2));
    }

    console.log('\n🧪 [TEST 2] Testing admin client (service role) update...');
    const adminTestStyling = {
        text_color: "#ADMIN",
        primary_color: "#ADMIN",
        background_color: "#ADMIN",
        admin_test: Date.now()
    };

    const { data: adminResult, error: adminError } = await adminClient
        .from('forms')
        .update({ styling: adminTestStyling })
        .eq('id', testId)
        .select('styling');

    if (adminError) {
        console.log('❌ [ADMIN] Update failed:', adminError.message);
    } else {
        console.log('✅ [ADMIN] Update successful!');
        console.log('📊 [RESULT]:', JSON.stringify(adminResult[0]?.styling, null, 2));
    }

    console.log('\n🔍 [TEST 3] Testing forms SELECT with anon key...');
    const { data: selectResult, error: selectError } = await frontendClient
        .from('forms')
        .select('*')
        .eq('id', testId)
        .single();

    if (selectError) {
        console.log('❌ [SELECT] Failed:', selectError.message);
    } else {
        console.log('✅ [SELECT] Successful - Form exists and is readable');
        console.log('📋 [FORM DATA] Name:', selectResult.name);
        console.log('🎨 [STYLING] Current styling:', JSON.stringify(selectResult.styling, null, 2));
    }

    console.log('\n🧪 [TEST 4] Checking table-level permissions...');

    // Check if we can even see the table
    const { data: tableCheck, error: tableError } = await frontendClient
        .from('forms')
        .select('count')
        .limit(1);

    if (tableError) {
        console.log('❌ [TABLE ACCESS] Cannot access forms table:', tableError.message);
    } else {
        console.log('✅ [TABLE ACCESS] Can access forms table');
    }

    // Final analysis
    console.log('\n================================================================================');
    console.log('RLS POLICY DIAGNOSIS COMPLETE');
    console.log('================================================================================');

    const diagnosis = {
        anon_can_read: !selectError,
        anon_can_update: !frontendError,
        service_role_works: !adminError,
        issue_identified: selectError ? 'READ_PERMISSION' : (frontendError ? 'UPDATE_PERMISSION' : 'NO_ISSUE')
    };

    console.table([diagnosis]);

    if (frontendError && !adminError) {
        console.log('\n🎯 [ROOT CAUSE] RLS UPDATE POLICY IS BLOCKING FRONTEND UPDATES');
        console.log('🔧 [SOLUTION] Need to fix RLS policies to allow styling updates');

        console.log('\n📋 [RECOMMENDED ACTIONS]:');
        console.log('1. Check forms table RLS policies');
        console.log('2. Ensure authenticated users can UPDATE their own forms');
        console.log('3. Verify styling column is not restricted');
    }
}

testRLSPolicies().catch(console.error);