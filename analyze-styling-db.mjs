import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function analyzeStylingDB() {
  try {
    console.log('🔍 ANALISI STRUTTURA TABELLA FORMS...');
    
    // 1. Verifico se la colonna styling esiste
    const { data: columns, error: columnError } = await supabase.rpc('get_table_columns', {
      table_name: 'forms'
    });
    
    if (columnError) {
      console.log('⚠️ Fallback: controllo diretto colonne...');
      // Fallback: query diretta
      const { data: sampleForm, error } = await supabase
        .from('forms')
        .select('*')
        .limit(1)
        .single();
        
      if (error) throw error;
      
      console.log('📋 Struttura form campione:');
      console.log(Object.keys(sampleForm));
      
      if ('styling' in sampleForm) {
        console.log('✅ Colonna styling ESISTE');
        console.log('📊 Tipo styling:', typeof sampleForm.styling);
        console.log('🎨 Contenuto styling:', JSON.stringify(sampleForm.styling, null, 2));
      } else {
        console.log('❌ Colonna styling NON ESISTE!');
      }
    }
    
    // 2. Verifico i dati di styling esistenti
    const { data: forms, error: formsError } = await supabase
      .from('forms')
      .select('id, title, styling')
      .limit(5);
      
    if (formsError) throw formsError;
    
    console.log('\n📊 Campione dati styling:');
    forms.forEach(form => {
      console.log(`Form ${form.id}: ${form.title}`);
      console.log(`  styling type: ${typeof form.styling}`);
      console.log(`  styling value: ${JSON.stringify(form.styling, null, 2)}`);
      console.log('');
    });
    
    // 3. Verifico se ci sono form con styling personalizzato
    const { data: customForms, error: customError } = await supabase
      .from('forms')
      .select('id, title, styling')
      .not('styling', 'is', null)
      .limit(3);
      
    if (customError) throw customError;
    
    console.log('🎨 Form con styling personalizzato:');
    if (customForms.length === 0) {
      console.log('❌ Nessun form ha styling personalizzato salvato!');
    } else {
      customForms.forEach(form => {
        console.log(`${form.id}: ${JSON.stringify(form.styling)}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Errore:', error);
  }
}

analyzeStylingDB();