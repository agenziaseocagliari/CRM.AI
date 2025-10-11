#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

async function fullSystemDiagnosis() {
    console.log('🔍 [FULL SYSTEM DIAGNOSIS] Testing complete styling and marketing flow...\n');

    const supabase = createClient(
        process.env.VITE_SUPABASE_URL,
        process.env.VITE_SUPABASE_ANON_KEY
    );

    // STEP 1: Test current database state
    console.log('📋 [STEP 1] Checking current forms in database...');
    const { data: forms, error: formsError } = await supabase
        .from('forms')
        .select('id, name, styling, fields')
        .limit(5);

    if (formsError) {
        console.log('❌ [DATABASE ERROR]:', formsError.message);
        return;
    }

    console.log('✅ [FORMS FOUND]:', forms.length);
    forms.forEach((form, i) => {
        console.log(`${i + 1}. ${form.name} (${form.id})`);
        console.log(`   Styling:`, JSON.stringify(form.styling, null, 2));
        console.log(`   Fields count:`, form.fields?.length || 0);
        if (form.fields && form.fields.length > 0) {
            const marketingField = form.fields.find(f => f.name === 'marketing_consent' || f.type === 'marketing');
            console.log(`   Has marketing field:`, !!marketingField);
        }
        console.log('   ---');
    });

    // STEP 2: Test styling update
    console.log('\n🎨 [STEP 2] Testing styling update...');
    const testFormId = forms[0]?.id;
    if (!testFormId) {
        console.log('❌ No forms found to test');
        return;
    }

    const testStyling = {
        primary_color: '#FF0000',
        background_color: '#FFFF00',
        text_color: '#000000',
        font_family: 'Inter, system-ui, sans-serif',
        border_color: '#FF0000',
        button_style: {
            background_color: '#FF0000',
            text_color: '#ffffff',
            border_radius: '6px'
        },
        border_radius: '8px',
        secondary_color: '#f3f4f6',
        test_timestamp: Date.now(),
        test_name: 'FULL_SYSTEM_DIAGNOSIS'
    };

    console.log('📤 [SENDING] Styling update for form:', testFormId);
    console.log('🎨 [DATA]:', JSON.stringify(testStyling, null, 2));

    const { data: updateResult, error: updateError } = await supabase
        .from('forms')
        .update({ styling: testStyling })
        .eq('id', testFormId)
        .select('styling');

    if (updateError) {
        console.log('❌ [UPDATE ERROR]:', updateError.message);
    } else {
        console.log('✅ [UPDATE SUCCESS] Records affected:', updateResult.length);
        if (updateResult.length > 0) {
            console.log('📥 [RETURNED DATA]:', JSON.stringify(updateResult[0].styling, null, 2));

            // Check if our data persisted
            const persistedCorrectly = updateResult[0].styling?.test_name === 'FULL_SYSTEM_DIAGNOSIS';
            console.log(`🎯 [PERSISTENCE CHECK]: ${persistedCorrectly ? '✅ SUCCESS' : '❌ FAILED'}`);

            if (!persistedCorrectly) {
                console.log('❌ [CRITICAL] Styling data was not persisted correctly');
            }
        } else {
            console.log('❌ [CRITICAL] Update executed but no data returned');
        }
    }

    // STEP 3: Test form generation with marketing
    console.log('\n📝 [STEP 3] Testing form generation with marketing consent...');

    const formGenerationPayload = {
        prompt: 'Test form for system diagnosis',
        required_fields: ['Email', 'Nome', 'privacy_consent', 'marketing_consent'],
        metadata: {
            gdpr_required: true,
            marketing_consent: true,
            organization: 'Test Org'
        },
        colors: {
            primary: '#FF6B35',
            background: '#FFF8F0',
            text: '#8B2635'
        }
    };

    console.log('📤 [EDGE FUNCTION] Calling generate-form-fields...');
    console.log('📋 [PAYLOAD]:', JSON.stringify(formGenerationPayload, null, 2));

    try {
        const response = await fetch(`${process.env.VITE_SUPABASE_URL}/functions/v1/generate-form-fields`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify(formGenerationPayload)
        });

        if (!response.ok) {
            console.log('❌ [EDGE FUNCTION ERROR]:', response.status, response.statusText);
            const errorText = await response.text();
            console.log('📝 [ERROR DETAILS]:', errorText);
        } else {
            const result = await response.json();
            console.log('✅ [EDGE FUNCTION SUCCESS]');
            console.log('📋 [RESULT]:', JSON.stringify(result, null, 2));

            // Check if marketing field was generated
            const hasMarketingField = result.fields?.some(field =>
                field.name === 'marketing_consent' ||
                field.type === 'marketing' ||
                field.label?.toLowerCase().includes('marketing')
            );

            console.log(`🎯 [MARKETING FIELD CHECK]: ${hasMarketingField ? '✅ FOUND' : '❌ MISSING'}`);

            if (!hasMarketingField) {
                console.log('❌ [CRITICAL] Marketing field not generated despite being requested');
                console.log('📋 [GENERATED FIELDS]:');
                result.fields?.forEach((field, i) => {
                    console.log(`   ${i + 1}. ${field.name} (${field.type}) - ${field.label}`);
                });
            }
        }
    } catch (fetchError) {
        console.log('❌ [FETCH ERROR]:', fetchError.message);
    }

    // STEP 4: Final database verification
    console.log('\n🔍 [STEP 4] Final verification - checking if changes persisted...');

    const { data: finalCheck, error: finalError } = await supabase
        .from('forms')
        .select('styling')
        .eq('id', testFormId)
        .single();

    if (finalError) {
        console.log('❌ [FINAL CHECK ERROR]:', finalError.message);
    } else {
        console.log('📊 [FINAL STATE]:', JSON.stringify(finalCheck.styling, null, 2));

        const stillHasTestData = finalCheck.styling?.test_name === 'FULL_SYSTEM_DIAGNOSIS';
        console.log(`🎯 [PERSISTENCE FINAL]: ${stillHasTestData ? '✅ PERSISTED' : '❌ REVERTED'}`);

        if (!stillHasTestData) {
            console.log('❌ [CRITICAL] Changes were reverted - database constraint/trigger issue confirmed');
        }
    }

    console.log('\n================================================================================');
    console.log('FULL SYSTEM DIAGNOSIS COMPLETE');
    console.log('================================================================================');
}

fullSystemDiagnosis().catch(console.error);