const fs = require('fs');

// Safe approach using regex patterns for corrupted characters
const targetFiles = [
  'src/components/JWTViewer.tsx',
  'src/components/Settings.tsx'
];

function fixCorruptedCharacters(content) {
  let fixed = content;
  let changeCount = 0;
  
  // Fix common corrupted emoji patterns
  const fixes = [
    // Search emoji: ðŸ" -> 🔍
    { pattern: /ðŸ"/g, replacement: '🔍', name: 'search emoji' },
    // Clipboard emoji: ðŸ"‹ -> 📋  
    { pattern: /ðŸ"‹/g, replacement: '📋', name: 'clipboard emoji' },
    // Lock emoji: ðŸ" -> 🔒
    { pattern: /ðŸ"/g, replacement: '🔒', name: 'lock emoji' },
    // User emoji: ðŸ'¤ -> 👤
    { pattern: /ðŸ'¤/g, replacement: '👤', name: 'user emoji' },
    // Checkmark: "… -> ✅
    { pattern: /"…/g, replacement: '✅', name: 'checkmark' },
    // Warning: "Œ -> ⚠️
    { pattern: /"Œ/g, replacement: '⚠️', name: 'warning' },
    // Shield: "š™ï¸ -> 🛡️
    { pattern: /"š™ï¸/g, replacement: '🛡️', name: 'shield' },
    // Double question marks: ?? -> 💡
    { pattern: /\?\?/g, replacement: '💡', name: 'double question marks' }
  ];
  
  fixes.forEach(({ pattern, replacement, name }) => {
    const matches = fixed.match(pattern);
    if (matches) {
      fixed = fixed.replace(pattern, replacement);
      changeCount += matches.length;
      console.log(`  ✅ Fixed ${matches.length} ${name} occurrences`);
    }
  });
  
  return { content: fixed, changeCount };
}

console.log('🎯 Starting safe character fixes...');

targetFiles.forEach(filePath => {
  if (!fs.existsSync(filePath)) {
    console.log(`⏭️  Skipping ${filePath} (not found)`);
    return;
  }

  console.log(`🔧 Processing: ${filePath}`);
  
  const originalContent = fs.readFileSync(filePath, 'utf8');
  const { content: fixedContent, changeCount } = fixCorruptedCharacters(originalContent);
  
  if (changeCount > 0) {
    fs.writeFileSync(filePath, fixedContent, 'utf8');
    console.log(`  💾 Applied ${changeCount} fixes to ${filePath}`);
  } else {
    console.log(`  ✨ No corrupted characters found in ${filePath}`);
  }
});

console.log('🎉 Safe character fixes completed!');