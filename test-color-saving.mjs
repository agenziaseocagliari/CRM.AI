import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testColorSaving() {
    try {
        console.log('🧪 TEST SALVATAGGIO COLORI PERSONALIZZATI...');

        // 1. Prima eliminiamo eventuali form test precedenti
        await supabase
            .from('forms')
            .delete()
            .eq('name', 'test-colori-personalizzati');

        // 2. Creiamo un nuovo form con colori personalizzati
        const customStyle = {
            primary_color: '#ff4444',       // Rosso personalizzato
            secondary_color: '#f0f0f0',     // Grigio chiaro personalizzato  
            background_color: '#fff9f9',    // Sfondo rosa chiaro
            text_color: '#333333',          // Testo scuro
            border_color: '#ff4444',        // Bordo rosso
            border_radius: '12px',          // Bordi più arrotondati
            font_family: 'Arial, sans-serif',
            button_style: {
                background_color: '#ff4444',  // Bottone rosso
                text_color: '#ffffff',
                border_radius: '8px'
            }
        };

        const testForm = {
            name: 'test-colori-personalizzati',
            title: 'Test Form Colori Personalizzati',
            fields: [
                {
                    name: 'nome',
                    type: 'text',
                    label: 'Nome',
                    required: true
                },
                {
                    name: 'email',
                    type: 'email',
                    label: 'Email',
                    required: true
                }
            ],
            styling: customStyle,
            privacy_policy_url: 'https://example.com/privacy',
            organization_id: '01935fc9-1e3a-7db1-be54-8de6893cbefb' // ID organizzazione valido
        };

        console.log('💾 Inserimento form con stili personalizzati...');
        console.log('🎨 Stili da salvare:', JSON.stringify(customStyle, null, 2));

        const { data: insertedForm, error: insertError } = await supabase
            .from('forms')
            .insert(testForm)
            .select()
            .single();

        if (insertError) throw insertError;

        console.log('✅ Form inserito con ID:', insertedForm.id);

        // 3. Verifichiamo che i colori siano stati salvati correttamente
        console.log('\n🔍 Verifica recupero dati...');

        const { data: retrievedForm, error: retrieveError } = await supabase
            .from('forms')
            .select('*')
            .eq('id', insertedForm.id)
            .single();

        if (retrieveError) throw retrieveError;

        console.log('📊 Dati recuperati:');
        console.log('  - ID:', retrievedForm.id);
        console.log('  - Nome:', retrievedForm.name);
        console.log('  - Styling salvato:', JSON.stringify(retrievedForm.styling, null, 2));

        // 4. Confrontiamo i colori salvati con quelli originali
        const savedPrimaryColor = retrievedForm.styling?.primary_color;
        const originalPrimaryColor = customStyle.primary_color;

        console.log('\n🎯 VERIFICA COLORI:');
        console.log('  - Colore Originale:', originalPrimaryColor);
        console.log('  - Colore Salvato:', savedPrimaryColor);
        console.log('  - Match?:', savedPrimaryColor === originalPrimaryColor);

        if (savedPrimaryColor === originalPrimaryColor) {
            console.log('✅ SUCCESS: I colori personalizzati sono stati salvati correttamente!');

            // 5. Test finale: simuliamo il caricamento per form pubblico
            console.log('\n🌐 SIMULAZIONE FORM PUBBLICO:');
            const publicFormData = {
                id: retrievedForm.id,
                styling: retrievedForm.styling,
                privacy_policy_url: retrievedForm.privacy_policy_url
            };

            const primaryColorForUI = publicFormData.styling?.primary_color || '#6366f1';
            const isCustomColor = primaryColorForUI !== '#6366f1';

            console.log('  - Primary color for UI:', primaryColorForUI);
            console.log('  - Is custom color?:', isCustomColor);
            console.log('  - Privacy URL:', publicFormData.privacy_policy_url);

            if (isCustomColor) {
                console.log('🎉 FORM PUBBLICO: Userà colori personalizzati!');
            } else {
                console.log('❌ FORM PUBBLICO: Ancora colori default!');
            }

        } else {
            console.log('❌ FAILURE: I colori non sono stati salvati correttamente!');
            console.log('   Expected:', originalPrimaryColor);
            console.log('   Got:', savedPrimaryColor);
        }

        // 6. Pulizia
        console.log('\n🧹 Pulizia form test...');
        await supabase
            .from('forms')
            .delete()
            .eq('id', insertedForm.id);

        console.log('✅ Test completato!');

    } catch (error) {
        console.error('❌ Errore durante il test:', error);
    }
}

testColorSaving();