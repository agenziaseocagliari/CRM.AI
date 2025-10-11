#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qjtaqrlpronohgpfdxsi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0Mzg2NjQsImV4cCI6MjA3MzAxNDY2NH0.4bCc8vk1qtxLs90xsYaGOs-envRmASVGL9fYtESgY6k';

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeStylingStructure() {
    console.log('🔍 Analisi struttura styling nel database...');

    try {
        // Ottieni un form per vedere la struttura dello styling
        const { data: forms, error } = await supabase
            .from('forms')
            .select('id, title, styling')
            .limit(3);

        if (error) {
            console.error('❌ Errore:', error);
            return;
        }

        console.log('📋 Struttura styling nei forms esistenti:');
        forms.forEach((form, index) => {
            console.log(`\n${index + 1}. Form: ${form.title}`);
            console.log(`   ID: ${form.id}`);
            console.log(`   Styling keys:`, Object.keys(form.styling || {}));
            console.log(`   Styling completo:`, JSON.stringify(form.styling, null, 2));
        });

        // Test con il form di default che stai usando
        const testFormId = 'c17a651f-55a3-4432-8432-9353b2a75686';
        const { data: testForm, error: testError } = await supabase
            .from('forms')
            .select('styling')
            .eq('id', testFormId)
            .single();

        if (testError) {
            console.error('❌ Errore test form:', testError);
            return;
        }

        console.log('\n🎯 Form di test - Struttura styling attuale:');
        console.log('Keys disponibili:', Object.keys(testForm.styling || {}));
        console.log('Valori:', JSON.stringify(testForm.styling, null, 2));

    } catch (error) {
        console.error('❌ Errore:', error);
    }
}

analyzeStylingStructure();