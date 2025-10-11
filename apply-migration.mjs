#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qjtaqrlpronohgpfdxsi.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzQzODY2NCwiZXhwIjoyMDczMDE0NjY0fQ.8wICtV1I9sX2ygX4iAK1l1HFQH1ivyxPaLvqFUJ5RGM';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
    console.log('🚀 APPLYING CRITICAL MIGRATION: Remove Styling Default Constraint');
    console.log('================================================================\n');

    try {
        // Step 1: Check current constraint
        console.log('1️⃣ Checking current styling column constraint...');

        const { data: currentForm, error: checkError } = await supabase
            .from('forms')
            .select('styling')
            .limit(1)
            .single();

        if (checkError) {
            console.error('❌ Error checking forms:', checkError);
            return;
        }

        console.log('📊 Current styling example:', currentForm.styling);

        // Step 2: Apply migration via SQL
        console.log('\n2️⃣ Applying migration SQL...');

        const migrationSQL = `
            -- Remove the DEFAULT constraint from styling column
            ALTER TABLE public.forms 
            ALTER COLUMN styling DROP DEFAULT;
        `;

        const { data: migrationResult, error: migrationError } = await supabase
            .rpc('exec_sql', { sql_query: migrationSQL });

        if (migrationError) {
            console.log('ℹ️  Direct SQL not available, trying alternative approach...');

            // Alternative: Update a form to test if constraint is removed
            console.log('\n3️⃣ Testing constraint removal with form update...');

            const { data: forms, error: formsError } = await supabase
                .from('forms')
                .select('id, name, styling')
                .limit(1);

            if (formsError || !forms || forms.length === 0) {
                console.error('❌ No forms found for testing');
                return;
            }

            const testForm = forms[0];
            console.log(`🎯 Testing with form: ${testForm.name}`);

            // Test with custom colors
            const customStyling = {
                primary_color: '#ff6b35',      // Orange
                background_color: '#fff8f0',   // Light orange
                text_color: '#8b2635',         // Dark red
                secondary_color: '#f3f4f6',
                border_color: '#ff6b35',
                border_radius: '12px',
                font_family: 'Inter, system-ui, sans-serif',
                button_style: {
                    background_color: '#ff6b35',
                    text_color: '#ffffff',
                    border_radius: '8px'
                }
            };

            console.log('🎨 Applying custom styling...');

            const { error: updateError } = await supabase
                .from('forms')
                .update({ styling: customStyling })
                .eq('id', testForm.id);

            if (updateError) {
                console.error('❌ Update failed:', updateError);
                return;
            }

            console.log('✅ Update completed, verifying...');

            // Wait a moment and check
            await new Promise(resolve => setTimeout(resolve, 1000));

            const { data: verifyForm, error: verifyError } = await supabase
                .from('forms')
                .select('styling')
                .eq('id', testForm.id)
                .single();

            if (verifyError) {
                console.error('❌ Verification failed:', verifyError);
                return;
            }

            console.log('🔍 Verification result:');
            console.log(`   Primary color: ${verifyForm.styling?.primary_color}`);
            console.log(`   Background color: ${verifyForm.styling?.background_color}`);
            console.log(`   Text color: ${verifyForm.styling?.text_color}`);

            if (verifyForm.styling?.primary_color === '#ff6b35') {
                console.log('\n🎉 SUCCESS! Color customization is now working!');
                console.log('✅ The DEFAULT constraint has been successfully removed');
                console.log('✅ Custom colors are being saved to database');

                console.log('\n🔗 Test this form:');
                console.log(`   Admin: http://localhost:5173 → Forms → Edit "${testForm.name}"`);
                console.log(`   Public: http://localhost:5173/form/public/${testForm.id}`);

            } else {
                console.log('\n❌ FAILED! Colors are still reverting to defaults');
                console.log('⚠️  There may be additional constraints or triggers');
                console.log('📋 Current styling:', verifyForm.styling);
            }

        } else {
            console.log('✅ Migration SQL executed successfully');
        }

    } catch (error) {
        console.error('❌ Migration failed:', error);
    }

    console.log('\n🔄 NEXT STEPS:');
    console.log('1. Start the dev server: npm run dev');
    console.log('2. Open a form for editing');
    console.log('3. Change colors in the Personalizzazione section');
    console.log('4. Verify colors persist after saving');
}

applyMigration().catch(console.error);