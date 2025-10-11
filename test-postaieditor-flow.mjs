import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testPostAIEditorFlow() {
    try {
        console.log('🧪 TEST FLUSSO COMPLETO POSTAIEDITOR...');

        // Simuliamo il flusso completo:
        // 1. User apre create modal
        console.log('1️⃣ handleOpenCreateModal() chiamato');
        let formStyle = {
            primary_color: '#6366f1',  // Default iniziale
            secondary_color: '#f3f4f6',
            background_color: '#ffffff',
            text_color: '#1f2937',
            border_color: '#6366f1',
            border_radius: '8px',
            font_family: 'Inter, system-ui, sans-serif',
            button_style: {
                background_color: '#6366f1',
                text_color: '#ffffff',
                border_radius: '6px'
            }
        };
        console.log('   formStyle iniziale:', formStyle.primary_color);

        // 2. User genera campi con AI
        console.log('\n2️⃣ User genera campi con Edge Function');
        // Simuliamo response Edge Function con meta.colors
        const edgeResponse = {
            fields: [
                { name: 'nome', type: 'text', label: 'Nome', required: true },
                { name: 'email', type: 'email', label: 'Email', required: true }
            ],
            style_customizations: {
                primaryColor: '#e74c3c',    // Rosso personalizzato dall'AI
                backgroundColor: '#fff5f5',  // Sfondo rosa
                textColor: '#2c3e50'        // Testo scuro
            },
            privacy_policy_url: 'https://example.com/privacy'
        };

        // 3. Forms.tsx applica style_customizations
        console.log('3️⃣ Forms.tsx applica style_customizations');
        if (edgeResponse.style_customizations) {
            formStyle = {
                primary_color: edgeResponse.style_customizations.primaryColor || '#6366f1',
                secondary_color: '#f3f4f6',
                background_color: edgeResponse.style_customizations.backgroundColor || '#ffffff',
                text_color: edgeResponse.style_customizations.textColor || '#1f2937',
                border_color: edgeResponse.style_customizations.primaryColor || '#6366f1',
                border_radius: '8px',
                font_family: 'Inter, system-ui, sans-serif',
                button_style: {
                    background_color: edgeResponse.style_customizations.primaryColor || '#6366f1',
                    text_color: '#ffffff',
                    border_radius: '6px'
                }
            };
        }
        console.log('   formStyle dopo Edge Function:', formStyle.primary_color);

        // 4. PostAIEditor riceve style prop e si sincronizza
        console.log('\n4️⃣ PostAIEditor useEffect sincronizzazione');
        let postAIColors = {
            primaryColor: formStyle.primary_color,
            backgroundColor: formStyle.background_color,
            textColor: formStyle.text_color
        };
        console.log('   PostAI colors dopo sync:', postAIColors.primaryColor);

        // 5. User modifica manualmente un colore nel PostAIEditor
        console.log('\n5️⃣ User modifica colore da rosso a blu');
        const userSelectedColor = '#3498db'; // Blu scelto dall\'user

        // handleColorChange viene chiamato
        postAIColors.primaryColor = userSelectedColor;

        // onStyleChange viene chiamato
        const updatedFormStyle = {
            ...formStyle,
            primary_color: userSelectedColor,
            border_color: userSelectedColor,
            button_style: {
                ...formStyle.button_style,
                background_color: userSelectedColor
            }
        };
        console.log('   formStyle dopo user change:', updatedFormStyle.primary_color);

        // 6. handleSaveForm viene chiamato
        console.log('\n6️⃣ handleSaveForm() salva nel database');
        const dataToSave = {
            name: 'test-manual-colors',
            title: 'Test Manual Colors',
            fields: edgeResponse.fields,
            styling: updatedFormStyle,  // ← Questo dovrebbe avere il colore blu
            privacy_policy_url: edgeResponse.privacy_policy_url,
            organization_id: '01935fc9-1e3a-7db1-be54-8de6893cbefb'
        };

        console.log('🔍 ANALISI FINALE:');
        console.log('   Colore che sarà salvato:', dataToSave.styling.primary_color);
        console.log('   È il colore scelto dall\'user?:', dataToSave.styling.primary_color === userSelectedColor);

        if (dataToSave.styling.primary_color === userSelectedColor) {
            console.log('✅ FLUSSO CORRETTO: Il colore user viene salvato');
        } else {
            console.log('❌ FLUSSO ERRATO: Il colore user è stato perso');
            console.log('   Expected:', userSelectedColor);
            console.log('   Got:', dataToSave.styling.primary_color);
        }

        // Test salvataggio reale
        console.log('\n🧪 TEST SALVATAGGIO REALE...');

        // Prima pulizia
        await supabase
            .from('forms')
            .delete()
            .eq('name', 'test-manual-colors');

        const { data: insertedForm, error: insertError } = await supabase
            .from('forms')
            .insert(dataToSave)
            .select()
            .single();

        if (insertError) throw insertError;

        console.log('💾 Form salvato con ID:', insertedForm.id);
        console.log('🎨 Colore salvato nel DB:', insertedForm.styling?.primary_color);

        // Verifica recupero
        const { data: retrievedForm, error: retrieveError } = await supabase
            .from('forms')
            .select('*')
            .eq('id', insertedForm.id)
            .single();

        if (retrieveError) throw retrieveError;

        console.log('🔍 Colore recuperato dal DB:', retrievedForm.styling?.primary_color);
        console.log('✅ Match con colore user?:', retrievedForm.styling?.primary_color === userSelectedColor);

        // Pulizia
        await supabase
            .from('forms')
            .delete()
            .eq('id', insertedForm.id);

    } catch (error) {
        console.error('❌ Errore durante il test:', error);
    }
}

testPostAIEditorFlow();