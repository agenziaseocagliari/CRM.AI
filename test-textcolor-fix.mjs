import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testTextColorFix() {
    console.log('🧪 TEST DEFINITIVO: Auto-sync Text Color Fix');
    console.log('===========================================\n');

    try {
        // 1. Simula questionnaire con auto-sync colors
        const questionnairePrimaryColor = '#ff6b35';  // Orange
        const questionnaireTextColor = '#ff6b35';     // Should auto-sync with primary

        console.log('1️⃣ SIMULAZIONE QUESTIONNAIRE:');
        console.log(`   Primary Color: ${questionnairePrimaryColor}`);
        console.log(`   Text Color (auto-sync): ${questionnaireTextColor}`);

        const requestBody = {
            prompt: 'Crea un form di contatto per un\'azienda di web design con colori arancioni personalizzati',
            style_customizations: {
                primary_color: questionnairePrimaryColor,
                background_color: '#f0f8ff',
                text_color: questionnaireTextColor    // ✅ Questo dovrebbe essere preservato!
            },
            privacy_policy_url: 'https://example.com/privacy',
            metadata: {
                gdpr_required: true,
                marketing_consent: true
            }
        };

        console.log('\n2️⃣ CHIAMATA EDGE FUNCTION:');
        console.log('   Invio text_color:', requestBody.style_customizations.text_color);

        // 2. Simula chiamata Edge Function (usando service role key per test)
        const response = await fetch(`${process.env.VITE_SUPABASE_URL}/functions/v1/generate-form-fields`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
                'apikey': process.env.VITE_SUPABASE_ANON_KEY
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Edge Function error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();

        console.log('\n3️⃣ RISPOSTA EDGE FUNCTION:');
        console.log('   textColor ricevuto:', data.style_customizations?.textColor);
        console.log('   primaryColor ricevuto:', data.style_customizations?.primaryColor);

        // 3. Verifica che il text color sia quello del questionnaire
        const receivedTextColor = data.style_customizations?.textColor;
        const isTextColorPreserved = receivedTextColor === questionnaireTextColor;

        console.log('\n🎯 RISULTATO ANALISI:');
        if (isTextColorPreserved) {
            console.log('✅ SUCCESS: Text color auto-sync FUNZIONA!');
            console.log(`   Questionnaire inviato: ${questionnaireTextColor}`);
            console.log(`   Edge Function restituito: ${receivedTextColor}`);
            console.log('   🎨 Il colore viene preservato correttamente!');
        } else {
            console.log('❌ FAILED: Text color auto-sync NON funziona');
            console.log(`   Questionnaire inviato: ${questionnaireTextColor}`);
            console.log(`   Edge Function restituito: ${receivedTextColor}`);
            console.log('   🛑 Il colore viene sovrascritto!');
        }

        // 4. Test completo con salvataggio form
        if (isTextColorPreserved) {
            console.log('\n4️⃣ TEST SALVATAGGIO FORM:');

            const testFormData = {
                name: 'test-textcolor-autosync',
                title: 'Test Auto-sync Text Color',
                fields: data.fields,
                styling: {
                    primary_color: data.style_customizations.primaryColor,
                    background_color: data.style_customizations.backgroundColor,
                    text_color: data.style_customizations.textColor
                },
                privacy_policy_url: data.privacy_policy_url,
                organization_id: '01935fc9-1e3a-7db1-be54-8de6893cbefb'
            };

            // Pulisci form esistente
            await supabase
                .from('forms')
                .delete()
                .eq('name', 'test-textcolor-autosync');

            const { data: savedForm, error: saveError } = await supabase
                .from('forms')
                .insert(testFormData)
                .select()
                .single();

            if (saveError) throw saveError;

            console.log('   ✅ Form salvato con ID:', savedForm.id);
            console.log('   🎨 Text color nel database:', savedForm.styling.text_color);
            console.log(`   🌐 Test URL: http://localhost:5173/form/${savedForm.id}`);
        }

    } catch (error) {
        console.error('❌ Errore durante test:', error);
    }
}

testTextColorFix();