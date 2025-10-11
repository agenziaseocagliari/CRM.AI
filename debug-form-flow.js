#!/usr/bin/env node

/**
 * 🔍 DEBUG FORM FLOW - Test senza database
 * Simula il flusso di personalizzazione form per identificare dove si perdono i dati
 */

console.log('🔍 SIMULAZIONE FLUSSO FORM PERSONALIZZAZIONI\n');

// Simula il questionario che estrae colori
const questionnaireResult = {
    colors: {
        primary_color: '#ef4444', // Rosso custom
        background_color: '#f3f4f6', // Grigio custom
        text_color: '#1f2937'
    },
    privacy_url: 'https://example.com/privacy'
};

console.log('1️⃣ QUESTIONARIO COMPLETATO');
console.log('   Colori estratti:', questionnaireResult.colors);
console.log('   Privacy URL:', questionnaireResult.privacy_url);
console.log('');

// Simula Forms.tsx che riceve i dati dal questionario
let formStyle = {
    primary_color: questionnaireResult.colors.primary_color,
    background_color: questionnaireResult.colors.background_color,
    text_color: questionnaireResult.colors.text_color,
    secondary_color: '#f3f4f6',
    border_color: questionnaireResult.colors.primary_color,
    border_radius: '8px',
    font_family: 'Inter, system-ui, sans-serif',
    button_style: {
        background_color: questionnaireResult.colors.primary_color,
        text_color: '#ffffff',
        border_radius: '6px'
    }
};

let privacyPolicyUrl = questionnaireResult.privacy_url;

console.log('2️⃣ FORMS.tsx STATE INIZIALIZZATO');
console.log('   formStyle.primary_color:', formStyle.primary_color);
console.log('   privacyPolicyUrl:', privacyPolicyUrl);
console.log('');

// Simula Edge Function che genera campi
const edgeFunctionResponse = {
    fields: [
        { name: 'nome', label: 'Nome', type: 'text', required: true },
        { name: 'email', label: 'Email', type: 'email', required: true },
        { name: 'privacy_consent', label: 'Accetto Privacy Policy', type: 'checkbox', required: true }
    ],
    meta: {
        // ❓ QUESTO È IL PUNTO CRITICO: Edge Function dovrebbe ritornare colors?
        colors: questionnaireResult.colors,
        privacy_policy_url: questionnaireResult.privacy_url
    }
};

console.log('3️⃣ EDGE FUNCTION RISPOSTA');
console.log('   Campi generati:', edgeFunctionResponse.fields.length);
console.log('   Meta.colors presente:', !!edgeFunctionResponse.meta.colors);
console.log('   Meta.privacy_url presente:', !!edgeFunctionResponse.meta.privacy_policy_url);
console.log('');

// Simula PostAIEditor che riceve props
console.log('4️⃣ POSTAI EDITOR MOUNT');

// SIMULA IL BUG: PostAIEditor useState inizializza con undefined style
const postAIEditorInitialState = {
    primaryColor: undefined?.primary_color || '#6366f1', // ❌ BUG: style è undefined!
    backgroundColor: undefined?.background_color || '#ffffff',
    textColor: undefined?.text_color || '#1f2937'
};

console.log('   ❌ PostAIEditor initial state (BUG):');
console.log('     primaryColor:', postAIEditorInitialState.primaryColor);
console.log('     backgroundColor:', postAIEditorInitialState.backgroundColor);
console.log('');

// Simula useEffect che dovrebbe sincronizzare
console.log('5️⃣ USEEFFECT SYNC ATTEMPT');
if (formStyle?.primary_color && formStyle.primary_color !== postAIEditorInitialState.primaryColor) {
    console.log('   ✅ useEffect dovrebbe aggiornare:', formStyle.primary_color);
    postAIEditorInitialState.primaryColor = formStyle.primary_color;
    postAIEditorInitialState.backgroundColor = formStyle.background_color;
    postAIEditorInitialState.textColor = formStyle.text_color;
    console.log('   ✅ State aggiornato a:', postAIEditorInitialState.primaryColor);
} else {
    console.log('   ❌ useEffect NON triggered - mantiene default');
}
console.log('');

// Simula salvataggio database
const dataToSave = {
    name: 'Test Form',
    title: 'Test Form Title',
    fields: edgeFunctionResponse.fields,
    styling: formStyle, // ❓ Questo contiene i colori corretti?
    privacy_policy_url: privacyPolicyUrl,
    organization_id: 'test-org'
};

console.log('6️⃣ DATABASE SAVE SIMULATION');
console.log('   styling.primary_color:', dataToSave.styling?.primary_color);
console.log('   privacy_policy_url:', dataToSave.privacy_policy_url);
console.log('');

// Verifica finale
const isColorLost = dataToSave.styling?.primary_color === '#6366f1';
const isPrivacyLost = !dataToSave.privacy_policy_url;

console.log('🎯 RISULTATO DIAGNOSI:');
console.log('   Colori persi?', isColorLost ? '❌ SÌ' : '✅ NO');
console.log('   Privacy persa?', isPrivacyLost ? '❌ SÌ' : '✅ NO');
console.log('');

if (isColorLost || isPrivacyLost) {
    console.log('🔧 PROBLEMI IDENTIFICATI:');
    if (isColorLost) {
        console.log('   • formStyle mantiene colori corretti ma PostAIEditor mostra default');
        console.log('   • useEffect dependency loop potrebbe causare reset');
    }
    if (isPrivacyLost) {
        console.log('   • privacyPolicyUrl non viene passato correttamente');
    }
    console.log('');
    console.log('💡 SOLUZIONI PROPOSTE:');
    console.log('   1. Fix useEffect dependencies in PostAIEditor.tsx');
    console.log('   2. Garantire che style prop sia sempre passato');
    console.log('   3. Debug timing di inizializzazione componenti');
}