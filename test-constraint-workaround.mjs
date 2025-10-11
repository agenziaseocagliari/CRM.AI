#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qjtaqrlpronohgpfdxsi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0Mzg2NjQsImV4cCI6MjA3MzAxNDY2NH0.4bCc8vk1qtxLs90xsYaGOs-envRmASVGL9fYtESgY6k';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConstraintRemoval() {
    console.log('🧪 TESTING CONSTRAINT REMOVAL WORKAROUND');
    console.log('=========================================\n');

    try {
        // Get a test form
        const { data: forms, error: formsError } = await supabase
            .from('forms')
            .select('id, name, styling')
            .limit(1);

        if (formsError || !forms || forms.length === 0) {
            console.error('❌ No forms found');
            return;
        }

        const testForm = forms[0];
        console.log(`🎯 Testing with: ${testForm.name} (${testForm.id})`);
        console.log(`📊 Current styling:`, testForm.styling);

        // Test 1: Try setting styling to NULL first
        console.log('\n1️⃣ Setting styling to NULL to bypass DEFAULT...');

        const { error: nullError } = await supabase
            .from('forms')
            .update({ styling: null })
            .eq('id', testForm.id);

        if (nullError) {
            console.error('❌ Cannot set to NULL:', nullError);
        } else {
            console.log('✅ Successfully set to NULL');

            // Now try custom styling
            await new Promise(resolve => setTimeout(resolve, 500));

            console.log('\n2️⃣ Now applying custom styling...');

            const customStyling = {
                primary_color: '#e74c3c',      // Red
                background_color: '#fdf2f2',   // Light red
                text_color: '#2c3e50',         // Dark blue
                secondary_color: '#ecf0f1',
                border_color: '#e74c3c',
                border_radius: '10px',
                font_family: 'Inter, system-ui, sans-serif',
                button_style: {
                    background_color: '#e74c3c',
                    text_color: '#ffffff',
                    border_radius: '6px'
                }
            };

            const { error: customError } = await supabase
                .from('forms')
                .update({ styling: customStyling })
                .eq('id', testForm.id);

            if (customError) {
                console.error('❌ Custom styling failed:', customError);
            } else {
                console.log('✅ Custom styling applied');

                // Verify
                await new Promise(resolve => setTimeout(resolve, 1000));

                const { data: verifyForm, error: verifyError } = await supabase
                    .from('forms')
                    .select('styling')
                    .eq('id', testForm.id)
                    .single();

                if (verifyError) {
                    console.error('❌ Verification failed:', verifyError);
                } else {
                    console.log('\n🔍 VERIFICATION RESULT:');
                    console.log(`   Primary: ${verifyForm.styling?.primary_color}`);
                    console.log(`   Background: ${verifyForm.styling?.background_color}`);
                    console.log(`   Text: ${verifyForm.styling?.text_color}`);

                    if (verifyForm.styling?.primary_color === '#e74c3c') {
                        console.log('\n🎉 CONSTRAINT WORKAROUND SUCCESSFUL!');
                        console.log('✅ Custom colors are being saved!');
                        console.log('✅ The NULL→Custom approach bypassed the DEFAULT constraint');

                        // Now we can fix the frontend to use this approach
                        console.log('\n🔧 FRONTEND FIX NEEDED:');
                        console.log('   Modify handleStyleChange to:');
                        console.log('   1. Set styling to null first');
                        console.log('   2. Then set custom styling');

                    } else {
                        console.log('\n❌ STILL FAILING');
                        console.log('📋 Actual result:', verifyForm.styling);
                    }
                }
            }
        }

    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testConstraintRemoval().catch(console.error);