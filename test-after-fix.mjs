#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qjtaqrlpronohgpfdxsi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0Mzg2NjQsImV4cCI6MjA3MzAxNDY2NH0.4bCc8vk1qtxLs90xsYaGOs-envRmASVGL9fYtESgY6k';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAfterFix() {
    console.log('🧪 TEST POST-FIX: Colori + Marketing');
    console.log('===================================\n');

    // Test 1: Edge function con marketing consent
    console.log('1️⃣ TEST EDGE FUNCTION CON MARKETING CONSENT:');

    const testPayload = {
        prompt: `Tipo di business: Agenzia Web
Nome del form: Test Marketing Form
Descrizione del form: Form per test marketing consent
Target: PMI italiane che cercano servizi web
Campi richiesti: Nome completo, Email, Telefono, Servizi di interesse
Privacy policy URL: https://example.com/privacy`,
        required_fields: [
            'Nome completo',
            'Email',
            'Telefono',
            'Servizi di interesse',
            'privacy_consent',
            'marketing_consent'  // ⚠️ QUESTO DEVE essere incluso
        ],
        metadata: {
            gdpr_required: true,
            marketing_consent: true  // ⚠️ QUESTO DEVE essere true
        },
        colors: {
            primary: '#ff4500',
            background: '#fff5f5',
            text: '#8b0000'
        }
    };

    try {
        console.log('📡 Sending payload:', JSON.stringify(testPayload, null, 2));

        const { data, error } = await supabase.functions.invoke('generate-form-fields', {
            body: testPayload
        });

        if (error) {
            console.error('❌ Edge function error:', error);
            return;
        }

        console.log('✅ Edge function response:');
        console.log('📋 Fields received:', data.fields?.length || 0);

        // Verifica campi marketing
        const marketingField = data.fields?.find(f => f.name === 'marketing_consent');
        if (marketingField) {
            console.log('✅ MARKETING FIELD FOUND:');
            console.log(`   Label: ${marketingField.label}`);
            console.log(`   Type: ${marketingField.type}`);
            console.log(`   Required: ${marketingField.required}`);
        } else {
            console.log('❌ MARKETING FIELD MISSING');
            console.log('📋 Available fields:');
            data.fields?.forEach(f => {
                console.log(`   - ${f.name} (${f.type}): ${f.label}`);
            });
        }

        // Verifica colori
        if (data.style_customizations) {
            console.log('✅ STYLE CUSTOMIZATIONS FOUND:');
            console.log(`   Primary: ${data.style_customizations.primary_color}`);
            console.log(`   Background: ${data.style_customizations.background_color}`);
            console.log(`   Text: ${data.style_customizations.text_color}`);
        } else {
            console.log('❌ STYLE CUSTOMIZATIONS MISSING');
        }

    } catch (error) {
        console.error('❌ Test failed:', error);
    }

    // Test 2: Database direct update (per testare fix useCallback)
    console.log('\n2️⃣ TEST DATABASE UPDATE DIRETTO:');

    try {
        // Trova un form esistente
        const { data: forms, error: fetchError } = await supabase
            .from('forms')
            .select('id, name, styling')
            .limit(1);

        if (fetchError || !forms || forms.length === 0) {
            console.error('❌ No forms found for testing');
            return;
        }

        const testForm = forms[0];
        console.log(`🎯 Testing on form: ${testForm.name} (${testForm.id})`);

        // Test update con colori estremi
        const testColors = {
            primary_color: '#ff1493',      // DeepPink
            background_color: '#000080',   // Navy  
            text_color: '#ffff00',         // Yellow
            secondary_color: '#f3f4f6',
            border_color: '#ff1493',
            border_radius: '12px',
            font_family: 'Inter, system-ui, sans-serif',
            button_style: {
                background_color: '#ff1493',
                text_color: '#ffffff',
                border_radius: '8px'
            }
        };

        console.log('💾 Updating with extreme colors...');

        const { error: updateError, data: updateResult } = await supabase
            .from('forms')
            .update({ styling: testColors })
            .eq('id', testForm.id)
            .select('styling');

        if (updateError) {
            console.error('❌ Update failed:', updateError);
        } else {
            console.log('✅ Update successful');

            // Verifica immediata
            setTimeout(async () => {
                const { data: verifyForm, error: verifyError } = await supabase
                    .from('forms')
                    .select('styling')
                    .eq('id', testForm.id)
                    .single();

                if (verifyError) {
                    console.error('❌ Verification failed:', verifyError);
                } else {
                    console.log('🔍 Verification result:');
                    console.log(`   Primary: ${verifyForm.styling?.primary_color}`);
                    console.log(`   Background: ${verifyForm.styling?.background_color}`);
                    console.log(`   Text: ${verifyForm.styling?.text_color}`);

                    if (verifyForm.styling?.primary_color === '#ff1493') {
                        console.log('✅ SUCCESS: Colors are correctly saved to database!');
                    } else {
                        console.log('❌ FAILED: Colors not saved correctly');
                    }
                }
            }, 1000);
        }

    } catch (error) {
        console.error('❌ Database test failed:', error);
    }

    console.log('\n🔄 NEXT STEPS:');
    console.log('1. Start dev server: npm run dev');
    console.log('2. Open form editor and test color changes');
    console.log('3. Watch console for handleStyleChange logs');
    console.log('4. Test questionnaire with marketing consent enabled');
}

testAfterFix().catch(console.error);