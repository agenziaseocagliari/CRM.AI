import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testPublicFormRendering() {
    try {
        console.log('🧪 TEST RENDERING FORM PUBBLICO CON COLORI...');

        // 1. Creiamo un form con colori molto distintivi
        const testStyle = {
            primary_color: '#ff1493',      // Rosa shocking
            secondary_color: '#f0f0f0',
            background_color: '#fff0f5',   // Lavanda
            text_color: '#800080',         // Viola
            border_color: '#ff1493',
            border_radius: '15px',         // Bordi molto arrotondati
            font_family: 'Arial, sans-serif',
            button_style: {
                background_color: '#ff1493',
                text_color: '#ffffff',
                border_radius: '10px'
            }
        };

        // Prima pulizia
        await supabase
            .from('forms')
            .delete()
            .eq('name', 'test-public-render');

        const testForm = {
            name: 'test-public-render',
            title: 'Test Form Rendering Pubblico',
            fields: [
                {
                    name: 'nome_completo',
                    type: 'text',
                    label: 'Nome Completo',
                    required: true
                },
                {
                    name: 'email',
                    type: 'email',
                    label: 'Email',
                    required: true
                },
                {
                    name: 'servizi_interesse',
                    type: 'select',
                    label: 'Servizi di Interesse',
                    required: true,
                    options: ['Web Design', 'SEO', 'Marketing', 'Consulenza']
                }
            ],
            styling: testStyle,
            privacy_policy_url: 'https://example.com/privacy-test',
            organization_id: '01935fc9-1e3a-7db1-be54-8de6893cbefb'
        };

        console.log('💾 Creazione form con colori distintivi...');
        console.log('🎨 Colori impostati:', {
            primary: testStyle.primary_color,
            background: testStyle.background_color,
            text: testStyle.text_color
        });

        const { data: insertedForm, error: insertError } = await supabase
            .from('forms')
            .insert(testForm)
            .select()
            .single();

        if (insertError) throw insertError;

        console.log('✅ Form creato con ID:', insertedForm.id);

        // 2. Simuliamo il caricamento del form pubblico
        console.log('\n🌐 SIMULAZIONE CARICAMENTO FORM PUBBLICO...');
        const { data: publicForm, error: loadError } = await supabase
            .from('forms')
            .select('*')
            .eq('id', insertedForm.id)
            .single();

        if (loadError) throw loadError;

        console.log('📊 Dati form pubblico caricati:');
        console.log('  - ID:', publicForm.id);
        console.log('  - Nome:', publicForm.name);
        console.log('  - Styling presente:', !!publicForm.styling);

        if (publicForm.styling) {
            console.log('🎨 Colori nel database:');
            console.log('  - Primary:', publicForm.styling.primary_color);
            console.log('  - Background:', publicForm.styling.background_color);
            console.log('  - Text:', publicForm.styling.text_color);
            console.log('  - Border Radius:', publicForm.styling.border_radius);
        }

        // 3. Simuliamo DynamicFormField.tsx rendering
        console.log('\n🖼️ SIMULAZIONE DYNAMICFORMFIELD RENDERING...');
        const formStyle = publicForm.styling;

        // Come in DynamicFormField
        const primaryColor = formStyle?.primary_color || '#6366f1';
        const textColor = formStyle?.text_color || '#374151';
        const borderRadius = formStyle?.border_radius || '8px';

        console.log('🎯 Colori che verrebbero applicati ai campi:');
        console.log('  - primaryColor (focus):', primaryColor);
        console.log('  - textColor:', textColor);
        console.log('  - borderRadius:', borderRadius);

        const isCustomColors = primaryColor !== '#6366f1';
        console.log('  - Ha colori personalizzati?:', isCustomColors);

        if (isCustomColors) {
            console.log('✅ I campi del form dovrebbero avere colori personalizzati!');

            // 4. Simuliamo il CSS che viene applicato
            console.log('\n🎨 CSS CHE VERREBBE APPLICATO:');
            console.log('Input focus style:', {
                borderColor: primaryColor,
                boxShadow: `0 0 0 2px ${primaryColor}25`
            });
            console.log('Container style:', {
                backgroundColor: formStyle.background_color,
                borderRadius: borderRadius
            });
            console.log('Button style:', {
                backgroundColor: primaryColor
            });

        } else {
            console.log('❌ I campi useranno ancora i colori default!');
        }

        // 5. URL del form pubblico per test manuale
        const publicUrl = `http://localhost:5173/form/${insertedForm.id}`;
        console.log('\n🔗 URL FORM PUBBLICO PER TEST MANUALE:');
        console.log(publicUrl);
        console.log('');
        console.log('📝 ISTRUZIONI TEST:');
        console.log('1. Apri l\'URL sopra nel browser');
        console.log('2. Verifica che i colori siano rosa shocking (#ff1493)');
        console.log('3. Verifica che lo sfondo sia lavanda (#fff0f5)');
        console.log('4. Clicca sui campi per vedere il bordo focus rosa');
        console.log('5. Verifica che il checkbox privacy abbia link cliccabile');

        // Non eliminiamo il form per permettere test manuale
        console.log('\n⚠️ Form NON eliminato per permettere test manuale');
        console.log('🧹 Per pulire manualmente: DELETE FROM forms WHERE id = \'' + insertedForm.id + '\'');

    } catch (error) {
        console.error('❌ Errore durante il test:', error);
    }
}

testPublicFormRendering();