#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

async function testEnterpriseFixWithServiceRole() {
    console.log('🎯 [ENTERPRISE FIX TEST] Testing styling updates with service role...\n');

    const adminClient = createClient(
        process.env.VITE_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const testFormId = 'd5768d0f-ffea-4f08-86a4-8f2ac2f8c9ef';

    console.log('🔍 [STEP 1] Current form state...');
    const { data: currentForm, error: readError } = await adminClient
        .from('forms')
        .select('styling')
        .eq('id', testFormId)
        .single();

    if (readError) {
        console.log('❌ [READ ERROR]:', readError.message);
        return;
    }

    console.log('📊 [CURRENT STYLING]:', JSON.stringify(currentForm.styling, null, 2));

    console.log('\n🚀 [STEP 2] Testing service role update...');
    const enterpriseStyling = {
        primary_color: '#FF6B35',
        background_color: '#FFF8F0',
        text_color: '#8B2635',
        font_family: 'Inter, system-ui, sans-serif',
        border_color: '#FF6B35',
        button_style: {
            background_color: '#FF6B35',
            text_color: '#ffffff',
            border_radius: '6px'
        },
        border_radius: '8px',
        secondary_color: '#f3f4f6',
        enterprise_fix: Date.now(),
        test_name: 'ENTERPRISE_SERVICE_ROLE_FIX'
    };

    console.log('📤 [SENDING]:', JSON.stringify(enterpriseStyling, null, 2));

    const { data: updateResult, error: updateError } = await adminClient
        .from('forms')
        .update({ styling: enterpriseStyling })
        .eq('id', testFormId)
        .select('styling');

    if (updateError) {
        console.log('❌ [UPDATE ERROR]:', updateError.message);
    } else {
        console.log('✅ [UPDATE SUCCESS] Records affected:', updateResult.length);
        console.log('📥 [RETURNED DATA]:', JSON.stringify(updateResult[0]?.styling, null, 2));

        const successfullyPersisted = updateResult[0]?.styling?.test_name === 'ENTERPRISE_SERVICE_ROLE_FIX';
        console.log(`🎯 [PERSISTENCE CHECK]: ${successfullyPersisted ? '✅ SUCCESS' : '❌ FAILED'}`);

        if (successfullyPersisted) {
            console.log('🎉 [ENTERPRISE SUCCESS] Service role bypassed RLS successfully!');

            // Now test reading with anon client to ensure public forms can see the changes
            console.log('\n🔍 [STEP 3] Testing public visibility with anon client...');

            const anonClient = createClient(
                process.env.VITE_SUPABASE_URL,
                process.env.VITE_SUPABASE_ANON_KEY
            );

            const { data: publicRead, error: publicError } = await anonClient
                .from('forms')
                .select('styling')
                .eq('id', testFormId)
                .single();

            if (publicError) {
                console.log('❌ [PUBLIC READ ERROR]:', publicError.message);
            } else {
                const publicCanSeeChanges = publicRead?.styling?.test_name === 'ENTERPRISE_SERVICE_ROLE_FIX';
                console.log(`🌐 [PUBLIC VISIBILITY]: ${publicCanSeeChanges ? '✅ VISIBLE' : '❌ NOT VISIBLE'}`);

                if (publicCanSeeChanges) {
                    console.log('🎯 [FINAL SUCCESS] Enterprise fix working perfectly!');
                    console.log('✅ Service role can write');
                    console.log('✅ Public can read');
                    console.log('✅ Styling persistence confirmed');
                }
            }
        }
    }

    console.log('\n================================================================================');
    console.log('ENTERPRISE SERVICE ROLE FIX TEST COMPLETE');
    console.log('================================================================================');
}

testEnterpriseFixWithServiceRole().catch(console.error);