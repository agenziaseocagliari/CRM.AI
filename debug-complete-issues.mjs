#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qjtaqrlpronohgpfdxsi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0Mzg2NjQsImV4cCI6MjA3MzAxNDY2NH0.4bCc8vk1qtxLs90xsYaGOs-envRmASVGL9fYtESgY6k';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugCompleteIssues() {
    console.log('🔍 DEBUGGING COMPLETO - COLORI + CAMPI');
    console.log('=======================================\n');

    // 1. Verifica tutti i form nel database
    console.log('1️⃣ ANALISI FORME NEL DATABASE:');
    const { data: forms, error: formsError } = await supabase
        .from('forms')
        .select('id, name, title, styling, fields')
        .order('created_at', { ascending: false })
        .limit(5);

    if (formsError) {
        console.error('❌ Errore nel recupero forme:', formsError);
        return;
    }

    console.log(`📊 Trovate ${forms.length} forme recenti:\n`);

    forms.forEach((form, index) => {
        console.log(`📝 FORM ${index + 1}: ${form.name || form.title || 'Senza nome'}`);
        console.log(`   🆔 ID: ${form.id}`);

        // Analisi styling
        console.log('   🎨 STYLING:');
        if (form.styling) {
            console.log(`      • Primary: ${form.styling.primary_color || 'NON IMPOSTATO'}`);
            console.log(`      • Background: ${form.styling.background_color || 'NON IMPOSTATO'}`);
            console.log(`      • Text: ${form.styling.text_color || 'NON IMPOSTATO'}`);
        } else {
            console.log('      ❌ NESSUNO STYLING TROVATO');
        }

        // Analisi campi
        console.log('   📋 CAMPI:');
        if (form.fields && Array.isArray(form.fields)) {
            console.log(`      • Totale campi: ${form.fields.length}`);

            // Cerca campi marketing/newsletter
            const marketingFields = form.fields.filter(field =>
                field.type === 'checkbox' &&
                (field.label?.toLowerCase().includes('marketing') ||
                    field.label?.toLowerCase().includes('newsletter') ||
                    field.name?.toLowerCase().includes('marketing') ||
                    field.name?.toLowerCase().includes('newsletter'))
            );

            if (marketingFields.length > 0) {
                console.log('      ✅ CAMPI MARKETING TROVATI:');
                marketingFields.forEach(field => {
                    console.log(`         - ${field.label || field.name} (${field.type})`);
                });
            } else {
                console.log('      ❌ NESSUN CAMPO MARKETING/NEWSLETTER');
            }

            // Lista tutti i campi
            console.log('      📋 Tutti i campi:');
            form.fields.forEach(field => {
                console.log(`         - ${field.label || field.name} (${field.type})`);
            });
        } else {
            console.log('      ❌ NESSUN CAMPO TROVATO');
        }
        console.log('');
    });

    // 2. Test specifico sui colori di default
    console.log('\n2️⃣ VERIFICA COLORI DI DEFAULT:');
    const defaultColors = {
        primary_color: '#6366f1',
        background_color: '#ffffff',
        text_color: '#1f2937'
    };

    let allDefaultCount = 0;
    forms.forEach(form => {
        if (form.styling &&
            form.styling.primary_color === defaultColors.primary_color &&
            form.styling.background_color === defaultColors.background_color &&
            form.styling.text_color === defaultColors.text_color) {
            allDefaultCount++;
        }
    });

    console.log(`📊 Forme con colori di default: ${allDefaultCount}/${forms.length}`);
    if (allDefaultCount === forms.length) {
        console.log('❌ PROBLEMA: TUTTE le forme hanno colori di default!');
        console.log('   Questo indica che le personalizzazioni non vengono salvate.');
    }

    // 3. Test di aggiornamento colori
    console.log('\n3️⃣ TEST AGGIORNAMENTO COLORI:');
    if (forms.length > 0) {
        const testForm = forms[0];
        console.log(`🧪 Testando aggiornamento su: ${testForm.name || testForm.id}`);

        const testColors = {
            primary_color: '#ff0000',
            background_color: '#000000',
            text_color: '#ffffff',
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

        const { error: updateError } = await supabase
            .from('forms')
            .update({ styling: testColors })
            .eq('id', testForm.id);

        if (updateError) {
            console.error('❌ Errore aggiornamento:', updateError);
        } else {
            console.log('✅ Aggiornamento riuscito, verifico...');

            // Rileggi il form
            const { data: updatedForm, error: readError } = await supabase
                .from('forms')
                .select('styling')
                .eq('id', testForm.id)
                .single();

            if (readError) {
                console.error('❌ Errore lettura:', readError);
            } else {
                console.log('🔍 Colori dopo aggiornamento:');
                console.log(`   Primary: ${updatedForm.styling?.primary_color}`);
                console.log(`   Background: ${updatedForm.styling?.background_color}`);
                console.log(`   Text: ${updatedForm.styling?.text_color}`);

                if (updatedForm.styling?.primary_color === '#ff0000') {
                    console.log('✅ AGGIORNAMENTO FUNZIONA: I colori vengono salvati correttamente');
                } else {
                    console.log('❌ AGGIORNAMENTO FALLITO: I colori non vengono salvati');
                }
            }
        }
    }

    console.log('\n4️⃣ PROSSIMI PASSI:');
    console.log('• Se i colori vengono salvati nel DB ma non in frontend → problema nel caricamento');
    console.log('• Se i colori non vengono salvati nel DB → problema nella funzione handleStyleChange');
    console.log('• Per i campi marketing → verificare il sistema di creazione campi');
}

debugCompleteIssues().catch(console.error);