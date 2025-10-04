const fs = require('fs');

console.log('🎯 Final targeted JWT character fixes...');

const filePath = 'src/components/JWTViewer.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Make backup
const backupPath = `${filePath}.final-backup-${Date.now()}`;
fs.writeFileSync(backupPath, content, 'utf8');

console.log('💾 Final backup created');

// Show current corrupted patterns before fixing
console.log('\n📊 Current corrupted patterns:');
const patterns = [
  'ðŸ" JWT Session Diagnostics',
  'ðŸ" Run Health Check', 
  'ðŸ" Super Admin',
  'ðŸ'¤ Utente Standard',
  'ðŸ"‹ ${diagnostics.claims.user_role}',
  'ðŸ" Azioni Consigliate',
  'ðŸ"‹ JWT Claims',
  'ðŸ"' Token Raw',
  'ðŸ"„ Esegui Logout',
  'ðŸ"‹ Copia Report',
  'ðŸ"„ Ricarica'
];

patterns.forEach(pattern => {
  if (content.includes(pattern)) {
    console.log(`  ❌ Found: "${pattern}"`);
  }
});

// Simple string replacements
const fixes = [
  { from: 'ðŸ" JWT Session Diagnostics', to: '🔍 JWT Session Diagnostics' },
  { from: 'ðŸ" Run Health Check', to: '🔍 Run Health Check' },
  { from: 'ðŸ" Super Admin', to: '🛡️ Super Admin' },
  { from: 'ðŸ'¤ Utente Standard', to: '👤 Utente Standard' },
  { from: 'ðŸ"‹ ${diagnostics.claims.user_role}', to: '📋 ${diagnostics.claims.user_role}' },
  { from: 'ðŸ" Azioni Consigliate:', to: '🔍 Azioni Consigliate:' },
  { from: 'ðŸ"‹ JWT Claims', to: '📋 JWT Claims' },
  { from: 'ðŸ"' Token Raw', to: '🔒 Token Raw' },
  { from: 'ðŸ"„ Esegui Logout', to: '🔄 Esegui Logout' },
  { from: 'ðŸ"‹ Copia Report', to: '📋 Copia Report' },
  { from: 'ðŸ"„ Ricarica', to: '🔄 Ricarica' }
];

let totalFixed = 0;

console.log('\n🔧 Applying fixes:');
fixes.forEach(({ from, to }) => {
  if (content.includes(from)) {
    content = content.split(from).join(to);
    console.log(`  ✅ Fixed: "${from}" → "${to}"`);
    totalFixed++;
  }
});

// Write the fixed content
if (totalFixed > 0) {
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`\n🎉 Applied ${totalFixed} fixes to JWTViewer.tsx!`);
  
  // Final verification
  const remainingCorrupted = (content.match(/ðŸ/g) || []).length;
  console.log(`📊 Remaining corrupted characters: ${remainingCorrupted}`);
  
  if (remainingCorrupted === 0) {
    console.log('🌟 ALL JWT CHARACTERS FIXED! 🌟');
  }
} else {
  console.log('ℹ️  No changes needed');
}

console.log('✨ Final JWT fix completed!');