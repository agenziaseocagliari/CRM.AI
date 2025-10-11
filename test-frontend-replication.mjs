#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

async function testFrontendReplication() {
    console.log('🔍 [FRONTEND REPLICATION] Replicating exact frontend behavior...\n');

    const supabase = createClient(
        process.env.VITE_SUPABASE_URL,
        process.env.VITE_SUPABASE_ANON_KEY
    );

    const testFormId = 'c17a651f-55a3-4432-8432-9353b2a75686';

    // Step 1: Read current form data (like Forms.tsx does)
    console.log('📖 [STEP 1] Reading current form data...');
    const { data: currentForm, error: readError } = await supabase
        .from('forms')
        .select('*')
        .eq('id', testFormId)
        .single();

    if (readError) {
        console.log('❌ [READ ERROR]:', readError.message);
        return;
    }

    console.log('✅ [CURRENT FORM] Name:', currentForm.name);
    console.log('🎨 [CURRENT STYLING]:', JSON.stringify(currentForm.styling, null, 2));

    // Step 2: Replicate handleStyleChange behavior exactly
    console.log('\n🔄 [STEP 2] Replicating handleStyleChange behavior...');

    const newColors = {
        primaryColor: '#FF6B35',
        backgroundColor: '#FFF8F0',
        textColor: '#8B2635'
    };

    // Simulate buildStyleObject function
    function buildStyleObject(colors) {
        return {
            primary_color: colors.primaryColor,
            background_color: colors.backgroundColor,
            text_color: colors.textColor,
            font_family: 'Inter, system-ui, sans-serif',
            border_color: colors.primaryColor,
            button_style: {
                background_color: colors.primaryColor,
                text_color: '#ffffff',
                border_radius: '6px'
            },
            border_radius: '8px',
            secondary_color: '#f3f4f6',
            frontend_replication_test: Date.now()
        };
    }

    const newStyling = buildStyleObject(newColors);
    console.log('🎨 [NEW STYLING TO SAVE]:', JSON.stringify(newStyling, null, 2));

    // Step 3: Execute the exact update that Forms.tsx does
    console.log('\n📤 [STEP 3] Executing Supabase update...');

    const { data: updateResult, error: updateError } = await supabase
        .from('forms')
        .update({ styling: newStyling })
        .eq('id', testFormId)
        .select('styling'); // This is what Forms.tsx should have!

    if (updateError) {
        console.log('❌ [UPDATE ERROR]:', updateError.message);
        console.log('🔍 [ERROR DETAILS]:', JSON.stringify(updateError, null, 2));
    } else {
        console.log('✅ [UPDATE SUCCESS]!');
        console.log('📥 [RETURNED DATA]:', JSON.stringify(updateResult, null, 2));
    }

    // Step 4: Verify persistence by reading again
    console.log('\n🔍 [STEP 4] Verifying persistence...');

    const { data: verifyForm, error: verifyError } = await supabase
        .from('forms')
        .select('styling')
        .eq('id', testFormId)
        .single();

    if (verifyError) {
        console.log('❌ [VERIFY ERROR]:', verifyError.message);
    } else {
        console.log('✅ [VERIFICATION SUCCESS]');
        console.log('💾 [PERSISTED STYLING]:', JSON.stringify(verifyForm.styling, null, 2));

        // Compare what we sent vs what was saved
        const comparison = {
            sent_primary: newStyling.primary_color,
            saved_primary: verifyForm.styling?.primary_color,
            sent_background: newStyling.background_color,
            saved_background: verifyForm.styling?.background_color,
            sent_test: newStyling.frontend_replication_test,
            saved_test: verifyForm.styling?.frontend_replication_test,
            exact_match: JSON.stringify(newStyling) === JSON.stringify(verifyForm.styling)
        };

        console.log('\n📊 [PERSISTENCE ANALYSIS]:');
        console.table([comparison]);

        if (comparison.exact_match) {
            console.log('🎉 [SUCCESS] Frontend update working perfectly!');
            console.log('🔍 [CONCLUSION] The issue is not in the update mechanism');
        } else {
            console.log('❌ [MISMATCH] Data is being corrupted during save');
            console.log('🔍 [ANALYSIS] Need to investigate data transformation');
        }
    }

    // Step 5: Test localStorage simulation
    console.log('\n💾 [STEP 5] Testing localStorage integration...');

    // Simulate what PublicForm.tsx does
    const localStorageKey = `formStyling_${testFormId}`;
    console.log(`📝 [LOCALSTORAGE] Would save to key: ${localStorageKey}`);
    console.log('🎨 [LOCALSTORAGE] Would save data:', JSON.stringify(newStyling, null, 2));

    console.log('\n================================================================================');
    console.log('FRONTEND REPLICATION TEST COMPLETE');
    console.log('================================================================================');
}

testFrontendReplication().catch(console.error);