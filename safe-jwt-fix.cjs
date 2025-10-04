const fs = require('fs');
const path = require('path');

console.log('🔧 Starting safe JWT character fixes...');

const filePath = path.join('src', 'components', 'JWTViewer.tsx');

if (!fs.existsSync(filePath)) {
  console.log('❌ File not found:', filePath);
  process.exit(1);
}

// Read file with explicit UTF-8 encoding
let content = fs.readFileSync(filePath, 'utf8');

// Make backup
const backupPath = `${filePath}.backup-${Date.now()}`;
fs.writeFileSync(backupPath, content, 'utf8');
console.log('💾 Backup created:', backupPath);

// Define replacements using Unicode code points for safety
const replacements = [
  // Title: ðŸ" → 🔍 (search icon)
  { 
    pattern: /ðŸ"/g, 
    replacement: '🔍', 
    name: 'search icon in title' 
  },
  // Super Admin role: ðŸ" → 🛡️ (shield)
  { 
    pattern: /ðŸ" Super Admin/g, 
    replacement: '🛡️ Super Admin', 
    name: 'super admin shield' 
  },
  // Admin role: "š™ï¸ → ✅ (checkmark)
  { 
    pattern: /"š™ï¸ Admin/g, 
    replacement: '✅ Admin', 
    name: 'admin checkmark' 
  },
  // User role: ðŸ'¤ → 👤 (user icon)
  { 
    pattern: /ðŸ'¤ Utente/g, 
    replacement: '👤 Utente', 
    name: 'user icon' 
  },
  // Clipboard: ðŸ"‹ → 📋
  { 
    pattern: /ðŸ"‹/g, 
    replacement: '📋', 
    name: 'clipboard icon' 
  },
  // General checkmarks: "… → ✅
  { 
    pattern: /"…/g, 
    replacement: '✅', 
    name: 'checkmark symbols' 
  },
  // Warning symbols: "Œ → ⚠️
  { 
    pattern: /"Œ/g, 
    replacement: '⚠️', 
    name: 'warning symbols' 
  }
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
  if (content.includes('export const JWTViewer') && content.length > originalContent.length * 0.9) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`🎉 Successfully applied ${totalChanges} character fixes to JWTViewer.tsx!`);
    
    // Show a sample of the fixed content
    const titleMatch = content.match(/className="text-2xl font-bold">[^<]+/);
    if (titleMatch) {
      console.log('📝 Fixed title:', titleMatch[0].replace('className="text-2xl font-bold">', ''));
    }
  } else {
    console.log('❌ Content validation failed, restoring backup...');
    fs.writeFileSync(filePath, originalContent, 'utf8');
    process.exit(1);
  }
} else {
  console.log('ℹ️  No corrupted characters found to fix');
}

console.log('✨ JWT character fix completed!');