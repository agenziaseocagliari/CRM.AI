#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

async function testQuestionnaireToFormFlow() {
    console.log('🧪 [QUESTIONNAIRE FLOW TEST] Testing complete data flow...\n');

    const supabase = createClient(
        process.env.VITE_SUPABASE_URL,
        process.env.VITE_SUPABASE_ANON_KEY
    );

    // Simulate the exact questionnaire output
    const questionnaireResult = {
        prompt: 'Test form per diagnosi completa del sistema',
        privacyUrl: 'https://seo-cagliari.it/',
        required_fields: ['Email', 'Nome', 'privacy_consent', 'marketing_consent'],
        colors: {
            primary: '#f264be',
            background: '#0f45b3',
            text: '#1f2937'
        },
        metadata: {
            gdpr_required: true,
            marketing_consent: true
        }
    };

    console.log('📋 [QUESTIONNAIRE OUTPUT] Simulated data:');
    console.log(JSON.stringify(questionnaireResult, null, 2));

    // Simulate handleGenerateForm call with the corrected signature
    console.log('\n🚀 [HANDLE GENERATE FORM] Testing with corrected parameters...');

    const requestBody = {
        prompt: questionnaireResult.prompt,
        organization_id: 'test-org-id',
        required_fields: questionnaireResult.required_fields,
        metadata: {
            gdpr_required: questionnaireResult.metadata.gdpr_required,
            marketing_consent: questionnaireResult.metadata.marketing_consent,
            organization: 'Test Organization'
        },
        style_customizations: {
            primaryColor: questionnaireResult.colors.primary,
            backgroundColor: questionnaireResult.colors.background,
            textColor: questionnaireResult.colors.text
        },
        privacy_policy_url: questionnaireResult.privacyUrl
    };

    console.log('📤 [REQUEST BODY] What would be sent to edge function:');
    console.log(JSON.stringify(requestBody, null, 2));

    // Test the edge function directly
    console.log('\n🔗 [EDGE FUNCTION TEST] Calling generate-form-fields...');

    try {
        const response = await fetch(`${process.env.VITE_SUPABASE_URL}/functions/v1/generate-form-fields`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify(requestBody)
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

            console.log(`\n🎯 [MARKETING FIELD CHECK]: ${hasMarketingField ? '✅ FOUND' : '❌ MISSING'}`);

            // Check if custom colors were applied
            const hasCustomColors =
                result.style_customizations?.primaryColor === '#f264be' ||
                result.style_customizations?.backgroundColor === '#0f45b3';

            console.log(`🎨 [CUSTOM COLORS CHECK]: ${hasCustomColors ? '✅ APPLIED' : '❌ MISSING'}`);

            if (hasMarketingField && hasCustomColors) {
                console.log('\n🎉 [SUCCESS] Both marketing field and custom colors working!');
            } else {
                console.log('\n❌ [PARTIAL SUCCESS] Some issues remain:');
                if (!hasMarketingField) {
                    console.log('   - Marketing field not generated despite metadata.marketing_consent = true');
                }
                if (!hasCustomColors) {
                    console.log('   - Custom colors not applied despite style_customizations');
                }
            }

            console.log('\n📊 [GENERATED FIELDS]:');
            result.fields?.forEach((field, i) => {
                console.log(`   ${i + 1}. ${field.name} (${field.type}) - ${field.label}`);
            });

            console.log('\n🎨 [STYLE CUSTOMIZATIONS]:');
            console.log(JSON.stringify(result.style_customizations, null, 2));
        }
    } catch (fetchError) {
        console.log('❌ [FETCH ERROR]:', fetchError.message);
    }

    console.log('\n================================================================================');
    console.log('QUESTIONNAIRE TO FORM FLOW TEST COMPLETE');
    console.log('================================================================================');
}

testQuestionnaireToFormFlow().catch(console.error);