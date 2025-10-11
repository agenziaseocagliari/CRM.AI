// Test per verificare i log del browser in modo automatico
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugPublicFormLoad() {
    console.log('🔍 DEBUG PUBLIC FORM LOAD');
    console.log('='.repeat(50));

    const formId = 'b8dd9a42-6226-4185-8d9b-ce0ca7837a1e';

    try {
        // Simula esattamente quello che fa PublicForm.tsx
        console.log('📋 Simulando fetch come PublicForm.tsx...');

        const { data, error: fetchError } = await supabase
            .from('forms')
            .select('*')
            .eq('id', formId)
            .single();

        console.log('🔍 Supabase Response:', {
            hasData: !!data,
            error: fetchError,
            dataKeys: data ? Object.keys(data) : []
        });

        if (fetchError) {
            console.error('❌ Supabase Error:', fetchError);
            return;
        }

        if (!data) {
            console.error('❌ No data returned');
            return;
        }

        console.log('✅ Form loaded successfully:', {
            id: data.id,
            name: data.name,
            fieldsCount: data.fields?.length || 0,
            hasStyling: !!data.styling,
            hasPrivacyUrl: !!data.privacy_policy_url
        });

        console.log('\n🎨 DETAILED STYLING ANALYSIS:');
        console.log('Raw styling from DB:', JSON.stringify(data.styling, null, 2));

        // Simula il calcolo dei colori come in DynamicFormField
        const formStyle = data.styling;
        const primaryColor = formStyle?.primary_color || '#6366f1';
        const textColor = formStyle?.text_color || '#374151';
        const borderRadius = formStyle?.border_radius || '6px';

        const fieldBackgroundColor = formStyle?.background_color ?
            (formStyle.background_color === '#ffffff' ? '#f9fafb' : '#ffffff') : '#ffffff';

        const borderColor = formStyle?.primary_color ?
            `${formStyle.primary_color}30` : '#d1d5db';

        console.log('\n🧮 CALCULATED COLORS (DynamicFormField logic):');
        console.log('  primaryColor:', primaryColor);
        console.log('  textColor:', textColor);
        console.log('  borderRadius:', borderRadius);
        console.log('  fieldBackgroundColor:', fieldBackgroundColor);
        console.log('  borderColor:', borderColor);

        // Verifica se avremmo colori personalizzati
        const hasCustomColors = primaryColor !== '#6366f1';
        console.log('\n✅ Has Custom Colors:', hasCustomColors);

        if (hasCustomColors) {
            console.log('✅ Il form dovrebbe avere colori personalizzati!');
            console.log('   - I campi dovrebbero avere bordi:', borderColor);
            console.log('   - Al focus dovrebbero diventare:', primaryColor);
            console.log('   - Lo sfondo pagina dovrebbe essere:', formStyle.background_color);
        } else {
            console.log('❌ Il form userà colori di default');
        }

        // Controlla localStorage interference
        console.log('\n🗄️ LOCALSTORAGE CHECK:');
        const formStyleKey = `form_style_${data.id}`;
        console.log('   Chiave localStorage che sarebbe usata:', formStyleKey);
        console.log('   (Questo potrebbe sovrascrivere i colori del DB se presente)');

        return data;

    } catch (err) {
        console.error('💥 Error:', err);
    }
}

debugPublicFormLoad();