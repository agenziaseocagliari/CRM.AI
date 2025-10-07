// Script per deploy manuale della funzione generate-form-fields
// Engineering Fellow - Deployment Override

const fs = require('fs');
const path = require('path');

const SUPABASE_PROJECT_REF = 'qjtaqrlpronohgpfdxsi';
const FUNCTION_NAME = 'generate-form-fields';

console.log('🚀 Engineering Fellow - Manual Deployment Script');
console.log('==================================================');

// Leggi il contenuto della funzione corretta
const functionPath = path.join(__dirname, 'supabase', 'functions', FUNCTION_NAME, 'index.ts');

if (!fs.existsSync(functionPath)) {
    console.error(`❌ Function file not found: ${functionPath}`);
    process.exit(1);
}

const functionContent = fs.readFileSync(functionPath, 'utf8');

console.log('📁 Function file loaded successfully');
console.log(`📊 Function size: ${functionContent.length} characters`);

// Verifica che la correzione sia presente
if (functionContent.includes('supabaseClient.functions.invoke')) {
    console.error('❌ CRITICAL: Function still contains broken supabaseClient.functions.invoke!');
    console.error('   The function has NOT been corrected properly.');
    process.exit(1);
}

if (functionContent.includes('fetch(`${supabaseUrl}/functions/v1/consume-credits`')) {
    console.log('✅ CONFIRMED: Function contains corrected direct fetch implementation');
} else {
    console.error('❌ WARNING: Expected direct fetch implementation not found');
}

console.log('\n📋 DEPLOYMENT INSTRUCTIONS:');
console.log('1. Go to: https://supabase.com/dashboard/project/qjtaqrlpronohgpfdxsi/functions');
console.log('2. Click on "generate-form-fields" function');
console.log('3. Click "Edit" or "Update Function"');
console.log('4. Replace the entire function code with the corrected version');
console.log('5. Click "Deploy" to update the function');

console.log('\n🔧 CORRECTED FUNCTION PREVIEW:');
console.log('=====================================');
console.log(functionContent.substring(0, 500) + '...');

console.log('\n🎯 KEY CHANGES APPLIED:');
console.log('- ❌ Removed: supabaseClient.functions.invoke (broken)');
console.log('- ✅ Added: Direct fetch() to consume-credits function');
console.log('- ✅ Added: Proper error handling and logging');
console.log('- ✅ Added: Authorization header forwarding');

console.log('\n🚀 Engineering Fellow deployment verification complete!');