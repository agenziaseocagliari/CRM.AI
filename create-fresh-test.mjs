import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

async function createFreshTestForm() {
    console.log('🆕 CREAZIONE FORM FRESCO PER TEST...\n');

    const supabase = createClient(
        process.env.VITE_SUPABASE_URL,
        process.env.VITE_SUPABASE_ANON_KEY
    );

    // Pulizia
    await supabase
        .from('forms')
        .delete()
        .eq('name', 'test-browser-refresh');

    const testForm = {
        name: 'test-browser-refresh',
        title: '🔥 Test Browser Refresh - Colori Vivaci',
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
                options: ['Web Design Moderno', 'SEO Avanzato', 'Marketing Digitale', 'Consulenza Strategica']
            },
            {
                name: 'consenso_privacy',
                type: 'checkbox',
                label: 'Accetto la privacy policy e i termini di servizio',
                required: true
            }
        ],
        styling: {
            primary_color: '#00ff88',      // Verde fluorescente
            secondary_color: '#e8f5e8',
            background_color: '#f0fff4',   // Verde molto chiaro
            text_color: '#004d00',         // Verde scuro
            border_color: '#00ff88',
            border_radius: '16px',
            font_family: 'Inter, sans-serif',
            button_style: {
                background_color: '#00ff88',
                text_color: '#ffffff',
                border_radius: '12px'
            }
        },
        privacy_policy_url: 'https://example.com/privacy-test',
        organization_id: '01935fc9-1e3a-7db1-be54-8de6893cbefb'
    };

    console.log('💾 Creazione form con colori verde fluorescente...');
    const { data: newForm, error } = await supabase
        .from('forms')
        .insert(testForm)
        .select()
        .single();

    if (error) {
        console.log('❌ Errore:', error.message);
    } else {
        console.log('✅ Form creato con successo!');
        console.log('🆔 ID:', newForm.id);
        console.log('🎨 Colore primario:', testForm.styling.primary_color);

        console.log('\n🔗 URL NUOVO FORM:');
        console.log(`http://localhost:5173/form/${newForm.id}`);

        console.log('\n📝 ISTRUZIONI:');
        console.log('1. Apri il link sopra in una NUOVA FINESTRA INCOGNITO');
        console.log('2. Il form dovrebbe essere VERDE FLUORESCENTE');
        console.log('3. Se ancora dà "Invalid API key", c\'è un problema di cache');

        // Test immediato
        console.log('\n🧪 Test immediato caricamento...');
        const { data: testLoad, error: loadError } = await supabase
            .from('forms')
            .select('*')
            .eq('id', newForm.id)
            .single();

        if (loadError) {
            console.log('❌ Test fallito:', loadError.message);
        } else {
            console.log('✅ Test riuscito! Form caricabile');
            console.log('  - Colore verificato:', testLoad.styling?.primary_color);
        }
    }
}

createFreshTestForm();