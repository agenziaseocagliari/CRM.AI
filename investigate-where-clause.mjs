#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

async function investigateWhereClause() {
    console.log('🔍 [WHERE CLAUSE INVESTIGATION] Deep diving into record matching...\n');

    const supabase = createClient(
        process.env.VITE_SUPABASE_URL,
        process.env.VITE_SUPABASE_ANON_KEY
    );

    const testFormId = 'c17a651f-55a3-4432-8432-9353b2a75686';

    // Step 1: Verify the record exists and check its exact ID
    console.log('🔍 [STEP 1] Verifying record existence and ID format...');

    const { data: allForms, error: allError } = await supabase
        .from('forms')
        .select('id, name, styling')
        .limit(10);

    if (allError) {
        console.log('❌ [ALL FORMS ERROR]:', allError.message);
        return;
    }

    console.log('📋 [ALL FORMS] Available forms:');
    allForms.forEach((form, index) => {
        console.log(`${index + 1}. ID: ${form.id} | Name: ${form.name}`);
        console.log(`   Type: ${typeof form.id} | Length: ${form.id.length}`);
    });

    // Step 2: Test exact ID matching
    console.log(`\n🎯 [STEP 2] Testing exact ID matching for: ${testFormId}`);
    console.log(`   Target ID type: ${typeof testFormId} | Length: ${testFormId.length}`);

    const { data: exactMatch, error: exactError } = await supabase
        .from('forms')
        .select('id, name, styling')
        .eq('id', testFormId);

    if (exactError) {
        console.log('❌ [EXACT MATCH ERROR]:', exactError.message);
    } else {
        console.log('✅ [EXACT MATCH RESULT]:');
        console.log(`   Found ${exactMatch.length} records`);
        if (exactMatch.length > 0) {
            console.log(`   ID: ${exactMatch[0].id}`);
            console.log(`   Name: ${exactMatch[0].name}`);
            console.log(`   Styling keys: ${Object.keys(exactMatch[0].styling || {}).join(', ')}`);
        }
    }

    // Step 3: Test update with debugging
    console.log('\n🔧 [STEP 3] Testing update with detailed debugging...');

    const testStyling = {
        primary_color: '#TEST123',
        background_color: '#TEST456',
        debug_timestamp: Date.now(),
        debug_test: 'WHERE_CLAUSE_TEST'
    };

    console.log('📤 [SENDING UPDATE]:');
    console.log(`   Table: forms`);
    console.log(`   ID: ${testFormId} (${typeof testFormId})`);
    console.log(`   Data:`, JSON.stringify(testStyling, null, 2));

    const { data: updateData, error: updateError, count } = await supabase
        .from('forms')
        .update({ styling: testStyling })
        .eq('id', testFormId)
        .select('id, styling');

    console.log('\n📥 [UPDATE RESPONSE]:');
    console.log(`   Error: ${updateError ? updateError.message : 'none'}`);
    console.log(`   Data: ${JSON.stringify(updateData, null, 2)}`);
    console.log(`   Count: ${count}`);
    console.log(`   Records affected: ${updateData ? updateData.length : 0}`);

    // Step 4: Manual verification
    console.log('\n🔍 [STEP 4] Manual verification after update...');

    const { data: verificationData, error: verificationError } = await supabase
        .from('forms')
        .select('id, styling')
        .eq('id', testFormId)
        .single();

    if (verificationError) {
        console.log('❌ [VERIFICATION ERROR]:', verificationError.message);
    } else {
        console.log('✅ [VERIFICATION SUCCESS]:');
        console.log('💾 [CURRENT STYLING]:', JSON.stringify(verificationData.styling, null, 2));

        const hasOurUpdate = verificationData.styling?.debug_test === 'WHERE_CLAUSE_TEST';
        console.log(`🎯 [UPDATE APPLIED]: ${hasOurUpdate ? 'YES' : 'NO'}`);

        if (!hasOurUpdate) {
            console.log('❌ [CONCLUSION] WHERE clause is not matching the intended record!');
        } else {
            console.log('✅ [CONCLUSION] WHERE clause works - issue is elsewhere!');
        }
    }

    // Step 5: Check for potential UUID issues
    console.log('\n🔍 [STEP 5] Testing alternative ID formats...');

    // Test with different ID formats that might be in the database
    const idVariations = [
        testFormId,
        testFormId.toLowerCase(),
        testFormId.toUpperCase(),
        testFormId.replace(/-/g, ''),
    ];

    for (const idVar of idVariations) {
        const { data: varData, error: varError } = await supabase
            .from('forms')
            .select('id')
            .eq('id', idVar)
            .limit(1);

        console.log(`   ID: ${idVar} → Found: ${varData ? varData.length : 0} records`);
    }

    console.log('\n================================================================================');
    console.log('WHERE CLAUSE INVESTIGATION COMPLETE');
    console.log('================================================================================');
}

investigateWhereClause().catch(console.error);