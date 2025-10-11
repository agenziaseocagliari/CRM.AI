import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testSpecificForm() {
    try {
        console.log('🧪 TESTING FORM PUBBLICO - Simulazione PublicForm.tsx...');

        // Simuliamo il caricamento di un form pubblico
        const formId = 'c17a651f-55a3-4432-8432-9353b2a75686'; // Primo form dal database

        console.log(`🔍 Caricamento form ${formId}...`);

        const { data, error } = await supabase
            .from('forms')
            .select('*')
            .eq('id', formId)
            .single();

        if (error) throw error;
        if (!data) throw new Error('Form non trovato');

        console.log('✅ Form caricato:', data.name);
        console.log('📊 Styling ricevuto:');
        console.log('  - Type:', typeof data.styling);
        console.log('  - Keys:', data.styling ? Object.keys(data.styling) : 'null/undefined');
        console.log('  - Primary Color:', data.styling?.primary_color);
        console.log('  - Background Color:', data.styling?.background_color);
        console.log('  - Text Color:', data.styling?.text_color);
        console.log('  - Border Radius:', data.styling?.border_radius);

        console.log('\n🔍 VALORE COMPLETO STYLING:');
        console.log(JSON.stringify(data.styling, null, 2));

        console.log('\n🎨 SIMULAZIONE DynamicFormField Props:');
        const mockField = { name: 'test', type: 'text', label: 'Test Field', required: false };

        // Simula DynamicFormField.tsx logic
        const formStyle = data.styling;
        const primaryColor = formStyle?.primary_color || '#6366f1';
        const textColor = formStyle?.text_color || '#374151';
        const borderRadius = formStyle?.border_radius || 8;

        console.log('  - formStyle:', !!formStyle);
        console.log('  - primaryColor:', primaryColor);
        console.log('  - textColor:', textColor);
        console.log('  - borderRadius:', borderRadius);

        // Test if color is actually different from default
        const isCustomColor = primaryColor !== '#6366f1';
        console.log('  - Is Custom Color?:', isCustomColor);

        if (!isCustomColor) {
            console.log('❌ PROBLEMA IDENTIFICATO: Il form ha ancora il colore default!');
            console.log('   Questo suggerisce che il problema è nel salvataggio, non nel rendering.');
        }

    } catch (error) {
        console.error('❌ Errore:', error);
    }
}

testSpecificForm();