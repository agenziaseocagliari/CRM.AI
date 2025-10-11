import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testColorInSavedForm() {
    console.log('🧪 TESTING COLOR PERSISTENCE IN SAVED FORMS');
    console.log('='.repeat(60));

    try {
        // 1. Crea un form con colori personalizzati
        const testFormData = {
            name: 'Test Color Form',
            title: 'Form per Test Colori',
            fields: [
                { name: 'email', label: 'Il tuo email', type: 'email', required: true },
                { name: 'nome', label: 'Nome completo', type: 'text', required: true },
                { name: 'messaggio', label: 'Messaggio', type: 'textarea', required: false },
                { name: 'marketing_consent', label: 'Accetto di ricevere comunicazioni commerciali e newsletter', type: 'checkbox', required: false }
            ],
            styling: {
                primary_color: '#ff6b35',      // Arancione vivace
                background_color: '#f0f8ff',   // Azzurro chiaro
                secondary_color: '#e6f3ff',    // Azzurro ancora più chiaro
                text_color: '#2c3e50',         // Blu scuro
                border_radius: 12              // Bordi arrotondati
            },
            privacy_policy_url: 'https://example.com/privacy',
            organization_id: '00000000-0000-0000-0000-000000000000' // Org di default
        };

        console.log('📝 Inserimento form nel database...');
        const { data: insertedForm, error: insertError } = await supabase
            .from('forms')
            .insert(testFormData)
            .select()
            .single();

        if (insertError) {
            console.error('❌ Errore inserimento:', insertError);
            return;
        }

        console.log('✅ Form inserito con successo!');
        console.log('📋 Form ID:', insertedForm.id);
        console.log('🎨 Styling salvato:', JSON.stringify(insertedForm.styling, null, 2));

        // 2. Verifica lettura dal database
        console.log('\n🔍 Verifica lettura dal database...');
        const { data: readForm, error: readError } = await supabase
            .from('forms')
            .select('*')
            .eq('id', insertedForm.id)
            .single();

        if (readError) {
            console.error('❌ Errore lettura:', readError);
            return;
        }

        console.log('✅ Form letto correttamente!');
        console.log('🎨 Styling letto:', JSON.stringify(readForm.styling, null, 2));

        // 3. Verifica uguaglianza
        const stylingMatch = JSON.stringify(insertedForm.styling) === JSON.stringify(readForm.styling);
        console.log('🔄 Styling identico after read/write:', stylingMatch ? '✅' : '❌');

        // 4. Mostra URL per test manuale
        console.log('\n🌐 TEST MANUALE:');
        console.log(`   Apri questo URL nel browser: http://localhost:5173/form/${insertedForm.id}`);
        console.log('   Verifica che i campi abbiano:');
        console.log('   - Bordi arancioni al focus (#ff6b35)');
        console.log('   - Sfondo azzurro chiaro (#f0f8ff) per la pagina');
        console.log('   - Testo blu scuro (#2c3e50)');
        console.log('   - Bordi arrotondati (12px)');
        console.log('   - Checkbox marketing consent presente');

        // 5. Calcola i colori come farebbe DynamicFormField
        const formStyle = readForm.styling;
        const primaryColor = formStyle?.primary_color || '#6366f1';
        const borderColor = formStyle?.primary_color ? `${formStyle.primary_color}30` : '#d1d5db';
        const fieldBackgroundColor = formStyle?.background_color ?
            (formStyle.background_color === '#ffffff' ? '#f9fafb' : '#ffffff') : '#ffffff';

        console.log('\n🧮 CALCOLI COLORE (come DynamicFormField):');
        console.log('   - Primary Color:', primaryColor);
        console.log('   - Border Color (con opacità):', borderColor);
        console.log('   - Field Background:', fieldBackgroundColor);

        return insertedForm.id;

    } catch (error) {
        console.error('💥 Errore generale:', error);
    }
}

testColorInSavedForm().then((formId) => {
    if (formId) {
        console.log('\n🎯 CONCLUSIONE:');
        console.log(`Form ID: ${formId}`);
        console.log('Test completato. Controlla i log del browser per vedere se i colori vengono applicati.');
    }
});