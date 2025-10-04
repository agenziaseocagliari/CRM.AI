const fs = require('fs');
const path = require('path');

console.log('🔧 Starting comprehensive JWT character fixes...');

const filePath = path.join('src', 'components', 'JWTViewer.tsx');

if (!fs.existsSync(filePath)) {
  console.log('❌ File not found:', filePath);
  process.exit(1);
}

// Read file with explicit UTF-8 encoding
let content = fs.readFileSync(filePath, 'utf8');

// Make backup
const backupPath = `${filePath}.comprehensive-backup-${Date.now()}`;
fs.writeFileSync(backupPath, content, 'utf8');
console.log('💾 Backup created:', backupPath);

// Extended replacements to cover ALL corrupted characters
const replacements = [
  // Main title search icon
  { pattern: /ðŸ" JWT Session Diagnostics/g, replacement: '🔍 JWT Session Diagnostics', name: 'main title' },
  
  // Run Health Check button
  { pattern: /ðŸ" Run Health Check/g, replacement: '🔍 Run Health Check', name: 'health check button' },
  
  // Role flags
  { pattern: /ðŸ" Super Admin/g, replacement: '🛡️ Super Admin', name: 'super admin role' },
  { pattern: /ðŸ'¤ Utente Standard/g, replacement: '👤 Utente Standard', name: 'user role' },
  { pattern: /ðŸ"‹ \$\{diagnostics\.claims\.user_role\}/g, replacement: '📋 ${diagnostics.claims.user_role}', name: 'custom role' },
  
  // Section headers
  { pattern: /ðŸ" Azioni Consigliate:/g, replacement: '🔍 Azioni Consigliate:', name: 'actions header' },
  { pattern: /ðŸš¨ Errori/g, replacement: '🚨 Errori', name: 'errors header' },
  { pattern: /ðŸ"‹ JWT Claims/g, replacement: '📋 JWT Claims', name: 'claims header' },
  { pattern: /ðŸ"' Token Raw/g, replacement: '🔒 Token Raw', name: 'token header' },
  
  // Buttons
  { pattern: /ðŸ"„ Esegui Logout/g, replacement: '🔄 Esegui Logout', name: 'logout button' },
  { pattern: /ðŸ"‹ Copia Report/g, replacement: '📋 Copia Report', name: 'copy button' },
  { pattern: /ðŸ"„ Ricarica/g, replacement: '🔄 Ricarica', name: 'reload button' },
  
  // Generic patterns - catch any remaining
  { pattern: /ðŸ"/g, replacement: '🔍', name: 'remaining search icons' },
  { pattern: /ðŸ"‹/g, replacement: '📋', name: 'remaining clipboard icons' },
  { pattern: /ðŸ'¤/g, replacement: '👤', name: 'remaining user icons' },
  { pattern: /ðŸ"'/g, replacement: '🔒', name: 'remaining lock icons' },
  { pattern: /ðŸ"„/g, replacement: '🔄', name: 'remaining reload icons' },
  { pattern: /ðŸš¨/g, replacement: '🚨', name: 'remaining alert icons' },
];

let totalChanges = 0;
let originalContent = content;

// Apply replacements
replacements.forEach(({ pattern, replacement, name }) => {
  const matches = content.match(pattern);
  if (matches) {
    content = content.replace(pattern, replacement);
    console.log(`  ✅ ${name}: ${matches.length} replacements`);
    totalChanges += matches.length;
  }
});

if (totalChanges > 0) {
  // Verify the content is still valid
  if (content.includes('export const JWTViewer') && content.length > originalContent.length * 0.8) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`🎉 Successfully applied ${totalChanges} character fixes to JWTViewer.tsx!`);
    
    // Check if any corrupted characters remain
    const remainingCorrupted = (content.match(/ðŸ/g) || []).length;
    if (remainingCorrupted === 0) {
      console.log('✨ All corrupted characters have been fixed!');
    } else {
      console.log(`⚠️  ${remainingCorrupted} corrupted characters still remain`);
    }
  } else {
    console.log('❌ Content validation failed, restoring backup...');
    fs.writeFileSync(filePath, originalContent, 'utf8');
    process.exit(1);
  }
} else {
  console.log('ℹ️  No corrupted characters found to fix');
}

console.log('✨ Comprehensive JWT character fix completed!');