#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qjtaqrlpronohgpfdxsi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0Mzg2NjQsImV4cCI6MjA3MzAxNDY2NH0.4bCc8vk1qtxLs90xsYaGOs-envRmASVGL9fYtESgY6k';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testColorSync() {
    console.log('🧪 Testing color synchronization...');

    const testFormId = 'c17a651f-55a3-4432-8432-9353b2a75686';

    // Test 1: Aggiorna con colori estremi
    const extremeColors = {
        primary_color: '#ff0000',      // Rosso puro
        background_color: '#000000',   // Nero puro  
        text_color: '#ffffff',         // Bianco puro
        secondary_color: '#f3f4f6',
        border_color: '#ff0000',
        border_radius: '8px',
        font_family: 'Inter, system-ui, sans-serif',
        button_style: {
            background_color: '#ff0000',
            text_color: '#ffffff',
            border_radius: '6px'
        }
    };

    try {
        console.log('🎨 Step 1: Applying extreme colors...');

        const { error: updateError } = await supabase
            .from('forms')
            .update({ styling: extremeColors })
            .eq('id', testFormId);

        if (updateError) {
            console.error('❌ Update error:', updateError);
            return;
        }

        console.log('✅ Colors updated in database');

        // Verifica che siano stati salvati
        const { data: updatedForm, error: fetchError } = await supabase
            .from('forms')
            .select('styling')
            .eq('id', testFormId)
            .single();

        if (fetchError) {
            console.error('❌ Fetch error:', fetchError);
            return;
        }

        console.log('🔍 Verification - Updated styling:');
        console.log('Primary Color:', updatedForm.styling.primary_color);
        console.log('Background Color:', updatedForm.styling.background_color);
        console.log('Text Color:', updatedForm.styling.text_color);

        // Verifica che siano diversi dai default
        if (updatedForm.styling.primary_color === '#ff0000') {
            console.log('✅ Primary color correctly saved');
        } else {
            console.log('❌ Primary color not saved correctly');
        }

        if (updatedForm.styling.background_color === '#000000') {
            console.log('✅ Background color correctly saved');
        } else {
            console.log('❌ Background color not saved correctly');
        }

        console.log('\n📍 Test form URL:');
        console.log(`http://localhost:5173/form/public/${testFormId}`);

        console.log('\n🔄 Now go to the dashboard, edit this form, and check if colors match!');

    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testColorSync();