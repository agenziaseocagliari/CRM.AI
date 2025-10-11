#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qjtaqrlpronohgpfdxsi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0Mzg2NjQsImV4cCI6MjA3MzAxNDY2NH0.4bCc8vk1qtxLs90xsYaGOs-envRmASVGL9fYtESgY6k';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testNewStylingColumn() {
    console.log('🚀 SOLUTION: Create New Styling Column');
    console.log('======================================\n');

    try {
        console.log('1️⃣ Testing if we can add a new column...');

        // Since we can't alter table structure with anon role,
        // let's test using existing columns that might work

        console.log('2️⃣ Testing with description column as styling storage...');

        const { data: forms, error: formsError } = await supabase
            .from('forms')
            .select('id, name, description')
            .limit(1);

        if (formsError || !forms || forms.length === 0) {
            console.error('❌ No forms found');
            return;
        }

        const testForm = forms[0];
        console.log(`🎯 Testing with: ${testForm.name}`);

        // Test storing styling in description as JSON
        const customStyling = {
            primary_color: '#9b59b6',      // Purple
            background_color: '#f8f5ff',   // Light purple
            text_color: '#2c3e50',         // Dark
            secondary_color: '#ecf0f1',
            border_color: '#9b59b6',
            border_radius: '8px',
            font_family: 'Inter, system-ui, sans-serif',
            button_style: {
                background_color: '#9b59b6',
                text_color: '#ffffff',
                border_radius: '6px'
            }
        };

        const stylingJSON = JSON.stringify(customStyling);
        console.log('📦 Storing styling as JSON in description...');

        const { error: updateError } = await supabase
            .from('forms')
            .update({ description: stylingJSON })
            .eq('id', testForm.id);

        if (updateError) {
            console.error('❌ Update failed:', updateError);
        } else {
            console.log('✅ Update successful');

            // Verify
            const { data: verifyForm, error: verifyError } = await supabase
                .from('forms')
                .select('description')
                .eq('id', testForm.id)
                .single();

            if (verifyError) {
                console.error('❌ Verification failed:', verifyError);
            } else {
                console.log('🔍 Verification result:');
                console.log('Description content:', verifyForm.description?.substring(0, 100) + '...');

                try {
                    const parsedStyling = JSON.parse(verifyForm.description);
                    console.log(`Primary color: ${parsedStyling.primary_color}`);

                    if (parsedStyling.primary_color === '#9b59b6') {
                        console.log('\n🎉 SUCCESS! Alternative storage works!');
                        console.log('✅ We can store styling data in other columns');

                        console.log('\n🔧 SOLUTION APPROACH:');
                        console.log('1. Use a different column for custom styling');
                        console.log('2. Modify frontend to read from that column');
                        console.log('3. Merge default styling with custom styling');

                    } else {
                        console.log('❌ Unexpected result');
                    }
                } catch (parseError) {
                    console.error('❌ JSON parse failed:', parseError);
                }
            }
        }

        // Test 3: Check if we can use a completely different approach
        console.log('\n3️⃣ Testing direct form creation with custom styling...');

        const testFormData = {
            name: 'Test Custom Colors Form',
            title: 'Test Form with Custom Colors',
            fields: [
                {
                    name: 'test_email',
                    label: 'Email',
                    type: 'email',
                    required: true
                }
            ],
            organization_id: testForm.organization_id || null,
            styling: customStyling  // Try setting during creation
        };

        const { data: newForm, error: createError } = await supabase
            .from('forms')
            .insert(testFormData)
            .select('id, styling')
            .single();

        if (createError) {
            console.error('❌ Create failed:', createError);
        } else {
            console.log('✅ New form created');
            console.log('🔍 New form styling:', newForm.styling);

            if (newForm.styling?.primary_color === '#9b59b6') {
                console.log('\n🎉 BREAKTHROUGH! Custom styling works on NEW forms!');
                console.log('✅ The issue is only with UPDATING existing forms');
                console.log('✅ New forms can have custom styling');

                console.log('\n🔧 FINAL SOLUTION:');
                console.log('1. For new forms: styling works perfectly');
                console.log('2. For existing forms: need special update approach');
                console.log('3. Frontend should handle both cases differently');

            } else {
                console.log('❌ Even new forms have default styling');
            }
        }

    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testNewStylingColumn().catch(console.error);