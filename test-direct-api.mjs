import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

async function testDirectAPI() {
    console.log('🔧 TEST DIRETTO API SUPABASE...\n');

    // Test con environment variables
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const currentKey = process.env.VITE_SUPABASE_ANON_KEY;

    console.log('🌐 URL:', supabaseUrl);
    console.log('🔑 Current Key (primi 50):', currentKey?.substring(0, 50));

    try {
        const client = createClient(supabaseUrl, currentKey);

        console.log('\n🧪 Test query form specifico...');
        const { data: form, error } = await client
            .from('forms')
            .select('*')
            .eq('id', '26e1ad32-7952-46d2-9777-51fe6ccee01d')
            .single();

        if (error) {
            console.log('❌ ERRORE:', error.message);
            console.log('📋 Codice:', error.code);
            console.log('📋 Hint:', error.hint);

            // Se ancora non funziona, proviamo a creare un nuovo form con chiave corretta
            console.log('\n🔄 Creazione nuovo form di test...');

            const testForm = {
                name: 'test-immediato',
                title: 'Test Immediato Funzionamento',
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
                    },
                    {
                        name: 'consenso_privacy',
                        type: 'checkbox',
                        label: 'Accetto la privacy policy',
                        required: true
                    }
                ],
                styling: {
                    primary_color: '#ff6b35',     // Arancione vivace
                    background_color: '#fff8f6',  // Arancione molto chiaro
                    text_color: '#1a1a1a',
                    border_radius: '8px'
                },
                privacy_policy_url: 'https://example.com/privacy',
                organization_id: '01935fc9-1e3a-7db1-be54-8de6893cbefb'
            };

            const { data: newForm, error: createError } = await client
                .from('forms')
                .insert(testForm)
                .select()
                .single();

            if (createError) {
                console.log('❌ Errore creazione:', createError.message);
            } else {
                console.log('✅ Form di test creato!');
                console.log('🆔 ID:', newForm.id);
                console.log('🔗 URL:', `http://localhost:5173/form/${newForm.id}`);

                // Test immediato del nuovo form
                const { data: testLoad, error: loadError } = await client
                    .from('forms')
                    .select('*')
                    .eq('id', newForm.id)
                    .single();

                if (loadError) {
                    console.log('❌ Errore caricamento nuovo form:', loadError.message);
                } else {
                    console.log('✅ Nuovo form carica correttamente!');
                    console.log('  - Nome:', testLoad.name);
                    console.log('  - Styling:', !!testLoad.styling);
                    console.log('  - Colore primario:', testLoad.styling?.primary_color);
                }
            }

        } else {
            console.log('✅ FORM CARICATO CORRETTAMENTE!');
            console.log('  - Nome:', form.name);
            console.log('  - Fields:', form.fields?.length || 0);
            console.log('  - Styling presente:', !!form.styling);
            console.log('  - Colore primario:', form.styling?.primary_color);
            console.log('  - Privacy URL:', form.privacy_policy_url);

            console.log('\n🎯 IL FORM DOVREBBE FUNZIONARE NEL BROWSER!');
            console.log('🔗 URL: http://localhost:5173/form/26e1ad32-7952-46d2-9777-51fe6ccee01d');
        }

    } catch (error) {
        console.log('❌ Errore generale:', error.message);
    }
}

testDirectAPI();